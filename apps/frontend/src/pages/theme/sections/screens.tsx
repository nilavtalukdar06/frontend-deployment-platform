import { CircleAlert } from "lucide-react";
import { GithubIcon } from "@/components/brand/github-icon";
import { VercelLogo } from "@/components/brand/vercel-logo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Section, Specimen } from "@/pages/theme/sections/section";

function LoginPreview() {
  return (
    <div className="bg-grid flex min-h-160 items-center justify-center overflow-hidden rounded-xl border border-border bg-black p-6">
      <div className="flex w-95 flex-col items-center bg-black px-0 py-10">
        <span className="flex size-15 items-center justify-center rounded-2xl border border-border-strong bg-card">
          <VercelLogo className="h-5.5 w-6.25 text-foreground" />
        </span>
        <h3 className="mt-10 text-auth font-medium">Log in to Deploy</h3>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Import a Vite repository from GitHub and ship it on every push.
        </p>
        <Alert variant="destructive" className="mt-6 items-start">
          <CircleAlert />
          <AlertDescription>
            The sign-in attempt expired or was opened in another browser. Try
            again.
          </AlertDescription>
        </Alert>
        <Button size="xl" className="mt-7 w-full">
          <GithubIcon className="size-5" />
          Continue with GitHub
        </Button>
        <p className="mt-6 text-center text-xs text-subtle">
          We request access to your repositories so you can import public and
          private projects and install a push webhook.
        </p>
      </div>
    </div>
  );
}

function ScreensSection() {
  return (
    <Section
      id="screens"
      title="Auth screen"
      description="The login screen composed from the primitives above on the 56px grid backdrop."
    >
      <Specimen label="Log in">
        <LoginPreview />
      </Specimen>
    </Section>
  );
}

export { ScreensSection };
