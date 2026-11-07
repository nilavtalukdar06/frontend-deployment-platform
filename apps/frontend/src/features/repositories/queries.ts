import {
  infiniteQueryOptions,
  queryOptions,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  listImportableRepositories,
  type ImportableRepository,
  type ImportableRepositoryPage,
} from "@/features/repositories/api";
import { ApiRequestError } from "@/lib/api-error";

const MAX_REPOSITORY_LOOKUP_PAGES = 10;

export const repositoryKeys = {
  all: ["repositories"] as const,
  list: () => ["repositories", "list"] as const,
  detail: (repositoryId: number) =>
    ["repositories", "detail", repositoryId] as const,
};

export const repositoriesInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: repositoryKeys.list(),
    queryFn: ({ pageParam, signal }) =>
      listImportableRepositories(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 60_000,
  });

const findInCache = (
  queryClient: QueryClient,
  repositoryId: number,
): ImportableRepository | undefined =>
  queryClient
    .getQueryData<InfiniteData<ImportableRepositoryPage>>(repositoryKeys.list())
    ?.pages.flatMap((page) => page.items)
    .find((repository) => repository.id === repositoryId);

const findRepository = async (
  queryClient: QueryClient,
  repositoryId: number,
  signal: AbortSignal,
): Promise<ImportableRepository> => {
  const cached = findInCache(queryClient, repositoryId);

  if (cached) {
    return cached;
  }

  for (let page = 1; page <= MAX_REPOSITORY_LOOKUP_PAGES; page += 1) {
    const result = await listImportableRepositories(page, signal);
    const match = result.items.find(
      (repository) => repository.id === repositoryId,
    );

    if (match) {
      return match;
    }

    if (!result.hasNextPage) {
      break;
    }
  }

  throw new ApiRequestError(
    404,
    "NOT_FOUND",
    "This repository isn't available to import. It may not be a Vite project or you may not have push access.",
  );
};

export const repositoryQueryOptions = (
  queryClient: QueryClient,
  repositoryId: number,
) =>
  queryOptions({
    queryKey: repositoryKeys.detail(repositoryId),
    queryFn: ({ signal }) => findRepository(queryClient, repositoryId, signal),
    initialData: () => findInCache(queryClient, repositoryId),
    staleTime: 60_000,
  });
