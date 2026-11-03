import { useEffect, useState } from "react";
import { getAccessToken, signInWithGithub } from "./lib/auth";

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "failed"; reason: string }
  | { status: "signed-in"; accessToken: string };

const callbackError = new URLSearchParams(window.location.search).get("error");

export default function App() {
  const [state, setState] = useState<AuthState>(
    callbackError
      ? { status: "failed", reason: callbackError }
      : { status: "loading" },
  );

  useEffect(() => {
    if (callbackError) {
      return;
    }

    getAccessToken()
      .then((accessToken) => {
        if (!accessToken) {
          setState({ status: "signed-out" });
          return;
        }

        window.history.replaceState({}, "", "/");
        setState({ status: "signed-in", accessToken });
      })
      .catch(() => setState({ status: "failed", reason: "API_UNREACHABLE" }));
  }, []);

  if (state.status === "signed-in") {
    return <div>{state.accessToken}</div>;
  }

  if (state.status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {state.status === "failed" && <p>Sign-in failed: {state.reason}</p>}
      <button type="button" onClick={signInWithGithub}>
        Sign in with GitHub
      </button>
    </div>
  );
}
