import { Navigate, Outlet } from "react-router";
import { SessionContext } from "@/components/auth/session-context";
import { SessionLoading } from "@/components/auth/session-loading";
import { useSession } from "@/hooks/use-session";

export function ProtectedRoute() {
  const { data: session, isPending, isError } = useSession();

  if (isPending) {
    return <SessionLoading />;
  }

  if (isError) {
    return <Navigate to="/sign-in?error=API_UNREACHABLE" replace />;
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <SessionContext value={session}>
      <Outlet />
    </SessionContext>
  );
}
