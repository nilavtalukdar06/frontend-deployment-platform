import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "@/components/auth/protected-route";
import AuthCallbackPage from "@/pages/auth-callback/auth-callback-page";
import HomePage from "@/pages/home/home-page";
import SignInPage from "@/pages/sign-in/sign-in-page";
import ThemePage from "@/pages/theme/theme-page";

export const router = createBrowserRouter([
  {
    path: "/sign-in",
    element: <SignInPage />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/theme",
        element: <ThemePage />,
      },
    ],
  },
]);
