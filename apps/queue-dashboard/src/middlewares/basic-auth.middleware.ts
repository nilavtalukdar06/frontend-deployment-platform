import basicAuth from "express-basic-auth";
import { env } from "../config/env";

export const dashboardAuth = basicAuth({
  users: { [env.DASHBOARD_USERNAME]: env.DASHBOARD_PASSWORD },
  challenge: true,
  realm: "queue-dashboard",
});
