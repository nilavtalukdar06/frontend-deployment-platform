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

  static async softDelete(id: string, userId: string): Promise<boolean> {
    const deleted = await db
      .update(projects)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(projects.id, id),
          eq(projects.userId, userId),
          isNull(projects.deletedAt),
        ),
      )
      .returning({ id: projects.id });

    return deleted.length > 0;
  }
}
