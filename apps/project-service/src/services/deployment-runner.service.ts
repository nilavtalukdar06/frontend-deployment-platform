import { RunTaskCommand } from "@aws-sdk/client-ecs";
import { env } from "../config/env";
import { ecs } from "../lib/ecs";
import { logger } from "../lib/logger";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { SecretCipher } from "../utils/secret-cipher";

const LAUNCH_FAILURE_MESSAGE =
  "[initialize] the deployment task could not be started";

export interface StartDeploymentInput {
  deploymentId: string;
  userId: string;
  githubToken: string;
}

export abstract class DeploymentRunnerService {
  static async start({
    deploymentId,
    userId,
    githubToken,
  }: StartDeploymentInput): Promise<void> {
    try {
      const { tasks, failures } = await ecs.send(
        new RunTaskCommand({
          cluster: env.ECS_CLUSTER,
          taskDefinition: env.ECS_TASK_DEFINITION,
          launchType: "FARGATE",
          count: 1,
          startedBy: deploymentId,
          clientToken: deploymentId,
          networkConfiguration: {
            awsvpcConfiguration: {
              subnets: env.ECS_SUBNET_IDS,
              securityGroups:
                env.ECS_SECURITY_GROUP_IDS.length > 0
                  ? env.ECS_SECURITY_GROUP_IDS
                  : undefined,
              assignPublicIp: env.ECS_ASSIGN_PUBLIC_IP,
            },
          },
          overrides: {
            containerOverrides: [
              {
                name: env.ECS_CONTAINER_NAME,
                environment: [
                  { name: "DEPLOYMENT_ID", value: deploymentId },
                  { name: "USER_ID", value: userId },
                  {
                    name: "GITHUB_TOKEN_ENCRYPTED",
                    value: SecretCipher.encrypt(githubToken),
                  },
                ],
              },
            ],
          },
        }),
      );

      const taskArn = tasks?.[0]?.taskArn;

      if (!taskArn) {
        throw new Error(
          failures
            ?.map(({ arn, reason, detail }) =>
              [arn, reason, detail].filter(Boolean).join(" "),
            )
            .join("; ") || "ecs did not return a task",
        );
      }

      logger.info({ deploymentId, taskArn }, "deployment task started");
    } catch (err) {
      logger.error({ err, deploymentId }, "deployment task failed to start");

      await DeploymentRepository.markQueuedAsFailed(
        deploymentId,
        LAUNCH_FAILURE_MESSAGE,
      ).catch((markErr: unknown) =>
        logger.error(
          { err: markErr, deploymentId },
          "failed to mark deployment as failed",
        ),
      );
    }
  }
}
