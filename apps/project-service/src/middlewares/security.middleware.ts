import compression from "compression";
import helmet from "helmet";
import type { Application } from "express";

export const applySecurityMiddlewares = (app: Application): void => {
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "default-src": ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
    }),
  );

  app.use(compression());
};
