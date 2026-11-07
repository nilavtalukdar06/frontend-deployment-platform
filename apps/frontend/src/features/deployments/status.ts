import type {
  DeploymentStatus,
  DeploymentTrigger,
} from "@/features/deployments/types";

const ACTIVE_STATUSES = new Set<DeploymentStatus>([
  "queued",
  "cloning",
  "installing",
  "building",
  "uploading",
]);

export const isActiveStatus = (status: DeploymentStatus): boolean =>
  ACTIVE_STATUSES.has(status);

export const isTerminalStatus = (status: DeploymentStatus): boolean =>
  !ACTIVE_STATUSES.has(status);

export const triggerLabels: Record<DeploymentTrigger, string> = {
  push: "Git push",
  manual: "Redeploy",
  create: "Initial import",
};
