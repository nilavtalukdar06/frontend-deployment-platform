import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiRequestError, getErrorMessage } from "@/lib/api-error";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      silent?: boolean;
    };
  }
}

const MAX_QUERY_RETRIES = 2;

const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (
    error instanceof ApiRequestError &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }

  return failureCount < MAX_QUERY_RETRIES;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 10_000,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      if (mutation.meta?.silent) {
        return;
      }

      toast.error(getErrorMessage(error));
    },
  }),
});
