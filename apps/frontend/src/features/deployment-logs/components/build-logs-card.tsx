import { useDeferredValue, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleAlert,
  Copy,
  FileText,
  Search,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDeploymentDuration } from "@/features/deployments/display";
import { isActiveStatus } from "@/features/deployments/status";
import type { Deployment } from "@/features/deployments/types";
import { LogViewer } from "@/features/deployment-logs/components/log-viewer";
import type { LogStreamPhase } from "@/features/deployment-logs/deployment-log-store";
import type { DeploymentLog } from "@/features/deployment-logs/types";
import { useNow } from "@/hooks/use-now";
import { formatLogTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const SKELETON_WIDTHS = ["w-2/5", "w-3/5", "w-1/3", "w-4/5", "w-1/2", "w-2/3"];

const isFindShortcut = (event: KeyboardEvent) =>
  (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f";

function StreamBadge({ phase }: { phase: LogStreamPhase }) {
  if (phase === "live") {
    return (
      <span className="flex items-center gap-1.5 text-label text-warning">
        <span className="size-1.5 animate-pulse rounded-full bg-warning" />
        Live
      </span>
    );
  }

  if (
    phase === "connecting" ||
    phase === "syncing" ||
    phase === "reconnecting"
  ) {
    return (
      <span className="flex items-center gap-1.5 text-label text-muted-foreground">
        <Spinner className="size-3" />
        {phase === "reconnecting" ? "Reconnecting…" : "Connecting…"}
      </span>
    );
  }

  if (phase === "offline") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="flex items-center gap-1.5 text-label text-subtle" />
          }
        >
          <span className="size-1.5 rounded-full bg-subtle" />
          Polling
        </TooltipTrigger>
        <TooltipContent>
          Live updates are unavailable, refreshing every few seconds
        </TooltipContent>
      </Tooltip>
    );
  }

  return null;
}

function LogsSkeleton() {
  return (
    <div
      className="flex flex-col gap-2.5 bg-background px-4 py-3"
      aria-busy="true"
      aria-label="Loading build logs"
    >
      {SKELETON_WIDTHS.map((width, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-3.5 w-23.5" />
          <Skeleton className={cn("h-3.5", width)} />
        </div>
      ))}
    </div>
  );
}

function LogsBody({
  deployment,
  phase,
  entries,
  visible,
  query,
  error,
  onRetry,
}: {
  deployment: Deployment;
  phase: LogStreamPhase;
  entries: readonly DeploymentLog[];
  visible: readonly DeploymentLog[];
  query: string;
  error: unknown;
  onRetry: () => void;
}) {
  if (entries.length === 0) {
    if (phase === "error") {
      return (
        <div className="p-4">
          <ErrorState
            error={error}
            title="Couldn't load build logs"
            onRetry={onRetry}
          />
        </div>
      );
    }

    if (phase === "connecting" || phase === "syncing") {
      return <LogsSkeleton />;
    }

    if (phase === "ended") {
      return (
        <div className="p-4">
          <EmptyState
            icon={FileText}
            title="No build logs were recorded"
            description={
              deployment.errorMessage ??
              "This deployment finished without producing any output."
            }
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 bg-background px-4 py-8 text-sm text-muted-foreground">
        <Spinner />
        {deployment.status === "queued"
          ? "Waiting in the queue for a build slot…"
          : "Waiting for build output…"}
      </div>
    );
  }

  if (query && visible.length === 0) {
    return (
      <p className="bg-background px-4 py-8 text-center text-sm text-subtle">
        No lines match “{query}”.
      </p>
    );
  }

  return <LogViewer entries={visible} query={query} />;
}

function BuildLogsCard({
  deployment,
  phase,
  entries,
  error,
  onRetry,
}: {
  deployment: Deployment;
  phase: LogStreamPhase;
  entries: readonly DeploymentLog[];
  error: unknown;
  onRetry: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoveredRef = useRef(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const active = isActiveStatus(deployment.status);
  const now = useNow(active);

  const visible = deferredQuery
    ? entries.filter((entry) =>
        entry.message.toLowerCase().includes(deferredQuery),
      )
    : entries;
  let warningCount = 0;
  let errorCount = 0;

  for (const entry of entries) {
    if (entry.level === "warn") {
      warningCount += 1;
    } else if (entry.level === "error") {
      errorCount += 1;
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !isFindShortcut(event) ||
        !(
          hoveredRef.current ||
          cardRef.current?.contains(document.activeElement)
        )
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const copyLogs = () => {
    const text = visible
      .map((entry) => `${formatLogTime(entry.timestamp)}  ${entry.message}`)
      .join("\n");

    void navigator.clipboard
      .writeText(text)
      .then(() =>
        toast.success(
          `Copied ${visible.length} line${visible.length === 1 ? "" : "s"}`,
        ),
      );
  };

  return (
    <Card
      ref={cardRef}
      className="gap-0 py-0"
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
      }}
    >
      <Collapsible defaultOpen>
        <div className="flex h-12.5 items-center justify-between gap-4 px-4">
          <CollapsibleTrigger className="group/logs flex cursor-pointer items-center gap-3 text-title font-medium outline-none focus-visible:underline">
            <ChevronDown className="size-4 -rotate-90 text-muted-foreground transition-transform group-aria-expanded/logs:rotate-0" />
            Build logs
          </CollapsibleTrigger>
          <span className="flex items-center gap-3 text-sm text-muted-foreground tabular-nums">
            {formatDeploymentDuration(deployment, now)}
            {active ? <Spinner className="text-warning" /> : null}
          </span>
        </div>
        <CollapsibleContent>
          <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y border-border px-4 py-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Copy logs"
                      disabled={visible.length === 0}
                      onClick={copyLogs}
                    />
                  }
                >
                  <Copy />
                </TooltipTrigger>
                <TooltipContent>Copy logs</TooltipContent>
              </Tooltip>
              <span className="tabular-nums">
                {deferredQuery
                  ? `${visible.length} of ${entries.length} lines`
                  : `${entries.length} lines`}
              </span>
              <StreamBadge phase={phase} />
            </span>
            <span className="flex flex-1 items-center justify-end gap-4">
              {errorCount > 0 ? (
                <span
                  className="flex items-center gap-1.5 text-destructive"
                  aria-label={`${errorCount} errors`}
                >
                  <CircleAlert className="size-4" />
                  {errorCount}
                </span>
              ) : null}
              <span
                className="flex items-center gap-1.5"
                aria-label={`${warningCount} warnings`}
              >
                <TriangleAlert className="size-4" />
                {warningCount}
              </span>
              <InputGroup className="h-8 w-full max-w-60 bg-background">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setQuery("");
                    }
                  }}
                  placeholder="Find in logs"
                  aria-label="Find in logs"
                />
                <InputGroupAddon align="inline-end">
                  <Kbd>⌘F</Kbd>
                </InputGroupAddon>
              </InputGroup>
            </span>
          </div>
          <LogsBody
            deployment={deployment}
            phase={phase}
            entries={entries}
            visible={visible}
            query={deferredQuery}
            error={error}
            onRetry={onRetry}
          />
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export { BuildLogsCard };
