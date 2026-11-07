import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";

function NotFoundState({
  title,
  description,
  backTo,
  backLabel,
}: {
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      action={
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to={backTo} />}
        >
          <ArrowLeft data-icon="inline-start" />
          {backLabel}
        </Button>
      }
    />
  );
}

export { NotFoundState };
