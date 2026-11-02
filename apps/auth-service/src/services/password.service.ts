import { hash, verify } from "@node-rs/argon2";

const ARGON2ID = 2;

const HASH_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export abstract class PasswordService {
  private static dummyHash: Promise<string> | undefined;

  static hash(password: string): Promise<string> {
    return hash(password, HASH_OPTIONS);
  }

  static async verify(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  static async verifyAgainstDummy(password: string): Promise<false> {
    PasswordService.dummyHash ??= PasswordService.hash("dummy-password-value");
    await PasswordService.verify(await PasswordService.dummyHash, password);
    return false;
  }
}
