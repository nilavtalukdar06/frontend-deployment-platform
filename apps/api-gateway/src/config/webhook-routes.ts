import type { Request } from "express";

export const WEBHOOK_PATH_PREFIX = "/webhooks";

export const isWebhookRoute = (req: Request): boolean =>
  req.path === WEBHOOK_PATH_PREFIX ||
  req.path.startsWith(`${WEBHOOK_PATH_PREFIX}/`);
