import { z } from "zod";
import type { GithubRepositoryRef } from "../services/github.service";

const GITHUB_PATH_PATTERN =
  /^\/(?<owner>[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/(?<name>[A-Za-z0-9._-]{1,100}?)(?:\.git)?\/?$/;

const gitUrl = z
  .string()
  .trim()
  .max(2048)
  .pipe(z.url({ protocol: /^https$/, hostname: /^(www\.)?github\.com$/ }))
  .transform((value, ctx): GithubRepositoryRef => {
    const url = new URL(value);
    const match = GITHUB_PATH_PATTERN.exec(url.pathname);
    const owner = match?.groups?.["owner"];
    const name = match?.groups?.["name"];

    if (
      !owner ||
      !name ||
      /^\.+$/.test(name) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      ctx.issues.push({
        code: "custom",
        message: "Expected a URL like https://github.com/<owner>/<repository>",
        input: value,
      });
      return z.NEVER;
    }

    return { owner, name };
  });

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(500);
const branch = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z0-9._/-]+$/);
const relativeDirectory = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .refine(
    (value) => !value.startsWith("/") && !value.split("/").includes(".."),
  );
const command = z.string().trim().min(1).max(500);

const projectId = z.object({ id: z.uuid() }).strict();

export abstract class ProjectValidator {
  static readonly create = {
    body: z.object({ gitUrl }).strict(),
  };

  static readonly list = {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  };

  static readonly get = {
    params: projectId,
  };

  static readonly update = {
    params: projectId,
    body: z
      .object({
        name: name.optional(),
        description: description.nullable().optional(),
        branch: branch.optional(),
        rootDirectory: relativeDirectory.optional(),
        installCommand: command.optional(),
        buildCommand: command.optional(),
        outputDirectory: relativeDirectory.optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field must be provided",
      }),
  };

  static readonly remove = {
    params: projectId,
  };
}
