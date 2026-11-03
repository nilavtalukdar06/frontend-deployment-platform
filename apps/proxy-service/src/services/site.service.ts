import path from "node:path";
import type { Readable } from "node:stream";
import { GetObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { env } from "../config/env";
import { s3 } from "../lib/s3";

export const outputKeyPrefix = (deploymentId: string): string =>
  `__outputs/${deploymentId}`;

const indexDocument = "index.html";

export type SiteObject =
  | { notModified: true }
  | {
      notModified: false;
      body: Readable;
      contentType?: string;
      contentLength?: number;
      etag?: string;
      lastModified?: Date;
      relativePath: string;
    };

export const toRelativePath = (urlPath: string): string | null => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const segments = decoded.split("/").filter(Boolean);

  if (
    segments.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        segment.includes("\\") ||
        segment.includes("\0"),
    )
  ) {
    return null;
  }

  const joined = segments.join("/");

  if (joined === "") {
    return indexDocument;
  }

  return decoded.endsWith("/") ? `${joined}/${indexDocument}` : joined;
};

const isNotModified = (err: unknown): boolean =>
  typeof err === "object" &&
  err !== null &&
  "$metadata" in err &&
  (err as { $metadata?: { httpStatusCode?: number } }).$metadata
    ?.httpStatusCode === 304;

const getObject = async (
  deploymentId: string,
  relativePath: string,
  ifNoneMatch: string | undefined,
): Promise<SiteObject | null> => {
  try {
    const object = await s3.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: `${outputKeyPrefix(deploymentId)}/${relativePath}`,
        IfNoneMatch: ifNoneMatch,
      }),
    );

    return {
      notModified: false,
      body: object.Body as Readable,
      contentType: object.ContentType,
      contentLength: object.ContentLength,
      etag: object.ETag,
      lastModified: object.LastModified,
      relativePath,
    };
  } catch (err) {
    if (err instanceof NoSuchKey) {
      return null;
    }
    if (isNotModified(err)) {
      return { notModified: true };
    }
    throw err;
  }
};

export abstract class SiteService {
  static async getFile(params: {
    deploymentId: string;
    relativePath: string;
    ifNoneMatch?: string;
  }): Promise<SiteObject | null> {
    const { deploymentId, relativePath, ifNoneMatch } = params;

    const file = await getObject(deploymentId, relativePath, ifNoneMatch);

    if (file || path.posix.extname(relativePath) !== "") {
      return file;
    }

    return getObject(deploymentId, indexDocument, ifNoneMatch);
  }

  static cacheControlFor(relativePath: string): string {
    if (relativePath.endsWith(".html")) {
      return "no-cache";
    }
    if (relativePath.startsWith("assets/")) {
      return "public, max-age=31536000, immutable";
    }
    return "public, max-age=0, must-revalidate";
  }
}
