import { CircleAlert, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { GithubIcon } from "@/components/brand/github-icon";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getErrorMessage, isApiError } from "@/lib/api-error";
import { signInWithGithub } from "@/lib/auth";
import { cn } from "@/lib/utils";

function ErrorState({
  error,
  title = "Something went wrong",
  onRetry,
  isRetrying,
  action,
  className,
}: {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  action?: ReactNode;
  className?: string;
}) {
  const needsGithub = isApiError(error, "GITHUB_AUTH_REQUIRED");

  return (
    <Empty
      role="alert"
      className={cn(
        "border border-destructive-border bg-destructive-surface/40",
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="bg-destructive-solid text-destructive"
        >
          <CircleAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        {needsGithub ? (
          <Button onClick={signInWithGithub}>
            <GithubIcon data-icon="inline-start" />
            Reconnect GitHub
          </Button>
        ) : null}
        {onRetry && !needsGithub ? (
          <Button variant="outline" onClick={onRetry} disabled={isRetrying}>
            <RotateCw
              data-icon="inline-start"
              className={cn(isRetrying && "animate-spin")}
            />
            Try again
          </Button>
        ) : null}
        {action}
      </EmptyContent>
    </Empty>
  );
}

export { ErrorState };
