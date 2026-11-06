import { and, eq, isNull } from "drizzle-orm";
import { deployments, projects } from "@repo/db";
import { db } from "../lib/postgres";

export abstract class DeploymentRepository {
  static async existsForUser(
    deploymentId: string,
    userId: string,
  ): Promise<boolean> {
    const [deployment] = await db
      .select({ id: deployments.id })
      .from(deployments)
      .innerJoin(projects, eq(projects.id, deployments.projectId))
      .where(
        and(
          eq(deployments.id, deploymentId),
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    return deployment !== undefined;
  }
}
