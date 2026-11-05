import { z } from "zod";
import {
  commandUsesPackageManager,
  type PackageManager,
  packageManagers,
  PACKAGE_MANAGER_BINARIES,
} from "../constants/package-manager";
import {
  commandUsesRuntime,
  defaultRuntimeFor,
  type Runtime,
  runtimes,
  RUNTIME_BUILD_BINARIES,
} from "../constants/runtime";

const packageManager = z.enum(packageManagers);
const runtime = z.enum(runtimes);

const installCommandMessage = (pm: PackageManager): string =>
  `Install command must be run with the "${pm}" package manager (one of: ${PACKAGE_MANAGER_BINARIES[
    pm
  ].join(", ")})`;

const buildCommandMessage = (rt: Runtime): string =>
  `Build command must run on the "${rt}" runtime (one of: ${RUNTIME_BUILD_BINARIES[
    rt
  ].join(", ")})`;

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
  "COREPACK_ENABLE_STRICT",
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

const deploymentParams = z
  .object({ id: z.uuid(), deploymentId: z.uuid() })
  .strict();

export abstract class ProjectValidator {
  static readonly create = {
    body: z
      .object({
        repositoryId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        packageManager: packageManager.default("npm"),
        runtime: runtime.optional(),
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
      .strict()
      .superRefine((value, ctx) => {
        if (
          value.installCommand !== undefined &&
          !commandUsesPackageManager(value.installCommand, value.packageManager)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["installCommand"],
            message: installCommandMessage(value.packageManager),
          });
        }

        const effectiveRuntime =
          value.runtime ?? defaultRuntimeFor(value.packageManager);

        if (
          value.buildCommand !== undefined &&
          !commandUsesRuntime(value.buildCommand, effectiveRuntime)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["buildCommand"],
            message: buildCommandMessage(effectiveRuntime),
          });
        }
      }),
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
      search: z
        .string()
        .trim()
        .max(100)
        .transform((value) => value || undefined)
        .optional(),
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
        packageManager: packageManager.optional(),
        runtime: runtime.optional(),
        installCommand: command.optional(),
        buildCommand: command.optional(),
        outputDirectory: relativeDirectory.optional(),
      })
      .strict()
      .refine((value) => Object.keys(value).length > 0, {
        message: "At least one field must be provided",
      })
      .superRefine((value, ctx) => {
        // Only the cases that are fully determined by this request are checked
        // here; when the package manager or runtime is omitted the service
        // validates the command against the project's stored value.
        if (
          value.packageManager !== undefined &&
          value.installCommand !== undefined &&
          !commandUsesPackageManager(value.installCommand, value.packageManager)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["installCommand"],
            message: installCommandMessage(value.packageManager),
          });
        }

        if (
          value.runtime !== undefined &&
          value.buildCommand !== undefined &&
          !commandUsesRuntime(value.buildCommand, value.runtime)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["buildCommand"],
            message: buildCommandMessage(value.runtime),
          });
        }
      }),
  };

  static readonly remove = {
    params: projectId,
  };

  static readonly redeploy = {
    params: projectId,
  };

  static readonly enableAutoDeploy = {
    params: projectId,
  };

  static readonly listDeployments = {
    params: projectId,
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
  };

  static readonly getDeployment = {
    params: deploymentParams,
  };

  static readonly cancelDeployment = {
    params: deploymentParams,
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
