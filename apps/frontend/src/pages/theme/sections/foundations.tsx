import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Copy,
  Ellipsis,
  ExternalLink,
  Eye,
  FileText,
  GitBranch,
  GitCommitVertical,
  LayoutGrid,
  LayoutList,
  LoaderCircle,
  Lock,
  Minus,
  Plus,
  Pointer,
  RotateCw,
  Rocket,
  Search,
  Settings,
  Table2,
  TriangleAlert,
  Upload,
  Zap,
  ZapOff,
  ChartColumn,
  type LucideIcon,
} from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import { VercelLogo } from "@/components/brand/vercel-logo";
import { Section, Specimen } from "@/pages/theme/sections/section";
import {
  layoutMetrics,
  radiusScale,
  spacingScale,
  swatchGroups,
  typeScale,
} from "@/pages/theme/data";

const icons: { name: string; icon: LucideIcon; usage: string }[] = [
  { name: "LayoutGrid", icon: LayoutGrid, usage: "Overview, grid view" },
  { name: "Rocket", icon: Rocket, usage: "Deployments, current badge" },
  { name: "ChartColumn", icon: ChartColumn, usage: "Analytics, chart toggle" },
  { name: "Settings", icon: Settings, usage: "Settings" },
  { name: "ArrowLeft", icon: ArrowLeft, usage: "All projects" },
  { name: "Search", icon: Search, usage: "Search fields" },
  { name: "Plus", icon: Plus, usage: "Add new, Add more" },
  { name: "Minus", icon: Minus, usage: "Remove variable" },
  { name: "Lock", icon: Lock, usage: "Private, locked preset" },
  { name: "GitBranch", icon: GitBranch, usage: "Branch" },
  { name: "GitCommitVertical", icon: GitCommitVertical, usage: "Commit" },
  { name: "Ellipsis", icon: Ellipsis, usage: "Row and card menus" },
  { name: "CircleAlert", icon: CircleAlert, usage: "Error alert" },
  { name: "Eye", icon: Eye, usage: "Reveal value" },
  { name: "ChevronsUpDown", icon: ChevronsUpDown, usage: "Project switcher" },
  { name: "ChevronDown", icon: ChevronDown, usage: "Collapsible section" },
  { name: "ChevronRight", icon: ChevronRight, usage: "View build" },
  { name: "RotateCw", icon: RotateCw, usage: "Redeploy" },
  { name: "ExternalLink", icon: ExternalLink, usage: "Domain link" },
  { name: "ArrowUpRight", icon: ArrowUpRight, usage: "Visit" },
  { name: "LoaderCircle", icon: LoaderCircle, usage: "Building spinner" },
  { name: "CircleCheck", icon: CircleCheck, usage: "Completed, success" },
  { name: "CircleDashed", icon: CircleDashed, usage: "Pending" },
  { name: "Copy", icon: Copy, usage: "Copy id, copy logs" },
  { name: "TriangleAlert", icon: TriangleAlert, usage: "Log warnings" },
  { name: "Ban", icon: Ban, usage: "Cancel deployment" },
  { name: "FileText", icon: FileText, usage: "Inspect deployment" },
  { name: "Pointer", icon: Pointer, usage: "Redeploy trigger" },
  { name: "Upload", icon: Upload, usage: "Initial import trigger" },
  { name: "Table2", icon: Table2, usage: "Table view" },
  { name: "LayoutList", icon: LayoutList, usage: "List view" },
  { name: "Check", icon: Check, usage: "Confirmation" },
  { name: "Zap", icon: Zap, usage: "Vite preset, deploys on push" },
  { name: "ZapOff", icon: ZapOff, usage: "Auto-deploy off" },
];

function ColorsSection() {
  return (
    <Section
      id="colors"
      title="Colors"
      description="Exact values sampled from the reference screens. A pure black canvas, near-black cards and a restrained palette of status colors."
    >
      {swatchGroups.map((group) => (
        <Specimen key={group.title} label={group.title}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {group.swatches.map((swatch) => (
              <div
                key={swatch.token}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                <span
                  className="size-12 shrink-0 rounded-lg border border-border-strong"
                  style={{ backgroundColor: `var(--${swatch.token})` }}
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">
                    {swatch.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {swatch.hex}
                  </span>
                  <span className="truncate text-xs text-subtle">
                    {swatch.usage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Specimen>
      ))}
    </Section>
  );
}

function TypographySection() {
  return (
    <Section
      id="typography"
      title="Typography"
      description="Geist for interface text and Geist Mono for commits, commands, hashes and logs."
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {typeScale.map((item) => (
          <div
            key={item.name}
            className="grid grid-cols-1 items-center gap-2 border-b border-border px-4 py-3 last:border-b-0 md:grid-cols-[200px_1fr]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="font-mono text-xs text-subtle">{item.spec}</span>
            </div>
            <span className={item.className}>{item.sample}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ShapeSection() {
  return (
    <Section
      id="shape"
      title="Radius, spacing and layout"
      description="Corner radii, the spacing scale and the fixed layout metrics measured from the screens."
    >
      <Specimen label="Radius">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {radiusScale.map((radius) => (
            <div
              key={radius.name}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div
                className={`h-16 border border-border-strong bg-accent ${radius.className}`}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {radius.name}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {radius.value}
                  </span>
                </span>
                <span className="text-xs text-subtle">{radius.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen label="Spacing scale">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
          {spacingScale.map((space) => (
            <div key={space} className="flex items-center gap-4">
              <span className="w-12 font-mono text-xs text-muted-foreground">
                {space}px
              </span>
              <span
                className="h-3 rounded-sm bg-chart-muted"
                style={{ width: space * 4 }}
              />
            </div>
          ))}
        </div>
      </Specimen>
      <Specimen label="Layout metrics">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
          {layoutMetrics.map((metric) => (
            <div
              key={metric.name}
              className="flex items-center justify-between gap-4 bg-card px-4 py-3 text-sm"
            >
              <span className="text-muted-foreground">{metric.name}</span>
              <span className="font-mono text-code">{metric.value}</span>
            </div>
          ))}
        </div>
      </Specimen>
    </Section>
  );
}

function IconsSection() {
  return (
    <Section
      id="icons"
      title="Logo and icons"
      description="Lucide outline icons at 16px for the interface, plus the Vercel triangle and the GitHub mark."
    >
      <Specimen label="Brand">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-15 items-center justify-center rounded-2xl border border-border-strong bg-card">
            <VercelLogo className="h-5.5 w-6.25 text-foreground" />
          </span>
          <span className="flex items-center gap-3">
            <VercelLogo className="h-4 w-4.5 text-foreground" />
            <span className="text-title font-medium">Deploy</span>
          </span>
          <span className="flex size-12 items-center justify-center rounded-lg border border-border-strong bg-card">
            <GithubIcon className="size-4 text-foreground" />
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <GithubIcon className="size-4" />
            nilavtalukdar06/dor-check
          </span>
        </div>
      </Specimen>
      <Specimen label="Interface icons">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3 xl:grid-cols-4">
          {icons.map(({ name, icon: Icon, usage }) => (
            <div
              key={name}
              className="flex items-center gap-3 bg-card px-4 py-3"
            >
              <Icon className="size-4 shrink-0 text-foreground" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-xs">{name}</span>
                <span className="truncate text-xs text-subtle">{usage}</span>
              </div>
            </div>
          ))}
        </div>
      </Specimen>
    </Section>
  );
}

export { ColorsSection, TypographySection, ShapeSection, IconsSection };
