import { createRequire } from "node:module";
import pino from "pino";
import { env } from "../config/env";

const canPrettyPrint = (() => {
  try {
    createRequire(import.meta.url).resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
})();

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development" && canPrettyPrint
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  base: env.NODE_ENV === "production" ? undefined : { pid: process.pid },
});
