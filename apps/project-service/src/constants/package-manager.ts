import type { PackageManager } from "@repo/db";

export { packageManagers, type PackageManager } from "@repo/db";

export const DEFAULT_PACKAGE_MANAGER: PackageManager = "npm";

/**
 * Default install and build commands for each supported package manager. Used
 * to fill in the commands when a project does not override them.
 */
export const PACKAGE_MANAGER_PRESETS: Record<
  PackageManager,
  { install: string; build: string }
> = {
  npm: { install: "npm install", build: "npm run build" },
  pnpm: { install: "pnpm install", build: "pnpm run build" },
  yarn: { install: "yarn install", build: "yarn build" },
  bun: { install: "bun install", build: "bun run build" },
};

/**
 * Leading binaries a custom install or build command is allowed to invoke for a
 * given package manager. This is what enforces "only these runtimes": a command
 * whose first token is not one of these is rejected.
 */
export const PACKAGE_MANAGER_BINARIES: Record<
  PackageManager,
  readonly string[]
> = {
  npm: ["npm", "npx"],
  pnpm: ["pnpm", "pnpx"],
  yarn: ["yarn"],
  bun: ["bun", "bunx"],
};

/**
 * Returns true when `command` invokes the given package manager, i.e. its first
 * whitespace-separated token is one of that package manager's allowed binaries.
 */
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
