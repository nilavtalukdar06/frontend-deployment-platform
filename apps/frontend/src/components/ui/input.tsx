import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors outline-none placeholder:text-subtle hover:border-ring/70 focus-visible:border-ring disabled:cursor-not-allowed disabled:text-subtle aria-invalid:border-destructive/60",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
