import { and, eq, sql } from "drizzle-orm";
import { db } from "../lib/postgres";
import { deployments } from "../db/schema";

const errorMessageMaxLength = 1000;

export abstract class DeploymentRepository {
  static async markQueuedAsFailed(
    id: string,
    errorMessage: string,
  ): Promise<boolean> {
    const updated = await db
      .update(deployments)
      .set({
        status: "failed",
        errorMessage: errorMessage.slice(0, errorMessageMaxLength),
        finishedAt: sql`now()`,
      })
      .where(and(eq(deployments.id, id), eq(deployments.status, "queued")))
      .returning({ id: deployments.id });

    return updated.length > 0;
  }
}
