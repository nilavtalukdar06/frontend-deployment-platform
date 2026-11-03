import { env } from "../config/env";
import { ErrorMessage } from "../middlewares/error-handler.middleware";
import { HealthMessage } from "../routes/health.route";

type JsonObject = Record<string, unknown>;

const textContent = (example: string) => ({
  "text/plain": { schema: { type: "string" }, example },
});

const jsonContent = (schemaName: string, example: unknown) => ({
  "application/json": {
    schema: { $ref: `#/components/schemas/${schemaName}` },
    example,
  },
});

const siteServer = {
  url: `http://{site}.${env.ROOT_DOMAIN}:${env.PORT}`,
  description:
    "A deployed site. `{site}` is a project slug (serves the project's latest ready deployment) or a deployment id (serves that exact deployment).",
  variables: {
    site: {
      default: "happy-tiger",
      description: "Project slug (`^[a-z]+-[a-z]+$`) or deployment uuid.",
    },
  },
};

const sitePathParameter = {
  name: "path",
  in: "path",
  required: true,
  description:
    "Path of the file inside the deployment's build output. Empty or trailing-slash paths serve `index.html` from that directory. Paths without a file extension that do not exist fall back to the root `index.html` so client-side routes work.",
  schema: { type: "string" },
  example: "assets/index-rkEG5X4P.js",
};

const siteResponses: JsonObject = {
  "200": {
    description:
      "The file from the deployment's build output, streamed from S3 with its stored content type. `.html` files are sent with `Cache-Control: no-cache`, files under `assets/` with a one year immutable cache, everything else with `max-age=0, must-revalidate`.",
    headers: {
      "Cache-Control": { schema: { type: "string" } },
      ETag: { schema: { type: "string" } },
      "Last-Modified": { schema: { type: "string" } },
      "X-Deployment-Id": {
        description: "Id of the deployment that served the file.",
        schema: { type: "string", format: "uuid" },
      },
    },
    content: {
      "*/*": { schema: { type: "string", format: "binary" } },
    },
  },
  "304": {
    description: "The `If-None-Match` header matches the file's current ETag.",
  },
  "400": {
    description: "The path is not a valid file path.",
    content: textContent("Bad Request"),
  },
  "404": {
    description:
      "No ready deployment exists for the host, or the requested file (with an extension) is not part of the build output.",
    content: textContent("Deployment not found"),
  },
  "405": {
    description: "Only `GET` and `HEAD` are supported on deployed sites.",
    headers: { Allow: { schema: { type: "string", example: "GET, HEAD" } } },
    content: textContent("Method Not Allowed"),
  },
  "502": {
    description: "The database or S3 could not be reached.",
    content: jsonContent("ErrorResponse", {
      success: false,
      statusCode: 502,
      message: ErrorMessage.INTERNAL_SERVER_ERROR,
    }),
  },
};

const getSiteFile: JsonObject = {
  tags: ["Sites"],
  operationId: "getSiteFile",
  summary: "Serve a file from a deployed site",
  servers: [siteServer],
  parameters: [
    sitePathParameter,
    {
      name: "If-None-Match",
      in: "header",
      required: false,
      schema: { type: "string" },
    },
  ],
  responses: siteResponses,
};

const headSiteFile: JsonObject = {
  ...getSiteFile,
  operationId: "headSiteFile",
  summary: "Read the headers of a file from a deployed site",
};

const health: JsonObject = {
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Service health",
  description:
    "Only served on the root domain host, never on a site subdomain. Checks the Postgres connection and responds with 503 when it is down.",
  responses: {
    "200": {
      description: "Postgres is reachable.",
      content: jsonContent("HealthResponse", {
        success: true,
        statusCode: 200,
        message: HealthMessage.HEALTH_OK,
        data: { postgres: "up", uptime: 1234.56 },
      }),
    },
    "503": {
      description: "Postgres is unreachable.",
      content: jsonContent("HealthResponse", {
        success: false,
        statusCode: 503,
        message: HealthMessage.SERVICE_UNAVAILABLE,
        data: { postgres: "down", uptime: 1234.56 },
      }),
    },
  },
};

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Proxy Service",
    version: "1.0.0",
    description: `Serves deployed sites from S3 by host name. Requests to \`<site>.${env.ROOT_DOMAIN}\` are mapped to the \`__outputs/<deploymentId>/\` prefix of the deployments bucket. The health and docs routes are only available on the root domain host. This service is reached directly by site visitors, not through the api-gateway.`,
  },
  servers: [
    {
      url: `http://${env.ROOT_DOMAIN}:${env.PORT}`,
      description: "Root domain host",
    },
  ],
  tags: [
    { name: "Sites", description: "Static files of deployed sites." },
    { name: "Health", description: "Service health." },
  ],
  paths: {
    "/health": { get: health },
    "/{path}": { get: getSiteFile, head: headSiteFile },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: "object",
        required: ["success", "statusCode", "message", "data"],
        properties: {
          success: { type: "boolean" },
          statusCode: { type: "integer" },
          message: { type: "string" },
          data: {
            type: "object",
            required: ["postgres", "uptime"],
            properties: {
              postgres: { type: "string", enum: ["up", "down"] },
              uptime: { type: "number" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "statusCode", "message"],
        properties: {
          success: { type: "boolean", const: false },
          statusCode: { type: "integer" },
          message: { type: "string" },
        },
      },
    },
  },
};
