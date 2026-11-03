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

export const RESERVED_ENVIRONMENT_VARIABLE_KEYS = [
  "PATH",
  "HOME",
  "CI",
  "COREPACK_ENABLE_DOWNLOAD_PROMPT",
] as const;
export const MAX_ENVIRONMENT_VARIABLES = 64;
export const MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH = 128;
export const MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH = 4096;

const environmentVariableKey = z
  .string()
  .min(1)
  .max(MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, {
    message:
      "Must start with a letter or underscore and contain only letters, digits and underscores",
  })
  .refine(
    (value) =>
      !(RESERVED_ENVIRONMENT_VARIABLE_KEYS as readonly string[]).includes(
        value,
      ),
    { message: "This key is reserved by the build environment" },
  );
const environmentVariableValue = z
  .string()
  .max(MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH);

const environmentVariableParams = z
  .object({ id: z.uuid(), key: environmentVariableKey })
  .strict();

export abstract class ProjectValidator {
  static readonly create = {
    body: z
      .object({
        repositoryId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        installCommand: command.optional(),
        buildCommand: command.optional(),
        environmentVariables: z
          .array(
            z
              .object({
                key: environmentVariableKey,
                value: environmentVariableValue,
              })
              .strict(),
          )
          .max(MAX_ENVIRONMENT_VARIABLES)
          .refine(
            (items) =>
              new Set(items.map((item) => item.key)).size === items.length,
            { message: "Environment variable keys must be unique" },
          )
          .optional(),
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

  static readonly listEnvironmentVariables = {
    params: projectId,
  };

  static readonly setEnvironmentVariable = {
    params: environmentVariableParams,
    body: z.object({ value: environmentVariableValue }).strict(),
  };

  static readonly deleteEnvironmentVariable = {
    params: environmentVariableParams,
  };
}
