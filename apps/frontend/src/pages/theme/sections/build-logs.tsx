import {
  ChevronDown,
  Copy,
  LoaderCircle,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Section, Specimen } from "@/pages/theme/sections/section";
import { logLines } from "@/pages/theme/data";

function BuildLogsCard() {
  const warningCount = logLines.filter((line) => line.level === "warn").length;

  return (
    <Card className="gap-0 py-0">
      <div className="flex h-12.5 items-center justify-between px-4">
        <span className="flex items-center gap-3 text-title font-medium">
          <ChevronDown className="size-4 text-muted-foreground" />
          Build logs
        </span>
        <span className="flex items-center gap-3 text-sm text-muted-foreground">
          0m 41s
          <LoaderCircle className="size-4 animate-spin text-warning" />
        </span>
      </div>
      <div className="flex h-12 items-center justify-between gap-4 border-y border-border px-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-4">
          <Copy className="size-4" />
          {logLines.length} lines
          <span className="flex items-center gap-1.5 text-label text-warning">
            <span className="size-1.5 rounded-full bg-warning" />
            Live
          </span>
        </span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <TriangleAlert className="size-4" />
            {warningCount}
          </span>
          <span className="flex h-8 w-60 items-center gap-2.5 rounded-md border border-border-strong bg-background px-3 text-subtle">
            <Search className="size-4" />
            <span className="flex-1">Find in logs</span>
            <Kbd>⌘F</Kbd>
          </span>
        </span>
      </div>
      <div className="flex flex-col bg-background py-1.5 font-mono text-code">
        {logLines.map((line) => (
          <div
            key={line.time}
            className={`flex h-6 items-center gap-4 px-4 ${line.level === "warn" ? "bg-warning-subtle text-warning" : "text-log"}`}
          >
            <span className="w-23.5 shrink-0 text-subtle">{line.time}</span>
            <span className="truncate">{line.message}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BuildLogsSection() {
  return (
    <Section
      id="build-logs"
      title="Build logs"
      description="A monospaced, timestamped log viewer with highlighted warnings."
    >
      <Specimen label="Build logs">
        <BuildLogsCard />
      </Specimen>
    </Section>
  );
}

export { BuildLogsSection };
