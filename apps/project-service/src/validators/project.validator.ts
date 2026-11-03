import { z } from "zod";
import { projectFrameworks } from "../db/schema";

const name = z.string().trim().min(1).max(100);
const description = z.string().trim().max(500);
const repositoryUrl = z.url({ protocol: /^https$/ }).max(2048);
const branch = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z0-9._/-]+$/);
const framework = z.enum(projectFrameworks);
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
        name,
        description: description.optional(),
        repositoryUrl,
        branch: branch.optional(),
        framework: framework.optional(),
        rootDirectory: relativeDirectory.optional(),
        installCommand: command.optional(),
        buildCommand: command.optional(),
        outputDirectory: relativeDirectory.optional(),
      })
      .strict(),
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
        repositoryUrl: repositoryUrl.optional(),
        branch: branch.optional(),
        framework: framework.optional(),
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
