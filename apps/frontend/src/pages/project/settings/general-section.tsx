import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProject } from "@/features/projects/mutations";
import type { Project } from "@/features/projects/types";
import { applyServerErrors } from "@/pages/project/settings/apply-server-errors";
import {
  SectionFooterHint,
  SettingsSection,
} from "@/pages/project/settings/settings-section";

const generalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "At most 100 characters"),
  description: z.string().trim().max(500, "At most 500 characters"),
});

type GeneralValues = z.infer<typeof generalSchema>;

const toValues = (project: Project): GeneralValues => ({
  name: project.name,
  description: project.description ?? "",
});

function GeneralSection({ project }: { project: Project }) {
  const update = useUpdateProject(project.id);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<GeneralValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: toValues(project),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await update.mutateAsync({
        name: dirtyFields.name ? values.name : undefined,
        description: dirtyFields.description
          ? values.description || null
          : undefined,
      });
      reset(toValues(updated));
    } catch (error) {
      applyServerErrors(error, setError, { CONFLICT: "name" });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection
        id="general"
        title="General"
        description="The project name is unique among your projects. The slug and URL never change."
        footer={
          <>
            <SectionFooterHint>
              {errors.root?.server?.message ? (
                <span className="text-destructive">
                  {errors.root.server.message}
                </span>
              ) : (
                "Name: up to 100 characters. Description: up to 500."
              )}
            </SectionFooterHint>
            <div className="flex gap-2">
              {isDirty ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset(toValues(project))}
                >
                  Discard
                </Button>
              ) : null}
              <Button type="submit" disabled={!isDirty || update.isPending}>
                {update.isPending ? <Spinner data-icon="inline-start" /> : null}
                Save
              </Button>
            </div>
          </>
        }
      >
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="settings-name">Project name</FieldLabel>
              <Input
                id="settings-name"
                aria-invalid={errors.name ? true : undefined}
                {...register("name")}
              />
              <FieldError className="text-label" errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-url">Project URL</FieldLabel>
              <Input
                id="settings-url"
                value={project.url}
                readOnly
                className="font-mono text-code text-subtle"
              />
            </Field>
          </div>
          <Field data-invalid={errors.description ? true : undefined}>
            <FieldLabel htmlFor="settings-description">Description</FieldLabel>
            <Textarea
              id="settings-description"
              rows={3}
              placeholder="What does this project do?"
              aria-invalid={errors.description ? true : undefined}
              {...register("description")}
            />
            <FieldError className="text-label" errors={[errors.description]} />
          </Field>
        </FieldGroup>
      </SettingsSection>
    </form>
  );
}

export { GeneralSection };
