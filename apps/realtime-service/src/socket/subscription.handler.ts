import type { Socket } from "socket.io";
import { env } from "../config/env";
import { ClientEvent, deploymentRoom } from "../constants/socket-events";
import { logger as rootLogger } from "../lib/logger";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { subscribePayloadSchema } from "../schemas/deployment-log-event.schema";
import type { AccessTokenClaims } from "../services/token.service";

const logger = rootLogger.child({ component: "subscription-handler" });

const ROOM_PREFIX = "deployment:";

type Acknowledge = (response: unknown) => void;

const failure = (code: string, message: string) => ({
  ok: false as const,
  code,
  message,
});

const subscribedDeployments = (socket: Socket): string[] =>
  [...socket.rooms].filter((room) => room.startsWith(ROOM_PREFIX));

const respond = (acknowledge: unknown, response: unknown): void => {
  if (typeof acknowledge === "function") {
    (acknowledge as Acknowledge)(response);
  }
};

export const registerSubscriptionHandlers = (socket: Socket): void => {
  const user = socket.data["user"] as AccessTokenClaims;

  socket.on(
    ClientEvent.SUBSCRIBE,
    async (payload: unknown, acknowledge: unknown) => {
      const parsed = subscribePayloadSchema.safeParse(payload);

      if (!parsed.success) {
        respond(
          acknowledge,
          failure("VALIDATION_ERROR", "deploymentId must be a UUID"),
        );
        return;
      }

      const { deploymentId } = parsed.data;
      const room = deploymentRoom(deploymentId);

      if (
        !socket.rooms.has(room) &&
        subscribedDeployments(socket).length >=
          env.SOCKET_MAX_SUBSCRIPTIONS_PER_CLIENT
      ) {
        respond(
          acknowledge,
          failure(
            "SUBSCRIPTION_LIMIT",
            `A connection can follow at most ${env.SOCKET_MAX_SUBSCRIPTIONS_PER_CLIENT} deployments`,
          ),
        );
        return;
      }

      try {
        const deployment = await DeploymentRepository.findOwnedByUser(
          deploymentId,
          user.userId,
        );

        if (!deployment) {
          respond(
            acknowledge,
            failure("NOT_FOUND", "The requested deployment could not be found"),
          );
          return;
        }

        await socket.join(room);
        respond(acknowledge, {
          ok: true,
          data: { deploymentId, status: deployment.status },
        });
      } catch (err) {
        logger.error(
          { err, deploymentId },
          "failed to subscribe to deployment",
        );
        respond(
          acknowledge,
          failure("INTERNAL_SERVER_ERROR", "Something went wrong on our end"),
        );
      }
    },
  );

  socket.on(
    ClientEvent.UNSUBSCRIBE,
    async (payload: unknown, acknowledge: unknown) => {
      const parsed = subscribePayloadSchema.safeParse(payload);

      if (!parsed.success) {
        respond(
          acknowledge,
          failure("VALIDATION_ERROR", "deploymentId must be a UUID"),
        );
        return;
      }

      await socket.leave(deploymentRoom(parsed.data.deploymentId));
      respond(acknowledge, {
        ok: true,
        data: { deploymentId: parsed.data.deploymentId },
      });
    },
  );
};
