import { createHmac, timingSafeEqual } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorCode } from "../constants/error-code.enum";
import { RedisKeys } from "@repo/contracts";
import { ErrorMessage } from "../constants/response-message.enum";
import type { Project } from "@repo/db";
import { AuthServiceClient } from "../lib/auth-service-client";
import { logger } from "../lib/logger";
import { redisClient } from "../lib/redis";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { ApiError } from "@repo/http";
import { SecretCipher } from "../utils/secret-cipher";
import { DeploymentQueueService } from "./deployment-queue.service";
import { GithubService } from "./github.service";

export interface GithubWebhookRequest {
  projectId: string;
  event: string | undefined;
  deliveryId: string | undefined;
  signature: string | undefined;
  rawBody: unknown;
}

export type WebhookOutcome =
  | { kind: "pong" }
  | { kind: "ignored"; reason: string }
  | { kind: "queued"; deploymentId: string };

const SIGNATURE_PREFIX = "sha256=";
const DELIVERY_TTL_SECONDS = 24 * 60 * 60;
const BRANCH_REF_PREFIX = "refs/heads/";
const commitShaPattern = /^[0-9a-f]{40}$/;
const zeroShaPattern = /^0{40}$/;

const pushPayloadSchema = z.object({
  ref: z.string().min(1),
  after: z.string(),
  deleted: z.boolean().default(false),
  repository: z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    owner: z.object({
      id: z.number().int().positive(),
      login: z.string().min(1),
    }),
  }),
  sender: z.object({
    id: z.number().int().positive(),
    login: z.string().min(1),
  }),
});

type PushPayload = z.infer<typeof pushPayloadSchema>;

const ignored = (reason: string): WebhookOutcome => ({
  kind: "ignored",
  reason,
});

const invalidPayload = (): ApiError =>
  new ApiError(
    StatusCodes.BAD_REQUEST,
    ErrorMessage.INVALID_WEBHOOK_PAYLOAD,
    ErrorCode.BAD_REQUEST,
  );

export abstract class WebhookService {
  static async handleGithub(
    request: GithubWebhookRequest,
  ): Promise<WebhookOutcome> {
    const project = await ProjectRepository.findActiveById(request.projectId);

    if (!project?.githubWebhookSecret) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ErrorMessage.PROJECT_NOT_FOUND,
        ErrorCode.NOT_FOUND,
      );
    }

    if (!Buffer.isBuffer(request.rawBody)) {
      throw invalidPayload();
    }

    WebhookService.assertSignature(
      request.rawBody,
      request.signature,
      SecretCipher.decrypt(project.githubWebhookSecret),
    );

    if (request.event === "ping") {
      return { kind: "pong" };
    }

    if (request.event !== "push") {
      return ignored(`event "${request.event ?? "unknown"}" is not handled`);
    }

    if (!request.deliveryId) {
      throw invalidPayload();
    }

    const payload = WebhookService.parsePush(request.rawBody);
    const skipReason = WebhookService.skipReason(project, payload);

    if (skipReason) {
      return ignored(skipReason);
    }

    const deliveryKey = RedisKeys.webhookDelivery(request.deliveryId);
    const firstDelivery = await redisClient.set(
      deliveryKey,
      "1",
      "EX",
      DELIVERY_TTL_SECONDS,
      "NX",
    );

    if (firstDelivery !== "OK") {
      return ignored("delivery was already processed");
    }

    try {
      return await WebhookService.deployPush(project, payload);
    } catch (err) {
      await redisClient
        .del(deliveryKey)
        .catch((delErr: unknown) =>
          logger.warn({ err: delErr }, "failed to clear webhook delivery key"),
        );
      throw err;
    }
  }

  private static async deployPush(
    project: Project,
    payload: PushPayload,
  ): Promise<WebhookOutcome> {
    if (!(await WebhookService.isTrustedPusher(project, payload))) {
      logger.info(
        { projectId: project.id, sender: payload.sender.login },
        "push ignored, sender is not the repository owner or a collaborator",
      );
      return ignored("pusher is not the repository owner or a collaborator");
    }

    const deployment = await DeploymentRepository.createForProject(project, {
      trigger: "push",
      commitSha: payload.after,
    });

    if (!deployment) {
      return ignored("project was deleted");
    }

    await DeploymentQueueService.enqueue({
      deploymentId: deployment.id,
      userId: project.userId,
    });

    logger.info(
      {
        projectId: project.id,
        deploymentId: deployment.id,
        commitSha: payload.after,
        sender: payload.sender.login,
      },
      "push deployment queued",
    );

    return { kind: "queued", deploymentId: deployment.id };
  }

  private static async isTrustedPusher(
    project: Project,
    payload: PushPayload,
  ): Promise<boolean> {
    if (payload.sender.id === payload.repository.owner.id) {
      return true;
    }

    try {
      const accessToken = await AuthServiceClient.getGithubToken(
        project.userId,
      );

      return await GithubService.isCollaborator(
        accessToken,
        {
          owner: payload.repository.owner.login,
          name: payload.repository.name,
        },
        payload.sender.login,
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.errorCode === ErrorCode.GITHUB_AUTH_REQUIRED
      ) {
        logger.warn(
          { projectId: project.id },
          "project owner github authorization is missing, push ignored",
        );
        return false;
      }

      throw err;
    }
  }

  private static skipReason(
    project: Project,
    payload: PushPayload,
  ): string | undefined {
    if (payload.repository.id !== project.githubRepositoryId) {
      return "repository does not match the project";
    }

    if (payload.ref !== `${BRANCH_REF_PREFIX}${project.branch}`) {
      return `ref "${payload.ref}" is not the production branch`;
    }

    if (
      payload.deleted ||
      !commitShaPattern.test(payload.after) ||
      zeroShaPattern.test(payload.after)
    ) {
      return "push does not point to a commit";
    }

    return undefined;
  }

  private static parsePush(rawBody: Buffer): PushPayload {
    let json: unknown;

    try {
      json = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw invalidPayload();
    }

    const parsed = pushPayloadSchema.safeParse(json);

    if (!parsed.success) {
      throw invalidPayload();
    }

    return parsed.data;
  }

  private static assertSignature(
    rawBody: Buffer,
    signature: string | undefined,
    secret: string,
  ): void {
    const expected = Buffer.from(
      `${SIGNATURE_PREFIX}${createHmac("sha256", secret).update(rawBody).digest("hex")}`,
    );
    const received = Buffer.from(signature ?? "");

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.INVALID_WEBHOOK_SIGNATURE,
        ErrorCode.INVALID_WEBHOOK_SIGNATURE,
      );
    }
  }
}
