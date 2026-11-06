import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-28 w-full resize-none rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground transition-colors outline-none placeholder:text-subtle hover:border-ring/70 focus-visible:border-ring aria-invalid:border-destructive/60",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
