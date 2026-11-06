import type { ReactNode } from "react";
import { ChevronsUpDown, Ellipsis, Plus, Search } from "lucide-react";
import { VercelLogo } from "@/components/brand/vercel-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { StatusDot } from "@/components/deploy/status-dot";

function SidebarSearch() {
  return (
    <div className="flex h-9 items-center gap-2.5 rounded-md border border-border-strong bg-card px-3 text-sm text-subtle">
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate">Find project…</span>
      <Kbd>F</Kbd>
    </div>
  );
}

function SidebarUser() {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-7">
        <AvatarFallback>N</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-label font-medium">Nilav Talukdar</span>
        <span className="truncate text-xs text-subtle">@nilavtalukdar06</span>
      </div>
      <Button variant="outline" size="icon" className="rounded-full">
        <Ellipsis />
      </Button>
    </div>
  );
}

function AppSidebar({ children }: { children: ReactNode }) {
  return (
    <aside
      data-slot="sidebar"
      className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex"
    >
      <div className="flex h-[61px] shrink-0 items-center gap-3 border-b border-border px-5">
        <VercelLogo className="h-4 w-[18px] text-foreground" />
        <span className="text-title font-medium">Deploy</span>
      </div>
      <div className="flex flex-col gap-4 p-3">
        <SidebarSearch />
        <nav className="flex flex-col">{children}</nav>
      </div>
      <div className="mt-auto flex flex-col gap-3 border-t border-border p-3">
        <div className="flex items-center gap-2 px-1 text-xs text-subtle">
          <StatusDot status="ready" className="size-1.5" />
          All systems normal
        </div>
        <SidebarUser />
      </div>
    </aside>
  );
}

function AppHeader({ title }: { title: ReactNode }) {
  return (
    <header
      data-slot="header"
      className="sticky top-0 z-20 flex h-[61px] shrink-0 items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {title}
        <ChevronsUpDown className="size-3.5 text-subtle" />
      </div>
      <Button>
        <Plus />
        Add new
      </Button>
    </header>
  );
}

function AppShell({
  title,
  nav,
  children,
}: {
  title: ReactNode;
  nav: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AppSidebar>{nav}</AppSidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title={title} />
        <main className="px-6 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

export { AppShell, AppSidebar, AppHeader, SidebarSearch, SidebarUser };
