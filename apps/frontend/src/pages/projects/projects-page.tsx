import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { FolderGit2, LayoutGrid, List, Plus, Search } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { projectsInfiniteQueryOptions } from "@/features/projects/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { ProjectCard, ProjectRow } from "@/pages/projects/project-card";

const VIEW_MODES = ["grid", "list"] as const;

type ViewMode = (typeof VIEW_MODES)[number];

const SKELETON_CARDS = Array.from({ length: 6 }, (_, index) => index);

function ProjectCardSkeleton() {
  return (
    <Card className="min-h-51.25 gap-4 p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9.5 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3.5 w-44" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-6 w-48 rounded-full" />
    </Card>
  );
}

function ProjectsSkeleton({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {SKELETON_CARDS.map((index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
          >
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="hidden h-4 w-64 md:block" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {SKELETON_CARDS.map((index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

function NewProjectButton() {
  return (
    <Button nativeButton={false} render={<Link to="/new" />}>
      <Plus data-icon="inline-start" />
      Import a repository
    </Button>
  );
}

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const [view, setView] = useLocalStorageState<ViewMode>(
    "projects-view",
    VIEW_MODES,
    "grid",
  );
  const {
    data,
    error,
    isPending,
    isError,
    isPlaceholderData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery(projectsInfiniteQueryOptions(debouncedSearch));

  const projects = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <InputGroup className="h-11">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
          />
          {isPlaceholderData ? (
            <InputGroupAddon align="inline-end">
              <Spinner />
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <ToggleGroup
          value={[view]}
          onValueChange={(next) => {
            const selected = next[0];
            if (selected === "grid" || selected === "list") {
              setView(selected);
            }
          }}
          spacing={0}
          className="h-11 rounded-md border border-border-strong bg-card p-1"
          aria-label="Layout"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Grid view"
            className="h-8.5"
          >
            <LayoutGrid />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className="h-8.5"
          >
            <List />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h1 className="text-title font-medium">Projects</h1>
          {data ? (
            <span className="text-sm text-subtle">
              {total} {total === 1 ? "project" : "projects"}
            </span>
          ) : null}
        </div>

        {isPending ? (
          <ProjectsSkeleton view={view} />
        ) : isError ? (
          <ErrorState
            error={error}
            title="Couldn't load your projects"
            onRetry={() => void refetch()}
            isRetrying={isRefetching}
          />
        ) : projects.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={Search}
              title="No matching projects"
              description={`No project name, slug or description matches “${debouncedSearch}”.`}
              action={
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={FolderGit2}
              title="No projects yet"
              description="Import a Vite repository from GitHub and it will deploy on every push."
              action={<NewProjectButton />}
            />
          )
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}

        {hasNextPage ? (
          <Button
            variant="outline"
            className="self-center"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? <Spinner data-icon="inline-start" /> : null}
            Load more projects
          </Button>
        ) : null}
      </section>
    </div>
  );
}
