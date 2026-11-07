import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SessionLoading } from "@/components/auth/session-loading";
import DashboardLayout from "@/components/deploy/dashboard-layout";
import { RouteErrorBoundary } from "@/components/states/route-error-boundary";
import AuthCallbackPage from "@/pages/auth-callback/auth-callback-page";
import SignInPage from "@/pages/sign-in/sign-in-page";

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    hydrateFallbackElement: <SessionLoading />,
    children: [
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
            path: "/theme",
            lazy: () =>
              import("@/pages/theme/theme-page").then((module) => ({
                Component: module.default,
              })),
          },
          {
            element: <DashboardLayout />,
            errorElement: <RouteErrorBoundary />,
            children: [
              {
                index: true,
                lazy: () =>
                  import("@/pages/projects/projects-page").then((module) => ({
                    Component: module.default,
                  })),
              },
              {
                path: "new",
                lazy: () =>
                  import("@/pages/new-project/import-repository-page").then(
                    (module) => ({ Component: module.default }),
                  ),
              },
              {
                path: "new/:repositoryId",
                lazy: () =>
                  import("@/pages/new-project/configure-project-page").then(
                    (module) => ({ Component: module.default }),
                  ),
              },
              {
                path: "projects/:projectId",
                lazy: () =>
                  import("@/pages/project/project-layout").then((module) => ({
                    Component: module.default,
                  })),
                children: [
                  {
                    index: true,
                    lazy: () =>
                      import("@/pages/project/overview/overview-page").then(
                        (module) => ({ Component: module.default }),
                      ),
                  },
                  {
                    path: "deployments",
                    lazy: () =>
                      import("@/pages/project/deployments/deployments-page").then(
                        (module) => ({ Component: module.default }),
                      ),
                  },
                  {
                    path: "deployments/:deploymentId",
                    lazy: () =>
                      import("@/pages/project/deployment-detail/deployment-detail-page").then(
                        (module) => ({ Component: module.default }),
                      ),
                  },
                  {
                    path: "analytics",
                    lazy: () =>
                      import("@/pages/project/analytics/analytics-page").then(
                        (module) => ({ Component: module.default }),
                      ),
                  },
                  {
                    path: "settings",
                    lazy: () =>
                      import("@/pages/project/settings/settings-page").then(
                        (module) => ({ Component: module.default }),
                      ),
                  },
                ],
              },
              {
                path: "*",
                lazy: () =>
                  import("@/pages/not-found/not-found-page").then((module) => ({
                    Component: module.default,
                  })),
              },
            ],
          },
        ],
      },
    ],
  },
]);
