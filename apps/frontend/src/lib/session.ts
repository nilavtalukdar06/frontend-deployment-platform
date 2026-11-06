import { queryOptions } from "@tanstack/react-query";
import { loadSession } from "@/lib/auth";

export const sessionQueryKey = ["session"] as const;

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: loadSession,
  staleTime: Infinity,
  retry: false,
});
