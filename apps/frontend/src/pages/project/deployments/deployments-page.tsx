import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Rocket, RotateCw } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { findCurrentDeployment } from "@/features/deployments/display";
import { useRedeploy } from "@/features/deployments/mutations";
import { deploymentsQueryOptions } from "@/features/deployments/queries";
import { CancelDeploymentDialog } from "@/pages/project/deployments/cancel-deployment-dialog";
import { DeploymentRow } from "@/pages/project/deployments/deployment-row";
import { useProject } from "@/pages/project/project-context";
import { cn } from "@/lib/utils";

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

function DeploymentsSkeleton() {
  return (
    <div
      className="rounded-xl border border-border bg-card"
      aria-busy="true"
      aria-label="Loading deployments"
    >
      {SKELETON_ROWS.map((index) => (
        <div
          key={index}
          className="grid grid-cols-1 items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_200px]"
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <Skeleton className="h-4 w-36" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="size-5.5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

const parsePage = (value: string | null) => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

export default function DeploymentsPage() {
  const project = useProject();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const redeploy = useRedeploy(project.id);
  const {
    data,
    error,
    isPending,
    isError,
    isPlaceholderData,
    refetch,
    isRefetching,
  } = useQuery(deploymentsQueryOptions(project.id, page));

  const deployments = data?.items ?? [];
  const pagination = data?.pagination;
  const current = page === 1 ? findCurrentDeployment(deployments) : undefined;

  const goToPage = (next: number) => {
    setSearchParams(next === 1 ? {} : { page: String(next) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl leading-8 font-semibold tracking-tight">
            Deployments
          </h1>
          {pagination ? (
            <p className="text-sm text-muted-foreground">
              {pagination.total} total · newest first
            </p>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}
        </div>
        <Button
          variant="outline"
          disabled={redeploy.isPending}
          onClick={() => redeploy.mutate()}
        >
          {redeploy.isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <RotateCw data-icon="inline-start" />
          )}
          Redeploy
        </Button>
      </div>

      {isPending ? (
        <DeploymentsSkeleton />
      ) : isError ? (
        <ErrorState
          error={error}
          title="Couldn't load deployments"
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : deployments.length === 0 ? (
        page > 1 ? (
          <EmptyState
            icon={Rocket}
            title="No deployments on this page"
            action={
              <Button variant="outline" onClick={() => goToPage(1)}>
                Back to the newest
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Rocket}
            title="No deployments yet"
            description={`Push to ${project.branch} or redeploy to create the first deployment.`}
            action={
              <Button
                disabled={redeploy.isPending}
                onClick={() => redeploy.mutate()}
              >
                Deploy now
              </Button>
            }
          />
        )
      ) : (
        <div
          className="rounded-xl border border-border bg-card data-stale:opacity-70"
          data-stale={isPlaceholderData ? "" : undefined}
        >
          {deployments.map((deployment) => (
            <DeploymentRow
              key={deployment.id}
              deployment={deployment}
              repositoryUrl={project.repositoryUrl}
              isCurrent={deployment.id === current?.id}
              onCancel={setCancelTarget}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page > 2 ? `?page=${page - 1}` : "?"}
                aria-disabled={page <= 1}
                className={cn(page <= 1 && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  event.preventDefault();
                  goToPage(page - 1);
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-muted-foreground tabular-nums">
                Page {page} of {pagination.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={`?page=${page + 1}`}
                aria-disabled={page >= pagination.totalPages}
                className={cn(
                  page >= pagination.totalPages &&
                    "pointer-events-none opacity-50",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  goToPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <CancelDeploymentDialog
        projectId={project.id}
        deploymentId={cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
          }
        }}
      />
    </div>
  );
}
