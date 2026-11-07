import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { getDeployment, listDeployments } from "@/features/deployments/api";
import { isActiveStatus } from "@/features/deployments/status";

export const DEPLOYMENTS_POLL_INTERVAL_MS = 2000;

export const deploymentKeys = {
  all: ["deployments"] as const,
  project: (projectId: string) => ["deployments", projectId] as const,
  list: (projectId: string, page: number) =>
    ["deployments", projectId, "list", page] as const,
  detail: (projectId: string, deploymentId: string) =>
    ["deployments", projectId, "detail", deploymentId] as const,
};

export const deploymentsQueryOptions = (projectId: string, page = 1) =>
  queryOptions({
    queryKey: deploymentKeys.list(projectId, page),
    queryFn: ({ signal }) => listDeployments(projectId, page, signal),
    placeholderData: keepPreviousData,
    refetchInterval: DEPLOYMENTS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

export const deploymentQueryOptions = (
  projectId: string,
  deploymentId: string,
) =>
  queryOptions({
    queryKey: deploymentKeys.detail(projectId, deploymentId),
    queryFn: ({ signal }) => getDeployment(projectId, deploymentId, signal),
    refetchInterval: (query) =>
      query.state.data && isActiveStatus(query.state.data.status)
        ? DEPLOYMENTS_POLL_INTERVAL_MS
        : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
