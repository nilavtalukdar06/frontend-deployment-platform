import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocation, useNavigate } from "react-router";
import { ChevronsUpDown, Plus } from "lucide-react";
import { ProjectIcon } from "@/components/deploy/project-icon";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  projectQueryOptions,
  projectSearchQueryOptions,
} from "@/features/projects/queries";

const PROJECT_SECTION_PATTERN =
  /^\/projects\/[^/]+\/(deployments|analytics|settings)/;

function SwitcherResults({
  search,
  currentProjectId,
  onSelect,
}: {
  search: string;
  currentProjectId: string;
  onSelect: (projectId: string) => void;
}) {
  const { data, isPending } = useQuery(projectSearchQueryOptions(search));

  if (isPending) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  return (
    <>
      <CommandEmpty className="text-muted-foreground">
        No projects found.
      </CommandEmpty>
      {data && data.items.length > 0 ? (
        <CommandGroup heading="Projects">
          {data.items.map((project) => (
            <CommandItem
              key={project.id}
              value={project.id}
              data-checked={project.id === currentProjectId}
              onSelect={() => onSelect(project.id)}
            >
              <ProjectIcon size="sm" className="size-6 [&_svg]:size-3" />
              <span className="truncate">{project.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}
    </>
  );
}

function ProjectSwitcher({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDebouncedValue(search.trim());
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: project, isPending } = useQuery(projectQueryOptions(projectId));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);

    if (!next) {
      setSearch("");
    }
  };

  const go = (path: string) => {
    handleOpenChange(false);
    navigate(path);
  };

  const handleSelect = (nextProjectId: string) => {
    const section = PROJECT_SECTION_PATTERN.exec(pathname)?.[1];
    go(
      section
        ? `/projects/${nextProjectId}/${section}`
        : `/projects/${nextProjectId}`,
    );
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors outline-none hover:bg-accent focus-visible:ring-1 focus-visible:ring-ring aria-expanded:bg-accent">
        {isPending ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <span className="max-w-56 truncate">
            {project?.name ?? "Project"}
          </span>
        )}
        <ChevronsUpDown className="size-3.5 text-subtle" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Switch project…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <SwitcherResults
              search={deferredSearch}
              currentProjectId={projectId}
              onSelect={handleSelect}
            />
            <CommandSeparator />
            <CommandGroup>
              <CommandItem value="new-project" onSelect={() => go("/new")}>
                <Plus />
                New project
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { ProjectSwitcher };
