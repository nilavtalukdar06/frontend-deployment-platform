import { authService } from "../config/services";
import { createServiceProxy } from "../middlewares/proxy.middleware";

export const authProxy = createServiceProxy(authService, "/auth");
