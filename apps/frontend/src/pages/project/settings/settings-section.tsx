import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SettingsSection({
  id,
  title,
  description,
  footer,
  tone = "default",
  children,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "destructive";
  children?: ReactNode;
}) {
  return (
    <Card
      id={id}
      className={cn(
        "scroll-mt-24 gap-0 py-0",
        tone === "destructive" && "border-destructive-border",
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-medium tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </div>
      {footer ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 sm:px-6",
            tone === "destructive"
              ? "border-destructive-border bg-destructive-surface/50"
              : "border-border bg-muted",
          )}
        >
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

function SectionFooterHint({ children }: { children: ReactNode }) {
  return <p className="text-sm text-subtle">{children}</p>;
}

export { SectionFooterHint, SettingsSection };
