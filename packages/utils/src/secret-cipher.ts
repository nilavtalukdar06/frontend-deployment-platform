import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const VERSION = "v1";

export interface SecretCipher {
  encrypt(plaintext: string): string;
  decrypt(payload: string): string;
}

export const createSecretCipher = (base64Key: string): SecretCipher => {
  const key = Buffer.from(base64Key, "base64");

  return {
    encrypt(plaintext) {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, iv);
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
    },

    decrypt(payload) {
      const [version, iv, authTag, ciphertext] = payload.split(".");

      if (version !== VERSION || !iv || !authTag || !ciphertext) {
        throw new Error("unsupported encrypted secret format");
      }

      const decipher = createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(iv, "base64url"),
      );
      decipher.setAuthTag(Buffer.from(authTag, "base64url"));

      return Buffer.concat([
        decipher.update(Buffer.from(ciphertext, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    },
  };
};
