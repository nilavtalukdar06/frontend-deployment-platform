import { useOutletContext } from "react-router";
import type { Project } from "@/features/projects/types";

export interface ProjectOutletContext {
  project: Project;
}

export const useProject = (): Project =>
  useOutletContext<ProjectOutletContext>().project;
