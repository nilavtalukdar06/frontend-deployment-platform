export type DeploymentLogType = "log" | "step" | "status" | "end";

export type DeploymentLogLevel = "debug" | "info" | "warn" | "error";

export type DeploymentStep =
  "initialize" | "clone" | "install" | "build" | "upload" | "finalize";

export interface DeploymentLog {
  sequence: number;
  timestamp: string;
  type: DeploymentLogType | null;
  level: DeploymentLogLevel | null;
  step: DeploymentStep | null;
  source: "system" | "stdout" | "stderr" | null;
  phase: "started" | "completed" | "failed" | null;
  status: string | null;
  message: string;
}

export interface DeploymentLogMessage extends DeploymentLog {
  deploymentId: string;
}

export interface DeploymentLogPage {
  items: (DeploymentLog & { id: string })[];
  nextAfter: number;
  hasMore: boolean;
}
