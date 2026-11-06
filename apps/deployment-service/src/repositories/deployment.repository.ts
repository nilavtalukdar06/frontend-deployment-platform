import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { db } from "../lib/postgres";
import {
  deployments,
  projectEnvironmentVariables,
  projects,
  type Deployment,
  type Project,
} from "@repo/db";

export type DeploymentStatus = Deployment["status"];

export interface DeploymentWithProject {
  deployment: Deployment;
  project: Project;
}

const terminalStatuses: DeploymentStatus[] = ["ready", "failed", "canceled"];

const errorMessageMaxLength = 1000;

export abstract class DeploymentRepository {
  static async findWithProject(
    deploymentId: string,
  ): Promise<DeploymentWithProject | undefined> {
    const [row] = await db
      .select({ deployment: deployments, project: projects })
      .from(deployments)
      .innerJoin(projects, eq(deployments.projectId, projects.id))
      .where(eq(deployments.id, deploymentId))
      .limit(1);

    return row;
  }

  static async findEnvironmentVariables(
    projectId: string,
  ): Promise<{ key: string; value: string }[]> {
    return db
      .select({
        key: projectEnvironmentVariables.key,
        value: projectEnvironmentVariables.value,
      })
      .from(projectEnvironmentVariables)
      .where(eq(projectEnvironmentVariables.projectId, projectId))
      .orderBy(asc(projectEnvironmentVariables.key));
  }

  static async transition(
    id: string,
    status: DeploymentStatus,
    changes: Partial<Pick<Deployment, "commitSha">> = {},
  ): Promise<boolean> {
    const updated = await db
      .update(deployments)
      .set({
        ...changes,
        status,
        startedAt: sql`coalesce(${deployments.startedAt}, now())`,
      })
      .where(
        and(
          eq(deployments.id, id),
          notInArray(deployments.status, terminalStatuses),
        ),
      )
      .returning({ id: deployments.id });

    return updated.length > 0;
  }

  static async markReady(id: string): Promise<boolean> {
    const updated = await db
      .update(deployments)
      .set({ status: "ready", errorMessage: null, finishedAt: sql`now()` })
      .where(
        and(
          eq(deployments.id, id),
          notInArray(deployments.status, terminalStatuses),
        ),
      )
      .returning({ id: deployments.id });

    return updated.length > 0;
  }

  static async markFailed(id: string, errorMessage: string): Promise<boolean> {
    const updated = await db
      .update(deployments)
      .set({
        status: "failed",
        errorMessage: errorMessage.slice(0, errorMessageMaxLength),
        finishedAt: sql`now()`,
      })
      .where(
        and(
          eq(deployments.id, id),
          notInArray(deployments.status, terminalStatuses),
        ),
      )
      .returning({ id: deployments.id });

    return updated.length > 0;
  }
}
