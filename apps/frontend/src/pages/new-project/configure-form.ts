import { z } from "zod";
import {
  environmentVariableKeySchema,
  environmentVariableValueSchema,
  MAX_ENVIRONMENT_VARIABLES,
} from "@/features/environment-variables/validation";
import {
  buildCommandHint,
  buildCommandMatches,
  defaultRuntimeFor,
  installCommandHint,
  installCommandMatches,
  packageManagers,
} from "@/features/projects/build-settings";
import type { PackageManager } from "@/features/deployments/types";

const isBlankRow = (row: { key: string; value: string }) =>
  row.key.trim() === "" && row.value === "";

const environmentVariableRowSchema = z
  .object({ key: z.string(), value: z.string() })
  .superRefine((row, context) => {
    if (isBlankRow(row)) {
      return;
    }

    const key = environmentVariableKeySchema.safeParse(row.key);

    if (!key.success) {
      context.addIssue({
        code: "custom",
        path: ["key"],
        message: key.error.issues[0]?.message ?? "Invalid key",
      });
    }

    const value = environmentVariableValueSchema.safeParse(row.value);

    if (!value.success) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: value.error.issues[0]?.message ?? "Invalid value",
      });
    }
  });

export const configureProjectSchema = z
  .object({
    packageManager: z.enum(packageManagers as [PackageManager]),
    overrideInstall: z.boolean(),
    installCommand: z.string().max(500, "At most 500 characters"),
    overrideBuild: z.boolean(),
    buildCommand: z.string().max(500, "At most 500 characters"),
    environmentVariables: z
      .array(environmentVariableRowSchema)
      .max(
        MAX_ENVIRONMENT_VARIABLES,
        `A project can have at most ${MAX_ENVIRONMENT_VARIABLES} environment variables`,
      ),
  })
  .superRefine((values, context) => {
    const runtime = defaultRuntimeFor(values.packageManager);

    if (values.overrideInstall) {
      if (!values.installCommand.trim()) {
        context.addIssue({
          code: "custom",
          path: ["installCommand"],
          message: "Enter an install command or turn the override off",
        });
      } else if (
        !installCommandMatches(values.installCommand, values.packageManager)
      ) {
        context.addIssue({
          code: "custom",
          path: ["installCommand"],
          message: installCommandHint(values.packageManager),
        });
      }
    }

    if (values.overrideBuild) {
      if (!values.buildCommand.trim()) {
        context.addIssue({
          code: "custom",
          path: ["buildCommand"],
          message: "Enter a build command or turn the override off",
        });
      } else if (!buildCommandMatches(values.buildCommand, runtime)) {
        context.addIssue({
          code: "custom",
          path: ["buildCommand"],
          message: buildCommandHint(runtime),
        });
      }
    }

    const seen = new Map<string, number>();

    values.environmentVariables.forEach((row, index) => {
      const key = row.key.trim();

      if (!key) {
        return;
      }

      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["environmentVariables", index, "key"],
          message: "Duplicate key",
        });
      } else {
        seen.set(key, index);
      }
    });
  });

export type ConfigureProjectValues = z.infer<typeof configureProjectSchema>;

export const nonBlankEnvironmentVariables = (
  rows: ConfigureProjectValues["environmentVariables"],
) =>
  rows
    .filter((row) => !isBlankRow(row))
    .map((row) => ({ key: row.key.trim(), value: row.value }));
