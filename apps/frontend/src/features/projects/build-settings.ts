import type { PackageManager, Runtime } from "@/features/deployments/types";

export const packageManagers: readonly PackageManager[] = [
  "npm",
  "pnpm",
  "yarn",
  "bun",
];

export const runtimes: readonly Runtime[] = ["node", "bun"];

export const packageManagerLabels: Record<PackageManager, string> = {
  npm: "npm",
  pnpm: "pnpm",
  yarn: "Yarn",
  bun: "Bun",
};

export const runtimeLabels: Record<Runtime, string> = {
  node: "Node.js",
  bun: "Bun",
};

const INSTALL_COMMANDS: Record<PackageManager, string> = {
  npm: "npm install",
  pnpm: "pnpm install",
  yarn: "yarn install",
  bun: "bun install",
};

const BUILD_COMMANDS: Record<PackageManager, string> = {
  npm: "npm run build",
  pnpm: "pnpm run build",
  yarn: "yarn build",
  bun: "bun run build",
};

const PACKAGE_MANAGER_BINARIES: Record<PackageManager, readonly string[]> = {
  npm: ["npm", "npx"],
  pnpm: ["pnpm", "pnpx"],
  yarn: ["yarn"],
  bun: ["bun", "bunx"],
};

const RUNTIME_BINARIES: Record<Runtime, readonly string[]> = {
  node: ["node", "npm", "npx", "pnpm", "pnpx", "yarn"],
  bun: ["bun", "bunx"],
};

export const defaultRuntimeFor = (packageManager: PackageManager): Runtime =>
  packageManager === "bun" ? "bun" : "node";

export const defaultInstallCommand = (packageManager: PackageManager) =>
  INSTALL_COMMANDS[packageManager];

export const defaultBuildCommand = (
  packageManager: PackageManager,
  runtime: Runtime = defaultRuntimeFor(packageManager),
) => {
  if (runtime === "bun") {
    return BUILD_COMMANDS.bun;
  }

  return packageManager === "bun"
    ? BUILD_COMMANDS.npm
    : BUILD_COMMANDS[packageManager];
};

const firstBinary = (command: string) =>
  command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";

export const installCommandMatches = (
  command: string,
  packageManager: PackageManager,
) => PACKAGE_MANAGER_BINARIES[packageManager].includes(firstBinary(command));

export const buildCommandMatches = (command: string, runtime: Runtime) =>
  RUNTIME_BINARIES[runtime].includes(firstBinary(command));

export const installCommandHint = (packageManager: PackageManager) =>
  `Must start with ${PACKAGE_MANAGER_BINARIES[packageManager]
    .map((binary) => `“${binary}”`)
    .join(" or ")}`;

export const buildCommandHint = (runtime: Runtime) =>
  runtime === "bun"
    ? "Must start with “bun” or “bunx”"
    : "Must run on Node.js (npm, npx, pnpm, pnpx, yarn or node)";

const RELATIVE_PATH_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$)).+$/;

export const isRelativePath = (value: string) =>
  RELATIVE_PATH_PATTERN.test(value.trim());

export const BRANCH_PATTERN = /^[A-Za-z0-9._/-]+$/;
