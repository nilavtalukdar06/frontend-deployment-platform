import {
  ArrowLeft,
  ChartColumn,
  ChevronsUpDown,
  Copy,
  LayoutGrid,
  Plus,
  Rocket,
  Settings,
} from "lucide-react";
import { NavItem } from "@/components/deploy/nav-item";
import { SidebarUser } from "@/components/deploy/app-shell";
import { SidebarSearchButton } from "@/components/deploy/project-search-dialog";
import { VercelLogo } from "@/components/brand/vercel-logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Section, Specimen } from "@/pages/theme/sections/section";

function SidebarFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-60 flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex h-15.25 items-center gap-3 border-b border-border px-5">
        <VercelLogo className="h-4 w-4.5 text-foreground" />
        <span className="text-title font-medium">Deploy</span>
      </div>
      <div className="flex flex-col gap-4 p-3">
        <SidebarSearchButton />
        <nav className="flex flex-col">{children}</nav>
      </div>
      <div className="mt-auto border-t border-border p-3">
        <SidebarUser />
      </div>
    </div>
  );
}

function NavigationSection() {
  return (
    <Section
      id="navigation"
      title="Navigation"
      description="Sidebar, project switcher header, breadcrumbs and settings navigation."
    >
      <div className="flex flex-wrap gap-8">
        <Specimen label="Workspace sidebar">
          <SidebarFrame>
            <NavItem active>
              <LayoutGrid />
              Projects
            </NavItem>
          </SidebarFrame>
        </Specimen>
        <Specimen label="Project sidebar">
          <SidebarFrame>
            <NavItem className="mb-2 h-8 text-label text-subtle">
              <ArrowLeft className="size-3.5" />
              All projects
            </NavItem>
            <NavItem active>
              <LayoutGrid />
              Overview
            </NavItem>
            <NavItem>
              <Rocket />
              Deployments
            </NavItem>
            <NavItem>
              <ChartColumn />
              Analytics
            </NavItem>
            <NavItem>
              <Settings />
              Settings
            </NavItem>
          </SidebarFrame>
        </Specimen>
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <Specimen label="Header with project switcher">
            <div className="flex h-15.25 items-center justify-between rounded-xl border border-border bg-background px-6">
              <span className="flex items-center gap-2 text-sm font-medium">
                dor-check
                <ChevronsUpDown className="size-3.5 text-subtle" />
              </span>
              <Button>
                <Plus />
                Add new
              </Button>
            </div>
          </Specimen>
          <Specimen label="Account header (new project)">
            <div className="flex h-15.25 items-center justify-between rounded-xl border border-border bg-background px-6">
              <span className="flex items-center gap-3 text-sm font-medium">
                <span className="size-7.5 rounded-full bg-[#16a34a]" />
                nilavtalukdar06’s projects
                <ChevronsUpDown className="size-3.5 text-subtle" />
              </span>
              <span className="text-sm">New project</span>
              <Avatar className="size-7.5">
                <AvatarFallback />
              </Avatar>
            </div>
          </Specimen>
          <Specimen label="Breadcrumb">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Deployments
              <span className="text-subtle">/</span>
              <span className="flex items-center gap-2 font-mono text-foreground">
                8c2f6a9b2
                <Copy className="size-3.5 text-muted-foreground" />
              </span>
            </div>
          </Specimen>
          <Specimen label="Settings navigation">
            <div className="flex w-56 flex-col gap-3.5 text-sm">
              <span>General</span>
              <span className="text-muted-foreground">
                Build and deployment
              </span>
              <span className="text-muted-foreground">Git</span>
              <span className="text-muted-foreground">
                Environment variables
              </span>
              <span className="text-destructive">Delete project</span>
            </div>
          </Specimen>
        </div>
      </div>
    </Section>
  );
}

export { NavigationSection };
