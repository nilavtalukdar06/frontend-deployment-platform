import type { DeploymentStep } from "../constants/deployment-step.enum";
import type { DeploymentStatus } from "../repositories/deployment.repository";

export const deploymentLogSchemaVersion = 1;

export type DeploymentLogLevel = "debug" | "info" | "warn" | "error";

export type DeploymentLogSource = "system" | "stdout" | "stderr";

export type DeploymentStepPhase = "started" | "completed" | "failed";

interface DeploymentLogEventBase {
  schemaVersion: typeof deploymentLogSchemaVersion;
  deploymentId: string;
  projectId: string | null;
  sequence: number;
  timestamp: string;
  message: string;
}

export interface DeploymentLogLineEvent extends DeploymentLogEventBase {
  type: "log";
  level: DeploymentLogLevel;
  step: DeploymentStep;
  source: DeploymentLogSource;
  truncated: boolean;
}

export interface DeploymentStepEvent extends DeploymentLogEventBase {
  type: "step";
  step: DeploymentStep;
  phase: DeploymentStepPhase;
  durationMs: number | null;
  error: string | null;
}

export interface DeploymentStatusEvent extends DeploymentLogEventBase {
  type: "status";
  status: DeploymentStatus;
  error: string | null;
}

export interface DeploymentLogEndEvent extends DeploymentLogEventBase {
  type: "end";
  status: DeploymentStatus;
  droppedCount: number;
}

export type DeploymentLogEvent =
  | DeploymentLogLineEvent
  | DeploymentStepEvent
  | DeploymentStatusEvent
  | DeploymentLogEndEvent;

export type DeploymentLogEventType = DeploymentLogEvent["type"];
