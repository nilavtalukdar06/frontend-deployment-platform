import path from "node:path";

export const resolveInside = (
  baseDir: string,
  relativePath: string,
): string | undefined => {
  const resolved = path.resolve(baseDir, relativePath);
  const relative = path.relative(baseDir, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return undefined;
  }

  return resolved;
};
