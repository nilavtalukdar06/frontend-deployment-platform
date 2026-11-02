import type { Request } from "express";

export interface PublicRoute {
  method: string;
  path: string;
}

export const publicRoutes: readonly PublicRoute[] = [
  { method: "POST", path: "/auth/register" },
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/auth/refresh" },
  { method: "POST", path: "/auth/logout" },
];

const normalizePath = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, "").toLowerCase() : path;

export const isPublicRoute = (req: Request): boolean => {
  const path = normalizePath(`${req.baseUrl}${req.path}`);
  return publicRoutes.some(
    (route) => route.method === req.method && route.path === path,
  );
};
