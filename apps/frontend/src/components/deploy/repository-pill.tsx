import { GithubIcon } from "@/components/brand/github-icon";
import { repositoryNameFromUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

function RepositoryPill({
  repositoryUrl,
  className,
}: {
  repositoryUrl: string;
  className?: string;
}) {
  return (
    <a
      href={repositoryUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "relative z-10 inline-flex h-6 w-fit max-w-full items-center gap-2 rounded-full border border-border bg-muted px-2.5 text-code text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <GithubIcon className="size-3.5 shrink-0" />
      <span className="truncate">{repositoryNameFromUrl(repositoryUrl)}</span>
    </a>
  );
}

export { RepositoryPill };
