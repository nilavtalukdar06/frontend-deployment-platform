import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/config/env";
import { ApiRequestError, toApiRequestError } from "@/lib/api-error";
import { getAccessToken } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { sessionQueryOptions } from "@/lib/session";

export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

const retriedRequests = new WeakSet<InternalAxiosRequestConfig>();

const NON_REFRESHABLE_ERROR_CODES = new Set(["GITHUB_AUTH_REQUIRED"]);

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

api.interceptors.response.use(undefined, async (error: unknown) => {
  const normalized = toApiRequestError(error);

  if (
    !axios.isAxiosError(error) ||
    !(normalized instanceof ApiRequestError) ||
    normalized.status !== 401 ||
    NON_REFRESHABLE_ERROR_CODES.has(normalized.errorCode) ||
    !error.config ||
    retriedRequests.has(error.config)
  ) {
    throw normalized;
  }

  retriedRequests.add(error.config);

  const session = await queryClient.query({
    ...sessionQueryOptions,
    staleTime: 0,
  });

  if (!session) {
    throw normalized;
  }

  return api(error.config);
});

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await api.request<ApiEnvelope<T>>(config);

  return response.data.data;
};
