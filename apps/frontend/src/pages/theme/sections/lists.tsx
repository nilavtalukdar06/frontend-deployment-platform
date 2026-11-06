import {
  Ban,
  Ellipsis,
  FileText,
  GitBranch,
  GitCommitVertical,
  Lock,
  Pointer,
  Rocket,
  RotateCw,
  Search,
  Upload,
} from "lucide-react";
import { ProjectIcon } from "@/components/deploy/project-icon";
import { StatusDot } from "@/components/deploy/status-dot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section, Specimen } from "@/pages/theme/sections/section";
import {
  demoDeployments,
  demoRepositories,
  type DemoDeployment,
} from "@/pages/theme/data";

const triggerIcons = {
  "Git push": GitCommitVertical,
  Redeploy: Pointer,
  "Initial import": Upload,
};

const statusLabels = {
  ready: "Ready",
  building: "Building",
  failed: "Failed",
  canceled: "Canceled",
};

function RowMenu() {
  return (
    <div className="absolute top-full right-5 z-10 mt-1 flex w-55 flex-col rounded-lg border border-border-strong bg-card p-1.5 shadow-2xl shadow-black">
      <span className="flex h-9 items-center gap-3 rounded-md px-3 text-sm">
        <FileText className="size-4 text-muted-foreground" />
        Inspect deployment
      </span>
      <span className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-destructive">
        <Ban className="size-4" />
        Cancel deployment
      </span>
    </div>
  );
}

function DeploymentRow({ deployment }: { deployment: DemoDeployment }) {
  const TriggerIcon = triggerIcons[deployment.trigger];

  return (
    <div className="relative grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_200px] items-center gap-6 border-b border-border px-5 py-4 last:border-b-0">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2.5 font-mono text-sm">
          {deployment.id}
          {deployment.current && (
            <Badge variant="current" className="font-sans">
              <Rocket />
              Current
            </Badge>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-label text-muted-foreground">
          <TriggerIcon className="size-3.5" />
          {deployment.trigger}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="flex items-center gap-2">
          <StatusDot status={deployment.status} />
          <span className="font-medium">{statusLabels[deployment.status]}</span>
          <span className="text-muted-foreground">{deployment.duration}</span>
        </span>
        {deployment.error && (
          <span className="text-label leading-snug text-destructive/90">
            {deployment.error}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 font-mono text-code text-muted-foreground">
        <span className="flex items-center gap-2">
          <GitBranch className="size-3.5" />
          {deployment.branch}
        </span>
        <span className="flex items-center gap-2">
          <GitCommitVertical className="size-3.5" />
          {deployment.commit}
        </span>
      </div>
      <div className="flex items-center justify-end gap-3 text-sm text-muted-foreground">
        <span>{deployment.time}</span>
        <Avatar className="size-5.5">
          <AvatarFallback className="text-[10px]" />
        </Avatar>
        <span
          className={`flex h-6 w-8 items-center justify-center rounded-sm ${deployment.menuOpen ? "bg-accent text-foreground" : ""}`}
        >
          <Ellipsis className="size-4" />
        </span>
      </div>
      {deployment.menuOpen && <RowMenu />}
    </div>
  );
}

function ListsSection() {
  return (
    <Section
      id="lists"
      title="Lists and tables"
      description="Divided rows inside a bordered panel: the repository importer and the deployments table with its action menu."
    >
      <Specimen label="Import Git repository">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-hero font-medium">Let’s build something new</h3>
            <p className="text-sm text-muted-foreground">
              Import a Git repository. Only repositories whose default branch is
              a Vite project are listed.
            </p>
          </div>
          <h4 className="text-xl font-medium tracking-tight">
            Import Git repository
          </h4>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
            <div className="flex h-10.5 items-center gap-3 rounded-md border border-input bg-card px-3 text-sm">
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]">N</AvatarFallback>
              </Avatar>
              nilavtalukdar06
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
              <Input placeholder="Search…" className="h-10.5 pl-10" />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {demoRepositories.map((repository) => (
              <div
                key={repository.name}
                className="flex items-center gap-4 border-b border-border px-5 py-4"
              >
                <ProjectIcon size="sm" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 text-title">
                    <span className="font-medium">{repository.name}</span>
                    {repository.isPrivate && (
                      <Lock className="size-3.5 text-subtle" />
                    )}
                    <span className="text-sm text-subtle">
                      · {repository.meta}
                    </span>
                  </span>
                  {repository.description && (
                    <span className="truncate text-label text-muted-foreground">
                      {repository.description}
                    </span>
                  )}
                </div>
                {repository.imported ? (
                  <span className="pr-1 text-sm text-subtle">Imported</span>
                ) : (
                  <Button>Import</Button>
                )}
              </div>
            ))}
            <div className="flex h-13.5 items-center justify-center text-label text-muted-foreground">
              Load more repositories
            </div>
          </div>
        </div>
      </Specimen>
      <Specimen label="Deployments table">
        <div className="flex flex-col gap-6">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-heading font-medium">Deployments</h3>
              <p className="text-sm text-muted-foreground">
                11 total · newest first
              </p>
            </div>
            <Button variant="outline">
              <RotateCw />
              Redeploy
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card">
            {demoDeployments.map((deployment) => (
              <DeploymentRow key={deployment.id} deployment={deployment} />
            ))}
          </div>
        </div>
      </Specimen>
    </Section>
  );
}

export { ListsSection };
