import { Link } from "react-router";
import {
  ArrowUpRight,
  Ellipsis,
  Rocket,
  RotateCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRedeploy } from "@/features/deployments/mutations";
import type { Project } from "@/features/projects/types";

function ProjectActionsMenu({ project }: { project: Project }) {
  const redeploy = useRedeploy(project.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative z-10 text-muted-foreground"
            aria-label={`Actions for ${project.name}`}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={<a href={project.url} target="_blank" rel="noreferrer" />}
          >
            <ArrowUpRight />
            Visit
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link to={`/projects/${project.id}/deployments`} />}
          >
            <Rocket />
            Deployments
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link to={`/projects/${project.id}/settings`} />}
          >
            <Settings />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={redeploy.isPending}
            onClick={() => redeploy.mutate()}
          >
            <RotateCw />
            Redeploy
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ProjectActionsMenu };
