import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  platformHealthQueryOptions,
  type PlatformHealth,
} from "@/features/health/queries";
import { cn } from "@/lib/utils";

const healthCopy: Record<PlatformHealth, { label: string; dot: string }> = {
  operational: { label: "All systems normal", dot: "bg-success" },
  degraded: { label: "Some systems degraded", dot: "bg-warning" },
  unreachable: { label: "API unreachable", dot: "bg-destructive" },
};

function SystemStatus() {
  const { data } = useQuery(platformHealthQueryOptions());

  if (!data) {
    return (
      <span className="flex items-center gap-2 px-1">
        <Skeleton className="size-2 rounded-full" />
        <Skeleton className="h-3 w-28" />
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-2 px-1 text-xs text-muted-foreground"
      aria-live="polite"
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", healthCopy[data].dot)}
      />
      {healthCopy[data].label}
    </span>
  );
}

export { SystemStatus };
