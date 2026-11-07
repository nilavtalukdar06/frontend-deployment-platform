import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { ArrowLeft, Ban, CircleAlert, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuthenticatedSession } from "@/components/auth/session-context";
import { SourceInfo, TriggerLabel } from "@/components/deploy/deployment-meta";
import { StatusLabel } from "@/components/deploy/status-dot";
import { ErrorState } from "@/components/states/error-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deploymentUrl,
  formatDeploymentDuration,
} from "@/features/deployments/display";
import { deploymentQueryOptions } from "@/features/deployments/queries";
import { isActiveStatus } from "@/features/deployments/status";
import type { Deployment } from "@/features/deployments/types";
import { BuildLogsCard } from "@/features/deployment-logs/components/build-logs-card";
import { useDeploymentLogs } from "@/features/deployment-logs/use-deployment-logs";
import type { Project } from "@/features/projects/types";
import { useNow } from "@/hooks/use-now";
import { isNotFoundError } from "@/lib/api-error";
import {
  formatDateTime,
  formatRelativeTime,
  hostFromUrl,
  shortId,
} from "@/lib/format";
import { CancelDeploymentDialog } from "@/pages/project/deployments/cancel-deployment-dialog";
import { useProject } from "@/pages/project/project-context";

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function DeploymentBreadcrumb({
  projectId,
  deploymentId,
}: {
  projectId: string;
  deploymentId: string;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="text-title">
        <BreadcrumbItem>
          <BreadcrumbLink
            render={<Link to={`/projects/${projectId}/deployments`} />}
          >
            Deployments
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-mono">
            {shortId(deploymentId)}
          </BreadcrumbPage>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Copy deployment ID"
            onClick={() => {
              void navigator.clipboard
                .writeText(deploymentId)
                .then(() => toast.success("Deployment ID copied"));
            }}
          >
            <Copy />
          </Button>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DomainValue({
  project,
  deployment,
}: {
  project: Project;
  deployment: Deployment;
}) {
  if (deployment.status !== "ready") {
    return <span className="text-subtle">Not serving traffic</span>;
  }

  const url = deploymentUrl(project, deployment.id);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex min-w-0 items-center gap-1.5 hover:underline"
    >
      <span className="truncate">{hostFromUrl(url)}</span>
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
    </a>
  );
}

function DeploymentSummaryCard({
  project,
  deployment,
}: {
  project: Project;
  deployment: Deployment;
}) {
  const { user } = useAuthenticatedSession();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const active = isActiveStatus(deployment.status);
  const now = useNow(active);

  return (
    <Card className="gap-0 py-0">
      <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border px-5 py-3">
        <h1 className="text-title font-medium">Deployment</h1>
        {active ? (
          <Button variant="destructive" onClick={() => setConfirmCancel(true)}>
            <Ban data-icon="inline-start" />
            Cancel deployment
          </Button>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm md:grid-cols-4">
        <DetailItem label="Status">
          <StatusLabel
            status={deployment.status}
            duration={formatDeploymentDuration(deployment, now)}
          />
        </DetailItem>
        <DetailItem label="Created">
          {formatRelativeTime(deployment.createdAt)} by {user.githubLogin}
        </DetailItem>
        <DetailItem label="Trigger">
          <TriggerLabel trigger={deployment.trigger} />
        </DetailItem>
        <DetailItem label="Domain">
          <DomainValue project={project} deployment={deployment} />
        </DetailItem>
        <DetailItem label="Source">
          <SourceInfo
            branch={deployment.branch}
            commitSha={deployment.commitSha}
            repositoryUrl={project.repositoryUrl}
          />
        </DetailItem>
        <DetailItem label="Started">
          {deployment.startedAt ? (
            formatDateTime(deployment.startedAt)
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailItem>
        <DetailItem label="Finished">
          {deployment.finishedAt ? (
            formatDateTime(deployment.finishedAt)
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </DetailItem>
        <DetailItem label="Build settings">
          <span className="font-mono text-code text-muted-foreground">
            {deployment.rootDirectory} → {deployment.outputDirectory}
          </span>
        </DetailItem>
      </dl>
      {deployment.status === "failed" && deployment.errorMessage ? (
        <div className="px-5 pb-6">
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Deployment failed</AlertTitle>
            <AlertDescription className="font-mono text-code">
              {deployment.errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-x-24 gap-y-2 border-t border-border px-5 py-3 text-sm text-muted-foreground">
        <span>
          Install{" "}
          <code className="font-mono text-code text-foreground">
            {deployment.installCommand}
          </code>
        </span>
        <span>
          Build{" "}
          <code className="font-mono text-code text-foreground">
            {deployment.buildCommand}
          </code>
        </span>
      </div>
      <CancelDeploymentDialog
        projectId={project.id}
        deploymentId={confirmCancel ? deployment.id : null}
        onOpenChange={setConfirmCancel}
      />
    </Card>
  );
}

function DeploymentActivity({
  project,
  deployment,
}: {
  project: Project;
  deployment: Deployment;
}) {
  const logs = useDeploymentLogs({
    projectId: project.id,
    deploymentId: deployment.id,
    status: deployment.status,
  });

  return (
    <BuildLogsCard
      deployment={deployment}
      phase={logs.phase}
      entries={logs.entries}
      error={logs.error}
      onRetry={logs.retry}
    />
  );
}

function DeploymentDetailSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading deployment"
    >
      <Skeleton className="h-5 w-56" />
      <Card className="gap-0 py-0">
        <div className="flex h-12 items-center border-b border-border px-5">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 md:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </Card>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

export default function DeploymentDetailPage() {
  const project = useProject();
  const { deploymentId = "" } = useParams();
  const {
    data: deployment,
    error,
    isPending,
    isError,
    refetch,
    isRefetching,
  } = useQuery(deploymentQueryOptions(project.id, deploymentId));

  if (isPending) {
    return <DeploymentDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl pt-16">
        {isNotFoundError(error) ? (
          <NotFoundState
            title="Deployment not found"
            description="This deployment doesn't exist or belongs to another project."
            backTo={`/projects/${project.id}/deployments`}
            backLabel="All deployments"
          />
        ) : (
          <ErrorState
            error={error}
            title="Couldn't load this deployment"
            onRetry={() => void refetch()}
            isRetrying={isRefetching}
            action={
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link to={`/projects/${project.id}/deployments`} />}
              >
                <ArrowLeft data-icon="inline-start" />
                All deployments
              </Button>
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DeploymentBreadcrumb
        projectId={project.id}
        deploymentId={deployment.id}
      />
      <DeploymentSummaryCard project={project} deployment={deployment} />
      <DeploymentActivity
        key={deployment.id}
        project={project}
        deployment={deployment}
      />
    </div>
  );
}
