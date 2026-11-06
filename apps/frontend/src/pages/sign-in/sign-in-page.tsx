import { CircleAlert } from "lucide-react";
import { Navigate, useSearchParams } from "react-router";
import { GithubIcon } from "@/components/brand/github-icon";
import { VercelLogo } from "@/components/brand/vercel-logo";
import { SessionLoading } from "@/components/auth/session-loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { signInWithGithub } from "@/lib/auth";

const DEFAULT_ERROR_MESSAGE =
  "Something went wrong while signing in. Try again.";

const errorMessages: Record<string, string> = {
  INVALID_OAUTH_STATE:
    "The sign-in attempt expired or was opened in another browser. Try again.",
  GITHUB_AUTH_FAILED: "GitHub sign-in failed or was cancelled. Try again.",
  TOO_MANY_REQUESTS: "Too many sign-in attempts. Try again in a moment.",
  API_UNREACHABLE: "We could not reach the server. Try again shortly.",
};

export default function SignInPage() {
  const { data: session, isPending } = useSession();
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");

  if (isPending) {
    return <SessionLoading />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="bg-grid flex min-h-svh items-center justify-center bg-black p-6">
      <div className="flex w-95 flex-col items-center bg-black px-0 py-10">
        <span className="flex size-15 items-center justify-center rounded-2xl border border-border-strong bg-card">
          <VercelLogo className="h-5.5 w-6.25 text-foreground" />
        </span>
        <h1 className="mt-10 text-auth font-medium">Log in to Deploy</h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Import a Vite repository from GitHub and ship it on every push.
        </p>
        {errorCode && (
          <Alert variant="destructive" className="mt-6 items-start">
            <CircleAlert />
            <AlertDescription>
              {errorMessages[errorCode] ?? DEFAULT_ERROR_MESSAGE}
            </AlertDescription>
          </Alert>
        )}
        <Button size="xl" className="mt-7 w-full" onClick={signInWithGithub}>
          <GithubIcon className="size-5" />
          Continue with GitHub
        </Button>
        <p className="mt-6 text-center text-xs text-subtle">
          We request access to your repositories so you can import public and
          private projects and install a push webhook.
        </p>
      </div>
    </main>
  );
}
