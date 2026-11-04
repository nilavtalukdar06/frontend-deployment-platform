import { env } from "../config/env";
import { HealthMessage } from "../routes/health.route";

type JsonObject = Record<string, unknown>;

const jsonContent = (schemaName: string, example: unknown) => ({
  "application/json": {
    schema: { $ref: `#/components/schemas/${schemaName}` },
    example,
  },
});

const health: JsonObject = {
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Service health",
  description: "Pings Redis and responds with 503 when it is down.",
  responses: {
    "200": {
      description: "Redis is reachable.",
      content: jsonContent("HealthResponse", {
        success: true,
        statusCode: 200,
        message: HealthMessage.HEALTH_OK,
        data: { redis: "up", uptime: 1234.56 },
      }),
    },
    "503": {
      description: "Redis is unreachable.",
      content: jsonContent("HealthResponse", {
        success: false,
        statusCode: 503,
        message: HealthMessage.SERVICE_UNAVAILABLE,
        data: { redis: "down", uptime: 1234.56 },
      }),
    },
  },
};

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Queue Dashboard",
    version: "1.0.0",
    description:
      "Real-time Bull Board UI for inspecting the `deployments` BullMQ queue shared by the project-service (producer) and the deployment-worker (consumer). The dashboard itself is served at `/admin/queues`, protected with HTTP Basic Auth, and is not a JSON API documented here.",
  },
  servers: [{ url: `http://localhost:${env.PORT}`, description: "Local" }],
  tags: [{ name: "Health", description: "Service health." }],
  paths: {
    "/health": { get: health },
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
            required: ["redis", "uptime"],
            properties: {
              redis: { type: "string", enum: ["up", "down"] },
              uptime: { type: "number" },
            },
          },
        },
      },
    },
  },
};
