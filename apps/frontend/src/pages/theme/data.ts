type DeploymentStatus = "ready" | "building" | "failed" | "canceled";

type Swatch = {
  name: string;
  token: string;
  hex: string;
  usage: string;
};

type SwatchGroup = {
  title: string;
  swatches: Swatch[];
};

export const swatchGroups: SwatchGroup[] = [
  {
    title: "Surfaces",
    swatches: [
      {
        name: "Background",
        token: "background",
        hex: "#000000",
        usage: "Page, sidebar, header",
      },
      {
        name: "Card",
        token: "card",
        hex: "#0a0a0a",
        usage: "Cards, inputs, popovers",
      },
      {
        name: "Muted",
        token: "muted",
        hex: "#111111",
        usage: "Pills, form footers, tooltips",
      },
      {
        name: "Surface",
        token: "surface",
        hex: "#151515",
        usage: "Import source box",
      },
      {
        name: "Accent",
        token: "accent",
        hex: "#1a1a1a",
        usage: "Active nav item, hover, toggles",
      },
    ],
  },
  {
    title: "Borders",
    swatches: [
      {
        name: "Border",
        token: "border",
        hex: "#1f1f1f",
        usage: "Cards, dividers, table rows",
      },
      {
        name: "Border strong",
        token: "border-strong",
        hex: "#2e2e2e",
        usage: "Inputs, buttons, icon tiles",
      },
      {
        name: "Ring",
        token: "ring",
        hex: "#555555",
        usage: "Focused input border",
      },
    ],
  },
  {
    title: "Text",
    swatches: [
      {
        name: "Foreground",
        token: "foreground",
        hex: "#ededed",
        usage: "Headings, values, primary fill",
      },
      {
        name: "Log",
        token: "log",
        hex: "#d4d4d4",
        usage: "Build log lines",
      },
      {
        name: "Muted foreground",
        token: "muted-foreground",
        hex: "#a1a1a1",
        usage: "Descriptions, labels",
      },
      {
        name: "Subtle",
        token: "subtle",
        hex: "#707070",
        usage: "Placeholders, timestamps, hints",
      },
    ],
  },
  {
    title: "Status",
    swatches: [
      {
        name: "Success",
        token: "success",
        hex: "#45dec5",
        usage: "Ready, auto-deploy, done",
      },
      {
        name: "Warning",
        token: "warning",
        hex: "#f5a623",
        usage: "Building, warnings",
      },
      {
        name: "Destructive",
        token: "destructive",
        hex: "#ff5b4f",
        usage: "Failed, errors, cancel",
      },
      {
        name: "Neutral status",
        token: "neutral-status",
        hex: "#8f8f8f",
        usage: "Canceled",
      },
    ],
  },
  {
    title: "Status tints",
    swatches: [
      {
        name: "Success surface",
        token: "success-surface",
        hex: "#0a2420",
        usage: "Auto-deploy badge",
      },
      {
        name: "Success border",
        token: "success-border",
        hex: "#174a43",
        usage: "Auto-deploy badge",
      },
      {
        name: "Warning surface",
        token: "warning-surface",
        hex: "#1a1306",
        usage: "Building banner",
      },
      {
        name: "Warning subtle",
        token: "warning-subtle",
        hex: "#0c0802",
        usage: "Warning log line",
      },
      {
        name: "Destructive surface",
        token: "destructive-surface",
        hex: "#1a0808",
        usage: "Error alert",
      },
      {
        name: "Destructive solid",
        token: "destructive-solid",
        hex: "#2a0b0b",
        usage: "Cancel deployment button",
      },
      {
        name: "Destructive border",
        token: "destructive-border",
        hex: "#5c1a17",
        usage: "Error alert, cancel button",
      },
      {
        name: "Destructive foreground",
        token: "destructive-foreground",
        hex: "#ffb4ae",
        usage: "Error alert text",
      },
      {
        name: "Info surface",
        token: "info-surface",
        hex: "#0d1d35",
        usage: "Redeploy notice",
      },
      {
        name: "Info border",
        token: "info-border",
        hex: "#1d3f73",
        usage: "Redeploy notice",
      },
      {
        name: "Info",
        token: "info",
        hex: "#a9caff",
        usage: "Redeploy notice text",
      },
      {
        name: "Info solid",
        token: "info-solid",
        hex: "#0a6cf0",
        usage: "Current badge",
      },
      {
        name: "Blue",
        token: "blue",
        hex: "#3b82f6",
        usage: "Switch on",
      },
    ],
  },
  {
    title: "Brand and identity",
    swatches: [
      {
        name: "Brand",
        token: "brand",
        hex: "#a78bfa",
        usage: "Vite / project bolt icon",
      },
      {
        name: "Avatar",
        token: "avatar",
        hex: "#7c3aed",
        usage: "User avatars",
      },
    ],
  },
  {
    title: "Charts",
    swatches: [
      {
        name: "Chart 1",
        token: "chart-1",
        hex: "#3987e5",
        usage: "Primary series",
      },
      { name: "Chart 2", token: "chart-2", hex: "#d95926", usage: "Series 2" },
      { name: "Chart 3", token: "chart-3", hex: "#199e70", usage: "Series 3" },
      { name: "Chart 4", token: "chart-4", hex: "#c98500", usage: "Series 4" },
      { name: "Chart 5", token: "chart-5", hex: "#d55181", usage: "Series 5" },
      { name: "Chart 6", token: "chart-6", hex: "#5e5e5e", usage: "Other" },
      {
        name: "Chart muted",
        token: "chart-muted",
        hex: "#1f426c",
        usage: "Inactive bars",
      },
    ],
  },
];

export const typeScale = [
  {
    name: "Hero",
    spec: "32 / 500 · text-hero",
    className: "text-hero font-medium",
    sample: "Let’s build something new",
  },
  {
    name: "Auth and form title",
    spec: "28 / 500 · text-auth",
    className: "text-auth font-medium",
    sample: "Log in to Deploy",
  },
  {
    name: "Stat value large",
    spec: "30 / 500 · text-stat-lg",
    className: "text-stat-lg font-medium tracking-tight",
    sample: "8,214",
  },
  {
    name: "Stat value",
    spec: "26 / 500 · text-stat",
    className: "text-stat font-medium tracking-tight",
    sample: "8,214",
  },
  {
    name: "Page title",
    spec: "22.5 / 500 · text-heading",
    className: "text-heading font-medium",
    sample: "Deployments",
  },
  {
    name: "Card heading",
    spec: "20 / 500 · text-xl",
    className: "text-xl font-medium",
    sample: "Build and deployment",
  },
  {
    name: "Section title",
    spec: "15 / 500 · text-title",
    className: "text-title font-medium",
    sample: "Production deployment",
  },
  {
    name: "Body",
    spec: "14 / 400 · text-sm",
    className: "text-sm",
    sample: "Scam and trap detector with evidence-backed verdicts",
  },
  {
    name: "Body muted",
    spec: "14 / 400 · muted-foreground",
    className: "text-sm text-muted-foreground",
    sample: "Import a Git repository. Only Vite projects are listed.",
  },
  {
    name: "Label and meta",
    spec: "13 / 400 · text-label",
    className: "text-label text-muted-foreground",
    sample: "Install command",
  },
  {
    name: "Helper",
    spec: "13 / 400 · text-label · subtle",
    className: "text-label text-subtle",
    sample: "Paths are relative and can’t contain “..”.",
  },
  {
    name: "Caption",
    spec: "12 / 400 · text-xs · subtle",
    className: "text-xs text-subtle",
    sample: "All systems normal",
  },
  {
    name: "Badge",
    spec: "11.5–12 / 500 · text-2xs, text-xs",
    className: "text-2xs font-medium text-muted-foreground",
    sample: "Hobby",
  },
  {
    name: "Mono",
    spec: "12.5 / Geist Mono · text-code",
    className: "font-mono text-code",
    sample: "pnpm run build",
  },
  {
    name: "Mono id",
    spec: "14 / Geist Mono",
    className: "font-mono text-sm",
    sample: "8c2f6a9b2",
  },
  {
    name: "Mono hash",
    spec: "12.5 / Geist Mono · muted-foreground",
    className: "font-mono text-code text-muted-foreground",
    sample: "0192f5a4-8c2f-7d4b-ae3f-6a9b2c3d4e5f",
  },
];

export const radiusScale = [
  {
    name: "sm",
    value: "3px",
    className: "rounded-sm",
    usage: "Toggle thumb, kbd",
  },
  {
    name: "md",
    value: "6px",
    className: "rounded-md",
    usage: "Buttons, inputs, nav items",
  },
  {
    name: "lg",
    value: "6px",
    className: "rounded-lg",
    usage: "Alerts, banners, menus",
  },
  {
    name: "xl",
    value: "8px",
    className: "rounded-xl",
    usage: "Cards, panels",
  },
  { name: "2xl", value: "12px", className: "rounded-2xl", usage: "Logo tile" },
  {
    name: "full",
    value: "9999px",
    className: "rounded-full",
    usage: "Badges, pills, avatars, dots",
  },
];

export const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48];

export const layoutMetrics = [
  { name: "Sidebar width", value: "240px" },
  { name: "Header height", value: "56px + 1px border" },
  { name: "Page padding", value: "24px" },
  { name: "Card padding", value: "16px" },
  { name: "Card grid gap", value: "16px" },
  { name: "Button height", value: "32px (44px on auth)" },
  { name: "Input height", value: "36px" },
  { name: "Nav item height", value: "32px" },
  { name: "Log row height", value: "24px" },
  { name: "Icon size", value: "16px, 1.5px stroke" },
  { name: "Status dot", value: "8px" },
  { name: "Border width", value: "1px" },
];

export type DemoProject = {
  name: string;
  domain: string;
  description: string;
  status: DeploymentStatus;
  branch: string;
  commit: string;
  time: string;
  repo: string;
  isPrivate?: boolean;
  autoDeploy?: boolean;
};

export const demoProjects: DemoProject[] = [
  {
    name: "dor-check",
    domain: "brave-falcon.deploy.app",
    description: "Scam and trap detector with evidence-backed verdicts",
    status: "building",
    branch: "main",
    commit: "9f8e7d6",
    time: "just now",
    repo: "nilavtalukdar06/dor-check",
  },
  {
    name: "repo-ask",
    domain: "quiet-lynx.deploy.app",
    description: "Ask questions about any public GitHub repository",
    status: "ready",
    branch: "main",
    commit: "a41c0e2",
    time: "3h ago",
    repo: "nilavtalukdar06/repo-ask",
    isPrivate: true,
  },
  {
    name: "shear-studios-web",
    domain: "amber-maple.deploy.app",
    description: "Marketing site for Shear Studios",
    status: "ready",
    branch: "main",
    commit: "2b7f91c",
    time: "Aug 29",
    repo: "nilavtalukdar06/shear-studios-web",
    isPrivate: true,
    autoDeploy: false,
  },
  {
    name: "video-transcoder-ui",
    domain: "swift-orbit.deploy.app",
    description: "Upload and track transcoding jobs",
    status: "failed",
    branch: "dev",
    commit: "5c09ab3",
    time: "2d ago",
    repo: "nilavtalukdar06/video-transcoder-ui",
  },
  {
    name: "softcrop-it",
    domain: "rapid-cedar.deploy.app",
    description: "",
    status: "ready",
    branch: "main",
    commit: "e81d4a0",
    time: "Jul 13",
    repo: "nilavtalukdar06/softcrop-it",
  },
  {
    name: "cli-website-builder",
    domain: "lunar-delta.deploy.app",
    description: "Landing page for the CLI website builder",
    status: "canceled",
    branch: "main",
    commit: "77fa3d1",
    time: "Jun 25",
    repo: "nilavtalukdar06/cli-website-builder",
  },
];

export const demoRepositories = [
  {
    name: "final-year-project",
    meta: "21h ago",
    description: "Smart irrigation dashboard",
    imported: false,
    isPrivate: false,
  },
  {
    name: "test-deploy",
    meta: "2d ago",
    description: "",
    imported: false,
    isPrivate: true,
  },
  {
    name: "video-transcoder-ui",
    meta: "Nov 1",
    description: "Upload and track transcoding jobs",
    imported: true,
    isPrivate: false,
  },
  {
    name: "repo-chat",
    meta: "Oct 24",
    description: "Chat with your repositories",
    imported: false,
    isPrivate: false,
  },
  {
    name: "portfolio-v3",
    meta: "Oct 8",
    description: "Personal portfolio",
    imported: false,
    isPrivate: false,
  },
];

export type DemoDeployment = {
  id: string;
  trigger: "Git push" | "Redeploy" | "Initial import";
  status: DeploymentStatus;
  duration: string;
  error?: string;
  branch: string;
  commit: string;
  time: string;
  current?: boolean;
  menuOpen?: boolean;
};

export const demoDeployments: DemoDeployment[] = [
  {
    id: "8c2f6a9b2",
    trigger: "Git push",
    status: "building",
    duration: "0m 41s",
    branch: "main",
    commit: "9f8e7d6",
    time: "just now",
    menuOpen: true,
  },
  {
    id: "4b1a7c3e9",
    trigger: "Git push",
    status: "ready",
    duration: "2m 14s",
    branch: "main",
    commit: "455e3f3",
    time: "Oct 11",
    current: true,
  },
  {
    id: "d07e21f58",
    trigger: "Redeploy",
    status: "ready",
    duration: "2m 43s",
    branch: "main",
    commit: "455e3f3",
    time: "Oct 11",
  },
  {
    id: "91ac0b4d2",
    trigger: "Git push",
    status: "failed",
    duration: "1m 08s",
    error: '[build] Command "npm run build" exited with 1',
    branch: "main",
    commit: "c3d90af",
    time: "Oct 9",
  },
  {
    id: "6fe23a17c",
    trigger: "Git push",
    status: "canceled",
    duration: "0m 06s",
    branch: "main",
    commit: "18be5c2",
    time: "Oct 4",
  },
  {
    id: "0a92dd410",
    trigger: "Initial import",
    status: "ready",
    duration: "2m 19s",
    branch: "main",
    commit: "7e1f0c9",
    time: "Sep 21",
  },
];

export type LogLine = {
  time: string;
  message: string;
  level: "info" | "step" | "warn";
};

export const logLines: LogLine[] = [
  { time: "00:41:05.120", message: "▸ Initialize step started", level: "step" },
  {
    time: "00:41:05.134",
    message: "Starting deployment 0192f5a4-8c2f-7d4b-ae3f-6a9b2c3d4e5f",
    level: "info",
  },
  {
    time: "00:41:06.512",
    message: "▸ Status changed to cloning",
    level: "step",
  },
  {
    time: "00:41:06.870",
    message:
      "Cloning github.com/nilavtalukdar06/dor-check (Branch: main, Commit: 9f8e7d6)",
    level: "info",
  },
  {
    time: "00:41:07.284",
    message: "Cloning completed: 412.000ms",
    level: "info",
  },
  { time: "00:41:08.530", message: "▸ Install step started", level: "step" },
  { time: "00:41:08.531", message: 'Running "npm install"', level: "info" },
  {
    time: "00:41:09.902",
    message:
      "npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory.",
    level: "warn",
  },
  {
    time: "00:41:10.114",
    message:
      "npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported",
    level: "warn",
  },
  {
    time: "00:41:12.880",
    message: "added 312 packages, and audited 313 packages in 4s",
    level: "info",
  },
  { time: "00:41:12.902", message: "found 0 vulnerabilities", level: "info" },
  { time: "00:41:13.540", message: "▸ Build step started", level: "step" },
  { time: "00:41:13.541", message: 'Running "npm run build"', level: "info" },
  {
    time: "00:41:14.210",
    message: "vite v7.1.4 building for production...",
    level: "info",
  },
  {
    time: "00:41:16.877",
    message: "✓ 1846 modules transformed.",
    level: "info",
  },
  {
    time: "00:41:17.320",
    message: "dist/assets/index-BqHvNk2L.js 612.40 kB │ gzip: 189.77 kB",
    level: "info",
  },
  {
    time: "00:41:17.402",
    message: "(!) Some chunks are larger than 500 kB after minification.",
    level: "warn",
  },
];

export const hourlyViews = [
  135, 110, 85, 72, 60, 67, 90, 145, 232, 313, 367, 397, 420, 445, 470, 493,
  527, 570, 612, 552, 480, 385, 293, 207,
];

export const hourLabels = [
  "1 AM",
  "",
  "",
  "4 AM",
  "",
  "",
  "7 AM",
  "",
  "",
  "10 AM",
  "",
  "",
  "1 PM",
  "",
  "",
  "4 PM",
  "",
  "",
  "7 PM",
  "",
  "",
  "10 PM",
  "",
  "",
];

export const routeShares = [
  { route: "/", views: 2965, share: 36.1, color: "var(--chart-1)" },
  { route: "/investigate", views: 1675, share: 20.4, color: "var(--chart-2)" },
  { route: "/dashboard", views: 1150, share: 14, color: "var(--chart-3)" },
  { route: "/directory", views: 871, share: 10.6, color: "var(--chart-4)" },
  { route: "/evidence", views: 706, share: 8.6, color: "var(--chart-5)" },
  {
    route: "Other (4 routes)",
    views: 847,
    share: 10.3,
    color: "var(--chart-6)",
  },
];

export const miniBars = [
  14, 18, 12, 10, 8, 12, 22, 34, 50, 62, 70, 76, 82, 88, 94, 100, 108, 116, 122,
  108, 92, 70, 54, 38, 24, 16,
];
