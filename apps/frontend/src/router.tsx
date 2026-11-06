import { createBrowserRouter } from "react-router";
import App from "@/App";
import ThemePage from "@/pages/theme/theme-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/theme",
    element: <ThemePage />,
  },
]);
