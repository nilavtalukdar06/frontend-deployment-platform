import { Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function FrameworkPreset({
  id,
  className,
}: {
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "flex h-9 items-center gap-3 rounded-md border border-input bg-card px-3 text-sm",
        className,
      )}
    >
      <Zap className="size-4 text-brand" />
      <span className="flex-1">Vite</span>
      <Lock className="size-4 text-subtle" aria-label="Locked" />
    </div>
  );
}

export { FrameworkPreset };
