import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowUpRight,
  ChartColumn,
  ChevronRight,
  ExternalLink,
  RotateCw,
  Zap,
  ZapOff,
} from "lucide-react";
import { useAuthenticatedSession } from "@/components/auth/session-context";
import { GithubIcon } from "@/components/brand/github-icon";
import { UserAvatar } from "@/components/deploy/app-shell";
import { SourceInfo, TriggerLabel } from "@/components/deploy/deployment-meta";
import { StatusLabel } from "@/components/deploy/status-dot";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { analyticsQueryOptions } from "@/features/analytics/api";
import {
  findCurrentDeployment,
  formatDeploymentDuration,
} from "@/features/deployments/display";
import { useRedeploy } from "@/features/deployments/mutations";
import { deploymentsQueryOptions } from "@/features/deployments/queries";
import { isActiveStatus } from "@/features/deployments/status";
import type { Deployment } from "@/features/deployments/types";
import type { Project } from "@/features/projects/types";
import { useNow } from "@/hooks/use-now";
import {
  formatNumber,
  formatShortDate,
  hostFromUrl,
  repositoryNameFromUrl,
  shortSha,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { SitePreview } from "@/pages/project/overview/site-preview";
import { useProject } from "@/pages/project/project-context";

function BuildingStrip({
  projectId,
  deployment,
}: {
  projectId: string;
  deployment: Deployment;
}) {
  return (
    <Link
      to={`/projects/${projectId}/deployments/${deployment.id}`}
      className="flex h-10.25 items-center justify-between gap-4 border-b border-warning-border bg-warning-surface px-6 text-sm text-warning transition-colors hover:bg-warning-surface/70"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Spinner className="size-3.5" />
        <span className="truncate">
          A new deployment is{" "}
          <b className="font-medium">
            {deployment.status === "queued" ? "queued" : "building"}
          </b>
          <span className="ml-2 font-mono text-code">
            · {shortSha(deployment.commitSha)}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-warning/80">
        View build
        <ChevronRight className="size-4" />
      </span>
    </Link>
  );
}

function DetailItem({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function ProductionDetails({
  project,
  deployment,
}: {
  project: Project;
  deployment: Deployment;
}) {
  const { user } = useAuthenticatedSession();
  const now = useNow(isActiveStatus(deployment.status));

  return (
    <dl className="grid grid-cols-2 content-start gap-x-8 gap-y-5 text-sm">
      <DetailItem label="Deployment" className="col-span-2">
        <Link
          to={`/projects/${project.id}/deployments/${deployment.id}`}
          className="font-mono text-code break-all hover:underline"
        >
          {deployment.id}
        </Link>
      </DetailItem>
      <DetailItem label="Domain" className="col-span-2">
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="flex w-fit items-center gap-2 text-title font-medium hover:underline"
        >
          {hostFromUrl(project.url)}
          <ExternalLink className="size-3.5 text-muted-foreground" />
        </a>
      </DetailItem>
      <DetailItem label="Status">
        <StatusLabel
          status={deployment.status}
          duration={formatDeploymentDuration(deployment, now)}
        />
      </DetailItem>
      <DetailItem label="Created">
        <span className="flex items-center gap-2">
          <span className="truncate">
            {formatShortDate(deployment.createdAt)} by {user.githubLogin}
          </span>
          <UserAvatar className="size-5" />
        </span>
      </DetailItem>
      <DetailItem label="Source" className="col-span-2">
        <span className="flex flex-col gap-1.5">
          <SourceInfo
            branch={deployment.branch}
            commitSha={deployment.commitSha}
            repositoryUrl={project.repositoryUrl}
          />
          <TriggerLabel
            trigger={deployment.trigger}
            className="text-label text-muted-foreground"
          />
        </span>
      </DetailItem>
    </dl>
  );
}

function ProductionSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[minmax(0,413px)_1fr]">
      <Skeleton className="aspect-413/258 w-full rounded-lg" />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-12 w-36" />
      </div>
    </div>
  );
}

function ProductionDeploymentCard({ project }: { project: Project }) {
  const redeploy = useRedeploy(project.id);
  const { data, error, isPending, isError, refetch, isRefetching } = useQuery(
    deploymentsQueryOptions(project.id),
  );
  const deployments = data?.items ?? [];
  const latest = deployments[0];
  const current = findCurrentDeployment(deployments);
  const building = latest && isActiveStatus(latest.status) ? latest : null;

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 className="text-title font-medium">Production deployment</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-lg"
            className="size-8.5"
            aria-label="Open repository on GitHub"
            nativeButton={false}
            render={
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <GithubIcon />
          </Button>
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
          {current ? (
            <Button
              nativeButton={false}
              render={<a href={project.url} target="_blank" rel="noreferrer" />}
            >
              <ArrowUpRight data-icon="inline-start" />
              Visit
            </Button>
          ) : (
            <Button disabled>
              <ArrowUpRight data-icon="inline-start" />
              Visit
            </Button>
          )}
        </div>
      </div>
      {building ? (
        <BuildingStrip projectId={project.id} deployment={building} />
      ) : null}
      {isPending ? (
        <ProductionSkeleton />
      ) : isError ? (
        <div className="p-6">
          <ErrorState
            error={error}
            title="Couldn't load deployments"
            onRetry={() => void refetch()}
            isRetrying={isRefetching}
          />
        </div>
      ) : deployments.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={RotateCw}
            title="No deployments yet"
            description="Start the first deployment of this project."
            action={
              <Button
                disabled={redeploy.isPending}
                onClick={() => redeploy.mutate()}
              >
                Deploy now
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[minmax(0,413px)_1fr]">
          <SitePreview
            url={current ? project.url : null}
            title={project.name}
          />
          {current ? (
            <ProductionDetails project={project} deployment={current} />
          ) : (
            <div className="flex flex-col justify-center gap-2 text-sm text-muted-foreground">
              <span className="text-title font-medium text-foreground">
                Not serving traffic yet
              </span>
              The site goes live as soon as a deployment is ready.
              <Link
                to={`/projects/${project.id}/deployments/${latest.id}`}
                className="w-fit text-foreground underline-offset-4 hover:underline"
              >
                Inspect the latest deployment
              </Link>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-3 border-t border-border px-6 py-4 text-sm text-muted-foreground">
        {project.autoDeploy ? (
          <>
            <Zap className="size-4 shrink-0 text-success" />
            <span>
              To update your production deployment, push to the{" "}
              <code className="font-mono text-code text-foreground">
                {project.branch}
              </code>{" "}
              branch.
            </span>
          </>
        ) : (
          <>
            <ZapOff className="size-4 shrink-0 text-warning" />
            <span>
              Automatic deployments are off.{" "}
              <Link
                to={`/projects/${project.id}/settings#git`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                Install the webhook
              </Link>{" "}
              to deploy on every push.
            </span>
          </>
        )}
      </div>
    </Card>
  );
}

function AnalyticsSummaryCard({ project }: { project: Project }) {
  const { data, error, isPending, isError, refetch, isRefetching } = useQuery(
    analyticsQueryOptions(project.id, "24h"),
  );
  const values = data?.viewsPerHour ?? [];
  const peak = values.reduce((max, point) => Math.max(max, point.views), 0);

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${project.id}/analytics`}
          className="text-title font-medium hover:underline"
        >
          Analytics
        </Link>
        <span className="text-sm text-subtle">24h</span>
      </div>
      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          title="Analytics unavailable"
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
          className="p-4"
        />
      ) : data.stats.totalViews.value === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title="No traffic yet"
          description="Page views appear here once people visit your site."
          className="border-0 bg-transparent py-6"
        />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-label text-muted-foreground">Page views</span>
            <span className="text-stat-lg font-medium tracking-tight">
              {formatNumber(data.stats.totalViews.value)}
            </span>
          </div>
          <div className="flex h-20 items-end gap-1" aria-hidden="true">
            {values.map((point) => (
              <span
                key={point.hour}
                className="flex-1 rounded-t-[2px] bg-chart-1"
                style={{
                  height: `${peak === 0 ? 0 : Math.max((point.views / peak) * 100, 4)}%`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function KeyValueCard({
  title,
  action,
  rows,
}: {
  title: string;
  action?: ReactNode;
  rows: { label: string; value: ReactNode; mono?: boolean }[];
}) {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-title font-medium">{title}</span>
        {action}
      </div>
      <dl className="flex flex-col gap-3 text-label">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4"
          >
            <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
            <dd
              className={cn(
                "flex min-w-0 items-center gap-2 truncate",
                row.mono && "font-mono text-code",
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export default function OverviewPage() {
  const project = useProject();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[32px] leading-tight font-medium tracking-tight">
            {project.name}
          </h1>
          {project.autoDeploy ? (
            <Badge variant="success">Auto-deploy on</Badge>
          ) : (
            <Badge variant="warning">Auto-deploy off</Badge>
          )}
        </div>
        {project.description ? (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        ) : null}
      </div>

      <ProductionDeploymentCard project={project} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AnalyticsSummaryCard project={project} />
        <KeyValueCard
          title="Build settings"
          action={
            <Link
              to={`/projects/${project.id}/settings#build`}
              className="text-sm text-subtle hover:text-foreground"
            >
              Edit
            </Link>
          }
          rows={[
            { label: "Framework", value: "Vite" },
            {
              label: "Root directory",
              value: project.rootDirectory,
              mono: true,
            },
            {
              label: "Install command",
              value: project.installCommand,
              mono: true,
            },
            { label: "Build command", value: project.buildCommand, mono: true },
            {
              label: "Output directory",
              value: project.outputDirectory,
              mono: true,
            },
          ]}
        />
        <KeyValueCard
          title="Repository"
          rows={[
            {
              label: "Git",
              value: (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 hover:underline"
                >
                  <GithubIcon className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {repositoryNameFromUrl(project.repositoryUrl)}
                  </span>
                </a>
              ),
            },
            { label: "Production branch", value: project.branch, mono: true },
            {
              label: "Visibility",
              value: project.private ? "Private" : "Public",
            },
            { label: "Slug", value: project.slug, mono: true },
            { label: "Created", value: formatShortDate(project.createdAt) },
          ]}
        />
      </div>
    </div>
  );
}
