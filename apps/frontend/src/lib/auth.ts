import { z } from "zod";
import { env } from "../config/env";

const refreshResponseSchema = z.object({
  data: z.object({ accessToken: z.string().min(1) }),
});

let accessTokenRequest: Promise<string | null> | undefined;

const requestAccessToken = async (): Promise<string | null> => {
  const response = await fetch(`${env.VITE_API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const parsed = refreshResponseSchema.safeParse(await response.json());

  return parsed.success ? parsed.data.data.accessToken : null;
};

export const getAccessToken = (): Promise<string | null> => {
  accessTokenRequest ??= requestAccessToken();
  return accessTokenRequest;
};

export const signInWithGithub = (): void => {
  window.location.href = `${env.VITE_API_URL}/auth/github`;
};
