import type { ComponentProps } from "react";
import { NavLink, type NavLinkProps } from "react-router";
import { cn } from "@/lib/utils";

const navItemClassName =
  "flex h-8.5 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground data-active:bg-accent data-active:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0";

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
      className={cn(navItemClassName, className)}
      {...props}
    >
      {children}
    </a>
  );
}

function NavItemLink({
  className,
  ...props
}: Omit<NavLinkProps, "className"> & { className?: string }) {
  return (
    <NavLink
      data-slot="nav-item"
      className={cn(navItemClassName, className)}
      {...props}
    />
  );
}

export { NavItem, NavItemLink };
