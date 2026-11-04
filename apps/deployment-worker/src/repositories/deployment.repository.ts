import { and, eq, sql } from "drizzle-orm";
import { db } from "../lib/postgres";
import { deployments, type Deployment } from "../db/schema";

const errorMessageMaxLength = 1000;

const ACTIVE_DEPLOYMENT_STATUSES: readonly Deployment["status"][] = [
  "queued",
  "cloning",
  "installing",
  "building",
  "uploading",
];

export abstract class DeploymentRepository {
  static async findById(id: string): Promise<Deployment | undefined> {
    const [deployment] = await db
      .select()
      .from(deployments)
      .where(eq(deployments.id, id))
      .limit(1);

    return deployment;
  }

  static isActive(deployment: Pick<Deployment, "status">): boolean {
    return ACTIVE_DEPLOYMENT_STATUSES.includes(deployment.status);
  }

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
