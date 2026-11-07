import { NotFoundState } from "@/components/states/not-found-state";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl pt-16">
      <NotFoundState
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        backTo="/"
        backLabel="All projects"
      />
    </div>
  );
}
