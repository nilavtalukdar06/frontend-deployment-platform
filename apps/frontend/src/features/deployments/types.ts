export const deploymentStatuses = [
  "queued",
  "cloning",
  "installing",
  "building",
  "uploading",
  "ready",
  "failed",
  "canceled",
] as const;

export type DeploymentStatus = (typeof deploymentStatuses)[number];

export type DeploymentTrigger = "create" | "manual" | "push";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type Runtime = "node" | "bun";

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  trigger: DeploymentTrigger;
  branch: string;
  commitSha: string | null;
  framework: "vite";
  rootDirectory: string;
  packageManager: PackageManager;
  runtime: Runtime;
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedList<T> {
  items: T[];
  pagination: Pagination;
}
