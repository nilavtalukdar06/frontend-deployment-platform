import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  loadSession,
  signInWithGithub,
  signOut,
  type Session,
} from "@/lib/auth";

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "failed"; reason: string }
  | { status: "signed-in"; session: Session };

const callbackError = new URLSearchParams(window.location.search).get("error");

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : "Never";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right break-all">{value}</dd>
    </div>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-6 p-6">
      {children}
    </main>
  );
}

function SignedOut({ reason }: { reason?: string }) {
  return (
    <Page>
      <Card>
        <CardHeader>
          <CardTitle>React Deployment Platform</CardTitle>
          <CardDescription>
            Sign in with GitHub to import and deploy your Vite projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {reason && (
            <Alert variant="destructive">
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{reason}</AlertDescription>
            </Alert>
          )}
          <Button onClick={signInWithGithub}>Sign in with GitHub</Button>
        </CardContent>
      </Card>
    </Page>
  );
}

function Loading() {
  return (
    <Page>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </Page>
  );
}

function Dashboard({
  session,
  onSignedOut,
}: {
  session: Session;
  onSignedOut: () => void;
}) {
  const { user, accessToken } = session;
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  const handleSignOut = () => {
    setSigningOut(true);
    setSignOutFailed(false);
    signOut(accessToken)
      .then(onSignedOut)
      .catch(() => {
        setSignOutFailed(true);
        setSigningOut(false);
      });
  };

  return (
    <Page>
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">React Deployment Platform</h1>
        <Button variant="outline" disabled={signingOut} onClick={handleSignOut}>
          {signingOut ? "Logging out..." : "Log out"}
        </Button>
      </header>

      {signOutFailed && (
        <Alert variant="destructive">
          <AlertTitle>Log out failed</AlertTitle>
          <AlertDescription>Please try again.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.githubLogin} />
              )}
              <AvatarFallback>
                {(user.name ?? user.githubLogin).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <CardTitle>{user.name ?? user.githubLogin}</CardTitle>
              <CardDescription>@{user.githubLogin}</CardDescription>
            </div>
          </div>
          <CardAction>
            <Badge variant="secondary">{user.status}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <dl className="flex flex-col gap-3">
            <Field label="User ID" value={user.id} />
            <Field label="GitHub login" value={user.githubLogin} />
            <Field label="Name" value={user.name ?? "Not set"} />
            <Field label="Email" value={user.email ?? "Not available"} />
            <Field label="Status" value={user.status} />
            <Field label="Last login" value={formatDate(user.lastLoginAt)} />
            <Field label="Created" value={formatDate(user.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access token</CardTitle>
          <CardDescription>
            Use it as a Bearer token. Reload the page for a new one when it
            expires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block rounded-lg bg-muted p-3 text-xs break-all">
            {accessToken}
          </code>
        </CardContent>
      </Card>
    </Page>
  );
}

export default function App() {
  const [state, setState] = useState<AuthState>(
    callbackError
      ? { status: "failed", reason: callbackError }
      : { status: "loading" },
  );

  useEffect(() => {
    if (callbackError) {
      return;
    }

    loadSession()
      .then((session) => {
        if (!session) {
          setState({ status: "signed-out" });
          return;
        }

        window.history.replaceState({}, "", "/");
        setState({ status: "signed-in", session });
      })
      .catch(() => setState({ status: "failed", reason: "API_UNREACHABLE" }));
  }, []);

  if (state.status === "loading") {
    return <Loading />;
  }

  if (state.status === "signed-in") {
    return (
      <Dashboard
        session={state.session}
        onSignedOut={() => setState({ status: "signed-out" })}
      />
    );
  }

  return (
    <SignedOut reason={state.status === "failed" ? state.reason : undefined} />
  );
}
