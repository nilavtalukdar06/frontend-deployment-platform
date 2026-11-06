import { env } from "./env";

export interface UpstreamService {
  name: string;
  url: string;
}

export const authService: UpstreamService = {
  name: "auth-service",
  url: env.AUTH_SERVICE_URL,
};

export const projectService: UpstreamService = {
  name: "project-service",
  url: env.PROJECT_SERVICE_URL,
};

export const realtimeService: UpstreamService = {
  name: "realtime-service",
  url: env.REALTIME_SERVICE_URL,
};
