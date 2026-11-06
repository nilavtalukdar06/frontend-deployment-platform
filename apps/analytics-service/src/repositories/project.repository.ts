import { and, eq, isNull } from "drizzle-orm";
import { deployments, projects } from "@repo/db";
import { db } from "../lib/postgres";

export abstract class ProjectRepository {
  static async existsForUser(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    return project !== undefined;
  }

  static async listDeploymentIds(projectId: string): Promise<string[]> {
    const rows = await db
      .select({ id: deployments.id })
      .from(deployments)
      .where(eq(deployments.projectId, projectId));

    return rows.map((row) => row.id);
  }
}
