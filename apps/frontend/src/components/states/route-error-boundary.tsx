import { ArrowLeft } from "lucide-react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";

function RouteErrorBoundary() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "This page crashed";

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <ErrorState
        error={
          isRouteErrorResponse(error)
            ? new Error("The page could not be loaded.")
            : error
        }
        title={title}
        className="max-w-md"
        onRetry={() => window.location.reload()}
        action={
          <Button variant="ghost" nativeButton={false} render={<Link to="/" />}>
            <ArrowLeft data-icon="inline-start" />
            All projects
          </Button>
        }
      />
    </main>
  );
}

export { RouteErrorBoundary };
