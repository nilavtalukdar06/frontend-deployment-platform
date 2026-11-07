import { useRef, type ClipboardEvent } from "react";
import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
} from "react-hook-form";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { SecretInput } from "@/components/deploy/secret-input";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  looksLikeDotEnv,
  MAX_ENVIRONMENT_VARIABLES,
  parseDotEnv,
} from "@/features/environment-variables/validation";
import type { ConfigureProjectValues } from "@/pages/new-project/configure-form";

const emptyRow = { key: "", value: "" };

function EnvironmentVariableRows({
  control,
  register,
  getValues,
  errors,
}: {
  control: Control<ConfigureProjectValues>;
  register: UseFormRegister<ConfigureProjectValues>;
  getValues: UseFormGetValues<ConfigureProjectValues>;
  errors: FieldErrors<ConfigureProjectValues>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "environmentVariables",
  });

  const mergeEntries = (
    entries: { key: string; value: string }[],
    replaceIndex?: number,
  ) => {
    const rows = getValues("environmentVariables").filter(
      (row, index) =>
        index !== replaceIndex && (row.key.trim() !== "" || row.value !== ""),
    );
    const byKey = new Map(rows.map((row) => [row.key.trim(), row]));

    for (const entry of entries) {
      byKey.set(entry.key, entry);
    }

    const merged = Array.from(byKey.values()).slice(
      0,
      MAX_ENVIRONMENT_VARIABLES,
    );
    replace(merged.length > 0 ? merged : [emptyRow]);

    if (byKey.size > MAX_ENVIRONMENT_VARIABLES) {
      toast.warning(
        `Only the first ${MAX_ENVIRONMENT_VARIABLES} variables were kept`,
      );
    }
  };

  const handleKeyPaste = (
    event: ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const text = event.clipboardData.getData("text");

    if (!text.includes("\n") || !looksLikeDotEnv(text)) {
      return;
    }

    const entries = parseDotEnv(text);

    if (entries.length === 0) {
      return;
    }

    event.preventDefault();
    mergeEntries(entries, index);
    toast.success(
      `Added ${entries.length} variable${entries.length === 1 ? "" : "s"}`,
    );
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const entries = parseDotEnv(await file.text());

    if (entries.length === 0) {
      toast.error("No variables found in that file");
      return;
    }

    mergeEntries(entries);
    toast.success(
      `Imported ${entries.length} variable${entries.length === 1 ? "" : "s"}`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-x-3 gap-y-3">
        <FieldLabel className="col-span-1">Key</FieldLabel>
        <FieldLabel className="col-span-2">Value</FieldLabel>
        {fields.map((field, index) => {
          const rowErrors = errors.environmentVariables?.[index];
          const keyId = `environment-variable-key-${field.id}`;

          return (
            <div key={field.id} className="col-span-3 grid grid-cols-subgrid">
              <Field data-invalid={rowErrors?.key ? true : undefined}>
                <Input
                  id={keyId}
                  placeholder="VITE_API_URL"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono text-code"
                  aria-label="Key"
                  aria-invalid={rowErrors?.key ? true : undefined}
                  onPaste={(event) => handleKeyPaste(event, index)}
                  {...register(`environmentVariables.${index}.key`)}
                />
                <FieldError className="text-label" errors={[rowErrors?.key]} />
              </Field>
              <Field data-invalid={rowErrors?.value ? true : undefined}>
                <SecretInput
                  placeholder="Value"
                  aria-label="Value"
                  aria-invalid={rowErrors?.value ? true : undefined}
                  {...register(`environmentVariables.${index}.value`)}
                />
                <FieldError
                  className="text-label"
                  errors={[rowErrors?.value]}
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Remove variable"
                onClick={() =>
                  fields.length === 1 ? replace([emptyRow]) : remove(index)
                }
              >
                <Minus />
              </Button>
            </div>
          );
        })}
      </div>
      <FieldError
        className="text-label"
        errors={[
          {
            message:
              errors.environmentVariables?.root?.message ??
              errors.environmentVariables?.message,
          },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".env,text/plain"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
        >
          Import .env
        </Button>
        <span className="text-sm text-subtle">
          or paste the .env contents into a Key field
        </span>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="ml-auto"
          disabled={fields.length >= MAX_ENVIRONMENT_VARIABLES}
          onClick={() => append(emptyRow)}
        >
          <Plus data-icon="inline-start" />
          Add more
        </Button>
      </div>
    </div>
  );
}

export { EnvironmentVariableRows, emptyRow };
