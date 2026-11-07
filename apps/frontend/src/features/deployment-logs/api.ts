import { request } from "@/lib/axios";
import type {
  DeploymentLog,
  DeploymentLogPage,
} from "@/features/deployment-logs/types";

export const LOG_PAGE_SIZE = 1000;

const MAX_LOG_PAGES = 100;

export const getDeploymentLogs = (
  deploymentId: string,
  after: number,
  signal?: AbortSignal,
) =>
  request<DeploymentLogPage>({
    url: `/deployment/${deploymentId}/logs`,
    params: { after, limit: LOG_PAGE_SIZE },
    signal,
  });

export const fetchDeploymentLogsAfter = async (
  deploymentId: string,
  after: number,
  signal?: AbortSignal,
): Promise<DeploymentLog[]> => {
  const collected: DeploymentLog[] = [];
  let cursor = after;

  for (let page = 0; page < MAX_LOG_PAGES; page += 1) {
    const result = await getDeploymentLogs(deploymentId, cursor, signal);
    collected.push(...result.items);

    if (!result.hasMore || result.nextAfter <= cursor) {
      break;
    }

    cursor = result.nextAfter;
  }

  return collected;
};
