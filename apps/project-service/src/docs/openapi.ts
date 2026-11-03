import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { projectFrameworks } from "../db/schema";
import {
  MAX_ENVIRONMENT_VARIABLES,
  MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH,
  MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH,
  RESERVED_ENVIRONMENT_VARIABLE_KEYS,
} from "../validators/project.validator";

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
  slug: "brave-falcon",
  githubRepositoryId: 715409281,
  private: false,
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

const exampleEnvironmentVariable = {
  key: "VITE_API_URL",
  value: "https://api.example.com",
  createdAt: "2026-11-03T09:30:00.000Z",
  updatedAt: "2026-11-03T09:30:00.000Z",
};

const exampleRepository = {
  id: 715409281,
  name: "marketing-site",
  fullName: "acme/marketing-site",
  description: "Public marketing website",
  private: false,
  defaultBranch: "main",
  url: "https://github.com/acme/marketing-site",
  pushedAt: "2026-11-02T18:04:11Z",
  imported: false,
};

const sharedErrorResponses = {
  "429": ref("TooManyRequests"),
  "500": ref("InternalServerError"),
};

const protectedErrorResponses = {
  "401": ref("Unauthorized"),
  ...sharedErrorResponses,
};

const githubErrorResponses = {
  "401": ref("GithubUnauthorized"),
  "503": ref("GithubUnavailable"),
  ...sharedErrorResponses,
};

const projectIdParameter: JsonObject = {
  name: "id",
  in: "path",
  required: true,
  description: "Identifier of a project owned by the authenticated user.",
  schema: { type: "string", format: "uuid" },
};

const environmentVariableKeyDescription = `Must start with a letter or underscore and contain only letters, digits and underscores. Case-sensitive. Reserved keys, which the build environment sets itself, are rejected: ${RESERVED_ENVIRONMENT_VARIABLE_KEYS.map((key) => `\`${key}\``).join(", ")}.`;

const environmentVariableKeySchema: JsonObject = {
  type: "string",
  minLength: 1,
  maxLength: MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH,
  pattern: "^[A-Za-z_][A-Za-z0-9_]*$",
  description: environmentVariableKeyDescription,
  example: "VITE_API_URL",
};

const environmentVariableValueSchema: JsonObject = {
  type: "string",
  maxLength: MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH,
  description:
    "Stored encrypted (AES-256-GCM). Not trimmed; an empty string is allowed.",
  example: "https://api.example.com",
};

const environmentVariableKeyParameter: JsonObject = {
  name: "key",
  in: "path",
  required: true,
  description: environmentVariableKeyDescription,
  schema: environmentVariableKeySchema,
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
  branch: {
    type: "string",
    minLength: 1,
    maxLength: 255,
    pattern: "^[A-Za-z0-9._/-]+$",
    description: "Branch to build. Defaults to `main`.",
    example: "main",
  },
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
    description:
      "Only `vite` is supported: every project is verified to be a Vite project when it is created and whenever its `branch` or `rootDirectory` changes.",
  },
  CreateProjectRequest: {
    type: "object",
    additionalProperties: false,
    required: ["repositoryId"],
    description:
      "Imports one of the repositories returned by `GET /projects/repositories`. The name, description, repository URL, visibility and branch of the project are taken from GitHub. `installCommand` and `buildCommand` fall back to their defaults when omitted; the remaining settings start with defaults. Everything except the repository can be changed later with `PATCH`.",
    properties: {
      repositoryId: {
        type: "integer",
        minimum: 1,
        description:
          "GitHub numeric repository id (`id` from `GET /projects/repositories`). The repository must be accessible with the user's GitHub token, the user must have push access, it must not be archived or disabled, and its default branch must be a Vite project.",
        example: 715409281,
      },
      installCommand: projectProperties["installCommand"],
      buildCommand: projectProperties["buildCommand"],
      environmentVariables: {
        type: "array",
        maxItems: MAX_ENVIRONMENT_VARIABLES,
        description:
          "Environment variables passed to the install and build commands of every deployment. Keys must be unique. They can be changed later through `/projects/{id}/environment-variables`.",
        items: { $ref: "#/components/schemas/EnvironmentVariableInput" },
      },
    },
  },
  EnvironmentVariableInput: {
    type: "object",
    additionalProperties: false,
    required: ["key", "value"],
    properties: {
      key: environmentVariableKeySchema,
      value: environmentVariableValueSchema,
    },
  },
  SetEnvironmentVariableRequest: {
    type: "object",
    additionalProperties: false,
    required: ["value"],
    properties: { value: environmentVariableValueSchema },
  },
  EnvironmentVariable: {
    type: "object",
    required: ["key", "value", "createdAt", "updatedAt"],
    properties: {
      key: { type: "string", example: "VITE_API_URL" },
      value: {
        type: "string",
        description: "Decrypted value.",
        example: "https://api.example.com",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  UpdateProjectRequest: {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    description:
      "Partial update. At least one field is required; fields that are omitted stay unchanged. The repository, slug and framework cannot be changed. Changing `branch` or `rootDirectory` re-checks the new location with the GitHub API and requires it to still be a Vite project.",
    properties: {
      name: projectProperties["name"],
      description: {
        type: ["string", "null"],
        maxLength: 500,
        description: "Trimmed before validation. Send `null` to clear it.",
        example: "Public marketing website",
      },
      branch: projectProperties["branch"],
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
      "slug",
      "githubRepositoryId",
      "private",
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
      slug: {
        type: "string",
        pattern: "^[a-z]+-[a-z]+$",
        description:
          "Globally unique identifier made of exactly two lowercase words separated by a hyphen, such as `brave-falcon`. Generated randomly when the project is created (not derived from the repository name), never changes, and is not released when the project is deleted.",
        example: "brave-falcon",
      },
      githubRepositoryId: {
        type: "integer",
        description:
          "GitHub numeric repository id. Stable across repository renames and transfers; a repository can be imported once per user.",
      },
      private: {
        type: "boolean",
        description: "Whether the repository was private when imported.",
      },
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
  ImportableRepository: {
    type: "object",
    required: [
      "id",
      "name",
      "fullName",
      "description",
      "private",
      "defaultBranch",
      "url",
      "pushedAt",
      "imported",
    ],
    properties: {
      id: {
        type: "integer",
        description:
          "GitHub numeric repository id; send it to `POST /projects`.",
      },
      name: { type: "string" },
      fullName: { type: "string", example: "acme/marketing-site" },
      description: { type: ["string", "null"] },
      private: { type: "boolean" },
      defaultBranch: { type: "string" },
      url: { type: "string", format: "uri" },
      pushedAt: { type: ["string", "null"], format: "date-time" },
      imported: {
        type: "boolean",
        description:
          "True when the user already has a (not deleted) project for this repository.",
      },
    },
  },
  ImportableRepositoryPage: {
    type: "object",
    required: ["items", "page", "hasNextPage"],
    properties: {
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/ImportableRepository" },
        description:
          "The Vite projects among the 30 repositories on this page. Can hold fewer than 30 items, or none, even when `hasNextPage` is true.",
      },
      page: { type: "integer", minimum: 1 },
      hasNextPage: {
        type: "boolean",
        description: "Whether GitHub has another page of repositories.",
      },
    },
  },
  ImportableRepositoryPageResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/ImportableRepositoryPage" },
        },
      },
    ],
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
  EnvironmentVariableResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/EnvironmentVariable" },
        },
      },
    ],
  },
  EnvironmentVariableListResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/EnvironmentVariable" },
          },
        },
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
          "Optional context. For `VALIDATION_ERROR` it is the Zod tree-ified error (`errors` plus per-field `properties`); for `UNSUPPORTED_FRAMEWORK` it is `{ detectedFramework }`; for `ENVIRONMENT_VARIABLE_LIMIT_REACHED` it is `{ maxEnvironmentVariables }`; for an `INVALID_REPOSITORY` caused by a missing branch or root directory it is `{ branch, rootDirectory }`; for the route-level `NOT_FOUND` of an unknown path it is `{ path }`.",
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
          repositoryId: {
            errors: ["Invalid input: expected number, received string"],
          },
        },
      },
    ),
  ),
  Unauthorized: errorResponse(
    `The \`${USER_ID_HEADER}\` header is missing or is not a UUID. Behind the api-gateway this cannot happen for a request with a valid bearer token.`,
    errorExample(401, ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED),
  ),
  GithubUnauthorized: {
    description: `Either the \`${USER_ID_HEADER}\` header is missing or is not a UUID (\`UNAUTHORIZED\`), or the user's GitHub authorization is missing or was revoked on GitHub (\`GITHUB_AUTH_REQUIRED\`); the user must sign in with GitHub again.`,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        examples: {
          missingUser: {
            summary: "Missing user header",
            value: errorExample(
              401,
              ErrorCode.UNAUTHORIZED,
              ErrorMessage.UNAUTHORIZED,
            ),
          },
          githubAuthRequired: {
            summary: "GitHub token missing or revoked",
            value: errorExample(
              401,
              ErrorCode.GITHUB_AUTH_REQUIRED,
              ErrorMessage.GITHUB_AUTH_REQUIRED,
            ),
          },
        },
      },
    },
  },
  RepositoryRejected: {
    description:
      "The repository was rejected. `INVALID_REPOSITORY` means it does not exist, is not accessible with the user's GitHub token, the user has no push access, or it is archived or disabled (all reported the same way), or that the branch or root directory does not exist in it. `UNSUPPORTED_FRAMEWORK` means it is not a Vite project; `details.detectedFramework` is the framework that was detected instead, or `null`. Only Vite is supported, and it is detected with Vercel's framework detection, so a Next.js, Remix, SvelteKit or Create React App project is rejected even when it uses Vite internally.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        examples: {
          notPublic: {
            summary: "Missing repository or no push access",
            value: errorExample(
              422,
              ErrorCode.INVALID_REPOSITORY,
              ErrorMessage.INVALID_REPOSITORY,
            ),
          },
          sourceNotFound: {
            summary: "Branch or root directory not found",
            value: errorExample(
              422,
              ErrorCode.INVALID_REPOSITORY,
              ErrorMessage.SOURCE_NOT_FOUND,
              { branch: "main", rootDirectory: "apps/web" },
            ),
          },
          unsupportedFramework: {
            summary: "Not a Vite project",
            value: errorExample(
              422,
              ErrorCode.UNSUPPORTED_FRAMEWORK,
              ErrorMessage.UNSUPPORTED_FRAMEWORK,
              { detectedFramework: "nextjs" },
            ),
          },
        },
      },
    },
  },
  GithubUnavailable: errorResponse(
    "GitHub could not be used: the GitHub API timed out, was unreachable, rate limited the user or returned an unexpected response. The same status with `SERVICE_UNAVAILABLE` and the generic message is returned when the auth-service, which holds the user's GitHub token, cannot be reached.",
    errorExample(
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorMessage.GITHUB_UNAVAILABLE,
    ),
  ),
  ProjectNotFound: errorResponse(
    "No project with this id exists for the authenticated user. Projects owned by other users and deleted projects are reported the same way.",
    errorExample(404, ErrorCode.NOT_FOUND, ErrorMessage.PROJECT_NOT_FOUND),
  ),
  EnvironmentVariableNotFound: errorResponse(
    "The project exists but has no environment variable with this key.",
    errorExample(
      404,
      ErrorCode.NOT_FOUND,
      ErrorMessage.ENVIRONMENT_VARIABLE_NOT_FOUND,
    ),
  ),
  EnvironmentVariableLimitReached: errorResponse(
    `Adding this key would give the project more than ${MAX_ENVIRONMENT_VARIABLES} environment variables. Updating an existing key is always allowed.`,
    errorExample(
      422,
      ErrorCode.ENVIRONMENT_VARIABLE_LIMIT_REACHED,
      ErrorMessage.ENVIRONMENT_VARIABLE_LIMIT_REACHED,
      { maxEnvironmentVariables: MAX_ENVIRONMENT_VARIABLES },
    ),
  ),
  RepositoryAlreadyImported: errorResponse(
    "The user already has a project for this repository.",
    errorExample(
      409,
      ErrorCode.REPOSITORY_ALREADY_IMPORTED,
      ErrorMessage.REPOSITORY_ALREADY_IMPORTED,
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
  summary: "Create a project from a GitHub repository",
  description:
    "Imports a repository picked from `GET /projects/repositories`. Using the user's GitHub token (fetched from the auth-service), the repository is looked up by id and must be accessible with push access, then the framework is detected from its default branch (no clone) and must be Vite. On success the project, its environment variables (encrypted) and its first `queued` deployment are stored in one transaction with a unique two-word slug, and the project is returned. Once that transaction has committed, an AWS ECS (Fargate) task running the deployment pipeline is started for the deployment with `DEPLOYMENT_ID` and `USER_ID` passed as container environment variables; the pipeline then moves the deployment through its statuses. If the task cannot be started (ECS unreachable, rejected the request or returned no task) the deployment is marked `failed` with a `[initialize]` error message and the project is still returned, so the request does not fail. Environment variables are not part of the response; read them with `GET /projects/{id}/environment-variables`. If a random slug is already taken a new one is generated; `409 CONFLICT` is returned only after repeated collisions.",
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
    "409": ref("RepositoryAlreadyImported"),
    "422": ref("RepositoryRejected"),
    ...githubErrorResponses,
  },
};

const listRepositories: JsonObject = {
  tags: ["Projects"],
  operationId: "listImportableRepositories",
  summary: "List the user's GitHub repositories that can be imported",
  description:
    "The \"add project\" picker. Uses the user's GitHub token (fetched from the auth-service) to read one page of 30 of the user's repositories, newest push first, including repositories owned by the user, shared as a collaborator, or in organizations the user belongs to. Only repositories with push access that are not archived or disabled are considered, and only those whose default branch is a Vite project are returned (Vercel framework detection, at most 6 repositories checked in parallel). Detection results are cached in Redis for 24 hours per repository, branch and last push, so a repository is only re-checked after a new push. Repositories without any commit are skipped.",
  security: userIdSecurity,
  parameters: [
    {
      name: "page",
      in: "query",
      required: false,
      schema: { type: "integer", minimum: 1, maximum: 100, default: 1 },
      description: "GitHub page of 30 repositories.",
    },
  ],
  responses: {
    "200": {
      description: "The Vite repositories on this page.",
      content: jsonContent("ImportableRepositoryPageResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.REPOSITORIES_RETRIEVED,
        data: { items: [exampleRepository], page: 1, hasNextPage: true },
      }),
    },
    "400": ref("ValidationError"),
    ...githubErrorResponses,
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
  description:
    "The repository and framework cannot be changed. When `branch` or `rootDirectory` is sent, the resulting location is looked up on GitHub and must still be a Vite project; otherwise the project is left unchanged.",
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
    "422": ref("RepositoryRejected"),
    ...githubErrorResponses,
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

const listEnvironmentVariables: JsonObject = {
  tags: ["Environment variables"],
  operationId: "listEnvironmentVariables",
  summary: "List a project's environment variables",
  description:
    "Returns every variable with its decrypted value, sorted by key.",
  security: userIdSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "The project's environment variables.",
      content: jsonContent("EnvironmentVariableListResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.ENVIRONMENT_VARIABLES_RETRIEVED,
        data: [exampleEnvironmentVariable],
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...protectedErrorResponses,
  },
};

const setEnvironmentVariable: JsonObject = {
  tags: ["Environment variables"],
  operationId: "setEnvironmentVariable",
  summary: "Create or update an environment variable",
  description:
    "Creates the variable, or replaces its value when the key already exists. The new value is used by the next deployment; deployments that already ran are not affected.",
  security: userIdSecurity,
  parameters: [projectIdParameter, environmentVariableKeyParameter],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/SetEnvironmentVariableRequest" },
      },
    },
  },
  responses: {
    "200": {
      description: "The saved environment variable.",
      content: jsonContent("EnvironmentVariableResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.ENVIRONMENT_VARIABLE_SAVED,
        data: exampleEnvironmentVariable,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    "422": ref("EnvironmentVariableLimitReached"),
    ...protectedErrorResponses,
  },
};

const deleteEnvironmentVariable: JsonObject = {
  tags: ["Environment variables"],
  operationId: "deleteEnvironmentVariable",
  summary: "Delete an environment variable",
  security: userIdSecurity,
  parameters: [projectIdParameter, environmentVariableKeyParameter],
  responses: {
    "200": {
      description: "Environment variable deleted.",
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.ENVIRONMENT_VARIABLE_DELETED,
      }),
    },
    "400": ref("ValidationError"),
    "404": {
      description:
        "`PROJECT_NOT_FOUND`: the project does not exist for this user. `ENVIRONMENT_VARIABLE_NOT_FOUND`: the project has no variable with this key. Both use the `NOT_FOUND` error code.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
          examples: {
            project: {
              summary: "Project not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ErrorMessage.PROJECT_NOT_FOUND,
              ),
            },
            environmentVariable: {
              summary: "Environment variable not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ErrorMessage.ENVIRONMENT_VARIABLE_NOT_FOUND,
              ),
            },
          },
        },
      },
    },
    ...protectedErrorResponses,
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "Project Service API",
    version: "1.0.0",
    description: `Project management for the React deployment platform. A project describes how to build a Vite app from one of the user's GitHub repositories (public or private) and is owned by exactly one user.\n\n**Authentication.** The service does not verify tokens. It trusts the \`${USER_ID_HEADER}\` header that the api-gateway sets after verifying the bearer token, so it must only be reachable through the gateway. Every \`/projects\` route requires that header to be a UUID and only ever reads or changes projects owned by that user.\n\n**GitHub access.** Routes that talk to GitHub fetch the user's GitHub OAuth token from the auth-service (\`GET /internal/users/{id}/github-token\`, authenticated with \`INTERNAL_API_KEY\`) and call GitHub with it, so private repositories are supported and GitHub's per-user rate limit applies. Unknown routes return a \`404\` with the standard error envelope.`,
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Liveness and dependency checks." },
    {
      name: "Projects",
      description: "Create, list, read, update and delete projects.",
    },
    {
      name: "Environment variables",
      description:
        "Encrypted per-project variables passed to the install and build commands of each deployment.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/projects": { post: createProject, get: listProjects },
    "/projects/repositories": { get: listRepositories },
    "/projects/{id}": {
      get: getProject,
      patch: updateProject,
      delete: deleteProject,
    },
    "/projects/{id}/environment-variables": { get: listEnvironmentVariables },
    "/projects/{id}/environment-variables/{key}": {
      put: setEnvironmentVariable,
      delete: deleteEnvironmentVariable,
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
