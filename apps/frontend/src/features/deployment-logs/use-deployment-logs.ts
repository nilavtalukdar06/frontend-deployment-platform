import { useEffect, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DeploymentLogStore } from "@/features/deployment-logs/deployment-log-store";
import { deploymentKeys } from "@/features/deployments/queries";
import { isTerminalStatus } from "@/features/deployments/status";
import { projectKeys } from "@/features/projects/queries";
import type { DeploymentStatus } from "@/features/deployments/types";

interface UseDeploymentLogsOptions {
  projectId: string;
  deploymentId: string;
  status: DeploymentStatus;
}

export const useDeploymentLogs = ({
  projectId,
  deploymentId,
  status,
}: UseDeploymentLogsOptions) => {
  const queryClient = useQueryClient();
  const [store] = useState(
    () =>
      new DeploymentLogStore({
        deploymentId,
        isTerminal: isTerminalStatus(status),
        onStatusEvent: () => {
          void queryClient.invalidateQueries({
            queryKey: deploymentKeys.detail(projectId, deploymentId),
          });
        },
        onEnd: () => {
          void queryClient.invalidateQueries({
            queryKey: deploymentKeys.project(projectId),
          });
          void queryClient.invalidateQueries({ queryKey: projectKeys.all });
        },
      }),
  );

  useEffect(() => {
    store.start();

    return store.stop;
  }, [store]);

  useEffect(() => {
    if (isTerminalStatus(status)) {
      store.markTerminal();
    }
  }, [store, status]);

  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return { ...snapshot, retry: store.retry };
};
