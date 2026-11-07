import { formatElapsed } from "@/lib/format";
import type { Deployment } from "@/features/deployments/types";
import type { LatestDeployment, Project } from "@/features/projects/types";

type TimedDeployment = Pick<
  Deployment | LatestDeployment,
  "startedAt" | "finishedAt" | "createdAt"
>;

export const deploymentDurationMs = (
  deployment: TimedDeployment,
  now: number,
): number | null => {
  const start = deployment.startedAt ?? null;

  if (!start) {
    return null;
  }

  const end = deployment.finishedAt
    ? new Date(deployment.finishedAt).getTime()
    : now;

  return end - new Date(start).getTime();
};

export const formatDeploymentDuration = (
  deployment: TimedDeployment,
  now: number,
): string | undefined => {
  const duration = deploymentDurationMs(deployment, now);

  return duration === null ? undefined : formatElapsed(duration);
};

export const deploymentUrl = (project: Project, deploymentId: string) => {
  try {
    const url = new URL(project.url);
    url.hostname = url.hostname.replace(project.slug, deploymentId);
    return url.toString().replace(/\/$/, "");
  } catch {
    return project.url;
  }
};

export const findCurrentDeployment = <T extends { status: string }>(
  deployments: readonly T[],
): T | undefined =>
  deployments.find((deployment) => deployment.status === "ready");
