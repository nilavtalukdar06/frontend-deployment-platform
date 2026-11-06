import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-8">
      <div className="flex flex-col gap-1.5 border-b border-border pb-5">
        <h2 className="text-heading font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Specimen({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium tracking-wide text-subtle uppercase">
        {label}
      </span>
      <div className={cn("flex flex-col gap-3", className)}>{children}</div>
    </div>
  );
}

export { Section, Specimen };
