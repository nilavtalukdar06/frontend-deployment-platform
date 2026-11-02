import { env } from "./env";

export interface UpstreamService {
  name: string;
  url: string;
}

export const authService: UpstreamService = {
  name: "auth-service",
  url: env.AUTH_SERVICE_URL,
};
