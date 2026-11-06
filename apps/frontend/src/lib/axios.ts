import axios, { type InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { getAccessToken } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { sessionQueryOptions } from "@/lib/session";

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

const retriedRequests = new WeakSet<InternalAxiosRequestConfig>();

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (
    !axios.isAxiosError(error) ||
    error.response?.status !== 401 ||
    !error.config ||
    retriedRequests.has(error.config)
  ) {
    throw error;
  }

  retriedRequests.add(error.config);

  const session = await queryClient.query({
    ...sessionQueryOptions,
    staleTime: 0,
  });

  if (!session) {
    throw error;
  }

  return api(error.config);
});
