import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "@/components/states/error-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { projectQueryOptions } from "@/features/projects/queries";
import { isNotFoundError } from "@/lib/api-error";
import type { ProjectOutletContext } from "@/pages/project/project-context";

function ProjectSkeleton() {
  return (
    <div
      className="mx-auto flex w-full max-w-6xl flex-col gap-8"
      aria-busy="true"
      aria-label="Loading project"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-80" />
      </div>
      <Card className="gap-0 py-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <Skeleton className="h-5 w-44" />
          <div className="flex gap-2">
            <Skeleton className="size-8.5" />
            <Skeleton className="h-8.5 w-28" />
            <Skeleton className="h-8.5 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[minmax(0,413px)_1fr]">
          <Skeleton className="aspect-413/258 w-full rounded-lg" />
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function ProjectLayout() {
  const { projectId = "" } = useParams();
  const {
    data: project,
    error,
    isPending,
    isError,
    refetch,
    isRefetching,
  } = useQuery(projectQueryOptions(projectId));

  if (isPending) {
    return <ProjectSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl pt-16">
        {isNotFoundError(error) ? (
          <NotFoundState
            title="Project not found"
            description="This project doesn't exist or you don't have access to it."
            backTo="/"
            backLabel="All projects"
          />
        ) : (
          <ErrorState
            error={error}
            title="Couldn't load this project"
            onRetry={() => void refetch()}
            isRetrying={isRefetching}
            action={
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link to="/" />}
              >
                <ArrowLeft data-icon="inline-start" />
                All projects
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Outlet context={{ project } satisfies ProjectOutletContext} />
    </div>
  );
}
