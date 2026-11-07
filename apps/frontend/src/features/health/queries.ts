import { queryOptions } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export type PlatformHealth = "operational" | "degraded" | "unreachable";

const HEALTH_POLL_INTERVAL_MS = 60_000;

const getPlatformHealth = async (
  signal?: AbortSignal,
): Promise<PlatformHealth> => {
  try {
    const response = await api.get("/health", {
      signal,
      validateStatus: (status) => status === 200 || status === 503,
    });

    return response.status === 200 ? "operational" : "degraded";
  } catch {
    return "unreachable";
  }
};

export const platformHealthQueryOptions = () =>
  queryOptions({
    queryKey: ["health"] as const,
    queryFn: ({ signal }) => getPlatformHealth(signal),
    refetchInterval: HEALTH_POLL_INTERVAL_MS,
    staleTime: HEALTH_POLL_INTERVAL_MS,
  });
