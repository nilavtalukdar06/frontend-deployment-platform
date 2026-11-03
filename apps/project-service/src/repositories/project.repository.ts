import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "../lib/postgres";
import { projects, type NewProject, type Project } from "../db/schema";

export type ProjectChanges = Partial<
  Omit<
    NewProject,
    "id" | "userId" | "slug" | "createdAt" | "updatedAt" | "deletedAt"
  >
>;

export interface ProjectPage {
  items: Project[];
  total: number;
}

export abstract class ProjectRepository {
  static async create(
    data: Omit<NewProject, "id" | "createdAt" | "updatedAt" | "deletedAt">,
  ): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();

    if (!project) {
      throw new Error("project insert returned no rows");
    }

    return project;
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
