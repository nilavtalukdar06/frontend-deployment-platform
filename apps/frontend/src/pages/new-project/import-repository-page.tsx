import { useDeferredValue, useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { FolderGit2, Lock, Search } from "lucide-react";
import { useAuthenticatedSession } from "@/components/auth/session-context";
import { UserAvatar } from "@/components/deploy/app-shell";
import { ProjectIcon } from "@/components/deploy/project-icon";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { ImportableRepository } from "@/features/repositories/api";
import { repositoriesInfiniteQueryOptions } from "@/features/repositories/queries";
import { formatRelativeTime } from "@/lib/format";

const MIN_VISIBLE_REPOSITORIES = 5;
const MAX_AUTO_LOADED_PAGES = 3;
const SKELETON_ROWS = Array.from({ length: 5 }, (_, index) => index);

function RepositoryRow({ repository }: { repository: ImportableRepository }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-5 py-4">
      <ProjectIcon size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2 text-title">
          <span className="truncate font-medium">{repository.name}</span>
          {repository.private ? (
            <Lock
              className="size-3.5 shrink-0 text-subtle"
              aria-label="Private repository"
            />
          ) : null}
          {repository.pushedAt ? (
            <span className="shrink-0 text-sm text-subtle">
              · {formatRelativeTime(repository.pushedAt)}
            </span>
          ) : null}
        </span>
        {repository.description ? (
          <span className="truncate text-label text-muted-foreground">
            {repository.description}
          </span>
        ) : null}
      </div>
      {repository.imported ? (
        <span className="pr-1 text-sm text-subtle">Imported</span>
      ) : (
        <Button
          nativeButton={false}
          render={
            <Link
              to={`/new/${repository.id}`}
              state={{ repository }}
              aria-label={`Import ${repository.fullName}`}
            />
          }
        >
          Import
        </Button>
      )}
    </div>
  );
}

function RepositoryListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {SKELETON_ROWS.map((index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
        >
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-8.5 w-18" />
        </div>
      ))}
    </div>
  );
}

export default function ImportRepositoryPage() {
  const { user } = useAuthenticatedSession();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const {
    data,
    error,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(repositoriesInfiniteQueryOptions());

  const repositories = data?.pages.flatMap((page) => page.items) ?? [];
  const loadedPages = data?.pages.length ?? 0;
  const visible = deferredSearch
    ? repositories.filter(
        (repository) =>
          repository.name.toLowerCase().includes(deferredSearch) ||
          repository.description?.toLowerCase().includes(deferredSearch),
      )
    : repositories;

  const shouldAutoLoad =
    hasNextPage &&
    !isFetchingNextPage &&
    repositories.length < MIN_VISIBLE_REPOSITORIES &&
    loadedPages < MAX_AUTO_LOADED_PAGES;

  useEffect(() => {
    if (shouldAutoLoad) {
      void fetchNextPage();
    }
  }, [shouldAutoLoad, fetchNextPage]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 pt-6 pb-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-hero font-medium tracking-tight sm:text-[44px] sm:leading-tight">
          Let’s build something new
        </h1>
        <p className="text-sm text-muted-foreground">
          Import a Git repository. Only repositories whose default branch is a
          Vite project are listed.
        </p>
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-medium tracking-tight">
          Import Git repository
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex h-10.5 items-center gap-3 rounded-md border border-input bg-card px-3 text-sm">
            <UserAvatar className="size-5" />
            <span className="truncate">{user.githubLogin}</span>
          </div>
          <InputGroup className="h-10.5">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search…"
              aria-label="Search repositories"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </InputGroup>
        </div>

        {isPending ? (
          <RepositoryListSkeleton />
        ) : isError ? (
          <ErrorState
            error={error}
            title="Couldn't load your repositories"
            onRetry={() => void refetch()}
            isRetrying={isRefetching}
          />
        ) : visible.length === 0 && !hasNextPage ? (
          <EmptyState
            icon={deferredSearch ? Search : FolderGit2}
            title={
              deferredSearch
                ? "No matching repositories"
                : "No Vite repositories found"
            }
            description={
              deferredSearch
                ? `None of the loaded repositories match “${search.trim()}”.`
                : "Push a Vite project to GitHub and it will show up here."
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {visible.map((repository) => (
              <RepositoryRow key={repository.id} repository={repository} />
            ))}
            {visible.length === 0 ? (
              <p className="border-b border-border px-5 py-6 text-center text-sm text-subtle">
                {deferredSearch
                  ? "No loaded repositories match your search yet."
                  : "No Vite repositories on the pages loaded so far."}
              </p>
            ) : null}
            {hasNextPage ? (
              <button
                type="button"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="flex h-13.5 w-full cursor-pointer items-center justify-center gap-2 text-label text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-default"
              >
                {isFetchingNextPage ? <Spinner /> : null}
                {isFetchingNextPage
                  ? "Loading repositories…"
                  : "Load more repositories"}
              </button>
            ) : (
              <p className="flex h-13.5 items-center justify-center text-label text-subtle">
                All repositories loaded
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
