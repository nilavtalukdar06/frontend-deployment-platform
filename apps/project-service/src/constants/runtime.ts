import {
  PACKAGE_MANAGER_PRESETS,
  type PackageManager,
} from "./package-manager";
import type { Runtime } from "@repo/db";

export { runtimes, type Runtime } from "@repo/db";

/**
 * Runtimes that execute a project's build. The package manager installs
 * dependencies; the runtime runs the build script. On the `node` runtime the
 * build is run through a Node-based package manager; on `bun` it is run by bun.
 */

/**
 * Leading binaries a build command is allowed to invoke for a given runtime.
 * On `node` this is any Node-based package-manager runner; on `bun` it is bun.
 */
export const RUNTIME_BUILD_BINARIES: Record<Runtime, readonly string[]> = {
  node: ["node", "npm", "npx", "pnpm", "pnpx", "yarn"],
  bun: ["bun", "bunx"],
};

/**
 * The runtime a project defaults to when none is given: bun projects run on the
 * bun runtime, everything else on Node.
 */
export const defaultRuntimeFor = (packageManager: PackageManager): Runtime =>
  packageManager === "bun" ? "bun" : "node";

/**
 * Default build command for a package manager / runtime pair. On the bun
 * runtime the build always runs with bun; on Node it runs through the package
 * manager (falling back to npm when the package manager is bun, since bun's own
 * runner is the bun runtime).
 */
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

/**
 * Returns true when `command` runs on the given runtime, i.e. its first
 * whitespace-separated token is one of that runtime's allowed build binaries.
 */
export const commandUsesRuntime = (
  command: string,
  runtime: Runtime,
): boolean => {
  const binary = command.trim().split(/\s+/)[0]?.toLowerCase();

  return (
    binary !== undefined && RUNTIME_BUILD_BINARIES[runtime].includes(binary)
  );
};
