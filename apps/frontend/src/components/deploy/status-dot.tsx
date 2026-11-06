import { cn } from "@/lib/utils";

type DeploymentStatus = "ready" | "building" | "failed" | "canceled";

const dotClassNames: Record<DeploymentStatus, string> = {
  ready: "bg-success",
  building: "bg-warning ring-[3px] ring-warning/20",
  failed: "bg-destructive",
  canceled: "bg-neutral-status",
};

const statusLabels: Record<DeploymentStatus, string> = {
  ready: "Ready",
  building: "Building",
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
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        dotClassNames[status],
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
      {duration && <span className="text-muted-foreground">{duration}</span>}
    </span>
  );
}

export { StatusDot, StatusLabel };
export type { DeploymentStatus };
