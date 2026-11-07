import type { ReactNode } from "react";
import { Link } from "react-router";
import { Ellipsis, LogOut, Palette, Plus } from "lucide-react";
import { VercelLogo } from "@/components/brand/vercel-logo";
import { useAuthenticatedSession } from "@/components/auth/session-context";
import { ProjectSearchDialog } from "@/components/deploy/project-search-dialog";
import { SystemStatus } from "@/components/deploy/system-status";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/hooks/use-sign-out";

function UserAvatar({ className }: { className?: string }) {
  const { user } = useAuthenticatedSession();
  const displayName = user.name ?? user.githubLogin;

  return (
    <Avatar className={className}>
      {user.avatarUrl ? (
        <AvatarImage src={user.avatarUrl} alt={user.githubLogin} />
      ) : null}
      <AvatarFallback className="bg-avatar text-[11px] text-white">
        {displayName.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function SidebarUser() {
  const { user } = useAuthenticatedSession();
  const signOut = useSignOut();
  const displayName = user.name ?? user.githubLogin;

  return (
    <div className="flex items-center gap-3">
      <UserAvatar className="size-8" />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-label font-medium">{displayName}</span>
        <span className="truncate text-xs text-subtle">
          @{user.githubLogin}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Account menu"
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">
              {user.email ?? `@${user.githubLogin}`}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link to="/theme" />}>
              <Palette />
              Design system
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AppSidebar({ children }: { children: ReactNode }) {
  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="h-15.25 shrink-0 flex-row items-center gap-3 border-b border-border px-5">
        <Link to="/" className="flex items-center gap-3">
          <VercelLogo className="h-4 w-4.5 text-foreground" />
          <span className="text-title font-medium">Deploy</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-4 p-3">
        <ProjectSearchDialog />
        <nav className="flex flex-col gap-0.5">{children}</nav>
      </SidebarContent>
      <SidebarFooter className="gap-3 border-t border-border p-3">
        <SystemStatus />
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function AppHeader({ title }: { title: ReactNode }) {
  return (
    <header
      data-slot="header"
      className="sticky top-0 z-20 flex h-15.25 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/85 px-6 backdrop-blur"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
        <SidebarTrigger className="-ml-1 md:hidden" />
        {title}
      </div>
      <Button nativeButton={false} render={<Link to="/new" />}>
        <Plus data-icon="inline-start" />
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
    <SidebarProvider className="bg-background text-foreground">
      <AppSidebar>{nav}</AppSidebar>
      <SidebarInset>
        <AppHeader title={title} />
        <div className="px-6 py-8 sm:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export { AppShell, AppSidebar, AppHeader, SidebarUser, UserAvatar };
