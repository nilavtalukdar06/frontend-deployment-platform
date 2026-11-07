import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from "@tanstack/react-query";
import { getProject, listProjects } from "@/features/projects/api";
import { isActiveStatus } from "@/features/deployments/status";
import { DEPLOYMENTS_POLL_INTERVAL_MS } from "@/features/deployments/queries";
import type { Project } from "@/features/projects/types";

export const projectKeys = {
  all: ["projects"] as const,
  list: (search: string) => ["projects", "list", search] as const,
  search: (search: string) => ["projects", "search", search] as const,
  detail: (projectId: string) => ["projects", "detail", projectId] as const,
};

const hasActiveDeployment = (projects: Project[]) =>
  projects.some(
    (project) =>
      project.latestDeployment !== null &&
      isActiveStatus(project.latestDeployment.status),
  );

export const projectsInfiniteQueryOptions = (search: string) =>
  infiniteQueryOptions({
    queryKey: projectKeys.list(search),
    queryFn: ({ pageParam, signal }) =>
      listProjects({ page: pageParam, search }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.data &&
      hasActiveDeployment(query.state.data.pages.flatMap((page) => page.items))
        ? DEPLOYMENTS_POLL_INTERVAL_MS
        : false,
    refetchIntervalInBackground: false,
  });

export const projectSearchQueryOptions = (search: string) =>
  queryOptions({
    queryKey: projectKeys.search(search),
    queryFn: ({ signal }) =>
      listProjects({ page: 1, limit: 8, search }, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const projectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: projectKeys.detail(projectId),
    queryFn: ({ signal }) => getProject(projectId, signal),
  });
