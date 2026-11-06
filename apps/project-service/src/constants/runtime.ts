import {
  PACKAGE_MANAGER_PRESETS,
  type PackageManager,
} from "./package-manager";
import type { Runtime } from "@repo/db";

export { runtimes, type Runtime } from "@repo/db";

export const RUNTIME_BUILD_BINARIES: Record<Runtime, readonly string[]> = {
  node: ["node", "npm", "npx", "pnpm", "pnpx", "yarn"],
  bun: ["bun", "bunx"],
};

export const defaultRuntimeFor = (packageManager: PackageManager): Runtime =>
  packageManager === "bun" ? "bun" : "node";

export const defaultBuildCommand = (
  packageManager: PackageManager,
  runtime: Runtime,
): string => {
  if (runtime === "bun") {
    return "bun run build";
  }

  return packageManager === "bun"
    ? PACKAGE_MANAGER_PRESETS.npm.build
    : PACKAGE_MANAGER_PRESETS[packageManager].build;
};

export const commandUsesRuntime = (
  command: string,
  runtime: Runtime,
): boolean => {
  const binary = command.trim().split(/\s+/)[0]?.toLowerCase();

  return (
    binary !== undefined && RUNTIME_BUILD_BINARIES[runtime].includes(binary)
  );
};
