import { Skeleton } from "@/components/ui/skeleton";

export function SessionLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your session"
      className="flex min-h-svh bg-background"
    >
      <aside className="hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-15.25 shrink-0 items-center gap-3 border-b border-border px-5">
          <Skeleton className="h-4 w-4.5" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex flex-col gap-4 p-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="mt-auto flex items-center gap-3 border-t border-border p-3">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-15.25 shrink-0 items-center justify-between border-b border-border px-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="flex flex-col gap-3 px-6 py-8 sm:px-8">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
