import {
  ListTasksCommand,
  StopTaskCommand,
  waitUntilTasksStopped,
} from "@aws-sdk/client-ecs";
import { env } from "../config/env";
import { ecs } from "../lib/ecs";
import { logger } from "../lib/logger";

const TASK_STOP_MAX_WAIT_SECONDS = 120;

export abstract class DeploymentRunnerService {
  static async stop(deploymentId: string): Promise<void> {
    try {
      const taskArns =
        await DeploymentRunnerService.listLiveTasks(deploymentId);

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

  static async stopAndWait(deploymentId: string): Promise<void> {
    const taskArns = await DeploymentRunnerService.listLiveTasks(deploymentId);

    if (taskArns.length === 0) {
      return;
    }

    await Promise.all(
      taskArns.map((task) =>
        ecs.send(
          new StopTaskCommand({
            cluster: env.ECS_CLUSTER,
            task,
            reason: `project of deployment ${deploymentId} was deleted`,
          }),
        ),
      ),
    );

    await waitUntilTasksStopped(
      { client: ecs, maxWaitTime: TASK_STOP_MAX_WAIT_SECONDS },
      { cluster: env.ECS_CLUSTER, tasks: taskArns },
    );

    logger.info(
      { deploymentId, stoppedTasks: taskArns.length },
      "deployment tasks stopped",
    );
  }

  private static async listLiveTasks(deploymentId: string): Promise<string[]> {
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

    return [...new Set(listed.flatMap(({ taskArns }) => taskArns ?? []))];
  }
}
