import { Lock, Zap } from "lucide-react";

function FrameworkPreset({ id }: { id?: string }) {
  return (
    <div
      id={id}
      className="flex h-10 items-center gap-3 rounded-md border border-input bg-card px-3 text-sm"
    >
      <Zap className="size-4 text-brand" />
      <span className="flex-1">Vite</span>
      <Lock className="size-4 text-subtle" aria-label="Locked" />
    </div>
  );
}

export { FrameworkPreset };
