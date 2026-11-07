import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cancelDeployment, createDeployment } from "@/features/deployments/api";
import { deploymentKeys } from "@/features/deployments/queries";
import { projectKeys } from "@/features/projects/queries";

export const useRedeploy = (projectId: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => createDeployment(projectId),
    onSuccess: (deployment) => {
      toast.success("Deployment queued");
      void queryClient.invalidateQueries({
        queryKey: deploymentKeys.project(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      navigate(`/projects/${projectId}/deployments/${deployment.id}`);
    },
  });
};

const REDEPLOY_PROMPT_ID = "redeploy-prompt";

export const useRedeployPrompt = (projectId: string, projectName: string) => {
  const redeploy = useRedeploy(projectId);

  return () => {
    toast("Variables changed", {
      id: `${REDEPLOY_PROMPT_ID}:${projectId}`,
      description: `Redeploy ${projectName} to see the changes.`,
      duration: Number.POSITIVE_INFINITY,
      cancel: { label: "Cancel", onClick: () => undefined },
      action: { label: "Redeploy", onClick: () => redeploy.mutate() },
    });
  };
};

export const useCancelDeployment = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deploymentId: string) =>
      cancelDeployment(projectId, deploymentId),
    onSuccess: (deployment) => {
      toast.success("Deployment canceled");
      queryClient.setQueryData(
        deploymentKeys.detail(projectId, deployment.id),
        deployment,
      );
      void queryClient.invalidateQueries({
        queryKey: deploymentKeys.project(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
};
