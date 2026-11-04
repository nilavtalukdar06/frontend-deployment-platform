import { ListTasksCommand, StopTaskCommand } from "@aws-sdk/client-ecs";
import { env } from "../config/env";
import { ecs } from "../lib/ecs";
import { logger } from "../lib/logger";

export abstract class DeploymentRunnerService {
  static async stop(deploymentId: string): Promise<void> {
    try {
      const listed = await Promise.all(
        (["RUNNING", "PENDING"] as const).map((desiredStatus) =>
          ecs.send(
            new ListTasksCommand({
              cluster: env.ECS_CLUSTER,
              startedBy: deploymentId,
              desiredStatus,
            }),
          ),
        ),
      );

      const taskArns = [
        ...new Set(listed.flatMap(({ taskArns: arns }) => arns ?? [])),
      ];

      await Promise.all(
        taskArns.map((task) =>
          ecs.send(
            new StopTaskCommand({
              cluster: env.ECS_CLUSTER,
              task,
              reason: `canceled deployment ${deploymentId}`,
            }),
          ),
        ),
      );

      logger.info(
        { deploymentId, stoppedTasks: taskArns.length },
        "deployment task stop requested",
      );
    } catch (err) {
      logger.error({ err, deploymentId }, "failed to stop deployment task");
    }
  }
}
