import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function ProjectIcon({
  size = "md",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      data-slot="project-icon"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-background text-brand",
        size === "md" ? "size-8" : "size-7",
        className,
      )}
    >
      <Zap className="size-3.5" />
    </span>
  );
}

export { ProjectIcon };
