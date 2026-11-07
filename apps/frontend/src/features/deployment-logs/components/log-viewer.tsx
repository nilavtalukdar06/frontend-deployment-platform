import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogRow } from "@/features/deployment-logs/components/log-row";
import type { DeploymentLog } from "@/features/deployment-logs/types";

const ROW_HEIGHT = 24;
const FOLLOW_THRESHOLD_PX = 32;

function LogViewer({
  entries,
  query,
}: {
  entries: readonly DeploymentLog[];
  query: string;
}) {
  "use no memo";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 24,
    getItemKey: (index) => entries[index]?.sequence ?? index,
  });

  const shouldFollow = following && !query;

  useEffect(() => {
    if (shouldFollow && entries.length > 0) {
      virtualizer.scrollToIndex(entries.length - 1, { align: "end" });
    }
  }, [shouldFollow, entries.length, virtualizer]);

  const handleScroll = () => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    setFollowing(distance < FOLLOW_THRESHOLD_PX);
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-150 overflow-y-auto bg-background py-1.5 font-mono text-code"
        role="log"
        aria-live="off"
        aria-label="Build logs"
        tabIndex={0}
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => (
            <LogRow
              key={item.key}
              index={item.index}
              start={item.start}
              measureRef={virtualizer.measureElement}
              entry={entries[item.index]}
              query={query}
            />
          ))}
        </div>
      </div>
      {!following && !query && entries.length > 0 ? (
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-5 bottom-4 shadow-lg shadow-black"
          onClick={() => {
            setFollowing(true);
            virtualizer.scrollToIndex(entries.length - 1, { align: "end" });
          }}
        >
          <ArrowDown data-icon="inline-start" />
          Jump to latest
        </Button>
      ) : null}
    </div>
  );
}

export { LogViewer };
