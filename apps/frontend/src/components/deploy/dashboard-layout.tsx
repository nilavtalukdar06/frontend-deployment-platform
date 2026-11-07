import { Outlet, useMatch } from "react-router";
import {
  ArrowLeft,
  ChartColumn,
  LayoutGrid,
  Rocket,
  Settings,
} from "lucide-react";
import { AppShell } from "@/components/deploy/app-shell";
import { NavItemLink } from "@/components/deploy/nav-item";
import { ProjectSwitcher } from "@/components/deploy/project-switcher";

function ProjectNav({ projectId }: { projectId: string }) {
  const base = `/projects/${projectId}`;

  return (
    <>
      <NavItemLink
        to="/"
        className="mb-1 h-7 gap-2 text-label text-subtle [&_svg]:size-3.5"
      >
        <ArrowLeft />
        All projects
      </NavItemLink>
      <NavItemLink to={base} end>
        <LayoutGrid />
        Overview
      </NavItemLink>
      <NavItemLink to={`${base}/deployments`}>
        <Rocket />
        Deployments
      </NavItemLink>
      <NavItemLink to={`${base}/analytics`}>
        <ChartColumn />
        Analytics
      </NavItemLink>
      <NavItemLink to={`${base}/settings`}>
        <Settings />
        Settings
      </NavItemLink>
    </>
  );
}

function RootNav() {
  return (
    <NavItemLink to="/" end>
      <LayoutGrid />
      Projects
    </NavItemLink>
  );
}

function DashboardLayout() {
  const projectMatch = useMatch("/projects/:projectId/*");
  const newProjectMatch = useMatch("/new/*");
  const projectId = projectMatch?.params.projectId;

  const title = projectId ? (
    <ProjectSwitcher projectId={projectId} />
  ) : (
    <span className="px-1">
      {newProjectMatch ? "New project" : "All projects"}
    </span>
  );

  return (
    <AppShell
      title={title}
      nav={projectId ? <ProjectNav projectId={projectId} /> : <RootNav />}
    >
      <Outlet />
    </AppShell>
  );
}

export default DashboardLayout;
