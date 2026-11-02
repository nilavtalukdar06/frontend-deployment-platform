import { and, eq, isNull } from "drizzle-orm";
import { db } from "../lib/postgres";
import { users, type NewUser, type User } from "../db/schema";

export abstract class UserRepository {
  static async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    return user;
  }

  static async findById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return user;
  }

  static async create(
    data: Pick<NewUser, "email" | "passwordHash">,
  ): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();

    if (!user) {
      throw new Error("user insert returned no rows");
    }

    return user;
  }

  static async touchLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }
}
