import { Navigate, useSearchParams } from "react-router";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get("error");

  if (errorCode) {
    return (
      <Navigate
        to={`/sign-in?error=${encodeURIComponent(errorCode)}`}
        replace
      />
    );
  }

  return <Navigate to="/" replace />;
}
