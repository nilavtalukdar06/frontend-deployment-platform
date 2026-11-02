import type { AccessTokenClaims } from "../services/token.service";

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenClaims;
    }
  }
}
