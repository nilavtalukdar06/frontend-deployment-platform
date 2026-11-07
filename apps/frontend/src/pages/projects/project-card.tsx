import { Link } from "react-router";
import { GitBranch, Lock, Zap, ZapOff } from "lucide-react";
import { ProjectIcon } from "@/components/deploy/project-icon";
import { RepositoryPill } from "@/components/deploy/repository-pill";
import { StatusDot, statusLabels } from "@/components/deploy/status-dot";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProjectActionsMenu } from "@/pages/projects/project-actions-menu";
import type { LatestDeployment, Project } from "@/features/projects/types";
import { formatRelativeTime, hostFromUrl, shortSha } from "@/lib/format";
import { cn } from "@/lib/utils";

function AutoDeployIndicator({ autoDeploy }: { autoDeploy: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="relative z-10 flex size-7 items-center" />}
      >
        {autoDeploy ? (
          <Zap className="size-4 text-subtle" />
        ) : (
          <ZapOff className="size-4 text-warning" />
        )}
      </TooltipTrigger>
      <TooltipContent>
        {autoDeploy ? "Deploys on every push" : "Auto-deploy is off"}
      </TooltipContent>
    </Tooltip>
  );
}

function LatestDeploymentSummary({
  deployment,
  className,
}: {
  deployment: LatestDeployment | null;
  className?: string;
}) {
  if (!deployment) {
    return (
      <span className={cn("text-sm text-subtle", className)}>
        No deployments yet
      </span>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-3 text-sm", className)}>
      <StatusDot status={deployment.status} />
      <span className="font-medium">{statusLabels[deployment.status]}</span>
      <span className="flex min-w-0 items-center gap-1.5 font-mono text-code text-muted-foreground">
        <GitBranch className="size-3.5 shrink-0 text-subtle" />
        <span className="truncate">
          {deployment.branch} · {shortSha(deployment.commitSha)}
        </span>
      </span>
      <span className="ml-auto shrink-0 text-subtle">
        {formatRelativeTime(deployment.createdAt)}
      </span>
    </div>
  );
}

function ProjectTitle({ project }: { project: Project }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="flex items-center gap-2 text-title leading-snug font-medium">
        <Link
          to={`/projects/${project.id}`}
          className="truncate outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-1 focus-visible:after:ring-ring"
        >
          {project.name}
        </Link>
        {project.private ? (
          <Lock
            className="size-3.5 shrink-0 text-subtle"
            aria-label="Private repository"
          />
        ) : null}
      </span>
      <span className="truncate text-sm text-muted-foreground">
        {hostFromUrl(project.url)}
      </span>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="relative gap-3 p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start gap-3">
        <ProjectIcon />
        <ProjectTitle project={project} />
        <div className="flex items-center gap-1">
          <AutoDeployIndicator autoDeploy={project.autoDeploy} />
          <ProjectActionsMenu project={project} />
        </div>
      </div>
      {project.description ? (
        <p className="line-clamp-2 text-label text-muted-foreground">
          {project.description}
        </p>
      ) : null}
      <LatestDeploymentSummary
        deployment={project.latestDeployment}
        className="mt-auto"
      />
      <RepositoryPill repositoryUrl={project.repositoryUrl} />
    </Card>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <div className="relative grid grid-cols-1 items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <ProjectIcon size="sm" />
        <ProjectTitle project={project} />
      </div>
      <LatestDeploymentSummary deployment={project.latestDeployment} />
      <div className="flex items-center justify-end gap-3">
        <RepositoryPill
          repositoryUrl={project.repositoryUrl}
          className="hidden lg:inline-flex"
        />
        <AutoDeployIndicator autoDeploy={project.autoDeploy} />
        <ProjectActionsMenu project={project} />
      </div>
    </div>
  );
}

export { ProjectCard, ProjectRow };
