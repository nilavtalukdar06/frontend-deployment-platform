import { posix } from "node:path";
import { DetectorFilesystem } from "@vercel/fs-detectors";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import type { GithubRepositoryRef } from "../services/github.service";
import {
  GITHUB_API_URL,
  GITHUB_RAW,
  githubFetch,
  githubUnavailableError,
} from "./github";
import { logger } from "./logger";

type DetectorFilesystemStat = Awaited<
  ReturnType<DetectorFilesystem["readdir"]>
>[number];

interface DirectoryEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

type DirectoryListings = Map<string, Promise<DirectoryEntry[] | undefined>>;

const MAX_FILE_BYTES = 1_048_576;

const MISSING_STATUSES: readonly number[] = [
  StatusCodes.NOT_FOUND,
  StatusCodes.MOVED_PERMANENTLY,
  StatusCodes.MOVED_TEMPORARILY,
];

const directoryResponseSchema = z.array(
  z.object({ name: z.string(), path: z.string(), type: z.string() }),
);

const encodePath = (path: string): string =>
  path.split("/").map(encodeURIComponent).join("/");

const normalizePath = (path: string): string => {
  const normalized = posix.normalize(path);
  return normalized === "." || normalized === "/"
    ? ""
    : normalized.replace(/^\/+|\/+$/g, "");
};

export class GithubFilesystem extends DetectorFilesystem {
  private readonly basePath: string;

  constructor(
    private readonly repository: GithubRepositoryRef,
    private readonly ref: string,
    private readonly accessToken: string,
    basePath = "",
    private readonly listings: DirectoryListings = new Map(),
  ) {
    super();
    this.basePath = normalizePath(basePath);
  }

  async exists(): Promise<boolean> {
    return (await this.listDirectory(this.basePath)) !== undefined;
  }

  protected async _hasPath(name: string): Promise<boolean> {
    return (await this.findEntry(name)) !== undefined;
  }

  protected async _isFile(name: string): Promise<boolean> {
    return (await this.findEntry(name))?.type === "file";
  }

  protected async _readdir(name: string): Promise<DetectorFilesystemStat[]> {
    const entries = (await this.listDirectory(this.resolve(name))) ?? [];

    return entries.map((entry) => ({
      name: entry.name,
      path: posix.relative(this.basePath, entry.path),
      type: entry.type,
    }));
  }

  protected async _readFile(name: string): Promise<Buffer> {
    const path = this.resolve(name);
    const response = await githubFetch(
      this.contentsUrl(path),
      this.accessToken,
      GITHUB_RAW,
    );

    if (MISSING_STATUSES.includes(response.status)) {
      throw new Error(`ENOENT: ${path}`);
    }

    if (!response.ok) {
      logger.error({ status: response.status }, "github file read failed");
      throw githubUnavailableError();
    }

    return GithubFilesystem.readLimited(response);
  }

  protected _chdir(name: string): DetectorFilesystem {
    return new GithubFilesystem(
      this.repository,
      this.ref,
      this.accessToken,
      this.resolve(name),
      this.listings,
    );
  }

  private contentsUrl(path: string): string {
    return `${GITHUB_API_URL}/repos/${encodeURIComponent(this.repository.owner)}/${encodeURIComponent(this.repository.name)}/contents${path ? `/${encodePath(path)}` : ""}?ref=${encodeURIComponent(this.ref)}`;
  }

  private resolve(name: string): string {
    const path = normalizePath(posix.join(this.basePath, name));

    if (path === ".." || path.startsWith("../")) {
      throw new Error(`path escapes the repository: ${name}`);
    }

    return path;
  }

  private async findEntry(name: string): Promise<DirectoryEntry | undefined> {
    const path = this.resolve(name);

    if (path === "") {
      return undefined;
    }

    const parent = posix.dirname(path);
    const entries = await this.listDirectory(parent === "." ? "" : parent);

    return entries?.find((entry) => entry.path === path);
  }

  private listDirectory(path: string): Promise<DirectoryEntry[] | undefined> {
    const cached = this.listings.get(path);

    if (cached) {
      return cached;
    }

    const pending = this.fetchDirectory(path);
    this.listings.set(path, pending);
    pending.catch(() => this.listings.delete(path));

    return pending;
  }

  private async fetchDirectory(
    path: string,
  ): Promise<DirectoryEntry[] | undefined> {
    const response = await githubFetch(
      this.contentsUrl(path),
      this.accessToken,
    );

    if (MISSING_STATUSES.includes(response.status)) {
      return undefined;
    }

    if (!response.ok) {
      logger.error(
        {
          status: response.status,
          rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
        },
        "github directory listing failed",
      );
      throw githubUnavailableError();
    }

    const parsed = directoryResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      return undefined;
    }

    return parsed.data.map((entry) => ({
      name: entry.name,
      path: entry.path,
      type: entry.type === "dir" ? "dir" : "file",
    }));
  }

  private static async readLimited(response: Response): Promise<Buffer> {
    const declaredLength = Number(response.headers.get("content-length"));

    if (declaredLength > MAX_FILE_BYTES || !response.body) {
      await response.body?.cancel();
      throw new Error("file is too large to inspect");
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    for await (const chunk of response.body) {
      received += chunk.byteLength;

      if (received > MAX_FILE_BYTES) {
        throw new Error("file is too large to inspect");
      }

      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
