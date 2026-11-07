import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FrameworkPreset } from "@/components/deploy/framework-preset";
import { PackageManagerSelect } from "@/components/deploy/package-manager-select";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { PackageManager, Runtime } from "@/features/deployments/types";
import {
  BRANCH_PATTERN,
  buildCommandHint,
  buildCommandMatches,
  defaultBuildCommand,
  defaultInstallCommand,
  installCommandHint,
  installCommandMatches,
  isRelativePath,
  packageManagers,
  runtimeLabels,
  runtimes,
} from "@/features/projects/build-settings";
import { useUpdateProject } from "@/features/projects/mutations";
import type { Project, UpdateProjectInput } from "@/features/projects/types";
import { applyServerErrors } from "@/pages/project/settings/apply-server-errors";
import {
  SectionFooterHint,
  SettingsSection,
} from "@/pages/project/settings/settings-section";

const relativePath = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(255, "At most 255 characters")
    .refine(isRelativePath, "Must be relative and can't contain “..”");

const buildSchema = z
  .object({
    branch: z
      .string()
      .trim()
      .min(1, "Branch is required")
      .max(255, "At most 255 characters")
      .regex(BRANCH_PATTERN, "Letters, digits, “.”, “_”, “/” and “-” only"),
    rootDirectory: relativePath("Root directory"),
    outputDirectory: relativePath("Output directory"),
    packageManager: z.enum(packageManagers as [PackageManager]),
    runtime: z.enum(runtimes as [Runtime]),
    installCommand: z
      .string()
      .trim()
      .min(1, "Install command is required")
      .max(500, "At most 500 characters"),
    buildCommand: z
      .string()
      .trim()
      .min(1, "Build command is required")
      .max(500, "At most 500 characters"),
  })
  .superRefine((values, context) => {
    if (!installCommandMatches(values.installCommand, values.packageManager)) {
      context.addIssue({
        code: "custom",
        path: ["installCommand"],
        message: installCommandHint(values.packageManager),
      });
    }

    if (!buildCommandMatches(values.buildCommand, values.runtime)) {
      context.addIssue({
        code: "custom",
        path: ["buildCommand"],
        message: buildCommandHint(values.runtime),
      });
    }
  });

type BuildValues = z.infer<typeof buildSchema>;

const toValues = (project: Project): BuildValues => ({
  branch: project.branch,
  rootDirectory: project.rootDirectory,
  outputDirectory: project.outputDirectory,
  packageManager: project.packageManager,
  runtime: project.runtime,
  installCommand: project.installCommand,
  buildCommand: project.buildCommand,
});

const runtimeItems = runtimes.map((value) => ({
  value,
  label: runtimeLabels[value],
}));

const BUILD_FIELDS = [
  "branch",
  "rootDirectory",
  "outputDirectory",
  "packageManager",
  "runtime",
  "installCommand",
  "buildCommand",
] as const;

function BuildSection({ project }: { project: Project }) {
  const update = useUpdateProject(project.id);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<BuildValues>({
    resolver: zodResolver(buildSchema),
    defaultValues: toValues(project),
  });
  const [packageManager, runtime] = useWatch({
    control,
    name: ["packageManager", "runtime"],
  });

  const onSubmit = handleSubmit(async (values) => {
    const changes: UpdateProjectInput = {};

    for (const field of BUILD_FIELDS) {
      if (dirtyFields[field]) {
        Object.assign(changes, { [field]: values[field] });
      }
    }

    try {
      const updated = await update.mutateAsync(changes);
      reset(toValues(updated));
    } catch (error) {
      applyServerErrors(error, setError, {
        PACKAGE_MANAGER_COMMAND_MISMATCH: "installCommand",
        RUNTIME_COMMAND_MISMATCH: "buildCommand",
        INVALID_REPOSITORY: "branch",
        UNSUPPORTED_FRAMEWORK: "rootDirectory",
      });
    }
  });

  const handlePackageManagerChange = (next: PackageManager) => {
    const previous = getValues("packageManager");
    const currentRuntime = getValues("runtime");

    setValue("packageManager", next, { shouldDirty: true });

    if (getValues("installCommand") === defaultInstallCommand(previous)) {
      setValue("installCommand", defaultInstallCommand(next), {
        shouldDirty: true,
      });
    }

    if (
      getValues("buildCommand") ===
      defaultBuildCommand(previous, currentRuntime)
    ) {
      setValue("buildCommand", defaultBuildCommand(next, currentRuntime), {
        shouldDirty: true,
      });
    }
  };

  const handleRuntimeChange = (next: Runtime) => {
    const previous = getValues("runtime");
    const currentPackageManager = getValues("packageManager");

    setValue("runtime", next, { shouldDirty: true });

    if (
      getValues("buildCommand") ===
      defaultBuildCommand(currentPackageManager, previous)
    ) {
      setValue(
        "buildCommand",
        defaultBuildCommand(currentPackageManager, next),
        {
          shouldDirty: true,
        },
      );
    }
  };

  const textField = (
    name:
      | "branch"
      | "rootDirectory"
      | "outputDirectory"
      | "installCommand"
      | "buildCommand",
    label: string,
    placeholder: string,
  ) => (
    <Field data-invalid={errors[name] ? true : undefined}>
      <FieldLabel htmlFor={`settings-${name}`}>{label}</FieldLabel>
      <Input
        id={`settings-${name}`}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="font-mono text-code"
        aria-invalid={errors[name] ? true : undefined}
        {...register(name)}
      />
      <FieldError className="text-label" errors={[errors[name]]} />
    </Field>
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection
        id="build"
        title="Build and deployment"
        description="Changes apply to the next deployment. Changing the branch or root directory re-checks that it's still a Vite project."
        footer={
          <>
            <SectionFooterHint>
              {errors.root?.server?.message ? (
                <span className="text-destructive">
                  {errors.root.server.message}
                </span>
              ) : (
                "Paths are relative and can't contain “..”."
              )}
            </SectionFooterHint>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={!isDirty}
                onClick={() => reset(toValues(project))}
              >
                Discard
              </Button>
              <Button type="submit" disabled={!isDirty || update.isPending}>
                {update.isPending ? <Spinner data-icon="inline-start" /> : null}
                Save
              </Button>
            </div>
          </>
        }
      >
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {textField("branch", "Production branch", "main")}
            {textField("rootDirectory", "Root directory", ".")}
            {textField("outputDirectory", "Output directory", "dist")}
            {textField(
              "installCommand",
              "Install command",
              defaultInstallCommand(packageManager),
            )}
            {textField(
              "buildCommand",
              "Build command",
              defaultBuildCommand(packageManager, runtime),
            )}
            <Field>
              <FieldLabel htmlFor="settings-framework">
                Framework preset
              </FieldLabel>
              <FrameworkPreset id="settings-framework" />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-package-manager">
                Package manager
              </FieldLabel>
              <Controller
                control={control}
                name="packageManager"
                render={({ field }) => (
                  <PackageManagerSelect
                    id="settings-package-manager"
                    value={field.value}
                    onChange={handlePackageManagerChange}
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-runtime">Build runtime</FieldLabel>
              <Select
                items={runtimeItems}
                value={runtime}
                onValueChange={(next) => {
                  if (next) {
                    handleRuntimeChange(next);
                  }
                }}
              >
                <SelectTrigger id="settings-runtime" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {runtimeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>
      </SettingsSection>
    </form>
  );
}

export { BuildSection };
