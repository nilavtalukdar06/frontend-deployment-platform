import type { AuthenticatedUser } from "../middlewares/authenticate.middleware";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
