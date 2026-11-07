import { request } from "@/lib/axios";
import type { PaginatedList } from "@/features/deployments/types";
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "@/features/projects/types";

export const PROJECTS_PAGE_SIZE = 24;

export interface ListProjectsParams {
  page: number;
  limit?: number;
  search?: string;
}

export const listProjects = (
  { page, limit = PROJECTS_PAGE_SIZE, search }: ListProjectsParams,
  signal?: AbortSignal,
) =>
  request<PaginatedList<Project>>({
    url: "/projects",
    params: { page, limit, search: search || undefined },
    signal,
  });

export const getProject = (projectId: string, signal?: AbortSignal) =>
  request<Project>({ url: `/projects/${projectId}`, signal });

export const createProject = (input: CreateProjectInput) =>
  request<Project>({ method: "POST", url: "/projects", data: input });

export const updateProject = (projectId: string, input: UpdateProjectInput) =>
  request<Project>({
    method: "PATCH",
    url: `/projects/${projectId}`,
    data: input,
  });

export const deleteProject = (projectId: string) =>
  request<undefined>({ method: "DELETE", url: `/projects/${projectId}` });

export const installProjectWebhook = (projectId: string) =>
  request<Project>({ method: "POST", url: `/projects/${projectId}/webhook` });
