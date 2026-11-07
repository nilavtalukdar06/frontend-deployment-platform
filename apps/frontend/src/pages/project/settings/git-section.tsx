import { Zap, ZapOff } from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useInstallWebhook } from "@/features/projects/mutations";
import type { Project } from "@/features/projects/types";
import { formatShortDate, repositoryNameFromUrl } from "@/lib/format";
import {
  SectionFooterHint,
  SettingsSection,
} from "@/pages/project/settings/settings-section";

function GitSection({ project }: { project: Project }) {
  const installWebhook = useInstallWebhook(project.id);

  return (
    <SettingsSection
      id="git"
      title="Git"
      footer={
        <>
          <SectionFooterHint>
            {project.autoDeploy
              ? "Reinstall the webhook if it was deleted on GitHub."
              : "Installing the webhook needs admin access to the repository."}
          </SectionFooterHint>
          <Button
            variant="outline"
            disabled={installWebhook.isPending}
            onClick={() => installWebhook.mutate()}
          >
            {installWebhook.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            {project.autoDeploy ? "Reinstall webhook" : "Enable auto-deploy"}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border-strong px-4 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <GithubIcon className="size-5 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-title font-medium hover:underline"
            >
              {repositoryNameFromUrl(project.repositoryUrl)}
            </a>
            <span className="text-sm text-muted-foreground">
              {project.private ? "Private" : "Public"} repository · imported{" "}
              {formatShortDate(project.createdAt)}
            </span>
          </div>
        </div>
        {project.autoDeploy ? (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <Zap className="size-4" />
            Deploys on push
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-warning">
            <ZapOff className="size-4" />
            Auto-deploy off
          </span>
        )}
      </div>
    </SettingsSection>
  );
}

export { GitSection };
