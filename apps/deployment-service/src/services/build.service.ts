import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { env } from "../config/env";
import type { DeploymentStep } from "../constants/deployment-step.enum";
import type { DeploymentLogCollector } from "../logging/deployment-log-collector";
import { DeploymentError } from "../utils/deployment-error";
import { formatDuration } from "../utils/format-duration";

const outputTailLines = 20;

const heartbeatIntervalMs = 30_000;

const sandboxedEnv = (): NodeJS.ProcessEnv => ({
  PATH: process.env["PATH"],
  HOME: process.env["HOME"],
  CI: "true",
  COREPACK_ENABLE_DOWNLOAD_PROMPT: "0",
  COREPACK_ENABLE_STRICT: "0",
});

export abstract class BuildService {
  static run(params: {
    step: DeploymentStep;
    command: string;
    cwd: string;
    environmentVariables: Record<string, string>;
    collector: DeploymentLogCollector;
  }): Promise<void> {
    const { step, command, cwd, environmentVariables, collector } = params;
    const tail: string[] = [];
    const label = step === "install" ? "Install" : "Build";
    const startedAt = Date.now();
    const variableCount = Object.keys(environmentVariables).length;

    return new Promise((resolve, reject) => {
      collector.log(
        "info",
        step,
        `${label}: running in ${cwd} with ${variableCount} environment variable${variableCount === 1 ? "" : "s"} injected, timeout ${formatDuration(env.BUILD_TIMEOUT_MS)}`,
      );

      const child = spawn(command, {
        cwd,
        shell: true,
        env: { ...environmentVariables, ...sandboxedEnv() },
        stdio: ["ignore", "pipe", "pipe"],
        signal: AbortSignal.timeout(env.BUILD_TIMEOUT_MS),
        killSignal: "SIGKILL",
      });

      collector.log("info", step, `$ ${command}`);
      if (child.pid !== undefined) {
        collector.log(
          "info",
          step,
          `${label}: process started (pid ${child.pid})`,
        );
      }

      const heartbeat = setInterval(() => {
        collector.log(
          "info",
          step,
          `${label}: still running after ${formatDuration(Date.now() - startedAt)}`,
        );
      }, heartbeatIntervalMs);
      heartbeat.unref();

      const collect = (
        stream: NodeJS.ReadableStream,
        source: "stdout" | "stderr",
      ) =>
        createInterface({ input: stream, crlfDelay: Infinity }).on(
          "line",
          (line) => {
            collector.log(
              source === "stdout" ? "info" : "warn",
              step,
              line,
              source,
            );
            tail.push(line);
            if (tail.length > outputTailLines) {
              tail.shift();
            }
          },
        );

      collect(child.stdout, "stdout");
      collect(child.stderr, "stderr");

      child.once("error", (err) => {
        clearInterval(heartbeat);
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
        clearInterval(heartbeat);
        const elapsed = formatDuration(Date.now() - startedAt);

        if (code === 0) {
          collector.log(
            "info",
            step,
            `${label}: command finished successfully with exit code 0 in ${elapsed}`,
          );
          resolve();
          return;
        }

        const exit = signal ? `signal ${signal}` : `exit code ${code}`;
        collector.log(
          "error",
          step,
          `${label}: command failed with ${exit} after ${elapsed}`,
        );
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
