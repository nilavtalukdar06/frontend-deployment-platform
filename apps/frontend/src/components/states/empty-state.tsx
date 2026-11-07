import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("border border-border bg-card py-12", className)}>
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-10 rounded-full border border-border-strong bg-background text-muted-foreground"
        >
          <Icon />
        </EmptyMedia>
        <EmptyTitle className="text-title">{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? (
        <EmptyContent className="flex-row justify-center">
          {action}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

export { EmptyState };
