import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { env } from "../config/env";
import type { DeploymentStep } from "../constants/deployment-step.enum";
import type { Logger } from "pino";
import { DeploymentError } from "../utils/deployment-error";

const outputTailLines = 20;

const sandboxedEnv = (): NodeJS.ProcessEnv => ({
  PATH: process.env["PATH"],
  HOME: process.env["HOME"],
  CI: "true",
  COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
});

export abstract class BuildService {
  static run(params: {
    step: DeploymentStep;
    command: string;
    cwd: string;
    environmentVariables: Record<string, string>;
    logger: Logger;
  }): Promise<void> {
    const { step, command, cwd, environmentVariables, logger } = params;
    const tail: string[] = [];

    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        cwd,
        shell: true,
        env: { ...environmentVariables, ...sandboxedEnv() },
        stdio: ["ignore", "pipe", "pipe"],
        signal: AbortSignal.timeout(env.BUILD_TIMEOUT_MS),
        killSignal: "SIGKILL",
      });

      const collect = (stream: NodeJS.ReadableStream, level: "info" | "warn") =>
        createInterface({ input: stream }).on("line", (line) => {
          logger[level]({ step }, line);
          tail.push(line);
          if (tail.length > outputTailLines) {
            tail.shift();
          }
        });

      collect(child.stdout, "info");
      collect(child.stderr, "warn");

      child.once("error", (err) => {
        const reason =
          err.name === "AbortError"
            ? `timed out after ${env.BUILD_TIMEOUT_MS}ms`
            : err.message;
        reject(
          new DeploymentError(step, `"${command}" failed: ${reason}`, {
            cause: err,
          }),
        );
      });

      child.once("close", (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }

        const exit = signal ? `signal ${signal}` : `exit code ${code}`;
        reject(
          new DeploymentError(
            step,
            `"${command}" failed with ${exit}\n${tail.join("\n")}`,
          ),
        );
      });
    });
  }
}
