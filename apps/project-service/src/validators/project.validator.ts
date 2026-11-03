import { z } from "zod";

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
    body: z
      .object({
        repositoryId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
      })
      .strict(),
  };

  static readonly repositories = {
    query: z.object({
      page: z.coerce.number().int().min(1).max(100).default(1),
    }),
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
