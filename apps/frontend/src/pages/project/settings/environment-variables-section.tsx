import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
import { SecretInput } from "@/components/deploy/secret-input";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useRedeploy } from "@/features/deployments/mutations";
import type { EnvironmentVariable } from "@/features/environment-variables/api";
import {
  environmentVariablesQueryOptions,
  useDeleteEnvironmentVariable,
  useSaveEnvironmentVariable,
} from "@/features/environment-variables/queries";
import {
  environmentVariableKeySchema,
  environmentVariableValueSchema,
  MAX_ENVIRONMENT_VARIABLES,
} from "@/features/environment-variables/validation";
import type { Project } from "@/features/projects/types";
import { getErrorMessage } from "@/lib/api-error";
import { formatRelativeTime } from "@/lib/format";
import { SettingsSection } from "@/pages/project/settings/settings-section";

function VariableRow({
  projectId,
  variable,
  onChanged,
  onDelete,
}: {
  projectId: string;
  variable: EnvironmentVariable;
  onChanged: () => void;
  onDelete: (key: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(variable.value);
  const [error, setError] = useState<string | null>(null);
  const save = useSaveEnvironmentVariable(projectId);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    const parsed = environmentVariableValueSchema.safeParse(value);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid value");
      return;
    }

    setError(null);
    save.mutate(
      { key: variable.key, value },
      {
        onSuccess: () => {
          setEditing(false);
          onChanged();
        },
        onError: (mutationError) => setError(getErrorMessage(mutationError)),
      },
    );
  };

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-2 border-b border-border px-5 py-4 last:border-b-0"
      >
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
          <span className="flex h-10 items-center truncate font-mono text-code">
            {variable.key}
          </span>
          <Field data-invalid={error ? true : undefined}>
            <SecretInput
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-label={`Value of ${variable.key}`}
              aria-invalid={error ? true : undefined}
              autoFocus
            />
            <FieldError className="text-label">{error}</FieldError>
          </Field>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setValue(variable.value);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Spinner data-icon="inline-start" /> : null}
              Save
            </Button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-mono text-code">{variable.key}</span>
        <span className="text-xs text-subtle">
          Updated {formatRelativeTime(variable.updatedAt)}
        </span>
      </div>
      <span className="hidden min-w-0 truncate font-mono text-code text-muted-foreground md:block">
        {revealed ? variable.value || "(empty)" : "••••••••••••"}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            revealed ? `Hide ${variable.key}` : `Show ${variable.key}`
          }
          onClick={() => setRevealed((current) => !current)}
        >
          {revealed ? <EyeOff /> : <Eye />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Edit ${variable.key}`}
          onClick={() => setEditing(true)}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${variable.key}`}
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(variable.key)}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

function AddVariableForm({
  projectId,
  existingKeys,
  disabled,
  onChanged,
}: {
  projectId: string;
  existingKeys: Set<string>;
  disabled: boolean;
  onChanged: () => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [errors, setErrors] = useState<{ key?: string; value?: string }>({});
  const save = useSaveEnvironmentVariable(projectId);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedKey = environmentVariableKeySchema.safeParse(key);
    const parsedValue = environmentVariableValueSchema.safeParse(value);
    const nextErrors: { key?: string; value?: string } = {};

    if (!parsedKey.success) {
      nextErrors.key = parsedKey.error.issues[0]?.message;
    } else if (existingKeys.has(parsedKey.data)) {
      nextErrors.key = "This key already exists. Edit it instead.";
    }

    if (!parsedValue.success) {
      nextErrors.value = parsedValue.error.issues[0]?.message;
    }

    setErrors(nextErrors);

    if (nextErrors.key || nextErrors.value || !parsedKey.success) {
      return;
    }

    save.mutate(
      { key: parsedKey.data, value },
      {
        onSuccess: () => {
          setKey("");
          setValue("");
          onChanged();
        },
        onError: (error) => setErrors({ key: getErrorMessage(error) }),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]"
    >
      <Field data-invalid={errors.key ? true : undefined}>
        <FieldLabel htmlFor="new-variable-key">Key</FieldLabel>
        <Input
          id="new-variable-key"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="VITE_API_URL"
          autoComplete="off"
          spellCheck={false}
          className="font-mono text-code"
          aria-invalid={errors.key ? true : undefined}
          disabled={disabled}
        />
        <FieldError className="text-label">{errors.key}</FieldError>
      </Field>
      <Field data-invalid={errors.value ? true : undefined}>
        <FieldLabel htmlFor="new-variable-value">Value</FieldLabel>
        <SecretInput
          id="new-variable-value"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Value"
          aria-invalid={errors.value ? true : undefined}
          disabled={disabled}
        />
        <FieldError className="text-label">{errors.value}</FieldError>
      </Field>
      <Button
        type="submit"
        size="lg"
        className="md:mt-7"
        disabled={disabled || save.isPending}
      >
        {save.isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Plus data-icon="inline-start" />
        )}
        Add
      </Button>
    </form>
  );
}

function VariablesSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border-strong">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-6 border-b border-border px-5 py-4 last:border-b-0"
        >
          <Skeleton className="h-4 w-36" />
          <Skeleton className="hidden h-4 w-48 md:block" />
          <Skeleton className="ml-auto h-7 w-24" />
        </div>
      ))}
    </div>
  );
}

function EnvironmentVariablesSection({ project }: { project: Project }) {
  const [changed, setChanged] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);
  const redeploy = useRedeploy(project.id);
  const remove = useDeleteEnvironmentVariable(project.id);
  const { data, error, isPending, isError, refetch, isRefetching } = useQuery(
    environmentVariablesQueryOptions(project.id),
  );
  const variables = data ?? [];
  const existingKeys = new Set(variables.map((variable) => variable.key));
  const atLimit = variables.length >= MAX_ENVIRONMENT_VARIABLES;
  const markChanged = () => setChanged(true);

  return (
    <SettingsSection
      id="environment-variables"
      title="Environment variables"
      description="Encrypted and passed to the install and build commands. New values are used by the next deployment."
    >
      {changed ? (
        <Alert variant="info" className="items-center">
          <AlertDescription className="text-sm">
            Redeploy to apply your environment variable changes to production.
          </AlertDescription>
          <AlertAction className="top-1/2 -translate-y-1/2">
            <Button
              variant="outline"
              size="sm"
              disabled={redeploy.isPending}
              onClick={() => redeploy.mutate()}
            >
              {redeploy.isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RotateCw data-icon="inline-start" />
              )}
              Redeploy
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {isPending ? (
        <VariablesSkeleton />
      ) : isError ? (
        <ErrorState
          error={error}
          title="Couldn't load environment variables"
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : variables.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No environment variables"
          description="Add variables like VITE_API_URL below. Only variables prefixed with VITE_ are exposed to client code by Vite."
          className="border-border-strong bg-transparent py-8"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-strong">
          {variables.map((variable) => (
            <VariableRow
              key={`${variable.key}:${variable.updatedAt}`}
              projectId={project.id}
              variable={variable}
              onChanged={markChanged}
              onDelete={setDeleteKey}
            />
          ))}
        </div>
      )}

      {isError ? null : (
        <AddVariableForm
          projectId={project.id}
          existingKeys={existingKeys}
          disabled={isPending || atLimit}
          onChanged={markChanged}
        />
      )}
      {atLimit ? (
        <p className="text-label text-subtle">
          A project can have at most {MAX_ENVIRONMENT_VARIABLES} environment
          variables.
        </p>
      ) : null}

      <AlertDialog
        open={deleteKey !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteKey(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteKey}?</AlertDialogTitle>
            <AlertDialogDescription>
              The next deployment runs without this variable. Existing
              deployments keep the value they were built with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (!deleteKey) {
                  return;
                }

                remove.mutate(deleteKey, {
                  onSuccess: markChanged,
                  onSettled: () => setDeleteKey(null),
                });
              }}
            >
              {remove.isPending ? <Spinner data-icon="inline-start" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}

export { EnvironmentVariablesSection };
