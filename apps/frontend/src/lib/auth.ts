import { z } from "zod";
import { env } from "../config/env";

const refreshResponseSchema = z.object({
  data: z.object({ accessToken: z.string().min(1) }),
});

const currentUserSchema = z.object({
  id: z.string(),
  githubLogin: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  status: z.string(),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});

const currentUserResponseSchema = z.object({ data: currentUserSchema });

export type CurrentUser = z.infer<typeof currentUserSchema>;

export interface Session {
  accessToken: string;
  user: CurrentUser;
}

let currentAccessToken: string | null = null;

export const getAccessToken = (): string | null => currentAccessToken;

const requestAccessToken = async (): Promise<string | null> => {
  const response = await fetch(`${env.VITE_API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("token refresh failed");
  }

  const parsed = refreshResponseSchema.safeParse(await response.json());

  return parsed.success ? parsed.data.data.accessToken : null;
};

const requestCurrentUser = async (
  accessToken: string,
): Promise<CurrentUser | null> => {
  const response = await fetch(`${env.VITE_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("current user request failed");
  }

  const parsed = currentUserResponseSchema.safeParse(await response.json());

  return parsed.success ? parsed.data.data : null;
};

export const loadSession = async (): Promise<Session | null> => {
  const accessToken = await requestAccessToken();

  if (!accessToken) {
    currentAccessToken = null;
    return null;
  }

  const user = await requestCurrentUser(accessToken);

  if (!user) {
    currentAccessToken = null;
    return null;
  }

  currentAccessToken = accessToken;

  return { accessToken, user };
};

export const signInWithGithub = (): void => {
  window.location.href = `${env.VITE_API_URL}/auth/github`;
};

export const signOut = async (): Promise<void> => {
  const response = await fetch(`${env.VITE_API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: currentAccessToken
      ? { Authorization: `Bearer ${currentAccessToken}` }
      : undefined,
  });

  if (!response.ok) {
    throw new Error("sign out failed");
  }

  currentAccessToken = null;
};
