import { and, eq, isNull } from "drizzle-orm";
import { deployments, projects } from "../db/schema";
import { db } from "../lib/postgres";

export interface OwnedDeployment {
  id: string;
  status: (typeof deployments.$inferSelect)["status"];
}

export abstract class DeploymentRepository {
  static async findOwnedByUser(
    id: string,
    userId: string,
  ): Promise<OwnedDeployment | undefined> {
    const [deployment] = await db
      .select({ id: deployments.id, status: deployments.status })
      .from(deployments)
      .innerJoin(projects, eq(projects.id, deployments.projectId))
      .where(
        and(
          eq(deployments.id, id),
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    return deployment;
  }
}
