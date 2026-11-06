import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function NavItem({
  active,
  className,
  children,
  ...props
}: ComponentProps<"a"> & { active?: boolean }) {
  return (
    <a
      data-slot="nav-item"
      data-active={active ? "" : undefined}
      className={cn(
        "flex h-[34px] items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground data-active:bg-accent data-active:text-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export { NavItem };
