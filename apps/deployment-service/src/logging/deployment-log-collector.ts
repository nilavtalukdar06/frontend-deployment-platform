import type { Logger } from "pino";
import { env } from "../config/env";
import { DeploymentStep } from "../constants/deployment-step.enum";
import type { KafkaProducer } from "../lib/kafka";
import { formatDuration } from "../utils/format-duration";
import type { DeploymentStatus } from "../repositories/deployment.repository";
import {
  deploymentLogSchemaVersion,
  type DeploymentLogEvent,
  type DeploymentLogLevel,
  type DeploymentLogSource,
  type DeploymentStepPhase,
} from "./deployment-log-event";
import {
  createRedactor,
  stripTerminalFormatting,
  truncateUtf8,
  type Redactor,
} from "./log-sanitizer";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

type DeploymentLogEventInput = DistributiveOmit<
  DeploymentLogEvent,
  "schemaVersion" | "deploymentId" | "projectId" | "sequence" | "timestamp"
>;

const retryBaseDelayMs = 200;
const retryMaxDelayMs = 5_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const stepLabels: Record<DeploymentStep, string> = {
  [DeploymentStep.INITIALIZE]: "Initialize",
  [DeploymentStep.CLONE]: "Clone",
  [DeploymentStep.INSTALL]: "Install",
  [DeploymentStep.BUILD]: "Build",
  [DeploymentStep.UPLOAD]: "Upload",
  [DeploymentStep.FINALIZE]: "Finalize",
};

const statusMessages: Record<DeploymentStatus, string> = {
  queued: "Deployment is queued",
  cloning: "Deployment status changed to cloning: fetching your repository",
  installing:
    "Deployment status changed to installing: installing dependencies",
  building: "Deployment status changed to building: building your project",
  uploading: "Deployment status changed to uploading: publishing build output",
  ready: "Deployment status changed to ready: your site is live",
  failed: "Deployment status changed to failed",
  canceled: "Deployment status changed to canceled",
};

const isDroppable = (event: DeploymentLogEvent): boolean =>
  event.type === "log" && event.source !== "system";

export class DeploymentLogCollector {
  private readonly deploymentId: string;
  private readonly producer: KafkaProducer | undefined;
  private readonly logger: Logger;
  private readonly topic = env.KAFKA_DEPLOYMENT_LOGS_TOPIC;
  private readonly batchSize = env.DEPLOYMENT_LOG_BATCH_SIZE;
  private readonly bufferLimit = env.DEPLOYMENT_LOG_BUFFER_LIMIT;
  private readonly maxLineBytes = env.DEPLOYMENT_LOG_MAX_LINE_BYTES;

  private projectId: string | null = null;
  private redact: Redactor = (text) => text;
  private sequence = 0;
  private lastStatus: DeploymentStatus = "queued";
  private buffer: DeploymentLogEvent[] = [];
  private inFlight: DeploymentLogEvent[] = [];
  private flushing: Promise<void> | undefined;
  private consecutiveFailures = 0;
  private nextAttemptAt = 0;
  private droppedCount = 0;
  private unreportedDroppedCount = 0;
  private readonly stepStartedAt = new Map<DeploymentStep, number>();
  private readonly timer: NodeJS.Timeout | undefined;
  private closing: Promise<void> | undefined;

  constructor(params: {
    deploymentId: string;
    producer: KafkaProducer | undefined;
    logger: Logger;
  }) {
    this.deploymentId = params.deploymentId;
    this.producer = params.producer;
    this.logger = params.logger;

    if (this.producer) {
      this.timer = setInterval(() => {
        void this.flush();
      }, env.DEPLOYMENT_LOG_FLUSH_INTERVAL_MS);
      this.timer.unref();
    }
  }

  get isStreaming(): boolean {
    return this.producer !== undefined;
  }

  setContext(params: { projectId: string; secrets: Iterable<string> }): void {
    this.projectId = params.projectId;
    this.redact = createRedactor(params.secrets);
  }

  log(
    level: DeploymentLogLevel,
    step: DeploymentStep,
    message: string,
    source: DeploymentLogSource = "system",
  ): void {
    const cleaned = this.redact(stripTerminalFormatting(message));

    if (cleaned.length === 0 && source !== "system") {
      return;
    }

    const { text, truncated } = truncateUtf8(cleaned, this.maxLineBytes);
    this.emit({ type: "log", level, step, source, message: text, truncated });
  }

  stepStarted(step: DeploymentStep): void {
    this.stepStartedAt.set(step, Date.now());
    this.emitStep(step, "started", null);
  }

  stepCompleted(step: DeploymentStep): void {
    this.emitStep(step, "completed", null);
  }

  stepFailed(step: DeploymentStep, error: string): void {
    this.emitStep(step, "failed", this.redact(error));
  }

  status(status: DeploymentStatus, error: string | null = null): void {
    this.lastStatus = status;
    const redactedError = error === null ? null : this.redact(error);
    const base = statusMessages[status];

    this.emit({
      type: "status",
      status,
      error: redactedError,
      message: redactedError === null ? base : `${base}: ${redactedError}`,
    });
  }

  close(timeoutMs: number): Promise<void> {
    this.closing ??= this.drain(this.lastStatus, timeoutMs);
    return this.closing;
  }

  private emitStep(
    step: DeploymentStep,
    phase: DeploymentStepPhase,
    error: string | null,
  ): void {
    const startedAt = this.stepStartedAt.get(step);
    const durationMs =
      phase !== "started" && startedAt !== undefined
        ? Date.now() - startedAt
        : null;

    const label = stepLabels[step];
    const elapsed =
      durationMs === null ? "" : ` in ${formatDuration(durationMs)}`;
    const message =
      phase === "started"
        ? `${label} step started`
        : phase === "completed"
          ? `${label} step completed${elapsed}`
          : `${label} step failed${elapsed}${error ? `: ${error}` : ""}`;

    this.emit({ type: "step", step, phase, durationMs, error, message });
  }

  private emit(input: DeploymentLogEventInput): void {
    if (this.closing && input.type !== "end") {
      return;
    }

    const event = {
      ...input,
      schemaVersion: deploymentLogSchemaVersion,
      deploymentId: this.deploymentId,
      projectId: this.projectId,
      sequence: ++this.sequence,
      timestamp: new Date().toISOString(),
    } as DeploymentLogEvent;

    this.mirror(event);

    if (!this.producer) {
      return;
    }

    this.enqueue(event);

    if (this.buffer.length >= this.batchSize) {
      void this.flush();
    }
  }

  private mirror(event: DeploymentLogEvent): void {
    switch (event.type) {
      case "log":
        this.logger[event.level](
          { step: event.step, source: event.source, sequence: event.sequence },
          event.message,
        );
        return;
      case "step":
        this.logger[event.phase === "failed" ? "error" : "info"](
          {
            step: event.step,
            phase: event.phase,
            durationMs: event.durationMs,
            error: event.error,
          },
          `step ${event.step} ${event.phase}`,
        );
        return;
      case "status":
        this.logger.info(
          { status: event.status, error: event.error },
          `deployment status changed to ${event.status}`,
        );
        return;
      case "end":
        this.logger.info(
          { status: event.status, droppedCount: event.droppedCount },
          "deployment log stream ended",
        );
        return;
    }
  }

  private enqueue(event: DeploymentLogEvent): void {
    if (isDroppable(event) && this.buffer.length >= this.bufferLimit) {
      const droppableIndex = this.buffer.findIndex(isDroppable);
      this.droppedCount += 1;
      this.unreportedDroppedCount += 1;

      if (droppableIndex < 0) {
        return;
      }

      this.buffer.splice(droppableIndex, 1);
    }

    this.buffer.push(event);
  }

  private reportDroppedLines(): void {
    if (this.unreportedDroppedCount === 0) {
      return;
    }

    const count = this.unreportedDroppedCount;
    this.unreportedDroppedCount = 0;

    const lastStep = [...this.stepStartedAt.keys()].at(-1);
    if (!lastStep) {
      return;
    }

    this.log(
      "warn",
      lastStep,
      `${count} log lines were dropped because the log pipeline fell behind`,
    );
  }

  private flush(): Promise<void> {
    this.flushing ??= this.sendNextBatch().finally(() => {
      this.flushing = undefined;
    });
    return this.flushing;
  }

  private async sendNextBatch(): Promise<void> {
    if (!this.producer || Date.now() < this.nextAttemptAt) {
      return;
    }

    this.reportDroppedLines();

    if (this.buffer.length === 0) {
      return;
    }

    this.inFlight = this.buffer.splice(0, this.batchSize);

    try {
      await this.producer.send({
        topic: this.topic,
        messages: this.inFlight.map((event) => ({
          key: this.deploymentId,
          value: JSON.stringify(event),
          timestamp: String(Date.parse(event.timestamp)),
          headers: {
            "schema-version": String(deploymentLogSchemaVersion),
            "event-type": event.type,
            "content-type": "application/json",
          },
        })),
      });

      this.inFlight = [];
      this.consecutiveFailures = 0;
      this.nextAttemptAt = 0;
    } catch (err) {
      this.buffer = [...this.inFlight, ...this.buffer];
      this.inFlight = [];
      this.consecutiveFailures += 1;

      const delay = Math.min(
        retryBaseDelayMs * 2 ** (this.consecutiveFailures - 1),
        retryMaxDelayMs,
      );
      this.nextAttemptAt = Date.now() + delay;

      this.logger.warn(
        {
          err,
          pending: this.buffer.length,
          attempt: this.consecutiveFailures,
          retryInMs: delay,
        },
        "failed to publish deployment logs to kafka",
      );
    }
  }

  private async drain(
    status: DeploymentStatus,
    timeoutMs: number,
  ): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.reportDroppedLines();
    const droppedNote =
      this.droppedCount > 0
        ? `, ${this.droppedCount} log lines were dropped`
        : "";

    this.emit({
      type: "end",
      status,
      droppedCount: this.droppedCount,
      message: `Deployment log stream ended with status ${status}${droppedNote}`,
    });

    if (!this.producer) {
      return;
    }

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      await this.flush();

      if (this.buffer.length === 0 && this.inFlight.length === 0) {
        return;
      }

      const wait = Math.max(this.nextAttemptAt - Date.now(), 0);
      await sleep(Math.min(Math.max(wait, 10), deadline - Date.now()));
    }

    this.logger.error(
      { pending: this.buffer.length + this.inFlight.length },
      "deployment logs could not be fully published to kafka before shutdown",
    );
  }
}
