import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../lib/postgres";
import { users, type NewUser, type User } from "../db/schema";

export type GithubUserData = Pick<
  NewUser,
  | "githubId"
  | "githubLogin"
  | "name"
  | "email"
  | "avatarUrl"
  | "githubAccessToken"
  | "githubTokenScopes"
>;

export abstract class UserRepository {
  static async findById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return user;
  }

  static async upsertFromGithub(data: GithubUserData): Promise<User> {
    const { githubId: _githubId, ...profile } = data;

    const [user] = await db
      .insert(users)
      .values({ ...data, lastLoginAt: sql`now()` })
      .onConflictDoUpdate({
        target: users.githubId,
        set: { ...profile, lastLoginAt: sql`now()` },
      })
      .returning();

    if (!user) {
      throw new Error("user upsert returned no rows");
    }

    return user;
  }
}
