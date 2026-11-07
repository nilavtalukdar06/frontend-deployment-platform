import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  createProject,
  deleteProject,
  installProjectWebhook,
  updateProject,
} from "@/features/projects/api";
import { projectKeys } from "@/features/projects/queries";
import { deploymentKeys } from "@/features/deployments/queries";
import { repositoryKeys } from "@/features/repositories/queries";
import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "@/features/projects/types";

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    meta: { silent: true },
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project);
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.all });
    },
  });
};

const storeProject = (
  queryClient: ReturnType<typeof useQueryClient>,
  project: Project,
) => {
  queryClient.setQueryData(projectKeys.detail(project.id), project);
  void queryClient.invalidateQueries({
    queryKey: projectKeys.all,
    predicate: (query) => query.queryKey[1] !== "detail",
  });
};

export const useUpdateProject = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => updateProject(projectId, input),
    meta: { silent: true },
    onSuccess: (project) => {
      storeProject(queryClient, project);
      toast.success("Project settings saved");
    },
  });
};

export const useInstallWebhook = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => installProjectWebhook(projectId),
    onSuccess: (project) => {
      storeProject(queryClient, project);
      toast.success("Webhook installed. Pushes now deploy automatically.");
    },
  });
};

export const useDeleteProject = (projectId: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      navigate("/", { replace: true });
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.removeQueries({
        queryKey: deploymentKeys.project(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.all });
      toast.success("Project deleted");
    },
  });
};
