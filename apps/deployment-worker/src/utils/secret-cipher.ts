import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const VERSION = "v1";

export abstract class SecretCipher {
  private static readonly key = Buffer.from(env.ENV_ENCRYPTION_KEY, "base64");

  static encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, SecretCipher.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    return [
      VERSION,
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      ciphertext.toString("base64url"),
    ].join(".");
  }

  static decrypt(payload: string): string {
    const [version, iv, authTag, ciphertext] = payload.split(".");

    if (version !== VERSION || !iv || !authTag || !ciphertext) {
      throw new Error("unsupported encrypted secret format");
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      SecretCipher.key,
      Buffer.from(iv, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTag, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  }
}
