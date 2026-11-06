import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full bg-border-strong p-0.5 transition-colors outline-none data-checked:bg-blue data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="block size-3.5 rounded-full bg-white transition-transform data-checked:translate-x-3.5"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
