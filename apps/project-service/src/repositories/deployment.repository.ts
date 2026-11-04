import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../lib/postgres";
import {
  deployments,
  projects,
  type Deployment,
  type Project,
} from "../db/schema";

export type DeploymentTrigger = Deployment["trigger"];

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
  static isActive(deployment: Pick<Deployment, "status">): boolean {
    return (ACTIVE_DEPLOYMENT_STATUSES as readonly string[]).includes(
      deployment.status,
    );
  }

  static async createForProject(
    project: Project,
    {
      trigger,
      commitSha = null,
    }: { trigger: DeploymentTrigger; commitSha?: string | null },
  ): Promise<Deployment | undefined> {
    return db.transaction(async (tx) => {
      const [alive] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, project.id), isNull(projects.deletedAt)))
        .for("key share");

      if (!alive) {
        return undefined;
      }

      const [deployment] = await tx
        .insert(deployments)
        .values({
          projectId: project.id,
          trigger,
          commitSha,
          branch: project.branch,
          framework: project.framework,
          rootDirectory: project.rootDirectory,
          packageManager: project.packageManager,
          runtime: project.runtime,
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
