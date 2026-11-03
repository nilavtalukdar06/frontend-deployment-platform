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

let sessionRequest: Promise<Session | null> | undefined;

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

const requestCurrentUser = async (
  accessToken: string,
): Promise<CurrentUser | null> => {
  const response = await fetch(`${env.VITE_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    return null;
  }

  const parsed = currentUserResponseSchema.safeParse(await response.json());

  return parsed.success ? parsed.data.data : null;
};

const requestSession = async (): Promise<Session | null> => {
  const accessToken = await requestAccessToken();

  if (!accessToken) {
    return null;
  }

  const user = await requestCurrentUser(accessToken);

  return user ? { accessToken, user } : null;
};

export const loadSession = (): Promise<Session | null> => {
  sessionRequest ??= requestSession();
  return sessionRequest;
};

export const signInWithGithub = (): void => {
  window.location.href = `${env.VITE_API_URL}/auth/github`;
};

export const signOut = async (accessToken: string): Promise<void> => {
  const response = await fetch(`${env.VITE_API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("sign out failed");
  }

  sessionRequest = undefined;
};
