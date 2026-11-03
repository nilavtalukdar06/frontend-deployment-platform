import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../lib/postgres";
import {
  projectEnvironmentVariables,
  type ProjectEnvironmentVariable,
} from "../db/schema";

export abstract class EnvironmentVariableRepository {
  static async listByProject(
    projectId: string,
  ): Promise<ProjectEnvironmentVariable[]> {
    return db
      .select()
      .from(projectEnvironmentVariables)
      .where(eq(projectEnvironmentVariables.projectId, projectId))
      .orderBy(asc(projectEnvironmentVariables.key));
  }

  static async exists(projectId: string, key: string): Promise<boolean> {
    const [row] = await db
      .select({ id: projectEnvironmentVariables.id })
      .from(projectEnvironmentVariables)
      .where(
        and(
          eq(projectEnvironmentVariables.projectId, projectId),
          eq(projectEnvironmentVariables.key, key),
        ),
      )
      .limit(1);

    return row !== undefined;
  }

  static async countByProject(projectId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(projectEnvironmentVariables)
      .where(eq(projectEnvironmentVariables.projectId, projectId));

    return row?.total ?? 0;
  }

  static async upsert(
    projectId: string,
    key: string,
    value: string,
  ): Promise<ProjectEnvironmentVariable> {
    const [row] = await db
      .insert(projectEnvironmentVariables)
      .values({ projectId, key, value })
      .onConflictDoUpdate({
        target: [
          projectEnvironmentVariables.projectId,
          projectEnvironmentVariables.key,
        ],
        set: { value },
      })
      .returning();

    if (!row) {
      throw new Error("environment variable upsert returned no rows");
    }

    return row;
  }

  static async delete(projectId: string, key: string): Promise<boolean> {
    const deleted = await db
      .delete(projectEnvironmentVariables)
      .where(
        and(
          eq(projectEnvironmentVariables.projectId, projectId),
          eq(projectEnvironmentVariables.key, key),
        ),
      )
      .returning({ id: projectEnvironmentVariables.id });

    return deleted.length > 0;
  }
}
