import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { projectFrameworks } from "../db/schema";

type JsonObject = Record<string, unknown>;
type Headers = Record<string, JsonObject>;

const USER_ID_HEADER = "x-user-id";

const jsonContent = (schemaName: string, example?: unknown) => ({
  "application/json": {
    schema: { $ref: `#/components/schemas/${schemaName}` },
    ...(example === undefined ? {} : { example }),
  },
});

const ref = (name: string) => ({ $ref: `#/components/responses/${name}` });

const errorExample = (
  statusCode: number,
  errorCode: ErrorCode,
  message: ErrorMessage,
  details?: unknown,
) => ({
  success: false,
  statusCode,
  errorCode,
  message,
  ...(details === undefined ? {} : { details }),
});

const errorResponse = (
  description: string,
  example: ReturnType<typeof errorExample>,
  headers?: Headers,
): JsonObject => ({
  description,
  ...(headers ? { headers } : {}),
  content: jsonContent("ErrorResponse", example),
});

const exampleProject = {
  id: "0192f5a4-7b1e-7c3a-9d2e-5f8a1b2c3d4e",
  name: "marketing-site",
  description: "Public marketing website",
  repositoryUrl: "https://github.com/acme/marketing-site",
  branch: "main",
  framework: "vite",
  rootDirectory: ".",
  installCommand: "npm install",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  createdAt: "2026-11-03T09:30:00.000Z",
  updatedAt: "2026-11-03T09:30:00.000Z",
};

const sharedErrorResponses = {
  "429": ref("TooManyRequests"),
  "500": ref("InternalServerError"),
};

const protectedErrorResponses = {
  "401": ref("Unauthorized"),
  ...sharedErrorResponses,
};

const projectIdParameter: JsonObject = {
  name: "id",
  in: "path",
  required: true,
  description: "Identifier of a project owned by the authenticated user.",
  schema: { type: "string", format: "uuid" },
};

const relativeDirectorySchema = (description: string): JsonObject => ({
  type: "string",
  minLength: 1,
  maxLength: 255,
  description: `${description} Trimmed before validation. Must be relative: it cannot start with \`/\` or contain a \`..\` segment.`,
});

const projectProperties: Record<string, JsonObject> = {
  name: {
    type: "string",
    minLength: 1,
    maxLength: 100,
    description:
      "Trimmed before validation. Unique per user among projects that are not deleted.",
    example: "marketing-site",
  },
  repositoryUrl: {
    type: "string",
    format: "uri",
    maxLength: 2048,
    pattern: "^https://",
    description: "HTTPS URL of the Git repository.",
    example: "https://github.com/acme/marketing-site",
  },
  branch: {
    type: "string",
    minLength: 1,
    maxLength: 255,
    pattern: "^[A-Za-z0-9._/-]+$",
    description: "Branch to build. Defaults to `main`.",
    example: "main",
  },
  framework: { $ref: "#/components/schemas/ProjectFramework" },
  rootDirectory: {
    ...relativeDirectorySchema(
      "Directory of the repository that contains the app. Defaults to `.`.",
    ),
    example: ".",
  },
  installCommand: {
    type: "string",
    minLength: 1,
    maxLength: 500,
    description: "Defaults to `npm install`.",
    example: "npm install",
  },
  buildCommand: {
    type: "string",
    minLength: 1,
    maxLength: 500,
    description: "Defaults to `npm run build`.",
    example: "npm run build",
  },
  outputDirectory: {
    ...relativeDirectorySchema(
      "Directory, relative to `rootDirectory`, that contains the build output. Defaults to `dist`.",
    ),
    example: "dist",
  },
};

const schemas: Record<string, JsonObject> = {
  ProjectFramework: {
    type: "string",
    enum: [...projectFrameworks],
    description: "Defaults to `vite`.",
  },
  CreateProjectRequest: {
    type: "object",
    additionalProperties: false,
    required: ["name", "repositoryUrl"],
    properties: {
      name: projectProperties["name"],
      description: {
        type: "string",
        maxLength: 500,
        description: "Trimmed before validation.",
        example: "Public marketing website",
      },
      repositoryUrl: projectProperties["repositoryUrl"],
      branch: projectProperties["branch"],
      framework: projectProperties["framework"],
      rootDirectory: projectProperties["rootDirectory"],
      installCommand: projectProperties["installCommand"],
      buildCommand: projectProperties["buildCommand"],
      outputDirectory: projectProperties["outputDirectory"],
    },
  },
  UpdateProjectRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    description:
      "Partial update. At least one field is required; fields that are omitted stay unchanged.",
    properties: {
      name: projectProperties["name"],
      description: {
        type: ["string", "null"],
        maxLength: 500,
        description: "Trimmed before validation. Send `null` to clear it.",
        example: "Public marketing website",
      },
      repositoryUrl: projectProperties["repositoryUrl"],
      branch: projectProperties["branch"],
      framework: projectProperties["framework"],
      rootDirectory: projectProperties["rootDirectory"],
      installCommand: projectProperties["installCommand"],
      buildCommand: projectProperties["buildCommand"],
      outputDirectory: projectProperties["outputDirectory"],
    },
  },
  Project: {
    type: "object",
    required: [
      "id",
      "name",
      "description",
      "repositoryUrl",
      "branch",
      "framework",
      "rootDirectory",
      "installCommand",
      "buildCommand",
      "outputDirectory",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      description: { type: ["string", "null"] },
      repositoryUrl: { type: "string", format: "uri" },
      branch: { type: "string" },
      framework: { $ref: "#/components/schemas/ProjectFramework" },
      rootDirectory: { type: "string" },
      installCommand: { type: "string" },
      buildCommand: { type: "string" },
      outputDirectory: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Pagination: {
    type: "object",
    required: ["page", "limit", "total", "totalPages"],
    properties: {
      page: { type: "integer", minimum: 1, example: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, example: 20 },
      total: {
        type: "integer",
        minimum: 0,
        description: "Number of projects owned by the user.",
        example: 1,
      },
      totalPages: { type: "integer", minimum: 0, example: 1 },
    },
  },
  ProjectList: {
    type: "object",
    required: ["items", "pagination"],
    properties: {
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/Project" },
      },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
  },
  HealthData: {
    type: "object",
    required: ["postgres", "redis", "uptime"],
    properties: {
      postgres: { type: "string", enum: ["up", "down"] },
      redis: { type: "string", enum: ["up", "down"] },
      uptime: {
        type: "number",
        description: "Process uptime in seconds.",
        example: 1234.56,
      },
    },
  },
  MessageResponse: {
    type: "object",
    required: ["success", "statusCode", "message"],
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string" },
    },
  },
  ProjectResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/Project" } },
      },
    ],
  },
  ProjectListResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/ProjectList" } },
      },
    ],
  },
  HealthResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/HealthData" } },
      },
    ],
  },
  ErrorCode: {
    type: "string",
    enum: Object.values(ErrorCode),
  },
  ErrorResponse: {
    type: "object",
    required: ["success", "statusCode", "errorCode", "message"],
    properties: {
      success: { type: "boolean", enum: [false] },
      statusCode: { type: "integer" },
      errorCode: { $ref: "#/components/schemas/ErrorCode" },
      message: { type: "string" },
      details: {
        description:
          "Optional context. For `VALIDATION_ERROR` it is the Zod tree-ified error (`errors` plus per-field `properties`); for the route-level `NOT_FOUND` of an unknown path it is `{ path }`.",
      },
      stack: {
        type: "string",
        description:
          "Stack trace. Only present when the service runs with `NODE_ENV=development`.",
      },
    },
  },
};

const responses: Record<string, JsonObject> = {
  ValidationError: errorResponse(
    "The request body, path parameters or query string failed validation.",
    errorExample(
      400,
      ErrorCode.VALIDATION_ERROR,
      ErrorMessage.VALIDATION_ERROR,
      {
        errors: [],
        properties: {
          repositoryUrl: {
            errors: ["Invalid URL"],
          },
        },
      },
    ),
  ),
  Unauthorized: errorResponse(
    `The \`${USER_ID_HEADER}\` header is missing or is not a UUID. Behind the api-gateway this cannot happen for a request with a valid bearer token.`,
    errorExample(401, ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED),
  ),
  ProjectNotFound: errorResponse(
    "No project with this id exists for the authenticated user. Projects owned by other users and deleted projects are reported the same way.",
    errorExample(404, ErrorCode.NOT_FOUND, ErrorMessage.PROJECT_NOT_FOUND),
  ),
  NameConflict: errorResponse(
    "The user already has a project with this name.",
    errorExample(
      409,
      ErrorCode.CONFLICT,
      ErrorMessage.PROJECT_NAME_ALREADY_EXISTS,
    ),
  ),
  TooManyRequests: errorResponse(
    "The per-client rate limit was exceeded (`RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS`). Standard `RateLimit-*` headers are returned on every response.",
    errorExample(
      429,
      ErrorCode.TOO_MANY_REQUESTS,
      ErrorMessage.TOO_MANY_REQUESTS,
    ),
  ),
  InternalServerError: errorResponse(
    "An unexpected error occurred.",
    errorExample(
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorMessage.INTERNAL_SERVER_ERROR,
    ),
  ),
};

const userIdSecurity = [{ userIdHeader: [] }];

const health: JsonObject = {
  security: [],
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Service health",
  description:
    "Checks the Postgres and Redis connections. Responds with 503 when either dependency is down.",
  responses: {
    "200": {
      description: "All dependencies are reachable.",
      content: jsonContent("HealthResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.HEALTH_OK,
        data: { postgres: "up", redis: "up", uptime: 1234.56 },
      }),
    },
    "503": {
      description:
        "At least one dependency is down. The body uses the success envelope with `success: false`.",
      content: jsonContent("HealthResponse", {
        success: false,
        statusCode: 503,
        message: ErrorMessage.SERVICE_UNAVAILABLE,
        data: { postgres: "up", redis: "down", uptime: 1234.56 },
      }),
    },
    "429": sharedErrorResponses["429"],
  },
};

const createProject: JsonObject = {
  tags: ["Projects"],
  operationId: "createProject",
  summary: "Create a project",
  security: userIdSecurity,
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/CreateProjectRequest" },
      },
    },
  },
  responses: {
    "201": {
      description: "Project created.",
      content: jsonContent("ProjectResponse", {
        success: true,
        statusCode: 201,
        message: SuccessMessage.PROJECT_CREATED,
        data: exampleProject,
      }),
    },
    "400": ref("ValidationError"),
    "409": ref("NameConflict"),
    ...protectedErrorResponses,
  },
};

const listProjects: JsonObject = {
  tags: ["Projects"],
  operationId: "listProjects",
  summary: "List the authenticated user's projects",
  description:
    "Newest projects first. Deleted projects and projects of other users are never returned.",
  security: userIdSecurity,
  parameters: [
    {
      name: "page",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, default: 1 },
    },
    {
      name: "limit",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    },
  ],
  responses: {
    "200": {
      description: "A page of projects.",
      content: jsonContent("ProjectListResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.PROJECTS_RETRIEVED,
        data: {
          items: [exampleProject],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      }),
    },
    "400": ref("ValidationError"),
    ...protectedErrorResponses,
  },
};

const getProject: JsonObject = {
  tags: ["Projects"],
  operationId: "getProject",
  summary: "Get a project",
  security: userIdSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "The project.",
      content: jsonContent("ProjectResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.PROJECT_RETRIEVED,
        data: exampleProject,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...protectedErrorResponses,
  },
};

const updateProject: JsonObject = {
  tags: ["Projects"],
  operationId: "updateProject",
  summary: "Update a project",
  security: userIdSecurity,
  parameters: [projectIdParameter],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/UpdateProjectRequest" },
      },
    },
  },
  responses: {
    "200": {
      description: "The updated project.",
      content: jsonContent("ProjectResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.PROJECT_UPDATED,
        data: { ...exampleProject, branch: "production" },
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    "409": ref("NameConflict"),
    ...protectedErrorResponses,
  },
};

const deleteProject: JsonObject = {
  tags: ["Projects"],
  operationId: "deleteProject",
  summary: "Delete a project",
  description:
    "Soft delete. The project disappears from every endpoint and its name becomes available again.",
  security: userIdSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "Project deleted.",
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.PROJECT_DELETED,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...protectedErrorResponses,
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "Project Service API",
    version: "1.0.0",
    description: `Project management for the React deployment platform. A project describes how to build a React app from a Git repository and is owned by exactly one user.\n\n**Authentication.** The service does not verify tokens. It trusts the \`${USER_ID_HEADER}\` header that the api-gateway sets after verifying the bearer token, so it must only be reachable through the gateway. Every \`/projects\` route requires that header to be a UUID and only ever reads or changes projects owned by that user. Unknown routes return a \`404\` with the standard error envelope.`,
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Liveness and dependency checks." },
    {
      name: "Projects",
      description: "Create, list, read, update and delete projects.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/projects": { post: createProject, get: listProjects },
    "/projects/{id}": {
      get: getProject,
      patch: updateProject,
      delete: deleteProject,
    },
  },
  components: {
    securitySchemes: {
      userIdHeader: {
        type: "apiKey",
        in: "header",
        name: USER_ID_HEADER,
        description:
          "Identifier of the authenticated user, set by the api-gateway. Never send it from a client: the gateway strips client-supplied values.",
      },
    },
    schemas,
    responses,
  },
};
