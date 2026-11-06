import { createSecretCipher } from "@repo/utils";
import { env } from "../config/env";

export const SecretCipher = createSecretCipher(env.ENV_ENCRYPTION_KEY);
