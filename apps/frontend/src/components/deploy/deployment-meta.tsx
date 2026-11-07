import {
  GitBranch,
  GitCommitVertical,
  Pointer,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { triggerLabels } from "@/features/deployments/status";
import type { DeploymentTrigger } from "@/features/deployments/types";
import { shortSha } from "@/lib/format";
import { cn } from "@/lib/utils";

const triggerIcons: Record<DeploymentTrigger, LucideIcon> = {
  push: GitCommitVertical,
  manual: Pointer,
  create: Upload,
};

function TriggerLabel({
  trigger,
  className,
}: {
  trigger: DeploymentTrigger;
  className?: string;
}) {
  const Icon = triggerIcons[trigger];

  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0" />
      {triggerLabels[trigger]}
    </span>
  );
}

function SourceInfo({
  branch,
  commitSha,
  repositoryUrl,
  trigger,
  className,
}: {
  branch: string;
  commitSha: string | null;
  repositoryUrl?: string;
  trigger?: DeploymentTrigger;
  className?: string;
}) {
  const commit = shortSha(commitSha);

  return (
    <span
      className={cn(
        "flex flex-col gap-1 font-mono text-code text-muted-foreground",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <GitBranch className="size-3.5 shrink-0" />
        <span className="truncate">{branch}</span>
      </span>
      <span className="flex items-center gap-2">
        <GitCommitVertical className="size-3.5 shrink-0" />
        {commitSha && repositoryUrl ? (
          <a
            href={`${repositoryUrl}/commit/${commitSha}`}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 hover:text-foreground hover:underline"
          >
            {commit}
          </a>
        ) : (
          commit
        )}
        {trigger ? (
          <span className="font-sans text-muted-foreground">
            · {triggerLabels[trigger]}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export { SourceInfo, TriggerLabel };
