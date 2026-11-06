import { createRequire } from "node:module";
import pino, { type Logger } from "pino";

export type { Logger } from "pino";

export type LogLevel =
  "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

export interface CreateLoggerOptions {
  level: LogLevel;
  nodeEnv: string;
}

const canPrettyPrint = (): boolean => {
  try {
    createRequire(import.meta.url).resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
};

export const createLogger = ({ level, nodeEnv }: CreateLoggerOptions): Logger =>
  pino({
    level,
    transport:
      nodeEnv === "development" && canPrettyPrint()
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
        : undefined,
    base: nodeEnv === "production" ? undefined : { pid: process.pid },
  });
