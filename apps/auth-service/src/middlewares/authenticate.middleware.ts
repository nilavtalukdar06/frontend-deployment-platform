import type { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export abstract class AuthenticateMiddleware {
  static handle(req: Request, _res: Response, next: NextFunction): void {
    const accessToken = AuthenticateMiddleware.extractBearerToken(req);

    AuthService.authenticate(accessToken)
      .then((user) => {
        req.user = user;
        next();
      })
      .catch(next);
  }

  static extractBearerToken(req: Request): string | undefined {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    return scheme?.toLowerCase() === "bearer" ? token : undefined;
  }
}
