import {
  ArrowUpRight,
  Ellipsis,
  ExternalLink,
  GitBranch,
  GitCommitVertical,
  Lock,
  RotateCw,
  Zap,
  ZapOff,
  ChevronRight,
} from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import { ProjectIcon } from "@/components/deploy/project-icon";
import { StatusDot, StatusLabel } from "@/components/deploy/status-dot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section, Specimen } from "@/pages/theme/sections/section";
import { demoProjects, miniBars, type DemoProject } from "@/pages/theme/data";

const statusLabels = {
  ready: "Ready",
  building: "Building",
  failed: "Failed",
  canceled: "Canceled",
};

function ProjectCard({ project }: { project: DemoProject }) {
  return (
    <Card className="min-h-[205px] gap-4 p-5">
      <div className="flex items-start gap-3">
        <ProjectIcon />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 text-title leading-snug font-medium">
            <span className="truncate">{project.name}</span>
            {project.isPrivate && (
              <Lock className="size-3.5 shrink-0 text-subtle" />
            )}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {project.domain}
          </span>
        </div>
        <div className="flex items-center gap-3 text-subtle">
          {project.autoDeploy === false ? (
            <ZapOff className="size-4 text-warning" />
          ) : (
            <Zap className="size-4" />
          )}
          <Ellipsis className="size-4 text-muted-foreground" />
        </div>
      </div>
      <p className="line-clamp-2 min-h-[42px] text-sm text-subtle">
        {project.description}
      </p>
      <div className="flex items-center gap-3 text-sm">
        <StatusDot status={project.status} />
        <span className="font-medium">{statusLabels[project.status]}</span>
        <span className="flex items-center gap-1.5 font-mono text-code text-muted-foreground">
          <GitBranch className="size-3.5 text-subtle" />
          {project.branch} · {project.commit}
        </span>
        <span className="ml-auto text-subtle">{project.time}</span>
      </div>
      <span className="inline-flex h-6 w-fit items-center gap-2 rounded-full border border-border bg-muted px-2.5 text-code text-muted-foreground">
        <GithubIcon className="size-3.5" />
        {project.repo}
      </span>
    </Card>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="gap-1 p-5">
      <span className="text-label text-muted-foreground">{label}</span>
      <span className="text-stat font-medium tracking-tight">{value}</span>
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </Card>
  );
}

function KeyValueCard({
  title,
  action,
  rows,
}: {
  title: string;
  action?: string;
  rows: { label: string; value: string; mono?: boolean; github?: boolean }[];
}) {
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-title font-medium">{title}</span>
        {action && <span className="text-sm text-subtle">{action}</span>}
      </div>
      <dl className="flex flex-col gap-3 text-label">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <dt className="text-label text-muted-foreground">{row.label}</dt>
            <dd
              className={`flex items-center gap-2 ${row.mono ? "font-mono text-code" : ""}`}
            >
              {row.github && <GithubIcon className="size-3.5" />}
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function ProductionDeploymentCard() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <span className="text-title font-medium">Production deployment</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-lg" className="size-[34px]">
            <GithubIcon />
          </Button>
          <Button variant="outline">
            <RotateCw />
            Redeploy
          </Button>
          <Button>
            <ArrowUpRight />
            Visit
          </Button>
        </div>
      </div>
      <div className="flex h-[41px] items-center justify-between border-b border-border bg-warning-surface px-6 text-sm text-warning">
        <span className="flex items-center gap-3">
          <span className="size-3.5 animate-spin rounded-full border-2 border-warning border-t-transparent" />
          <span>
            A new deployment is <b className="font-medium">building</b>
            <span className="ml-2 font-mono text-code">· 9f8e7d6</span>
          </span>
        </span>
        <span className="flex items-center gap-1 text-warning/80">
          View build
          <ChevronRight className="size-4" />
        </span>
      </div>
      <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[minmax(0,413px)_1fr]">
        <div className="flex aspect-[413/258] items-center justify-center overflow-hidden rounded-lg border border-border-strong bg-[#fafafa] text-[#111]">
          <div className="flex w-[190px] flex-col items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2 rounded-full bg-chart-1" />
              Trap Detector
            </span>
            <div className="flex w-full flex-col gap-2 rounded-lg border border-[#e5e5e5] bg-white p-3">
              <span className="text-center">Continue to</span>
              <span className="h-4 rounded-sm border border-[#d4d4d4]" />
              <span className="h-4 rounded-sm bg-[#111]" />
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 content-start gap-x-8 gap-y-5 text-sm">
          <div className="col-span-2 flex flex-col gap-1.5">
            <dt className="text-label text-muted-foreground">Deployment</dt>
            <dd className="font-mono text-code">
              0192f5a4-8c2f-7d4b-ae3f-6a9b2c3d4e5f
            </dd>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <dt className="text-label text-muted-foreground">Domain</dt>
            <dd className="flex items-center gap-2 text-title font-medium">
              brave-falcon.deploy.app
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-label text-muted-foreground">Status</dt>
            <dd>
              <StatusLabel status="ready" duration="2m 14s" />
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-label text-muted-foreground">Created</dt>
            <dd className="flex items-center gap-2">
              Oct 11 by nilavtalukdar06
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]" />
              </Avatar>
            </dd>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <dt className="text-label text-muted-foreground">Source</dt>
            <dd className="flex flex-col gap-1.5 font-mono text-code">
              <span className="flex items-center gap-2">
                <GitBranch className="size-3.5 text-muted-foreground" />
                main
              </span>
              <span className="flex items-center gap-2">
                <GitCommitVertical className="size-3.5 text-muted-foreground" />
                455e3f3
                <GitCommitVertical className="size-3.5 text-muted-foreground" />
                <span className="font-sans text-muted-foreground">
                  Git push
                </span>
              </span>
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex items-center gap-3 border-t border-border px-6 py-4 text-sm text-muted-foreground">
        <Zap className="size-4 text-success" />
        <span>
          To update your production deployment, push to the{" "}
          <code className="font-mono text-code text-foreground">main</code>{" "}
          branch.
        </span>
      </div>
    </Card>
  );
}

function DeploymentSummaryCard() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-title font-medium">Deployment</span>
        <Button variant="destructive">Cancel deployment</Button>
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-6 p-6 text-sm md:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Status</dt>
          <dd>
            <StatusLabel status="building" duration="0m 41s" />
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Created</dt>
          <dd>just now by nilavtalukdar06</dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Trigger</dt>
          <dd className="flex items-center gap-2">
            <GitCommitVertical className="size-4 text-muted-foreground" />
            Git push
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Domain</dt>
          <dd className="text-subtle">Not serving traffic</dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Source</dt>
          <dd className="flex flex-col gap-1 font-mono text-code">
            <span className="flex items-center gap-2">
              <GitBranch className="size-3.5 text-muted-foreground" />
              main
            </span>
            <span className="flex items-center gap-2">
              <GitCommitVertical className="size-3.5 text-muted-foreground" />
              9f8e7d6
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Started</dt>
          <dd>Nov 7, 12:41 AM</dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Finished</dt>
          <dd className="text-muted-foreground">—</dd>
        </div>
        <div className="flex flex-col gap-1.5">
          <dt className="text-label text-muted-foreground">Build settings</dt>
          <dd className="font-mono text-code text-muted-foreground">
            . → dist
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-x-24 gap-y-2 border-t border-border px-6 py-4 text-sm text-muted-foreground">
        <span>
          Install{" "}
          <code className="font-mono text-code text-foreground">
            npm install
          </code>
        </span>
        <span>
          Build{" "}
          <code className="font-mono text-code text-foreground">
            npm run build
          </code>
        </span>
      </div>
    </Card>
  );
}

function SettingsGitCard() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-5 p-6">
        <h3 className="text-xl font-medium tracking-tight">Git</h3>
        <div className="flex items-center justify-between rounded-lg border border-border-strong px-5 py-4">
          <div className="flex items-center gap-4">
            <GithubIcon className="size-5" />
            <div className="flex flex-col">
              <span className="text-title font-medium">
                nilavtalukdar06/dor-check
              </span>
              <span className="text-sm text-muted-foreground">
                Public repository · imported Oct 11
              </span>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-sm text-success">
            <Zap className="size-3.5" />
            Deploys on push
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border bg-muted px-6 py-3">
        <span className="text-sm text-subtle">
          Reinstall the webhook if it was deleted on GitHub.
        </span>
        <Button variant="outline">Reinstall webhook</Button>
      </div>
    </Card>
  );
}

function ImportSourceBox() {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface px-5 py-4">
      <span className="text-sm text-muted-foreground">
        Importing from GitHub
      </span>
      <span className="flex items-center gap-5 text-title font-medium">
        <span className="flex items-center gap-2.5">
          <GithubIcon className="size-4" />
          nilavtalukdar06/test-deploy
        </span>
        <span className="flex items-center gap-2 font-mono text-code font-normal text-muted-foreground">
          <GitBranch className="size-3.5" />
          main
        </span>
      </span>
    </div>
  );
}

function MiniBarChart() {
  return (
    <div className="flex h-[78px] items-end gap-[3px]">
      {miniBars.map((height, index) => (
        <span
          key={index}
          className="flex-1 rounded-t-[1px] bg-chart-1"
          style={{ height: `${Math.max(height / 1.22, 6)}%` }}
        />
      ))}
    </div>
  );
}

function CardsSection() {
  return (
    <Section
      id="cards"
      title="Cards and panels"
      description="12px radius panels on the #0a0a0a surface with a 1px #1f1f1f border, 20–24px padding and header dividers."
    >
      <Specimen label="Project cards (grid)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {demoProjects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </Specimen>
      <Specimen label="Stat cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Page views" value="8,214" hint="last 24 hours" />
          <StatCard label="Average per hour" value="342" />
          <StatCard
            label="Peak hour"
            value="612"
            hint="Nov 6, 7:00 – 8:00 PM"
          />
          <StatCard label="Top route" value="/" hint="36.1% of views" />
        </div>
      </Specimen>
      <Specimen label="Production deployment panel">
        <ProductionDeploymentCard />
      </Specimen>
      <Specimen label="Overview summary cards">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="text-title font-medium">Analytics</span>
              <span className="text-sm text-subtle">24h</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label text-muted-foreground">
                Page views
              </span>
              <span className="text-stat-lg font-medium tracking-tight">
                8,214
              </span>
            </div>
            <MiniBarChart />
          </Card>
          <KeyValueCard
            title="Build settings"
            action="Edit"
            rows={[
              { label: "Framework", value: "Vite" },
              { label: "Root directory", value: ".", mono: true },
              { label: "Install command", value: "npm install", mono: true },
              { label: "Build command", value: "npm run build", mono: true },
              { label: "Output directory", value: "dist", mono: true },
            ]}
          />
          <KeyValueCard
            title="Repository"
            rows={[
              {
                label: "Git",
                value: "nilavtalukdar06/dor-check",
                github: true,
              },
              { label: "Production branch", value: "main", mono: true },
              { label: "Visibility", value: "Public" },
              { label: "Slug", value: "brave-falcon", mono: true },
              { label: "Created", value: "Oct 11" },
            ]}
          />
        </div>
      </Specimen>
      <Specimen label="Deployment summary">
        <DeploymentSummaryCard />
      </Specimen>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Specimen label="Settings git row">
          <SettingsGitCard />
        </Specimen>
        <Specimen label="Import source">
          <ImportSourceBox />
        </Specimen>
      </div>
      <Specimen label="Badge inside card header" className="flex-row gap-4">
        <Card className="w-full gap-0 p-5">
          <div className="flex items-center gap-3">
            <span className="text-heading font-medium">dor-check</span>
            <Badge variant="success" className="px-3">
              Auto-deploy on
            </Badge>
          </div>
          <span className="mt-2 text-muted-foreground">
            Scam and trap detector with evidence-backed verdicts
          </span>
        </Card>
      </Specimen>
    </Section>
  );
}

export { CardsSection, ProjectCard, StatCard };
