import {
  Ban,
  ChartColumn,
  ChevronDown,
  CircleAlert,
  Eye,
  GitBranch,
  LayoutGrid,
  LayoutList,
  Lock,
  Minus,
  Pointer,
  Plus,
  RotateCw,
  Rocket,
  Search,
  Table2,
  Upload,
  Zap,
  ZapOff,
  ArrowUpRight,
  Ellipsis,
  GitCommitVertical,
  TriangleAlert,
  Info,
} from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import { StatusDot, StatusLabel } from "@/components/deploy/status-dot";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Section, Specimen } from "@/pages/theme/sections/section";

function ButtonsSection() {
  return (
    <Section
      id="buttons"
      title="Buttons"
      description="A light primary button on the dark canvas, outlined secondary buttons and a tinted destructive button."
    >
      <Specimen
        label="Variants"
        className="flex-row flex-wrap items-center gap-4"
      >
        <Button>
          <Plus />
          Add new
        </Button>
        <Button variant="outline">
          <RotateCw />
          Redeploy
        </Button>
        <Button variant="secondary">Discard</Button>
        <Button variant="ghost">Edit</Button>
        <Button variant="destructive">
          <Ban />
          Cancel deployment
        </Button>
        <Button variant="link">View build</Button>
      </Specimen>
      <Specimen label="Sizes" className="flex-row flex-wrap items-center gap-4">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default 34</Button>
        <Button size="lg">Large 40</Button>
        <Button size="xl">
          <GithubIcon />
          Continue with GitHub
        </Button>
      </Specimen>
      <Specimen
        label="With icons"
        className="flex-row flex-wrap items-center gap-4"
      >
        <Button>
          <ArrowUpRight />
          Visit
        </Button>
        <Button variant="outline">
          <GithubIcon />
          Reinstall webhook
        </Button>
        <Button variant="outline">Import .env</Button>
        <Button variant="outline">
          <Plus />
          Add more
        </Button>
        <Button>Import</Button>
        <Button variant="secondary">Save</Button>
      </Specimen>
      <Specimen
        label="Icon buttons"
        className="flex-row flex-wrap items-center gap-4"
      >
        <Button variant="outline" size="icon">
          <GithubIcon />
        </Button>
        <Button variant="outline" size="icon">
          <Minus />
        </Button>
        <Button variant="ghost" size="icon">
          <Ellipsis />
        </Button>
        <Button variant="outline" size="icon" className="rounded-full">
          <Ellipsis />
        </Button>
        <Button variant="outline" size="icon-lg">
          <Eye />
        </Button>
      </Specimen>
      <Specimen
        label="States"
        className="flex-row flex-wrap items-center gap-4"
      >
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled outline
        </Button>
        <Button variant="destructive" disabled>
          Disabled destructive
        </Button>
      </Specimen>
    </Section>
  );
}

function FormControlsSection() {
  return (
    <Section
      id="forms"
      title="Form controls"
      description="Inputs, textareas, switches, selectable fields and the grouped controls used in the import and settings forms."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Specimen label="Text input states">
          <div className="flex flex-col gap-2">
            <Label>Project name</Label>
            <Input defaultValue="dor-check" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Focused</Label>
            <Input
              defaultValue="npm run build:prod"
              className="border-ring font-mono text-code"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Invalid</Label>
            <Input
              defaultValue=""
              placeholder="2FA_SECRET"
              aria-invalid
              className="font-mono text-code"
            />
            <span className="text-label text-destructive">
              Letters, digits and underscores only; can’t start with a digit
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Project URL (read-only)</Label>
            <Input
              readOnly
              disabled
              defaultValue="https://brave-falcon.deploy.app"
              className="font-mono text-code"
            />
          </div>
        </Specimen>
        <Specimen label="Search, textarea and fields">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
            <Input placeholder="Search projects…" className="h-10.5 pl-10" />
          </div>
          <div className="flex h-9 items-center gap-2.5 rounded-md border border-border-strong bg-card px-3 text-sm text-subtle">
            <Search className="size-4" />
            <span className="flex-1">Find project…</span>
            <Kbd>F</Kbd>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Textarea defaultValue="Scam and trap detector with evidence-backed verdicts" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Owner</Label>
            <div className="flex h-10 items-center gap-3 rounded-md border border-input bg-card px-3 text-sm">
              <Avatar className="size-5">
                <AvatarFallback className="text-[10px]">N</AvatarFallback>
              </Avatar>
              <span className="flex-1">nilavtalukdar06</span>
              <Badge variant="outline">Hobby</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Application preset</Label>
            <div className="flex h-10 items-center gap-3 rounded-md border border-input bg-card px-3 text-sm">
              <Zap className="size-4 text-brand" />
              <span className="flex-1">Vite</span>
              <Lock className="size-4 text-subtle" />
            </div>
          </div>
        </Specimen>
      </div>

      <Specimen label="Switch">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3 text-sm">
            <Switch />
            <span className="text-muted-foreground">Off</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Switch defaultChecked />
            <span className="text-muted-foreground">On</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Switch disabled />
            <span className="text-muted-foreground">Disabled</span>
          </div>
        </div>
      </Specimen>

      <Specimen label="Input with override switch">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Install command</Label>
            <div className="flex h-10 items-center rounded-md border border-input bg-card pr-3 pl-3">
              <span className="flex-1 font-mono text-code text-subtle">
                npm install
              </span>
              <Switch />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Build command</Label>
            <div className="flex h-10 items-center rounded-md border border-ring bg-card pr-3 pl-3">
              <span className="flex-1 font-mono text-code">pnpm run build</span>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen label="Environment variable rows">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-[1fr_1fr_40px] gap-3">
            <Label>Key</Label>
            <Label>Value</Label>
            <span />
            <Input
              defaultValue="VITE_API_URL"
              className="font-mono text-code"
            />
            <div className="relative">
              <Input
                defaultValue="••••••••••••••••"
                className="pr-10 font-mono text-code"
              />
              <Eye className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle" />
            </div>
            <Button variant="outline" size="icon-lg">
              <Minus />
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-subtle">
              <Button variant="outline">Import .env</Button>
              <span>or paste the .env contents into a Key field</span>
            </div>
            <Button variant="outline">
              <Plus />
              Add more
            </Button>
          </div>
        </div>
      </Specimen>

      <Specimen label="Grouped toggles">
        <div className="flex flex-wrap items-center gap-6">
          <div className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-card p-0.5">
            <span className="flex size-8 items-center justify-center rounded-sm bg-accent text-foreground">
              <LayoutGrid className="size-4" />
            </span>
            <span className="flex size-8 items-center justify-center rounded-sm text-subtle">
              <LayoutList className="size-4" />
            </span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-md border border-border-strong bg-card p-0.5 text-label">
            <span className="flex h-7 items-center gap-1.5 rounded-sm bg-accent px-3 text-foreground">
              <ChartColumn className="size-3.5" />
              Chart
            </span>
            <span className="flex h-7 items-center gap-1.5 rounded-sm px-3 text-subtle">
              <Table2 className="size-3.5" />
              Table
            </span>
          </div>
          <Button variant="outline" size="sm">
            Last 24 hours
          </Button>
        </div>
      </Specimen>

      <Specimen label="Form footer">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-1.5 p-6">
            <h3 className="text-xl font-medium tracking-tight">General</h3>
            <p className="text-sm text-muted-foreground">
              The project name is unique among your projects. The slug and URL
              never change.
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border bg-muted px-6 py-3">
            <span className="text-sm text-subtle">
              Name: up to 100 characters. Description: up to 500.
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="bg-card">
                Discard
              </Button>
              <Button disabled>Save</Button>
            </div>
          </div>
        </div>
      </Specimen>

      <Specimen label="Collapsible section header">
        <div className="overflow-hidden rounded-lg border border-border-strong bg-card">
          <div className="flex h-12.5 items-center gap-3 border-b border-border px-5 text-title font-medium">
            <ChevronDown className="size-4 text-muted-foreground" />
            Build and output settings
          </div>
          <div className="p-5 text-sm text-muted-foreground">
            Section content sits on the card surface.
          </div>
        </div>
      </Specimen>

      <Specimen label="Loading skeletons">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Specimen>
    </Section>
  );
}

function BadgesSection() {
  return (
    <Section
      id="badges"
      title="Badges and status"
      description="Pill badges, deployment statuses, metadata chips and trigger labels."
    >
      <Specimen label="Deployment status" className="flex-row flex-wrap gap-8">
        <StatusLabel status="ready" duration="2m 14s" />
        <StatusLabel status="building" duration="0m 41s" />
        <StatusLabel status="failed" duration="1m 08s" />
        <StatusLabel status="canceled" duration="0m 06s" />
      </Specimen>
      <Specimen label="Status dots" className="flex-row items-center gap-6">
        <StatusDot status="ready" />
        <StatusDot status="building" />
        <StatusDot status="failed" />
        <StatusDot status="canceled" />
      </Specimen>
      <Specimen
        label="Badges"
        className="flex-row flex-wrap items-center gap-3"
      >
        <Badge variant="success" className="px-3">
          Auto-deploy on
        </Badge>
        <Badge variant="current">
          <Rocket />
          Current
        </Badge>
        <Badge variant="outline">Hobby</Badge>
        <Badge variant="warning">Building</Badge>
        <Badge variant="destructive">Failed</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="muted">Muted</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge>Default</Badge>
      </Specimen>
      <Specimen label="Repository pill and meta" className="gap-5">
        <span className="inline-flex h-6 w-fit items-center gap-2 rounded-full border border-border bg-muted px-2.5 text-code text-muted-foreground">
          <GithubIcon className="size-3.5" />
          nilavtalukdar06/dor-check
        </span>
        <div className="flex flex-wrap items-center gap-6 text-label text-muted-foreground">
          <span className="inline-flex items-center gap-2 font-mono">
            <GitBranch className="size-3.5 text-subtle" />
            main
          </span>
          <span className="inline-flex items-center gap-2 font-mono">
            <GitCommitVertical className="size-3.5 text-subtle" />
            455e3f3
          </span>
          <span className="inline-flex items-center gap-2 font-mono">
            <GitBranch className="size-3.5 text-subtle" />
            main · 9f8e7d6
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-subtle" />
            Private
          </span>
          <span className="inline-flex items-center gap-1.5 text-success">
            <Zap className="size-3.5" />
            Deploys on push
          </span>
          <span className="inline-flex items-center gap-1.5 text-warning">
            <ZapOff className="size-3.5" />
            Auto-deploy off
          </span>
        </div>
      </Specimen>
      <Specimen
        label="Deployment triggers"
        className="flex-row flex-wrap gap-8"
      >
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <GitCommitVertical className="size-4" />
          Git push
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Pointer className="size-4" />
          Redeploy
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Upload className="size-4" />
          Initial import
        </span>
      </Specimen>
      <Specimen
        label="Avatars"
        className="flex-row flex-wrap items-center gap-4"
      >
        <Avatar className="size-5">
          <AvatarFallback className="text-[10px]">N</AvatarFallback>
        </Avatar>
        <Avatar className="size-5.5">
          <AvatarFallback className="text-[10px]">N</AvatarFallback>
        </Avatar>
        <Avatar className="size-7">
          <AvatarFallback>N</AvatarFallback>
        </Avatar>
        <Avatar className="size-7.5">
          <AvatarFallback />
        </Avatar>
        <span className="size-7.5 rounded-full bg-[#16a34a]" />
      </Specimen>
    </Section>
  );
}

function AlertsSection() {
  return (
    <Section
      id="alerts"
      title="Alerts and banners"
      description="Inline feedback surfaces: sign-in errors, build state strips, redeploy notices and tips."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>
            The sign-in attempt expired or was opened in another browser. Try
            again.
          </AlertDescription>
        </Alert>
        <Alert variant="info" className="items-center pr-40">
          <Info />
          <AlertDescription>
            Redeploy to apply your environment variable changes to production.
          </AlertDescription>
          <AlertAction className="top-1/2 -translate-y-1/2">
            <Button variant="outline" size="sm">
              <RotateCw />
              Redeploy
            </Button>
          </AlertAction>
        </Alert>
        <Alert variant="warning">
          <TriangleAlert />
          <AlertTitle>Build is slower than usual</AlertTitle>
          <AlertDescription>
            Some chunks are larger than 500 kB after minification.
          </AlertDescription>
        </Alert>
        <Alert variant="success">
          <Zap />
          <AlertTitle>Auto-deploy is on</AlertTitle>
          <AlertDescription>
            Every push to main creates a production deployment.
          </AlertDescription>
        </Alert>
        <Alert>
          <Info />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>
            Default alerts use the card surface and a regular border.
          </AlertDescription>
        </Alert>
      </div>
      <Specimen label="Building strip">
        <div className="flex h-10.25 items-center justify-between overflow-hidden rounded-lg border-y border-border bg-warning-surface px-5 text-sm text-warning">
          <span className="flex items-center gap-3">
            <span className="size-3.5 animate-spin rounded-full border-2 border-warning border-t-transparent" />
            <span>
              A new deployment is <b className="font-medium">building</b>
              <span className="ml-2 font-mono text-code">· 9f8e7d6</span>
            </span>
          </span>
          <span className="flex items-center gap-1 text-warning/80">
            View build
            <ChevronDown className="size-4 -rotate-90" />
          </span>
        </div>
      </Specimen>
      <Specimen label="Tip strip">
        <div className="flex h-14 items-center gap-3 rounded-lg border border-border bg-card px-5 text-sm text-muted-foreground">
          <Zap className="size-4 text-success" />
          <span>
            To update your production deployment, push to the{" "}
            <code className="font-mono text-code text-foreground">main</code>{" "}
            branch.
          </span>
        </div>
      </Specimen>
    </Section>
  );
}

export { ButtonsSection, FormControlsSection, BadgesSection, AlertsSection };
