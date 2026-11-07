import { request } from "@/lib/axios";
import type { Deployment, PaginatedList } from "@/features/deployments/types";

export const DEPLOYMENTS_PAGE_SIZE = 20;

export const listDeployments = (
  projectId: string,
  page: number,
  signal?: AbortSignal,
) =>
  request<PaginatedList<Deployment>>({
    url: `/projects/${projectId}/deployments`,
    params: { page, limit: DEPLOYMENTS_PAGE_SIZE },
    signal,
  });

export const getDeployment = (
  projectId: string,
  deploymentId: string,
  signal?: AbortSignal,
) =>
  request<Deployment>({
    url: `/projects/${projectId}/deployments/${deploymentId}`,
    signal,
  });

export const createDeployment = (projectId: string) =>
  request<Deployment>({
    method: "POST",
    url: `/projects/${projectId}/deployments`,
  });

export const cancelDeployment = (projectId: string, deploymentId: string) =>
  request<Deployment>({
    method: "POST",
    url: `/projects/${projectId}/deployments/${deploymentId}/cancel`,
  });
