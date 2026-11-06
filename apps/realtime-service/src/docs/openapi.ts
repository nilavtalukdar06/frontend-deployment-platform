type JsonObject = Record<string, unknown>;

const errorSchema: JsonObject = {
  type: "object",
  required: ["success", "statusCode", "message"],
  properties: {
    success: { type: "boolean", example: false },
    statusCode: { type: "integer", example: 503 },
    message: { type: "string", example: "Service is temporarily unavailable" },
  },
};

const healthExample = {
  success: true,
  statusCode: 200,
  message: "Service is healthy",
  data: { postgres: "up", redis: "up", uptime: 1234.56 },
};

const serviceDescription = `Realtime deployment logs for the React deployment platform, delivered over Socket.IO (WebSocket).

**How it works.** The \`deployment-service\` publishes every log event to the Kafka topic \`deployment-logs\`. Every instance of this service joins the same Kafka consumer group, so each event is consumed by exactly one instance. That instance emits it to the Socket.IO room of the deployment, and the Redis adapter (\`REDIS_URL\`, Redis pub/sub) relays it to every other instance, so a client receives its deployment's logs whichever instance it is connected to. Instances can be added and removed freely; the number of Kafka partitions of the topic bounds how many instances consume in parallel, the others only serve sockets. The service is horizontally scalable and keeps no per-instance state besides open connections.

**Connecting.** Connect to \`/socket.io/\` (through the api-gateway the path is the same) with the Socket.IO client, passing the access token issued by the auth-service in the handshake \`auth\` object. Use \`transports: ["websocket"]\`: the gateway proxies WebSocket upgrades, and long-polling requests are subject to the gateway's proxy timeout and rate limit.

\`\`\`js
const socket = io("https://api.example.com", {
  transports: ["websocket"],
  auth: { token: accessToken },
});
\`\`\`

The token is verified exactly as the api-gateway does (signature, issuer, audience, \`typ: access\`, not blacklisted, session still active). A connection with a missing or invalid token is refused with a \`connect_error\` whose \`data.code\` is \`UNAUTHORIZED\`, \`INVALID_TOKEN\` or \`SERVICE_UNAVAILABLE\`. A connection is closed when its access token expires, after the server emits \`auth:expired\`; reconnect with a fresh token.

**Client to server events** (each takes an acknowledgement callback):

- \`deployment:subscribe\` \`{ deploymentId }\`: start receiving the logs of a deployment of a project the user owns. Acknowledged with \`{ ok: true, data: { deploymentId, status } }\`, where \`status\` is the deployment's current status, or \`{ ok: false, code, message }\` with \`code\` one of \`VALIDATION_ERROR\` (not a UUID), \`NOT_FOUND\` (no such deployment for this user), \`SUBSCRIPTION_LIMIT\` (too many deployments followed on one connection) or \`INTERNAL_SERVER_ERROR\`.
- \`deployment:unsubscribe\` \`{ deploymentId }\`: stop receiving them. Acknowledged with \`{ ok: true, data: { deploymentId } }\`.

**Server to client events:**

- \`deployment:log\`: one log event, see the \`DeploymentLogMessage\` schema. Events of a deployment are emitted in order, and \`sequence\` is unique per deployment.
- \`auth:expired\`: the access token expired, the connection is about to be closed.

**History and gaps.** Only events produced while the client is subscribed are delivered; nothing is replayed. To show a deployment's full output, subscribe first, then load the history with \`GET /deployment/{id}/logs\` (logs-service, see the api-gateway documentation), and merge the two by \`sequence\`, dropping events already shown. Delivery is at-least-once, so an event can arrive twice; \`sequence\` is the de-duplication key. The final event of a deployment has \`type\` \`end\`.`;

const logMessageSchema: JsonObject = {
  type: "object",
  required: [
    "deploymentId",
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
    deploymentId: { type: "string", format: "uuid" },
    sequence: {
      type: "integer",
      minimum: 1,
      description:
        "Position of the event in the deployment's log stream, unique per deployment. Same value as `sequence` in `GET /deployment/{id}/logs`.",
      example: 12,
    },
    timestamp: { type: "string", format: "date-time" },
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
      description: "Only set for `log` events.",
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
      description: "Deployment status. Only set for `status` and `end` events.",
    },
    message: { type: "string", example: "Install step started" },
  },
  example: {
    deploymentId: "0194f4d2-7b1a-7c3e-9a55-3e2f1b0c9d84",
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
};

const health: JsonObject = {
  tags: ["Health"],
  operationId: "health",
  summary: "Health check",
  description:
    "Reports whether the service can reach Postgres (deployment ownership checks) and Redis (token checks and the Socket.IO adapter).",
  responses: {
    "200": {
      description: "Healthy.",
      content: { "application/json": { example: healthExample } },
    },
    "503": {
      description: "Postgres or Redis is unreachable.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
        },
      },
    },
  },
};

const socketHandshake: JsonObject = {
  tags: ["Socket.IO"],
  operationId: "socketHandshake",
  summary: "Socket.IO endpoint",
  description:
    "The Socket.IO (Engine.IO v4) endpoint. Clients are expected to use the Socket.IO client library rather than call it by hand; with `transport=websocket` the request is a WebSocket upgrade. The access token is sent in the Socket.IO handshake `auth` payload (`{ token }`), not as an HTTP header. See the service description for the events.",
  parameters: [
    {
      name: "EIO",
      in: "query",
      required: true,
      schema: { type: "string", enum: ["4"] },
    },
    {
      name: "transport",
      in: "query",
      required: true,
      schema: { type: "string", enum: ["websocket", "polling"] },
    },
  ],
  responses: {
    "101": {
      description: "Switching protocols: the WebSocket connection is open.",
    },
    "200": {
      description: "Engine.IO handshake packet (polling transport).",
    },
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "Realtime Service API",
    version: "1.0.0",
    description: serviceDescription,
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Dependency checks." },
    {
      name: "Socket.IO",
      description: "The realtime deployment log stream.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/socket.io/": { get: socketHandshake },
  },
  components: {
    schemas: {
      ErrorResponse: errorSchema,
      DeploymentLogMessage: logMessageSchema,
    },
  },
};
