import { useState } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteProject } from "@/features/projects/mutations";
import type { Project } from "@/features/projects/types";
import { hostFromUrl } from "@/lib/format";
import {
  SectionFooterHint,
  SettingsSection,
} from "@/pages/project/settings/settings-section";

function DeleteSection({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const remove = useDeleteProject(project.id);
  const confirmed = confirmation.trim() === project.name;

  return (
    <SettingsSection
      id="delete"
      title="Delete project"
      tone="destructive"
      description={
        <>
          Permanently deletes{" "}
          <span className="text-foreground">{project.name}</span>, its
          deployments, environment variables and the GitHub webhook.{" "}
          {hostFromUrl(project.url)} stops serving immediately.
        </>
      }
      footer={
        <>
          <SectionFooterHint>This action can't be undone.</SectionFooterHint>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete project
          </Button>
        </>
      }
    >
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setConfirmation("");
          }
        }}
      >
        <AlertDialogContent>
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              if (confirmed) {
                remove.mutate();
              }
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                All deployments and environment variables are removed and the
                site goes offline.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Field>
              <FieldLabel htmlFor="delete-confirmation">
                Type <span className="text-foreground">{project.name}</span> to
                confirm
              </FieldLabel>
              <Input
                id="delete-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                autoFocus
              />
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                disabled={!confirmed || remove.isPending}
              >
                {remove.isPending ? <Spinner data-icon="inline-start" /> : null}
                Delete project
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}

export { DeleteSection };
