import { createDocsRouter } from "@repo/http/docs";
import { openApiDocument } from "../docs/openapi";

export const docsRouter = createDocsRouter(openApiDocument, {
  title: "Logs Service API",
  persistAuthorization: true,
});
