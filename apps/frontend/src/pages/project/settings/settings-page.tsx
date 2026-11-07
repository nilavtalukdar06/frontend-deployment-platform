import { useEffect } from "react";
import { useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { BuildSection } from "@/pages/project/settings/build-section";
import { DeleteSection } from "@/pages/project/settings/delete-section";
import { EnvironmentVariablesSection } from "@/pages/project/settings/environment-variables-section";
import { GeneralSection } from "@/pages/project/settings/general-section";
import { GitSection } from "@/pages/project/settings/git-section";
import { useProject } from "@/pages/project/project-context";

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "build", label: "Build and deployment" },
  { id: "git", label: "Git" },
  { id: "environment-variables", label: "Environment variables" },
  { id: "delete", label: "Delete project", destructive: true },
];

export default function SettingsPage() {
  const project = useProject();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    document
      .getElementById(hash.slice(1))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-[32px] leading-tight font-medium tracking-tight">
        Project settings
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:self-start"
        >
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                "flex h-9 shrink-0 items-center rounded-md px-3 text-sm whitespace-nowrap transition-colors hover:bg-accent",
                section.destructive
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-foreground",
                hash === `#${section.id}` &&
                  !section.destructive &&
                  "bg-accent text-foreground",
              )}
            >
              {section.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-8">
          <GeneralSection project={project} />
          <BuildSection project={project} />
          <GitSection project={project} />
          <EnvironmentVariablesSection project={project} />
          <DeleteSection project={project} />
        </div>
      </div>
    </div>
  );
}
