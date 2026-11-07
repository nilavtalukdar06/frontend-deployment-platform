import { memo, type Ref } from "react";
import type { DeploymentLog } from "@/features/deployment-logs/types";
import { formatLogTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const isMarkerEntry = (entry: DeploymentLog) =>
  entry.type === "step" || entry.type === "status" || entry.type === "end";

const toneFor = (entry: DeploymentLog) => {
  if (entry.level === "error" || entry.phase === "failed") {
    return "bg-destructive-surface/70 text-destructive-foreground";
  }

  if (entry.level === "warn") {
    return "bg-warning-subtle text-warning";
  }

  return isMarkerEntry(entry) ? "text-foreground" : "text-log";
};

const splitByQuery = (text: string, query: string) => {
  const lower = text.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let cursor = 0;
  let index = lower.indexOf(query, cursor);

  while (index !== -1) {
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), match: false });
    }

    parts.push({ text: text.slice(index, index + query.length), match: true });
    cursor = index + query.length;
    index = lower.indexOf(query, cursor);
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), match: false });
  }

  return parts;
};

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) {
    return text;
  }

  return splitByQuery(text, query).map((part, index) =>
    part.match ? (
      <mark key={index} className="rounded-xs bg-warning/30 text-foreground">
        {part.text}
      </mark>
    ) : (
      <span key={index}>{part.text}</span>
    ),
  );
}

const LogRow = memo(function LogRow({
  entry,
  query,
  index,
  start,
  measureRef,
}: {
  entry: DeploymentLog;
  query: string;
  index: number;
  start: number;
  measureRef: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={measureRef}
      data-index={index}
      style={{ transform: `translateY(${start}px)` }}
      className={cn(
        "absolute top-0 left-0 flex min-h-6 w-full items-start gap-4 px-4 py-0.5",
        toneFor(entry),
      )}
    >
      <span className="w-23.5 shrink-0 text-subtle select-none">
        {formatLogTime(entry.timestamp)}
      </span>
      <span className="min-w-0 flex-1 wrap-break-word whitespace-pre-wrap">
        {isMarkerEntry(entry) ? (
          <span className="mr-2 text-subtle select-none">▸</span>
        ) : null}
        <HighlightedText text={entry.message} query={query} />
      </span>
    </div>
  );
});

export { LogRow, isMarkerEntry };
