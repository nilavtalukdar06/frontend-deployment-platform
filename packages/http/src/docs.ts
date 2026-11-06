import { Router } from "express";
import swaggerUi from "swagger-ui-express";

export interface DocsRouterOptions {
  title: string;
  persistAuthorization?: boolean;
}

export const createDocsRouter = (
  openApiDocument: object,
  { title, persistAuthorization = false }: DocsRouterOptions,
): Router => {
  const router = Router();

  router.get("/docs.json", (_req, res) => {
    res.json(openApiDocument);
  });

  router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: title,
      ...(persistAuthorization
        ? { swaggerOptions: { persistAuthorization: true } }
        : {}),
    }),
  );

  return router;
};
