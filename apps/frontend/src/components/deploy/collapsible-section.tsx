import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="overflow-hidden rounded-lg border border-border-strong"
    >
      <CollapsibleTrigger className="group/section flex h-15 w-full cursor-pointer items-center gap-3 px-5 text-left text-title font-medium transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted">
        <ChevronDown className="size-4 text-muted-foreground -rotate-90 transition-transform group-data-panel-open/section:rotate-0" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border-strong p-5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export { CollapsibleSection };
