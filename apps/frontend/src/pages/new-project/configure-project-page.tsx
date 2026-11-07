import { useState, type ComponentProps } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, CircleAlert, GitBranch } from "lucide-react";
import { useAuthenticatedSession } from "@/components/auth/session-context";
import { GithubIcon } from "@/components/brand/github-icon";
import { UserAvatar } from "@/components/deploy/app-shell";
import { CollapsibleSection } from "@/components/deploy/collapsible-section";
import { FrameworkPreset } from "@/components/deploy/framework-preset";
import { PackageManagerSelect } from "@/components/deploy/package-manager-select";
import { ErrorState } from "@/components/states/error-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  defaultBuildCommand,
  defaultInstallCommand,
} from "@/features/projects/build-settings";
import { useCreateProject } from "@/features/projects/mutations";
import type { ImportableRepository } from "@/features/repositories/api";
import { repositoryQueryOptions } from "@/features/repositories/queries";
import {
  getErrorMessage,
  getFieldErrors,
  isApiError,
  isNotFoundError,
} from "@/lib/api-error";
import {
  configureProjectSchema,
  nonBlankEnvironmentVariables,
  type ConfigureProjectValues,
} from "@/pages/new-project/configure-form";
import {
  EnvironmentVariableRows,
  emptyRow,
} from "@/pages/new-project/environment-variable-rows";

const SERVER_FIELD_ERRORS: Record<string, keyof ConfigureProjectValues> = {
  PACKAGE_MANAGER_COMMAND_MISMATCH: "installCommand",
  RUNTIME_COMMAND_MISMATCH: "buildCommand",
};

const defaultValues: ConfigureProjectValues = {
  packageManager: "npm",
  overrideInstall: false,
  installCommand: "",
  overrideBuild: false,
  buildCommand: "",
  environmentVariables: [emptyRow],
};

function ConfigureSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl" aria-busy="true">
      <Card className="gap-8 p-6 sm:p-10">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </div>
  );
}

function CommandOverrideField({
  id,
  label,
  checked,
  onCheckedChange,
  placeholder,
  error,
  inputProps,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  placeholder: string;
  error?: string;
  inputProps: ComponentProps<"input">;
}) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup className="h-12">
        <InputGroupInput
          id={id}
          placeholder={placeholder}
          disabled={!checked}
          spellCheck={false}
          autoComplete="off"
          className="font-mono text-code"
          aria-invalid={error ? true : undefined}
          {...inputProps}
        />
        <InputGroupAddon align="inline-end" className="pr-3">
          <Switch
            checked={checked}
            onCheckedChange={onCheckedChange}
            aria-label={`Override ${label.toLowerCase()}`}
          />
        </InputGroupAddon>
      </InputGroup>
      <FieldError className="text-label" errors={[{ message: error }]} />
    </Field>
  );
}

function ConfigureProjectForm({
  repository,
}: {
  repository: ImportableRepository;
}) {
  const { user } = useAuthenticatedSession();
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [formError, setFormError] = useState<unknown>(null);
  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ConfigureProjectValues>({
    resolver: zodResolver(configureProjectSchema),
    defaultValues,
  });
  const [packageManager, overrideInstall, overrideBuild] = useWatch({
    control,
    name: ["packageManager", "overrideInstall", "overrideBuild"],
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const project = await createProject.mutateAsync({
        repositoryId: repository.id,
        packageManager: values.packageManager,
        installCommand: values.overrideInstall
          ? values.installCommand.trim()
          : undefined,
        buildCommand: values.overrideBuild
          ? values.buildCommand.trim()
          : undefined,
        environmentVariables: nonBlankEnvironmentVariables(
          values.environmentVariables,
        ),
      });

      navigate(
        project.latestDeployment
          ? `/projects/${project.id}/deployments/${project.latestDeployment.id}`
          : `/projects/${project.id}/deployments`,
        { replace: true },
      );
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      const entries = Object.entries(fieldErrors);

      for (const [path, message] of entries) {
        setError(path as FieldPath<ConfigureProjectValues>, { message });
      }

      for (const [code, field] of Object.entries(SERVER_FIELD_ERRORS)) {
        if (isApiError(error, code)) {
          setError(field, { message: getErrorMessage(error) });
          return;
        }
      }

      if (entries.length === 0) {
        setFormError(error);
      }
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card className="gap-8 p-6 sm:p-10">
        <h1 className="text-[40px] leading-tight font-medium tracking-tight">
          New project
        </h1>

        <div className="flex flex-col gap-2 rounded-lg bg-muted px-6 py-5">
          <span className="text-label text-muted-foreground">
            Importing from GitHub
          </span>
          <span className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <a
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-title font-medium hover:underline"
            >
              <GithubIcon className="size-4" />
              {repository.fullName}
            </a>
            <span className="flex items-center gap-2 font-mono text-code text-muted-foreground">
              <GitBranch className="size-3.5" />
              {repository.defaultBranch}
            </span>
          </span>
        </div>

        <FieldGroup className="gap-3">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field>
              <FieldLabel>Owner</FieldLabel>
              <div className="flex h-12 items-center gap-3 rounded-md border border-input bg-card px-4 text-sm">
                <UserAvatar className="size-6" />
                <span className="flex-1 truncate">{user.githubLogin}</span>
                <Badge variant="outline">Hobby</Badge>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="project-name">Project name</FieldLabel>
              <Input
                id="project-name"
                value={repository.name}
                readOnly
                className="h-12 text-muted-foreground"
              />
            </Field>
          </div>
          <FieldDescription className="text-label text-subtle">
            The name, description and branch come from GitHub. You can change
            them in Settings after import.
          </FieldDescription>
        </FieldGroup>

        <Separator />

        <FieldGroup className="gap-8">
          <Field>
            <FieldLabel htmlFor="framework-preset">
              Application preset
            </FieldLabel>
            <FrameworkPreset id="framework-preset" />
          </Field>

          <CollapsibleSection title="Build and output settings">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="package-manager">
                  Package manager
                </FieldLabel>
                <Controller
                  control={control}
                  name="packageManager"
                  render={({ field }) => (
                    <PackageManagerSelect
                      id="package-manager"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <CommandOverrideField
                  id="install-command"
                  label="Install command"
                  checked={overrideInstall}
                  onCheckedChange={(checked) => {
                    setValue("overrideInstall", checked);
                    if (checked && !getValues("installCommand")) {
                      setValue(
                        "installCommand",
                        defaultInstallCommand(packageManager),
                      );
                    }
                  }}
                  placeholder={defaultInstallCommand(packageManager)}
                  error={errors.installCommand?.message}
                  inputProps={register("installCommand")}
                />
                <CommandOverrideField
                  id="build-command"
                  label="Build command"
                  checked={overrideBuild}
                  onCheckedChange={(checked) => {
                    setValue("overrideBuild", checked);
                    if (checked && !getValues("buildCommand")) {
                      setValue(
                        "buildCommand",
                        defaultBuildCommand(packageManager),
                      );
                    }
                  }}
                  placeholder={defaultBuildCommand(packageManager)}
                  error={errors.buildCommand?.message}
                  inputProps={register("buildCommand")}
                />
              </div>
            </FieldGroup>
          </CollapsibleSection>

          <CollapsibleSection title="Environment variables">
            <EnvironmentVariableRows
              control={control}
              register={register}
              getValues={getValues}
              errors={errors}
            />
          </CollapsibleSection>
        </FieldGroup>

        {formError ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertTitle>Couldn't create the project</AlertTitle>
            <AlertDescription>
              {getErrorMessage(formError)}
              {isApiError(formError, "REPOSITORY_ALREADY_IMPORTED") ? (
                <>
                  {" "}
                  <Link to="/">Go to your projects</Link>.
                </>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          size="xl"
          className="w-full"
          disabled={createProject.isPending}
        >
          {createProject.isPending ? (
            <Spinner data-icon="inline-start" />
          ) : null}
          {createProject.isPending ? "Deploying…" : "Deploy"}
        </Button>
      </Card>
    </form>
  );
}

export default function ConfigureProjectPage() {
  const { repositoryId: repositoryIdParam } = useParams();
  const repositoryId = Number(repositoryIdParam);
  const location = useLocation();
  const queryClient = useQueryClient();
  const stateRepository = (
    location.state as { repository?: ImportableRepository } | null
  )?.repository;
  const isValidId = Number.isInteger(repositoryId) && repositoryId > 0;

  const options = repositoryQueryOptions(queryClient, repositoryId);
  const { data, error, isPending, isError, refetch, isRefetching } = useQuery({
    ...options,
    initialData:
      stateRepository?.id === repositoryId
        ? stateRepository
        : options.initialData,
    enabled: isValidId,
  });

  if (!isValidId || (isError && isNotFoundError(error))) {
    return (
      <div className="mx-auto max-w-2xl pt-16">
        <NotFoundState
          title="Repository not available"
          description={
            isError
              ? getErrorMessage(error)
              : "That repository link isn't valid."
          }
          backTo="/new"
          backLabel="Choose another repository"
        />
      </div>
    );
  }

  if (isPending) {
    return <ConfigureSkeleton />;
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl pt-16">
        <ErrorState
          error={error}
          title="Couldn't load this repository"
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
          action={
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link to="/new" />}
            >
              <ArrowLeft data-icon="inline-start" />
              Back
            </Button>
          }
        />
      </div>
    );
  }

  if (data.imported) {
    return (
      <div className="mx-auto max-w-2xl pt-16">
        <NotFoundState
          title="Already imported"
          description={`${data.fullName} is already one of your projects.`}
          backTo="/"
          backLabel="All projects"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-16">
      <ConfigureProjectForm repository={data} />
    </div>
  );
}
