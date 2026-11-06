import {
  ChevronDown,
  CircleCheck,
  CircleDashed,
  Copy,
  LoaderCircle,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Section, Specimen } from "@/pages/theme/sections/section";
import { logLines, pipelineSteps } from "@/pages/theme/data";

function PipelineCard() {
  return (
    <Card className="gap-6 p-6">
      <span className="text-title font-medium">Pipeline</span>
      <div className="grid grid-cols-3 gap-y-6 md:grid-cols-6">
        {pipelineSteps.map((step) => (
          <div key={step.name} className="flex flex-col items-center gap-2">
            {step.state === "done" && (
              <CircleCheck className="size-6 text-success" />
            )}
            {step.state === "running" && (
              <LoaderCircle className="size-6 animate-spin text-warning" />
            )}
            {step.state === "pending" && (
              <CircleDashed className="size-6 text-subtle" />
            )}
            <div className="flex flex-col items-center leading-tight">
              <span
                className={`text-sm font-medium ${step.state === "pending" ? "text-subtle" : ""}`}
              >
                {step.name}
              </span>
              <span className="min-h-[18px] text-label text-subtle">
                {step.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BuildLogsCard() {
  const warningCount = logLines.filter((line) => line.level === "warn").length;

  return (
    <Card className="gap-0 py-0">
      <div className="flex h-[50px] items-center justify-between px-5">
        <span className="flex items-center gap-3 text-title font-medium">
          <ChevronDown className="size-4 text-muted-foreground" />
          Build logs
        </span>
        <span className="flex items-center gap-3 text-sm text-muted-foreground">
          0m 41s
          <LoaderCircle className="size-4 animate-spin text-warning" />
        </span>
      </div>
      <div className="flex h-[54px] items-center justify-between gap-4 border-y border-border px-5 text-sm text-muted-foreground">
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
          <span className="flex h-8 w-[240px] items-center gap-2.5 rounded-md border border-border-strong bg-background px-3 text-subtle">
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
            className={`flex h-6 items-center gap-6 px-5 ${line.level === "warn" ? "bg-warning-subtle text-warning" : "text-log"}`}
          >
            <span className="w-[94px] shrink-0 text-subtle">{line.time}</span>
            <span className="truncate">{line.message}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PipelineSection() {
  return (
    <Section
      id="pipeline"
      title="Pipeline and build logs"
      description="Step indicators for each build phase and a monospaced, timestamped log viewer with highlighted warnings."
    >
      <Specimen label="Pipeline steps">
        <PipelineCard />
      </Specimen>
      <Specimen label="Build logs">
        <BuildLogsCard />
      </Specimen>
    </Section>
  );
}

export { PipelineSection };
