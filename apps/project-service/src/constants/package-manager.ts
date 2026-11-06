import type { PackageManager } from "@repo/db";

export { packageManagers, type PackageManager } from "@repo/db";

export const DEFAULT_PACKAGE_MANAGER: PackageManager = "npm";

export const PACKAGE_MANAGER_PRESETS: Record<
  PackageManager,
  { install: string; build: string }
> = {
  npm: { install: "npm install", build: "npm run build" },
  pnpm: { install: "pnpm install", build: "pnpm run build" },
  yarn: { install: "yarn install", build: "yarn build" },
  bun: { install: "bun install", build: "bun run build" },
};

export const PACKAGE_MANAGER_BINARIES: Record<
  PackageManager,
  readonly string[]
> = {
  npm: ["npm", "npx"],
  pnpm: ["pnpm", "pnpx"],
  yarn: ["yarn"],
  bun: ["bun", "bunx"],
};

export const commandUsesPackageManager = (
  command: string,
  packageManager: PackageManager,
): boolean => {
  const binary = command.trim().split(/\s+/)[0]?.toLowerCase();

  return (
    binary !== undefined &&
    PACKAGE_MANAGER_BINARIES[packageManager].includes(binary)
  );
};
