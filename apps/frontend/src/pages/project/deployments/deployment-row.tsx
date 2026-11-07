import { Link } from "react-router";
import { Ban, Copy, Ellipsis, FileText, Rocket } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/deploy/app-shell";
import { SourceInfo, TriggerLabel } from "@/components/deploy/deployment-meta";
import { StatusLabel } from "@/components/deploy/status-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDeploymentDuration } from "@/features/deployments/display";
import { isActiveStatus } from "@/features/deployments/status";
import type { Deployment } from "@/features/deployments/types";
import { useNow } from "@/hooks/use-now";
import { formatRelativeTime, shortId } from "@/lib/format";

function DeploymentRow({
  deployment,
  repositoryUrl,
  isCurrent,
  onCancel,
}: {
  deployment: Deployment;
  repositoryUrl: string;
  isCurrent: boolean;
  onCancel: (deploymentId: string) => void;
}) {
  const active = isActiveStatus(deployment.status);
  const now = useNow(active);
  const href = `/projects/${deployment.projectId}/deployments/${deployment.id}`;

  return (
    <div className="relative grid animate-in grid-cols-1 items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-300 fade-in last:border-b-0 hover:bg-muted/40 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] md:gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2.5 font-mono text-sm">
          <Link
            to={href}
            className="outline-none after:absolute after:inset-0 focus-visible:after:ring-1 focus-visible:after:ring-ring focus-visible:after:ring-inset"
          >
            {shortId(deployment.id)}
          </Link>
          {isCurrent ? (
            <Badge variant="current" className="font-sans">
              <Rocket />
              Current
            </Badge>
          ) : null}
        </span>
        <TriggerLabel
          trigger={deployment.trigger}
          className="text-label text-muted-foreground"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <StatusLabel
          status={deployment.status}
          duration={formatDeploymentDuration(deployment, now)}
        />
        {deployment.status === "failed" && deployment.errorMessage ? (
          <span className="line-clamp-2 text-label leading-snug text-destructive/90">
            {deployment.errorMessage}
          </span>
        ) : null}
      </div>
      <SourceInfo
        branch={deployment.branch}
        commitSha={deployment.commitSha}
        repositoryUrl={repositoryUrl}
      />
      <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">
          {formatRelativeTime(deployment.createdAt)}
        </span>
        <UserAvatar className="size-5.5" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative z-10 text-muted-foreground"
                aria-label={`Actions for deployment ${shortId(deployment.id)}`}
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-55">
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to={href} />}>
                <FileText />
                Inspect deployment
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  void navigator.clipboard
                    .writeText(deployment.id)
                    .then(() => toast.success("Deployment ID copied"));
                }}
              >
                <Copy />
                Copy deployment ID
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {active ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onCancel(deployment.id)}
                  >
                    <Ban />
                    Cancel deployment
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export { DeploymentRow };
