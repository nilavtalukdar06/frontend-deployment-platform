import { createContext, useContext } from "react";
import type { Session } from "@/lib/auth";

export const SessionContext = createContext<Session | null>(null);

export const useAuthenticatedSession = (): Session => {
  const session = useContext(SessionContext);

  if (!session) {
    throw new Error(
      "useAuthenticatedSession must be used inside ProtectedRoute",
    );
  }

  return session;
};
