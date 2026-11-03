import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../lib/postgres";
import { deployments, projects } from "../db/schema";

export abstract class DeploymentRepository {
  static async findReadyDeploymentId(
    deploymentId: string,
  ): Promise<string | null> {
    const [row] = await db
      .select({ id: deployments.id })
      .from(deployments)
      .innerJoin(projects, eq(projects.id, deployments.projectId))
      .where(
        and(
          eq(deployments.id, deploymentId),
          eq(deployments.status, "ready"),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    return row?.id ?? null;
  }

  static async findLatestReadyDeploymentIdBySlug(
    slug: string,
  ): Promise<string | null> {
    const [row] = await db
      .select({ id: deployments.id })
      .from(deployments)
      .innerJoin(projects, eq(projects.id, deployments.projectId))
      .where(
        and(
          eq(projects.slug, slug),
          eq(deployments.status, "ready"),
          isNull(projects.deletedAt),
        ),
      )
      .orderBy(desc(deployments.finishedAt), desc(deployments.createdAt))
      .limit(1);

    return row?.id ?? null;
  }
}
