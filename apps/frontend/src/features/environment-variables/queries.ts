import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteEnvironmentVariable,
  listEnvironmentVariables,
  saveEnvironmentVariable,
} from "@/features/environment-variables/api";

export const environmentVariableKeys = {
  list: (projectId: string) => ["environment-variables", projectId] as const,
};

export const environmentVariablesQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: environmentVariableKeys.list(projectId),
    queryFn: ({ signal }) => listEnvironmentVariables(projectId, signal),
  });

export const useSaveEnvironmentVariable = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      saveEnvironmentVariable(projectId, key, value),
    meta: { silent: true },
    onSuccess: (variable) => {
      toast.success(`Saved ${variable.key}`);
      void queryClient.invalidateQueries({
        queryKey: environmentVariableKeys.list(projectId),
      });
    },
  });
};

export const useDeleteEnvironmentVariable = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) => deleteEnvironmentVariable(projectId, key),
    onSuccess: (_result, key) => {
      toast.success(`Removed ${key}`);
      void queryClient.invalidateQueries({
        queryKey: environmentVariableKeys.list(projectId),
      });
    },
  });
};
