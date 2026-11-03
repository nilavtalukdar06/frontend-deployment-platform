import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../lib/postgres";
import { deployments, type Deployment, type Project } from "../db/schema";

const errorMessageMaxLength = 1000;

const ACTIVE_DEPLOYMENT_STATUSES = [
  "queued",
  "cloning",
  "installing",
  "building",
  "uploading",
] as const;

export interface DeploymentPage {
  items: Deployment[];
  total: number;
}

export abstract class DeploymentRepository {
  static async createForProject(
    project: Project,
  ): Promise<Deployment | undefined> {
    return db.transaction(async (tx) => {
      const [active] = await tx
        .select({ id: deployments.id })
        .from(deployments)
        .where(
          and(
            eq(deployments.projectId, project.id),
            inArray(deployments.status, [...ACTIVE_DEPLOYMENT_STATUSES]),
          ),
        )
        .limit(1);

      if (active) {
        return undefined;
      }

      const [deployment] = await tx
        .insert(deployments)
        .values({
          projectId: project.id,
          branch: project.branch,
          framework: project.framework,
          rootDirectory: project.rootDirectory,
          installCommand: project.installCommand,
          buildCommand: project.buildCommand,
          outputDirectory: project.outputDirectory,
        })
        .returning();

      if (!deployment) {
        throw new Error("deployment insert returned no rows");
      }

      return deployment;
    });
  }

  static async listByProject(
    projectId: string,
    limit: number,
    offset: number,
  ): Promise<DeploymentPage> {
    const ofProject = eq(deployments.projectId, projectId);

    const [items, [totals]] = await Promise.all([
      db
        .select()
        .from(deployments)
        .where(ofProject)
        .orderBy(desc(deployments.createdAt), desc(deployments.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(deployments).where(ofProject),
    ]);

    return { items, total: totals?.total ?? 0 };
  }

  static async findByIdForProject(
    id: string,
    projectId: string,
  ): Promise<Deployment | undefined> {
    const [deployment] = await db
      .select()
      .from(deployments)
      .where(and(eq(deployments.id, id), eq(deployments.projectId, projectId)))
      .limit(1);

    return deployment;
  }

  static async markCanceled(
    id: string,
    projectId: string,
  ): Promise<Deployment | undefined> {
    const [deployment] = await db
      .update(deployments)
      .set({
        status: "canceled",
        finishedAt: sql`now()`,
      })
      .where(
        and(
          eq(deployments.id, id),
          eq(deployments.projectId, projectId),
          inArray(deployments.status, [...ACTIVE_DEPLOYMENT_STATUSES]),
        ),
      )
      .returning();

    return deployment;
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
