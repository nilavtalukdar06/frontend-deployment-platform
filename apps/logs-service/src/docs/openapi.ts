import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import {
  DEFAULT_LOG_PAGE_SIZE,
  MAX_LOG_PAGE_SIZE,
} from "../validators/deployment-log.validator";

type JsonObject = Record<string, unknown>;

const serviceDescription = `Deployment logs for the React deployment platform.

**How it works.** The deployment-service publishes every log event of a deployment to the Kafka topic \`deployment-logs\`. This service consumes the topic (consumer group \`KAFKA_CONSUMER_GROUP_ID\`, so every event is handled by exactly one instance) and stores the events in the ClickHouse table \`log_events\`. The same process serves the read API below, which pages through the stored events of one deployment.

**Authentication.** The service is not exposed to clients directly; the api-gateway verifies the bearer token and forwards the user in the \`x-user-id\` header. A missing or malformed \`x-user-id\` is rejected with \`401 UNAUTHORIZED\`. A deployment is only readable by the owner of its project; deployments of other users and of deleted projects behave as if they did not exist (\`404\`).

**Live logs.** This API only returns stored history. The live stream of a running deployment is served by the realtime-service over Socket.IO.`;

const errorSchema: JsonObject = {
  type: "object",
  required: ["success", "statusCode", "errorCode", "message"],
  properties: {
    success: { type: "boolean", example: false },
    statusCode: { type: "integer", example: 404 },
    errorCode: {
      type: "string",
      enum: Object.values(ErrorCode),
      example: ErrorCode.NOT_FOUND,
    },
    message: { type: "string", example: ErrorMessage.DEPLOYMENT_NOT_FOUND },
    details: {
      description:
        "Extra information. For `VALIDATION_ERROR` the Zod error tree of the failing input.",
    },
  },
};

const messageResponseSchema: JsonObject = {
  type: "object",
  required: ["success", "statusCode", "message"],
  properties: {
    success: { type: "boolean", example: true },
    statusCode: { type: "integer", example: 200 },
    message: {
      type: "string",
      example: SuccessMessage.DEPLOYMENT_LOGS_RETRIEVED,
    },
  },
};

const exampleDeploymentLogs = {
  items: [
    {
      id: "0d8f7c2e-6a41-4d58-9a8e-5b0c4e2f1a37",
      sequence: 1,
      timestamp: "2026-11-03T10:00:05.120Z",
      type: "step",
      level: null,
      step: "initialize",
      source: null,
      phase: "started",
      status: null,
      message: "Initialize step started",
    },
    {
      id: "6b1e9d34-2c75-4f0a-8e13-7a9d5c4b2e68",
      sequence: 2,
      timestamp: "2026-11-03T10:00:05.134Z",
      type: "log",
      level: "info",
      step: "initialize",
      source: "system",
      phase: null,
      status: null,
      message: "Starting deployment 0194f4d2-7b1a-7c3e-9a55-3e2f1b0c9d84",
    },
    {
      id: "c4a2f6b8-91d3-4e07-b5a6-1f8e3d7c0b92",
      sequence: 3,
      timestamp: "2026-11-03T10:00:06.870Z",
      type: "log",
      level: "info",
      step: "install",
      source: "stdout",
      phase: null,
      status: null,
      message: "added 312 packages in 4s",
    },
  ],
  nextAfter: 3,
  hasMore: true,
};

const schemas: Record<string, JsonObject> = {
  ErrorResponse: errorSchema,
  MessageResponse: messageResponseSchema,
  DeploymentLog: {
    type: "object",
    required: [
      "id",
      "sequence",
      "timestamp",
      "type",
      "level",
      "step",
      "source",
      "phase",
      "status",
      "message",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      sequence: {
        type: "integer",
        minimum: 1,
        description:
          "Position of the event in the deployment's log stream, starting at 1 and unique per deployment. Logs are returned in this order and `after` filters on it.",
        example: 12,
      },
      timestamp: {
        type: "string",
        format: "date-time",
        description:
          "When the deployment pipeline emitted the event. Falls back to the time the event was stored when it is missing.",
      },
      type: {
        type: ["string", "null"],
        enum: ["log", "step", "status", "end", null],
        description:
          "`log` is a line of output, `step` marks a pipeline step starting, completing or failing, `status` is a deployment status change, and `end` is the last event of the stream.",
      },
      level: {
        type: ["string", "null"],
        enum: ["debug", "info", "warn", "error", null],
        description: "Only set for `log` events.",
      },
      step: {
        type: ["string", "null"],
        enum: [
          "initialize",
          "clone",
          "install",
          "build",
          "upload",
          "finalize",
          null,
        ],
        description: "Pipeline step. Only set for `log` and `step` events.",
      },
      source: {
        type: ["string", "null"],
        enum: ["system", "stdout", "stderr", null],
        description: "Where a `log` line came from. Only set for `log` events.",
      },
      phase: {
        type: ["string", "null"],
        enum: ["started", "completed", "failed", null],
        description: "Only set for `step` events.",
      },
      status: {
        type: ["string", "null"],
        enum: [
          "queued",
          "cloning",
          "installing",
          "building",
          "uploading",
          "ready",
          "failed",
          "canceled",
          null,
        ],
        description:
          "Deployment status. Only set for `status` and `end` events.",
      },
      message: { type: "string", example: "Install step started" },
    },
  },
  DeploymentLogList: {
    type: "object",
    required: ["items", "nextAfter", "hasMore"],
    properties: {
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/DeploymentLog" },
      },
      nextAfter: {
        type: "integer",
        minimum: 0,
        description:
          "Sequence of the last returned event, or the requested `after` when `items` is empty. Pass it as `after` to fetch the next page, or to poll for new events of a running deployment.",
        example: 3,
      },
      hasMore: {
        type: "boolean",
        description: "Whether more events are available right now.",
      },
    },
  },
  DeploymentLogsResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/DeploymentLogList" },
        },
      },
    ],
  },
};

const errorContent = (example: JsonObject) => ({
  "application/json": {
    schema: { $ref: "#/components/schemas/ErrorResponse" },
    example,
  },
});

const health: JsonObject = {
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Health check",
  description:
    "Reports whether the service can reach Postgres (deployment ownership checks) and ClickHouse (log events).",
  responses: {
    "200": {
      description: "Postgres and ClickHouse are reachable.",
      content: {
        "application/json": {
          example: {
            success: true,
            statusCode: 200,
            message: SuccessMessage.HEALTH_OK,
            data: { postgres: "up", clickhouse: "up", uptime: 1234.56 },
          },
        },
      },
    },
    "503": {
      description:
        "Postgres or ClickHouse is unreachable. The body uses the success envelope with `success: false`.",
      content: {
        "application/json": {
          example: {
            success: false,
            statusCode: 503,
            message: ErrorMessage.SERVICE_UNAVAILABLE,
            data: { postgres: "up", clickhouse: "down", uptime: 1234.56 },
          },
        },
      },
    },
  },
};

const listDeploymentLogs: JsonObject = {
  tags: ["Deployment logs"],
  operationId: "listDeploymentLogs",
  summary: "List a deployment's logs",
  description:
    "Returns the log events of a deployment in the order the pipeline emitted them (ascending `sequence`). The deployment-service publishes every event to the Kafka topic `deployment-logs` and this service stores them in the ClickHouse table `log_events`, so this route reads from ClickHouse and logs show up a moment after they are produced. The deployment must belong to a project owned by the user, otherwise `404`. Pages are cursor based: pass the `nextAfter` of the previous response as `after` to get the following events, which also lets a client poll a running deployment for new lines; `hasMore` tells whether the page was full. A deployment that has not emitted anything yet returns an empty `items` array. For a running deployment the live stream is served by the `realtime-service` over Socket.IO: subscribe there first, load the history here and merge by `sequence`. Events delivered twice by Kafka are returned once. If ClickHouse cannot be reached the response is `500`.",
  security: [{ userIdHeader: [] }],
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      description:
        "Identifier of a deployment of a project owned by the authenticated user.",
      schema: { type: "string", format: "uuid" },
    },
    {
      name: "after",
      in: "query",
      required: false,
      description: "Only return events with a `sequence` greater than this.",
      schema: { type: "integer", minimum: 0, default: 0 },
    },
    {
      name: "limit",
      in: "query",
      required: false,
      schema: {
        type: "integer",
        minimum: 1,
        maximum: MAX_LOG_PAGE_SIZE,
        default: DEFAULT_LOG_PAGE_SIZE,
      },
    },
  ],
  responses: {
    "200": {
      description: "A page of log events.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/DeploymentLogsResponse" },
          example: {
            success: true,
            statusCode: 200,
            message: SuccessMessage.DEPLOYMENT_LOGS_RETRIEVED,
            data: exampleDeploymentLogs,
          },
        },
      },
    },
    "400": {
      description:
        "`VALIDATION_ERROR`: `id` is not a UUID, or `after` / `limit` is not an integer in its allowed range.",
      content: errorContent({
        success: false,
        statusCode: 400,
        errorCode: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed for the given request",
      }),
    },
    "401": {
      description:
        "`UNAUTHORIZED`: the `x-user-id` header is missing or is not a UUID.",
      content: errorContent({
        success: false,
        statusCode: 401,
        errorCode: ErrorCode.UNAUTHORIZED,
        message: ErrorMessage.UNAUTHORIZED,
      }),
    },
    "404": {
      description:
        "`DEPLOYMENT_NOT_FOUND`: the deployment does not exist, or its project is not owned by this user or was deleted. Uses the `NOT_FOUND` error code.",
      content: errorContent({
        success: false,
        statusCode: 404,
        errorCode: ErrorCode.NOT_FOUND,
        message: ErrorMessage.DEPLOYMENT_NOT_FOUND,
      }),
    },
    "500": {
      description:
        "`INTERNAL_SERVER_ERROR`: Postgres or ClickHouse failed while reading the logs.",
      content: errorContent({
        success: false,
        statusCode: 500,
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
        message: "Something went wrong on our end",
      }),
    },
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "Logs Service API",
    version: "1.0.0",
    description: serviceDescription,
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Dependency checks." },
    {
      name: "Deployment logs",
      description: "Stored log events of a deployment.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/deployment/{id}/logs": { get: listDeploymentLogs },
  },
  components: {
    securitySchemes: {
      userIdHeader: {
        type: "apiKey",
        in: "header",
        name: "x-user-id",
        description:
          "Identifier of the authenticated user, set by the api-gateway after it verified the bearer token. Not meant to be sent by clients.",
      },
    },
    schemas,
  },
};
