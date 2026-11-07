import { request } from "@/lib/axios";

export interface EnvironmentVariable {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export const listEnvironmentVariables = (
  projectId: string,
  signal?: AbortSignal,
) =>
  request<EnvironmentVariable[]>({
    url: `/projects/${projectId}/environment-variables`,
    signal,
  });

export const saveEnvironmentVariable = (
  projectId: string,
  key: string,
  value: string,
) =>
  request<EnvironmentVariable>({
    method: "PUT",
    url: `/projects/${projectId}/environment-variables/${encodeURIComponent(key)}`,
    data: { value },
  });

export const deleteEnvironmentVariable = (projectId: string, key: string) =>
  request<undefined>({
    method: "DELETE",
    url: `/projects/${projectId}/environment-variables/${encodeURIComponent(key)}`,
  });
