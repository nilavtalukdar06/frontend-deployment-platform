import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/features/deployments/types";

type StatusTone = "ready" | "building" | "failed" | "canceled" | "queued";

const toneByStatus: Record<DeploymentStatus, StatusTone> = {
  queued: "queued",
  cloning: "building",
  installing: "building",
  building: "building",
  uploading: "building",
  ready: "ready",
  failed: "failed",
  canceled: "canceled",
};

const dotClassNames: Record<StatusTone, string> = {
  ready: "bg-success",
  building: "bg-warning ring-[3px] ring-warning/20",
  failed: "bg-destructive",
  canceled: "bg-neutral-status",
  queued: "bg-subtle ring-[3px] ring-subtle/20",
};

const statusLabels: Record<DeploymentStatus, string> = {
  queued: "Queued",
  cloning: "Building",
  installing: "Building",
  building: "Building",
  uploading: "Building",
  ready: "Ready",
  failed: "Failed",
  canceled: "Canceled",
};

function StatusDot({
  status,
  className,
}: {
  status: DeploymentStatus;
  className?: string;
}) {
  return (
    <span
      data-slot="status-dot"
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        dotClassNames[toneByStatus[status]],
        className,
      )}
    />
  );
}

function StatusLabel({
  status,
  duration,
  className,
}: {
  status: DeploymentStatus;
  duration?: string;
  className?: string;
}) {
  return (
    <span
      data-slot="status-label"
      className={cn("inline-flex items-center gap-2 text-sm", className)}
    >
      <StatusDot status={status} />
      <span className="font-medium text-foreground">
        {statusLabels[status]}
      </span>
      {duration ? (
        <span className="text-muted-foreground tabular-nums">{duration}</span>
      ) : null}
    </span>
  );
}

export { StatusDot, StatusLabel, statusLabels };
export type { DeploymentStatus };
