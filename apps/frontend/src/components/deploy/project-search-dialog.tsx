import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { ProjectIcon } from "@/components/deploy/project-icon";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { projectSearchQueryOptions } from "@/features/projects/queries";
import { getErrorMessage } from "@/lib/api-error";
import { hostFromUrl } from "@/lib/format";

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

function ProjectSearchResults({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (projectId: string) => void;
}) {
  const { data, isPending, isError, error } = useQuery(
    projectSearchQueryOptions(search),
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="px-3 py-6 text-center text-label text-destructive">
        {getErrorMessage(error)}
      </p>
    );
  }

  return (
    <>
      <CommandEmpty className="text-muted-foreground">
        No projects match “{search}”.
      </CommandEmpty>
      {data.items.length > 0 ? (
        <CommandGroup heading="Projects">
          {data.items.map((project) => (
            <CommandItem
              key={project.id}
              value={project.id}
              onSelect={() => onSelect(project.id)}
              className="gap-3"
            >
              <ProjectIcon size="sm" className="size-7" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{project.name}</span>
                <span className="truncate text-xs text-subtle">
                  {hostFromUrl(project.url)}
                </span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}
    </>
  );
}

function SidebarSearchButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md border border-border-strong bg-card px-3 text-sm text-subtle transition-colors hover:border-ring/70"
    >
      <Search className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">Find project…</span>
      <Kbd>F</Kbd>
    </button>
  );
}

function ProjectSearchDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDebouncedValue(search.trim());
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "f" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);

    if (!next) {
      setSearch("");
    }
  };

  const handleSelect = (projectId: string) => {
    handleOpenChange(false);
    navigate(`/projects/${projectId}`);
  };

  return (
    <>
      <SidebarSearchButton onClick={() => setOpen(true)} />
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Find project"
        description="Search your projects by name, slug or description"
        className="sm:max-w-lg"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search projects…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-80">
            <ProjectSearchResults
              search={deferredSearch}
              onSelect={handleSelect}
            />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export { ProjectSearchDialog, SidebarSearchButton };
