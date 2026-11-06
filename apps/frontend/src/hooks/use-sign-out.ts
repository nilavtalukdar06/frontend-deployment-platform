import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/auth";
import { sessionQueryKey } from "@/lib/session";

export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(sessionQueryKey, null);
    },
  });
};
