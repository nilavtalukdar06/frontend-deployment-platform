import { pipeline } from "node:stream/promises";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { DeploymentResolverService } from "../services/deployment-resolver.service";
import { SiteService, toRelativePath } from "../services/site.service";

const siteLabelFor = (hostname: string): string | null => {
  const host = hostname.toLowerCase();
  const suffix = `.${env.ROOT_DOMAIN}`;

  if (!host.endsWith(suffix)) {
    return null;
  }

  const label = host.slice(0, -suffix.length);

  return label && !label.includes(".") ? label : null;
};

const sendText = (res: Response, statusCode: number, message: string) => {
  res
    .status(statusCode)
    .set("Cache-Control", "no-store")
    .type("text/plain; charset=utf-8")
    .send(message);
};

export const siteHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const label = siteLabelFor(req.hostname);

  if (!label) {
    next();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.set("Allow", "GET, HEAD");
    sendText(res, StatusCodes.METHOD_NOT_ALLOWED, "Method Not Allowed");
    return;
  }

  try {
    const deploymentId = await DeploymentResolverService.resolve(label);

    if (!deploymentId) {
      sendText(res, StatusCodes.NOT_FOUND, "Deployment not found");
      return;
    }

    const relativePath = toRelativePath(req.path);

    if (!relativePath) {
      sendText(res, StatusCodes.BAD_REQUEST, "Bad Request");
      return;
    }

    const file = await SiteService.getFile({
      deploymentId,
      relativePath,
      ifNoneMatch: req.get("if-none-match"),
    });

    if (!file) {
      sendText(res, StatusCodes.NOT_FOUND, "File not found");
      return;
    }

    if (file.notModified) {
      res.status(StatusCodes.NOT_MODIFIED).end();
      return;
    }

    res.status(StatusCodes.OK);
    res.set({
      "Content-Type": file.contentType ?? "application/octet-stream",
      "Cache-Control": SiteService.cacheControlFor(file.relativePath),
      "X-Content-Type-Options": "nosniff",
      "X-Deployment-Id": deploymentId,
    });
    if (file.contentLength !== undefined) {
      res.set("Content-Length", String(file.contentLength));
    }
    if (file.etag) {
      res.set("ETag", file.etag);
    }
    if (file.lastModified) {
      res.set("Last-Modified", file.lastModified.toUTCString());
    }

    if (req.method === "HEAD") {
      file.body.destroy();
      res.end();
      return;
    }

    await pipeline(file.body, res);
  } catch (err) {
    if (res.headersSent) {
      req.log.warn({ err }, "site response stream aborted");
      res.destroy();
      return;
    }
    next(err);
  }
};
