import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../lib/postgres";
import {
  deployments,
  projectEnvironmentVariables,
  projects,
  type Deployment,
  type NewProject,
  type Project,
} from "../db/schema";

export type ProjectChanges = Partial<
  Omit<
    NewProject,
    | "id"
    | "userId"
    | "slug"
    | "githubRepositoryId"
    | "private"
    | "repositoryUrl"
    | "framework"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
    | "githubWebhookId"
    | "githubWebhookSecret"
  >
>;

export interface EncryptedEnvironmentVariable {
  key: string;
  value: string;
}

export interface CreatedProject {
  project: Project;
  deployment: Deployment;
}

export interface DeletedProject {
  project: Project;
  deployments: Deployment[];
}

export interface ProjectPage {
  items: Project[];
  total: number;
}

export abstract class ProjectRepository {
  static async create(
    data: Omit<NewProject, "id" | "createdAt" | "updatedAt" | "deletedAt">,
    environmentVariables: EncryptedEnvironmentVariable[] = [],
  ): Promise<CreatedProject> {
    return db.transaction(async (tx) => {
      const [project] = await tx.insert(projects).values(data).returning();

      if (!project) {
        throw new Error("project insert returned no rows");
      }

      const [deployment] = await tx
        .insert(deployments)
        .values({
          projectId: project.id,
          trigger: "create",
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

      if (environmentVariables.length > 0) {
        await tx.insert(projectEnvironmentVariables).values(
          environmentVariables.map(({ key, value }) => ({
            projectId: project.id,
            key,
            value,
          })),
        );
      }

      return { project, deployment };
    });
  }

  static async findById(
    id: string,
    userId: string,
  ): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
        ),
      )
      .limit(1);

    return project;
  }

  static async findActiveById(id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .limit(1);

    return project;
  }

  static async setWebhook(
    id: string,
    webhook: { githubWebhookId: number; githubWebhookSecret: string } | null,
  ): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({
        githubWebhookId: webhook?.githubWebhookId ?? null,
        githubWebhookSecret: webhook?.githubWebhookSecret ?? null,
      })
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .returning();

    return project;
  }

  static async findImportedRepositoryIds(
    userId: string,
    githubRepositoryIds: number[],
  ): Promise<number[]> {
    if (githubRepositoryIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({ githubRepositoryId: projects.githubRepositoryId })
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          inArray(projects.githubRepositoryId, githubRepositoryIds),
          isNull(projects.deletedAt),
        ),
      );

    return rows.map((row) => row.githubRepositoryId);
  }

  static async listByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<ProjectPage> {
    const owned = and(eq(projects.userId, userId), isNull(projects.deletedAt));

    const [items, [totals]] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(owned)
        .orderBy(desc(projects.createdAt), desc(projects.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(projects).where(owned),
    ]);

    return { items, total: totals?.total ?? 0 };
  }

  static async update(
    id: string,
    userId: string,
    changes: ProjectChanges,
  ): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(changes)
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
        ),
      )
      .returning();

    return project;
  }

  static async deleteWithCleanup(
    id: string,
    userId: string,
    cleanup: (deployments: Deployment[]) => Promise<void>,
  ): Promise<DeletedProject | undefined> {
    return db.transaction(async (tx) => {
      const [project] = await tx
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.id, id),
            eq(projects.userId, userId),
            isNull(projects.deletedAt),
          ),
        )
        .limit(1)
        .for("update");

      if (!project) {
        return undefined;
      }

      const projectDeployments = await tx
        .select()
        .from(deployments)
        .where(eq(deployments.projectId, id));

      await tx
        .update(projects)
        .set({ deletedAt: new Date() })
        .where(eq(projects.id, id));

      await cleanup(projectDeployments);

      await tx.delete(deployments).where(eq(deployments.projectId, id));

      return { project, deployments: projectDeployments };
    });
  }
}
