import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { authService } from "../config/services";

type JsonObject = Record<string, unknown>;
type Headers = Record<string, JsonObject>;

const REFRESH_COOKIE_NAME = "refresh_token";

const AuthServiceMessage = {
  VALIDATION_ERROR: "Validation failed for the given request",
  TOKEN_REFRESHED: "Tokens refreshed successfully",
  LOGGED_OUT: "Logged out successfully",
  CURRENT_USER: "Current user retrieved successfully",
} as const;

const ProjectServiceMessage = {
  PROJECT_NOT_FOUND: "The requested project could not be found",
  INVALID_REPOSITORY:
    "The repository does not exist or you do not have push access to it",
  REPOSITORY_ALREADY_IMPORTED:
    "This repository has already been imported as a project",
  GITHUB_AUTH_REQUIRED:
    "GitHub authorization is missing or was revoked, please sign in with GitHub again",
  SOURCE_NOT_FOUND:
    "The branch or root directory was not found in the repository",
  UNSUPPORTED_FRAMEWORK: "Only Vite projects are supported",
  GITHUB_UNAVAILABLE:
    "The repository could not be verified with GitHub, please try again later",
  PROJECT_CREATED: "Project created successfully",
  PROJECTS_RETRIEVED: "Projects retrieved successfully",
  PROJECT_RETRIEVED: "Project retrieved successfully",
  PROJECT_UPDATED: "Project updated successfully",
  PROJECT_DELETED: "Project deleted successfully",
  DEPLOYMENT_QUEUED: "Deployment queued successfully",
  AUTO_DEPLOY_ENABLED: "Automatic deployments enabled successfully",
  WEBHOOK_PONG: "Webhook received",
  WEBHOOK_IGNORED: "Webhook event ignored",
  WEBHOOK_DEPLOYMENT_QUEUED: "Deployment queued for the pushed commit",
  WEBHOOK_PERMISSION_DENIED:
    "Automatic deployments require admin access to the repository to install a webhook",
  INVALID_WEBHOOK_SIGNATURE: "The webhook signature is missing or invalid",
  INVALID_WEBHOOK_PAYLOAD: "The webhook payload could not be understood",
  DEPLOYMENTS_RETRIEVED: "Deployments retrieved successfully",
  DEPLOYMENT_RETRIEVED: "Deployment retrieved successfully",
  DEPLOYMENT_CANCELED: "Deployment canceled successfully",
  DEPLOYMENT_NOT_FOUND: "The requested deployment could not be found",
  DEPLOYMENT_NOT_CANCELABLE:
    "Only a deployment that is still in progress can be canceled",
  REPOSITORIES_RETRIEVED: "Repositories retrieved successfully",
  ENVIRONMENT_VARIABLES_RETRIEVED:
    "Environment variables retrieved successfully",
  ENVIRONMENT_VARIABLE_SAVED: "Environment variable saved successfully",
  ENVIRONMENT_VARIABLE_DELETED: "Environment variable deleted successfully",
  ENVIRONMENT_VARIABLE_NOT_FOUND:
    "The requested environment variable could not be found",
  ENVIRONMENT_VARIABLE_LIMIT_REACHED:
    "A project can have at most 64 environment variables",
} as const;

const MAX_ENVIRONMENT_VARIABLES = 64;
const MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH = 128;
const MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH = 4096;
const RESERVED_ENVIRONMENT_VARIABLE_KEYS = [
  "PATH",
  "HOME",
  "CI",
  "COREPACK_ENABLE_DOWNLOAD_PROMPT",
] as const;

const PROJECT_FRAMEWORKS = ["vite"] as const;
const DEPLOYMENT_TRIGGERS = ["create", "manual", "push"] as const;
const DEPLOYMENT_STATUSES = [
  "queued",
  "cloning",
  "installing",
  "building",
  "uploading",
  "ready",
  "failed",
  "canceled",
] as const;

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
  message: string,
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

const exampleUser = {
  id: "0192f5a4-7b1e-7c3a-9d2e-5f8a1b2c3d4e",
  githubLogin: "janedoe",
  name: "Jane Doe",
  email: "jane.doe@example.com",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  status: "active",
  lastLoginAt: "2026-11-03T09:30:00.000Z",
  createdAt: "2026-10-20T12:00:00.000Z",
};

const exampleTokenPayload = {
  accessToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJzaWQiOiJmM2U0Iiwic3ViIjoiMDE5MmY1YTQifQ.signature",
  tokenType: "Bearer",
  expiresIn: 900,
};

const exampleProject = {
  id: "0192f5a4-7b1e-7c3a-9d2e-5f8a1b2c3d4e",
  slug: "brave-falcon",
  url: "http://brave-falcon.localhost:8080",
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
  autoDeploy: true,
  createdAt: "2026-11-03T09:30:00.000Z",
  updatedAt: "2026-11-03T09:30:00.000Z",
};

const exampleDeployment = {
  id: "0192f5a4-8c2f-7d4b-ae3f-6a9b2c3d4e5f",
  projectId: "0192f5a4-7b1e-7c3a-9d2e-5f8a1b2c3d4e",
  status: "queued",
  trigger: "manual",
  branch: "main",
  commitSha: null,
  framework: "vite",
  rootDirectory: ".",
  installCommand: "npm install",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  errorMessage: null,
  startedAt: null,
  finishedAt: null,
  createdAt: "2026-11-03T10:15:00.000Z",
  updatedAt: "2026-11-03T10:15:00.000Z",
};

const exampleReadyDeployment = {
  ...exampleDeployment,
  status: "ready",
  commitSha: "9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c",
  errorMessage: null,
  startedAt: "2026-11-03T10:15:05.000Z",
  finishedAt: "2026-11-03T10:16:42.000Z",
  updatedAt: "2026-11-03T10:16:42.000Z",
};

const examplePushDeployment = {
  ...exampleDeployment,
  trigger: "push",
  commitSha: "9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c",
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

const refreshCookieHeader: Headers = {
  "Set-Cookie": {
    description: `Forwarded unchanged from the auth-service. Sets the \`${REFRESH_COOKIE_NAME}\` cookie (HttpOnly, SameSite=Strict, Path=/auth, Secure in production).`,
    schema: { type: "string" },
  },
};

const clearedCookieHeader: Headers = {
  "Set-Cookie": {
    description: `Forwarded unchanged from the auth-service. Clears the \`${REFRESH_COOKIE_NAME}\` cookie.`,
    schema: { type: "string" },
  },
};

const sharedErrorResponses = {
  "429": ref("TooManyRequests"),
  "500": ref("InternalServerError"),
};

const proxiedErrorResponses = {
  ...sharedErrorResponses,
  "413": ref("PayloadTooLarge"),
  "502": ref("BadGateway"),
  "503": ref("ServiceUnavailable"),
  "504": ref("GatewayTimeout"),
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
    "Stored encrypted (AES-256-GCM) by the project-service. Not trimmed; an empty string is allowed.",
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
  UserStatus: {
    type: "string",
    enum: ["active", "suspended", "deactivated"],
  },
  User: {
    type: "object",
    required: [
      "id",
      "githubLogin",
      "name",
      "email",
      "avatarUrl",
      "status",
      "lastLoginAt",
      "createdAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      githubLogin: {
        type: "string",
        description: "GitHub username, refreshed on every sign-in.",
      },
      name: { type: ["string", "null"] },
      email: {
        type: ["string", "null"],
        format: "email",
        description:
          "Primary verified email of the GitHub account, lower-cased. Null when GitHub has none.",
      },
      avatarUrl: { type: ["string", "null"], format: "uri" },
      status: { $ref: "#/components/schemas/UserStatus" },
      lastLoginAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "Time of the last GitHub sign-in.",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AccessTokenPayload: {
    type: "object",
    required: ["accessToken", "tokenType", "expiresIn"],
    properties: {
      accessToken: {
        type: "string",
        description: "Short-lived JWT (HS256) sent as a Bearer token.",
      },
      tokenType: { type: "string", enum: ["Bearer"] },
      expiresIn: {
        type: "integer",
        description: "Access token lifetime in seconds.",
        example: 900,
      },
    },
  },
  ProjectFramework: {
    type: "string",
    enum: [...PROJECT_FRAMEWORKS],
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
      "url",
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
      "autoDeploy",
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
      url: {
        type: "string",
        format: "uri",
        description:
          "Public URL of the deployed site, `<protocol>//<slug>.<host>` built from the project-service `SITES_BASE_URL` setting, for example `https://brave-falcon.example.app`. Served by the proxy-service, which always serves the project's latest `ready` deployment, so the URL responds with 404 until the first deployment is ready.",
        example: "http://brave-falcon.localhost:8080",
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
      autoDeploy: {
        type: "boolean",
        description:
          "Whether a GitHub push webhook is installed on the repository, so pushes to the project's `branch` by the repository owner or a collaborator deploy automatically through `POST /webhooks/github/projects/{projectId}`. Installing a webhook needs admin access to the repository, so this is `false` when the importing user is not a repository admin; enable it later with `POST /projects/{id}/webhook`.",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  DeploymentTrigger: {
    type: "string",
    enum: [...DEPLOYMENT_TRIGGERS],
    description:
      "What created the deployment: `create` for the first deployment made when the project was imported, `manual` for `POST /projects/{id}/deployments`, and `push` for a push to the project's `branch` received through the GitHub webhook.",
  },
  WebhookIgnoredData: {
    type: "object",
    required: ["reason"],
    properties: {
      reason: {
        type: "string",
        description: "Why the event did not start a deployment.",
      },
    },
  },
  WebhookQueuedData: {
    type: "object",
    required: ["deploymentId"],
    properties: { deploymentId: { type: "string", format: "uuid" } },
  },
  WebhookIgnoredResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/WebhookIgnoredData" },
        },
      },
    ],
  },
  WebhookQueuedResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        properties: {
          data: { $ref: "#/components/schemas/WebhookQueuedData" },
        },
      },
    ],
  },
  DeploymentStatus: {
    type: "string",
    enum: [...DEPLOYMENT_STATUSES],
    description:
      "Lifecycle of a deployment. A deployment starts `queued`, then the pipeline moves it through `cloning`, `installing`, `building` and `uploading` before it becomes `ready`; `failed` and `canceled` are the other terminal states. A deployment stays `queued` while another deployment of the same user is running, because each user runs at most one deployment at a time; a project can have several deployments waiting in `queued`.",
  },
  Deployment: {
    type: "object",
    required: [
      "id",
      "projectId",
      "status",
      "trigger",
      "branch",
      "commitSha",
      "framework",
      "rootDirectory",
      "installCommand",
      "buildCommand",
      "outputDirectory",
      "errorMessage",
      "startedAt",
      "finishedAt",
      "createdAt",
      "updatedAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      projectId: { type: "string", format: "uuid" },
      status: { $ref: "#/components/schemas/DeploymentStatus" },
      trigger: { $ref: "#/components/schemas/DeploymentTrigger" },
      branch: {
        type: "string",
        description:
          "Snapshot of the project's `branch` at the moment the deployment was created; later changes to the project do not affect a deployment that already exists.",
      },
      commitSha: {
        type: ["string", "null"],
        pattern: "^[0-9a-f]{40}$",
        description:
          "The commit the pipeline checked out. A `push` deployment is created with the pushed commit and the pipeline checks out exactly that commit; other deployments build the latest commit of `branch` and are filled in once cloning has resolved it, so they are `null` while still `queued`.",
      },
      framework: { $ref: "#/components/schemas/ProjectFramework" },
      rootDirectory: { type: "string" },
      installCommand: { type: "string" },
      buildCommand: { type: "string" },
      outputDirectory: { type: "string" },
      errorMessage: {
        type: ["string", "null"],
        description:
          "Why the deployment `failed`, prefixed with the pipeline step that failed (for example `[initialize]`). `null` unless the status is `failed`.",
      },
      startedAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "When the pipeline began work. `null` while `queued`.",
      },
      finishedAt: {
        type: ["string", "null"],
        format: "date-time",
        description:
          "When the deployment reached a terminal status (`ready`, `failed` or `canceled`). `null` before then.",
      },
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
    required: ["gateway", "redis", "authService", "projectService", "uptime"],
    properties: {
      gateway: { type: "string", enum: ["up"] },
      redis: {
        type: "string",
        enum: ["up", "down"],
        description:
          "Result of a `PING` against the Redis instance shared with the auth-service. The gateway uses it for rate limiting and to check whether access tokens were revoked or their session ended.",
      },
      authService: {
        type: "string",
        enum: ["up", "down"],
        description:
          "Result of `GET /health` on the auth-service, treated as down on a non-2xx response, a connection error or after `HEALTH_CHECK_TIMEOUT_MS`.",
      },
      projectService: {
        type: "string",
        enum: ["up", "down"],
        description:
          "Result of `GET /health` on the project-service, treated as down on a non-2xx response, a connection error or after `HEALTH_CHECK_TIMEOUT_MS`.",
      },
      uptime: {
        type: "number",
        description: "Gateway process uptime in seconds.",
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
  UserResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/User" } },
      },
    ],
  },
  RefreshResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/AccessTokenPayload" },
        },
      },
    ],
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
  DeploymentResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/Deployment" } },
      },
    ],
  },
  DeploymentList: {
    type: "object",
    required: ["items", "pagination"],
    properties: {
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/Deployment" },
      },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
  },
  DeploymentListResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/DeploymentList" } },
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
          "Optional context. For `VALIDATION_ERROR` it is the Zod tree-ified error (`errors` plus per-field `properties`); for `NOT_FOUND` it is `{ path }`; for `PAYLOAD_TOO_LARGE` it is `{ maxBytes }`; for `UNSUPPORTED_FRAMEWORK` it is `{ detectedFramework }`; for `ENVIRONMENT_VARIABLE_LIMIT_REACHED` it is `{ maxEnvironmentVariables }`; for an `INVALID_REPOSITORY` caused by a missing branch or root directory it is `{ branch, rootDirectory }`; for `BAD_GATEWAY`, `SERVICE_UNAVAILABLE` and `GATEWAY_TIMEOUT` it is `{ service }`. Errors produced by the auth-service and project-service are forwarded unchanged.",
      },
      stack: {
        type: "string",
        description:
          "Stack trace. Only present when the service that produced the error runs with `NODE_ENV=development`.",
      },
    },
  },
};

const responses: Record<string, JsonObject> = {
  ValidationError: errorResponse(
    "The request body failed validation.",
    errorExample(
      400,
      ErrorCode.VALIDATION_ERROR,
      AuthServiceMessage.VALIDATION_ERROR,
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
  TooManyRequests: errorResponse(
    "The per-client rate limit was exceeded, either at the gateway or at an upstream service. The gateway applies `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` to every route and, on top of that, `CREDENTIAL_RATE_LIMIT_MAX` requests per `CREDENTIAL_RATE_LIMIT_WINDOW_MS` to `GET /auth/github`, `GET /auth/github/callback` and `POST /auth/refresh`. Routes under `/webhooks` are excluded from `RATE_LIMIT_MAX` and use their own limit of `WEBHOOK_RATE_LIMIT_MAX` requests per `WEBHOOK_RATE_LIMIT_WINDOW_MS` instead. Clients are identified by IP address and counters live in Redis, so limits hold across gateway instances. Standard `RateLimit-*` headers are returned on every response.",
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
  ProjectNotFound: errorResponse(
    "No project with this id exists for the authenticated user. Projects owned by other users and deleted projects are reported the same way. Forwarded unchanged from the project-service.",
    errorExample(
      404,
      ErrorCode.NOT_FOUND,
      ProjectServiceMessage.PROJECT_NOT_FOUND,
    ),
  ),
  EnvironmentVariableLimitReached: errorResponse(
    `Adding this key would give the project more than ${MAX_ENVIRONMENT_VARIABLES} environment variables. Updating an existing key is always allowed. Forwarded unchanged from the project-service.`,
    errorExample(
      422,
      ErrorCode.ENVIRONMENT_VARIABLE_LIMIT_REACHED,
      ProjectServiceMessage.ENVIRONMENT_VARIABLE_LIMIT_REACHED,
      { maxEnvironmentVariables: MAX_ENVIRONMENT_VARIABLES },
    ),
  ),
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
              ProjectServiceMessage.INVALID_REPOSITORY,
            ),
          },
          sourceNotFound: {
            summary: "Branch or root directory not found",
            value: errorExample(
              422,
              ErrorCode.INVALID_REPOSITORY,
              ProjectServiceMessage.SOURCE_NOT_FOUND,
              { branch: "main", rootDirectory: "apps/web" },
            ),
          },
          unsupportedFramework: {
            summary: "Not a Vite project",
            value: errorExample(
              422,
              ErrorCode.UNSUPPORTED_FRAMEWORK,
              ProjectServiceMessage.UNSUPPORTED_FRAMEWORK,
              { detectedFramework: "nextjs" },
            ),
          },
        },
      },
    },
  },
  GithubUnavailable: errorResponse(
    "Either the project-service could not use GitHub because the GitHub API timed out, was unreachable, rate limited the user or returned an unexpected response, or it could not reach the auth-service for the user's GitHub token (`SERVICE_UNAVAILABLE`, forwarded unchanged), or the gateway could not reach the project-service or Redis (`SERVICE_UNAVAILABLE` with `details.service`, or while checking bearer token revocation).",
    errorExample(
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
      ProjectServiceMessage.GITHUB_UNAVAILABLE,
    ),
  ),
  RepositoryAlreadyImported: errorResponse(
    "The user already has a project for this repository. Forwarded unchanged from the project-service.",
    errorExample(
      409,
      ErrorCode.REPOSITORY_ALREADY_IMPORTED,
      ProjectServiceMessage.REPOSITORY_ALREADY_IMPORTED,
    ),
  ),
  InvalidWebhookSignature: errorResponse(
    "The `X-Hub-Signature-256` header is missing or is not the HMAC-SHA256 of the raw request body with the project's webhook secret. Forwarded unchanged from the project-service.",
    errorExample(
      401,
      ErrorCode.INVALID_WEBHOOK_SIGNATURE,
      ProjectServiceMessage.INVALID_WEBHOOK_SIGNATURE,
    ),
  ),
  WebhookProjectNotFound: errorResponse(
    "No active project with this id exists, or the project has no webhook installed. Forwarded unchanged from the project-service.",
    errorExample(
      404,
      ErrorCode.NOT_FOUND,
      ProjectServiceMessage.PROJECT_NOT_FOUND,
    ),
  ),
  WebhookPayloadTooLarge: errorResponse(
    "The webhook body is larger than `MAX_WEBHOOK_BODY_BYTES` (5 MiB by default), which replaces `MAX_REQUEST_BODY_BYTES` for `/webhooks` routes.",
    errorExample(
      413,
      ErrorCode.PAYLOAD_TOO_LARGE,
      ErrorMessage.PAYLOAD_TOO_LARGE,
      { maxBytes: 5242880 },
    ),
  ),
  DeploymentNotCancelable: errorResponse(
    "The deployment is already in a terminal status (`ready`, `failed` or `canceled`), so it can no longer be canceled. Forwarded unchanged from the project-service.",
    errorExample(
      409,
      ErrorCode.DEPLOYMENT_NOT_CANCELABLE,
      ProjectServiceMessage.DEPLOYMENT_NOT_CANCELABLE,
    ),
  ),
  GithubUnauthorized: {
    description:
      "The bearer token is missing (`UNAUTHORIZED`) or is invalid, expired, revoked, not an access token, or belongs to a session that was logged out or ended (`INVALID_TOKEN`), produced by the gateway; or the user's GitHub authorization is missing or was revoked on GitHub (`GITHUB_AUTH_REQUIRED`), forwarded from the project-service, in which case the user must sign in with GitHub again.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
        examples: {
          missingBearerToken: {
            summary: "Missing bearer token",
            value: errorExample(
              401,
              ErrorCode.UNAUTHORIZED,
              ErrorMessage.UNAUTHORIZED,
            ),
          },
          invalidBearerToken: {
            summary: "Invalid, expired or revoked bearer token",
            value: errorExample(
              401,
              ErrorCode.INVALID_TOKEN,
              ErrorMessage.INVALID_TOKEN,
            ),
          },
          githubAuthRequired: {
            summary: "GitHub token missing or revoked",
            value: errorExample(
              401,
              ErrorCode.GITHUB_AUTH_REQUIRED,
              ProjectServiceMessage.GITHUB_AUTH_REQUIRED,
            ),
          },
        },
      },
    },
  },
  PayloadTooLarge: errorResponse(
    "The request body is larger than `MAX_REQUEST_BODY_BYTES` (65536 bytes by default). Rejected from the `Content-Length` header before the body is read; for chunked bodies the request is aborted as soon as the limit is crossed and the connection is closed.",
    errorExample(
      413,
      ErrorCode.PAYLOAD_TOO_LARGE,
      ErrorMessage.PAYLOAD_TOO_LARGE,
      { maxBytes: 65536 },
    ),
  ),
  BadGateway: errorResponse(
    "The gateway could not get a valid response from the upstream service.",
    errorExample(502, ErrorCode.BAD_GATEWAY, ErrorMessage.BAD_GATEWAY, {
      service: authService.name,
    }),
  ),
  ServiceUnavailable: errorResponse(
    "The upstream service refused the connection or could not be resolved, or the gateway could not reach Redis to check whether a bearer token was revoked. Requests that need a bearer token fail closed in that case.",
    errorExample(
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorMessage.SERVICE_UNAVAILABLE,
      { service: authService.name },
    ),
  ),
  GatewayTimeout: errorResponse(
    "The upstream service did not respond within `PROXY_TIMEOUT_MS`.",
    errorExample(504, ErrorCode.GATEWAY_TIMEOUT, ErrorMessage.GATEWAY_TIMEOUT, {
      service: authService.name,
    }),
  ),
};

const projectProxiedErrorResponses = {
  "401": errorResponse(
    "The bearer token is missing (`UNAUTHORIZED`) or is invalid, expired, revoked, not an access token, or belongs to a session that was logged out or ended (`INVALID_TOKEN`). Produced by the gateway.",
    errorExample(401, ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED),
  ),
  ...proxiedErrorResponses,
};

const projectGithubErrorResponses = {
  ...projectProxiedErrorResponses,
  "401": ref("GithubUnauthorized"),
  "503": ref("GithubUnavailable"),
};

const projectIdParameter: JsonObject = {
  name: "id",
  in: "path",
  required: true,
  description: "Identifier of a project owned by the authenticated user.",
  schema: { type: "string", format: "uuid" },
};

const deploymentIdParameter: JsonObject = {
  name: "deploymentId",
  in: "path",
  required: true,
  description: "Identifier of a deployment that belongs to the project.",
  schema: { type: "string", format: "uuid" },
};

const bearerSecurity = [{ bearerAuth: [] }];
const refreshCookieSecurity = [{ refreshCookie: [] }];

const redirectHeader = (description: string): Headers => ({
  Location: { description, schema: { type: "string", format: "uri" } },
});

const health: JsonObject = {
  security: [],
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Gateway and upstream health",
  description:
    "Served by the gateway itself (not proxied). Pings Redis, calls `GET /health` on every upstream service and responds with 503 when any of them is down.",
  responses: {
    "200": {
      description: "The gateway, Redis and all upstream services are healthy.",
      content: jsonContent("HealthResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.HEALTH_OK,
        data: {
          gateway: "up",
          redis: "up",
          authService: "up",
          projectService: "up",
          uptime: 1234.56,
        },
      }),
    },
    "503": {
      description:
        "Redis or at least one upstream service is down. The body uses the success envelope with `success: false`.",
      content: jsonContent("HealthResponse", {
        success: false,
        statusCode: 503,
        message: ErrorMessage.SERVICE_UNAVAILABLE,
        data: {
          gateway: "up",
          redis: "up",
          authService: "up",
          projectService: "down",
          uptime: 1234.56,
        },
      }),
    },
    "429": sharedErrorResponses["429"],
  },
};

const githubAuthorize: JsonObject = {
  security: [],
  tags: ["Auth"],
  operationId: "startGithubSignIn",
  summary: "Start GitHub sign-in",
  description:
    "Public. Proxied to the auth-service `GET /auth/github`. Subject to the stricter credential rate limit. Open in the browser (a top-level navigation, not `fetch`). Sets a single-use `oauth_state` cookie and redirects to GitHub, requesting the `repo`, `read:user` and `user:email` scopes so the platform can list and read the user's public and private repositories.",
  responses: {
    "302": {
      description: "Redirect to the GitHub authorization page.",
      headers: {
        ...redirectHeader(
          "`https://github.com/login/oauth/authorize?…&scope=repo read:user user:email&state=…&code_challenge=…&code_challenge_method=S256`",
        ),
        "Set-Cookie": {
          description:
            "Forwarded unchanged from the auth-service. Sets the `oauth_state` cookie (HttpOnly, SameSite=Lax, Path=/auth, Secure in production).",
          schema: { type: "string" },
        },
      },
    },
    ...proxiedErrorResponses,
  },
};

const githubCallback: JsonObject = {
  security: [],
  tags: ["Auth"],
  operationId: "completeGithubSignIn",
  summary: "GitHub sign-in callback",
  description: `Public. Proxied to the auth-service \`GET /auth/github/callback\`; this gateway URL is the OAuth App's callback URL. Subject to the stricter credential rate limit. Verifies the state, exchanges the code, creates or updates the user, stores the encrypted GitHub token, starts a session and redirects to \`FRONTEND_URL/auth/callback\` with the \`${REFRESH_COOKIE_NAME}\` cookie set; the frontend then calls \`POST /auth/refresh\` for an access token. Never responds with JSON: failures redirect to \`FRONTEND_URL/auth/callback?error=<ERROR_CODE>\` with \`INVALID_OAUTH_STATE\`, \`GITHUB_AUTH_FAILED\`, \`FORBIDDEN\`, \`SERVICE_UNAVAILABLE\` or \`INTERNAL_SERVER_ERROR\`.`,
  parameters: [
    { name: "code", in: "query", required: false, schema: { type: "string" } },
    { name: "state", in: "query", required: false, schema: { type: "string" } },
    { name: "error", in: "query", required: false, schema: { type: "string" } },
  ],
  responses: {
    "302": {
      description:
        "Redirect to the frontend, with the refresh cookie set on success or an `error` query parameter on failure.",
      headers: {
        ...redirectHeader(
          "`FRONTEND_URL/auth/callback` or `FRONTEND_URL/auth/callback?error=<ERROR_CODE>`.",
        ),
        "Set-Cookie": {
          description: `Forwarded unchanged from the auth-service. On success sets the \`${REFRESH_COOKIE_NAME}\` cookie (HttpOnly, SameSite=Strict, Path=/auth, Secure in production); always clears \`oauth_state\`.`,
          schema: { type: "string" },
        },
      },
    },
    ...proxiedErrorResponses,
  },
};

const refresh: JsonObject = {
  tags: ["Auth"],
  operationId: "refreshTokens",
  summary: "Rotate the refresh token and issue a new access token",
  description: `Public. Proxied to the auth-service \`POST /auth/refresh\`. Subject to the stricter credential rate limit. Reads the refresh token from the \`${REFRESH_COOKIE_NAME}\` cookie, rotates it and returns a new access token. Re-using an already rotated refresh token revokes the whole session.`,
  security: refreshCookieSecurity,
  responses: {
    "200": {
      description: "Tokens refreshed.",
      headers: refreshCookieHeader,
      content: jsonContent("RefreshResponse", {
        success: true,
        statusCode: 200,
        message: AuthServiceMessage.TOKEN_REFRESHED,
        data: exampleTokenPayload,
      }),
    },
    "401": errorResponse(
      "The refresh cookie is missing, invalid, expired, revoked or reused. The cookie is cleared when the error code is `INVALID_TOKEN`.",
      errorExample(401, ErrorCode.INVALID_TOKEN, ErrorMessage.INVALID_TOKEN),
      clearedCookieHeader,
    ),
    ...proxiedErrorResponses,
  },
};

const logout: JsonObject = {
  tags: ["Auth"],
  operationId: "logout",
  summary: "Log out and revoke the current session",
  description: `Public. Proxied to the auth-service \`POST /auth/logout\`. Blacklists the presented access token and refresh cookie (when valid) and deletes their session. Deleting the session also invalidates every access token issued for it, even one that is not sent with this request. Always succeeds, even when no credentials or invalid ones are sent.`,
  security: [{}, ...bearerSecurity, ...refreshCookieSecurity],
  responses: {
    "200": {
      description: "Logged out.",
      headers: clearedCookieHeader,
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: AuthServiceMessage.LOGGED_OUT,
      }),
    },
    ...proxiedErrorResponses,
  },
};

const me: JsonObject = {
  tags: ["Auth"],
  operationId: "getCurrentUser",
  summary: "Get the authenticated user",
  description:
    "Protected. The gateway verifies the access token (signature, issuer, audience, expiry and revocation) before proxying to the auth-service `GET /auth/me`, which additionally checks that the user is still active.",
  security: bearerSecurity,
  responses: {
    "200": {
      description: "The current user.",
      content: jsonContent("UserResponse", {
        success: true,
        statusCode: 200,
        message: AuthServiceMessage.CURRENT_USER,
        data: exampleUser,
      }),
    },
    "401": errorResponse(
      "The bearer token is missing (`UNAUTHORIZED`) or is invalid, expired, revoked, not an access token, belongs to a session that was logged out or ended, or belongs to an inactive user (`INVALID_TOKEN`). Produced by the gateway, except for the inactive-user case which comes from the auth-service.",
      errorExample(401, ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED),
    ),
    ...proxiedErrorResponses,
  },
};

const createProject: JsonObject = {
  tags: ["Projects"],
  operationId: "createProject",
  summary: "Create a project from a GitHub repository",
  description:
    "Protected. Proxied to the project-service `POST /projects`. Imports a repository picked from `GET /projects/repositories` for the user the bearer token belongs to. Using the user's GitHub token, the project-service looks the repository up by id, requires push access, requires its default branch to be a Vite project (detected from the repository files, no clone), and stores the project, its encrypted environment variables and its first `queued` deployment (trigger `create`) with a unique two-word slug. It then installs a GitHub push webhook on the repository that points at this gateway's `POST /webhooks/github/projects/{projectId}`, so later pushes to the project's `branch` deploy automatically; this needs admin access to the repository, never fails the request, and `autoDeploy` in the response tells whether it succeeded. The deployment is pushed onto the project-service's BullMQ deployment queue, and the separate `deployment-worker` application launches an AWS ECS task running the deployment pipeline for it. Each user runs at most one deployment at a time: other deployments of the same user stay `queued` until the running one finishes, while deployments of other users run in parallel. If the task cannot be started the deployment is marked `failed`. The project is still returned when the deployment fails to start. Environment variables are not part of the response; read them with `GET /projects/{id}/environment-variables`.",
  security: bearerSecurity,
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
        message: ProjectServiceMessage.PROJECT_CREATED,
        data: exampleProject,
      }),
    },
    "400": ref("ValidationError"),
    "409": ref("RepositoryAlreadyImported"),
    "422": ref("RepositoryRejected"),
    ...projectGithubErrorResponses,
  },
};

const listRepositories: JsonObject = {
  tags: ["Projects"],
  operationId: "listImportableRepositories",
  summary: "List the user's GitHub repositories that can be imported",
  description:
    'Protected. Proxied to the project-service `GET /projects/repositories`. The "add project" picker: one page of 30 of the user\'s GitHub repositories (owned, collaborator and organization repositories with push access, newest push first, archived and disabled ones excluded), filtered to those whose default branch is a Vite project. Detection results are cached per repository and last push.',
  security: bearerSecurity,
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
        message: ProjectServiceMessage.REPOSITORIES_RETRIEVED,
        data: { items: [exampleRepository], page: 1, hasNextPage: true },
      }),
    },
    "400": ref("ValidationError"),
    ...projectGithubErrorResponses,
  },
};

const listProjects: JsonObject = {
  tags: ["Projects"],
  operationId: "listProjects",
  summary: "List the authenticated user's projects",
  description:
    "Protected. Proxied to the project-service `GET /projects`. Newest projects first. Deleted projects and projects of other users are never returned.",
  security: bearerSecurity,
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
        message: ProjectServiceMessage.PROJECTS_RETRIEVED,
        data: {
          items: [exampleProject],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      }),
    },
    "400": ref("ValidationError"),
    ...projectProxiedErrorResponses,
  },
};

const getProject: JsonObject = {
  tags: ["Projects"],
  operationId: "getProject",
  summary: "Get a project",
  description:
    "Protected. Proxied to the project-service `GET /projects/{id}`.",
  security: bearerSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "The project.",
      content: jsonContent("ProjectResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.PROJECT_RETRIEVED,
        data: exampleProject,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...projectProxiedErrorResponses,
  },
};

const updateProject: JsonObject = {
  tags: ["Projects"],
  operationId: "updateProject",
  summary: "Update a project",
  description:
    "Protected. Proxied to the project-service `PATCH /projects/{id}`. The repository and framework cannot be changed. When `branch` or `rootDirectory` is sent, the resulting location is looked up on GitHub and must still be a Vite project; otherwise the project is left unchanged.",
  security: bearerSecurity,
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
        message: ProjectServiceMessage.PROJECT_UPDATED,
        data: { ...exampleProject, branch: "production" },
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    "422": ref("RepositoryRejected"),
    ...projectGithubErrorResponses,
  },
};

const deleteProject: JsonObject = {
  tags: ["Projects"],
  operationId: "deleteProject",
  summary: "Delete a project",
  description:
    "Protected. Proxied to the project-service `DELETE /projects/{id}`. Soft delete of the project together with everything it deployed: the project disappears from every endpoint and its name becomes available again, its queued deployment jobs are removed, the AWS ECS tasks of its in-progress deployments are stopped, and every deployment and its build output in the S3 bucket is deleted. The project's database row stays locked while this happens, so no new deployment task can be started for the project by a concurrent redeploy or push webhook before the request completes. If stopping a task or deleting from S3 fails the request fails with `500` and nothing is deleted, so it can be retried. The project's GitHub push webhook, if any, is removed from the repository on a best-effort basis once the deletion has committed.",
  security: bearerSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "Project deleted.",
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.PROJECT_DELETED,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...projectProxiedErrorResponses,
  },
};

const createDeployment: JsonObject = {
  tags: ["Deployments"],
  operationId: "createDeployment",
  summary: "Redeploy a project",
  description:
    "Protected. Proxied to the project-service `POST /projects/{id}/deployments`. Starts a fresh deployment of an existing project without changing it, the equivalent of Vercel's \"Redeploy\". The project's current build settings and environment variables are used, so this is how you ship an updated commit or pick up changed environment variables. The user's GitHub authorization is checked, then a new `queued` deployment (trigger `manual`) is created. The deployment is pushed onto the project-service's BullMQ deployment queue, and the separate `deployment-worker` application launches an AWS ECS task running the deployment pipeline for it. Each user runs at most one deployment at a time: other deployments of the same user stay `queued` until the running one finishes, while deployments of other users run in parallel. If the task cannot be started the deployment is marked `failed`. The repository is not re-validated up front: if access was revoked or the branch no longer exists the deployment fails in its `cloning` step. A redeploy is accepted even while other deployments are running; it waits in `queued` until the user's running deployment finishes. The new deployment is returned with status `queued`; the response is `202 Accepted` because the build runs asynchronously.",
  security: bearerSecurity,
  parameters: [projectIdParameter],
  responses: {
    "202": {
      description: "The deployment was created and queued.",
      content: jsonContent("DeploymentResponse", {
        success: true,
        statusCode: 202,
        message: ProjectServiceMessage.DEPLOYMENT_QUEUED,
        data: exampleDeployment,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...projectGithubErrorResponses,
  },
};

const listDeployments: JsonObject = {
  tags: ["Deployments"],
  operationId: "listDeployments",
  summary: "List a project's deployments",
  description:
    "Protected. Proxied to the project-service `GET /projects/{id}/deployments`. Every deployment of the project, newest first, including the one created when the project was imported. Use it to poll the status of a deployment started with `POST /projects/{id}/deployments`.",
  security: bearerSecurity,
  parameters: [
    projectIdParameter,
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
      description: "A page of deployments.",
      content: jsonContent("DeploymentListResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.DEPLOYMENTS_RETRIEVED,
        data: {
          items: [examplePushDeployment, exampleReadyDeployment],
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        },
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...projectProxiedErrorResponses,
  },
};

const getDeployment: JsonObject = {
  tags: ["Deployments"],
  operationId: "getDeployment",
  summary: "Get a deployment",
  description:
    "Protected. Proxied to the project-service `GET /projects/{id}/deployments/{deploymentId}`. Returns a single deployment of the project, including its current status, the commit it built and any error message.",
  security: bearerSecurity,
  parameters: [projectIdParameter, deploymentIdParameter],
  responses: {
    "200": {
      description: "The deployment.",
      content: jsonContent("DeploymentResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.DEPLOYMENT_RETRIEVED,
        data: exampleReadyDeployment,
      }),
    },
    "400": ref("ValidationError"),
    "404": {
      description:
        "The project does not exist for this user, or the project has no deployment with this id. Both use the `NOT_FOUND` error code. Forwarded unchanged from the project-service.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
          examples: {
            project: {
              summary: "Project not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ProjectServiceMessage.PROJECT_NOT_FOUND,
              ),
            },
            deployment: {
              summary: "Deployment not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ProjectServiceMessage.DEPLOYMENT_NOT_FOUND,
              ),
            },
          },
        },
      },
    },
    ...projectProxiedErrorResponses,
  },
};

const cancelDeployment: JsonObject = {
  tags: ["Deployments"],
  operationId: "cancelDeployment",
  summary: "Cancel a deployment",
  description:
    "Protected. Proxied to the project-service `POST /projects/{id}/deployments/{deploymentId}/cancel`. Cancels a deployment that is still in progress (status `queued`, `cloning`, `installing`, `building` or `uploading`): it is marked `canceled`; a deployment still waiting in the queue is removed from it and never started, a running one stops at its next pipeline step and a best-effort request is made to stop the AWS ECS task running it. The user's deployment lock is released, so the user's next queued deployment starts right away. A deployment that has already reached a terminal status (`ready`, `failed` or `canceled`) cannot be canceled and returns `409`.",
  security: bearerSecurity,
  parameters: [projectIdParameter, deploymentIdParameter],
  responses: {
    "200": {
      description: "The canceled deployment.",
      content: jsonContent("DeploymentResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.DEPLOYMENT_CANCELED,
        data: {
          ...exampleDeployment,
          status: "canceled",
          finishedAt: "2026-11-03T10:15:30.000Z",
          updatedAt: "2026-11-03T10:15:30.000Z",
        },
      }),
    },
    "400": ref("ValidationError"),
    "404": {
      description:
        "The project does not exist for this user, or the project has no deployment with this id. Both use the `NOT_FOUND` error code. Forwarded unchanged from the project-service.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
          examples: {
            project: {
              summary: "Project not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ProjectServiceMessage.PROJECT_NOT_FOUND,
              ),
            },
            deployment: {
              summary: "Deployment not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ProjectServiceMessage.DEPLOYMENT_NOT_FOUND,
              ),
            },
          },
        },
      },
    },
    "409": ref("DeploymentNotCancelable"),
    ...projectProxiedErrorResponses,
  },
};

const listEnvironmentVariables: JsonObject = {
  tags: ["Environment variables"],
  operationId: "listEnvironmentVariables",
  summary: "List a project's environment variables",
  description:
    "Protected. Proxied to the project-service `GET /projects/{id}/environment-variables`. Returns every variable with its decrypted value, sorted by key.",
  security: bearerSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "The project's environment variables.",
      content: jsonContent("EnvironmentVariableListResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.ENVIRONMENT_VARIABLES_RETRIEVED,
        data: [exampleEnvironmentVariable],
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...projectProxiedErrorResponses,
  },
};

const setEnvironmentVariable: JsonObject = {
  tags: ["Environment variables"],
  operationId: "setEnvironmentVariable",
  summary: "Create or update an environment variable",
  description:
    "Protected. Proxied to the project-service `PUT /projects/{id}/environment-variables/{key}`. Creates the variable, or replaces its value when the key already exists. The new value is used by the next deployment; deployments that already ran are not affected.",
  security: bearerSecurity,
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
        message: ProjectServiceMessage.ENVIRONMENT_VARIABLE_SAVED,
        data: exampleEnvironmentVariable,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    "422": ref("EnvironmentVariableLimitReached"),
    ...projectProxiedErrorResponses,
  },
};

const deleteEnvironmentVariable: JsonObject = {
  tags: ["Environment variables"],
  operationId: "deleteEnvironmentVariable",
  summary: "Delete an environment variable",
  description:
    "Protected. Proxied to the project-service `DELETE /projects/{id}/environment-variables/{key}`.",
  security: bearerSecurity,
  parameters: [projectIdParameter, environmentVariableKeyParameter],
  responses: {
    "200": {
      description: "Environment variable deleted.",
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.ENVIRONMENT_VARIABLE_DELETED,
      }),
    },
    "400": ref("ValidationError"),
    "404": {
      description:
        "The project does not exist for this user, or the project has no variable with this key. Both use the `NOT_FOUND` error code. Forwarded unchanged from the project-service.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
          examples: {
            project: {
              summary: "Project not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ProjectServiceMessage.PROJECT_NOT_FOUND,
              ),
            },
            environmentVariable: {
              summary: "Environment variable not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ProjectServiceMessage.ENVIRONMENT_VARIABLE_NOT_FOUND,
              ),
            },
          },
        },
      },
    },
    ...projectProxiedErrorResponses,
  },
};

const enableAutoDeploy: JsonObject = {
  tags: ["Projects"],
  operationId: "enableAutoDeploy",
  summary: "Enable automatic deployments on push",
  description:
    "Protected. Proxied to the project-service `POST /projects/{id}/webhook`. Installs, or reinstalls, the GitHub push webhook for the project using the user's GitHub token, with a new random secret, and returns the project with `autoDeploy: true`. Use it for projects imported before automatic deployments existed, for projects whose webhook could not be installed at import time, or to repair a webhook deleted on GitHub. The user must have admin access to the repository.",
  security: bearerSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "The webhook is installed.",
      content: jsonContent("ProjectResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.AUTO_DEPLOY_ENABLED,
        data: exampleProject,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    "422": {
      description:
        "`INVALID_REPOSITORY`: the repository is no longer accessible with push access. `WEBHOOK_PERMISSION_DENIED`: the user is not an admin of the repository. Forwarded unchanged from the project-service.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
          examples: {
            invalidRepository: {
              summary: "Repository not accessible",
              value: errorExample(
                422,
                ErrorCode.INVALID_REPOSITORY,
                ProjectServiceMessage.INVALID_REPOSITORY,
              ),
            },
            permissionDenied: {
              summary: "Not a repository admin",
              value: errorExample(
                422,
                ErrorCode.WEBHOOK_PERMISSION_DENIED,
                ProjectServiceMessage.WEBHOOK_PERMISSION_DENIED,
              ),
            },
          },
        },
      },
    },
    ...projectGithubErrorResponses,
  },
};

const githubWebhook: JsonObject = {
  tags: ["Webhooks"],
  operationId: "receiveGithubWebhook",
  summary: "Receive a GitHub webhook delivery",
  description:
    "Public, called by GitHub. Proxied to the project-service `POST /webhooks/github/projects/{projectId}` without bearer authentication, with the raw body streamed unchanged so the signature can be verified upstream. The body may be up to `MAX_WEBHOOK_BODY_BYTES` (5 MiB by default) instead of `MAX_REQUEST_BODY_BYTES`, and the route uses its own rate limit (`WEBHOOK_RATE_LIMIT_MAX` requests per `WEBHOOK_RATE_LIMIT_WINDOW_MS`) instead of the global one.\n\nThe project-service verifies `X-Hub-Signature-256` with the project's webhook secret, answers `200` to `ping`, and for a `push` to the project's `branch` whose sender is the repository owner or a collaborator, creates a `queued` deployment with trigger `push` for the pushed commit and answers `202` with `data.deploymentId`. Every other event or push (other branches, branch deletions, pushes by non-collaborators, redeliveries of an already processed `X-GitHub-Delivery`) answers `202` with `data.reason`.",
  security: [],
  parameters: [
    {
      name: "projectId",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
    },
    {
      name: "X-GitHub-Event",
      in: "header",
      required: true,
      schema: { type: "string", example: "push" },
    },
    {
      name: "X-GitHub-Delivery",
      in: "header",
      required: true,
      schema: { type: "string" },
    },
    {
      name: "X-Hub-Signature-256",
      in: "header",
      required: true,
      schema: { type: "string", pattern: "^sha256=[0-9a-f]{64}$" },
    },
  ],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          description: "GitHub's webhook payload for the event.",
        },
      },
    },
  },
  responses: {
    "200": {
      description: "A `ping` event was received.",
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: ProjectServiceMessage.WEBHOOK_PONG,
      }),
    },
    "202": {
      description:
        "The event was accepted. Either a deployment was queued for the pushed commit, or the event was ignored.",
      content: {
        "application/json": {
          schema: {
            oneOf: [
              { $ref: "#/components/schemas/WebhookQueuedResponse" },
              { $ref: "#/components/schemas/WebhookIgnoredResponse" },
            ],
          },
          examples: {
            queued: {
              summary: "Deployment queued",
              value: {
                success: true,
                statusCode: 202,
                message: ProjectServiceMessage.WEBHOOK_DEPLOYMENT_QUEUED,
                data: { deploymentId: examplePushDeployment.id },
              },
            },
            ignored: {
              summary: "Event ignored",
              value: {
                success: true,
                statusCode: 202,
                message: ProjectServiceMessage.WEBHOOK_IGNORED,
                data: {
                  reason:
                    "pusher is not the repository owner or a collaborator",
                },
              },
            },
          },
        },
      },
    },
    "400": errorResponse(
      "`VALIDATION_ERROR`: `projectId` is not a UUID. `BAD_REQUEST`: the payload could not be understood. Forwarded unchanged from the project-service.",
      errorExample(
        400,
        ErrorCode.BAD_REQUEST,
        ProjectServiceMessage.INVALID_WEBHOOK_PAYLOAD,
      ),
    ),
    "401": ref("InvalidWebhookSignature"),
    "404": ref("WebhookProjectNotFound"),
    ...proxiedErrorResponses,
    "413": ref("WebhookPayloadTooLarge"),
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "API Gateway",
    version: "1.0.0",
    description:
      "Single entry point for the React deployment platform. Routes under `/auth` are reverse-proxied to the auth-service and routes under `/projects` and `/webhooks` to the project-service, with the method, path, query string, headers, cookies and body left untouched, so request and response contracts are identical to the upstream service.\n\n**Authentication.** The gateway authenticates every `/auth/*` request except the public routes `GET /auth/github`, `GET /auth/github/callback`, `POST /auth/refresh` and `POST /auth/logout`; any other method or path under `/auth`, and every route under `/projects`, is denied by default without a valid bearer token. Routes under `/webhooks` are public; they are called by GitHub and authenticated upstream by the webhook signature. It verifies the HS256 access token against the shared `JWT_ACCESS_SECRET`, `JWT_ISSUER` and `JWT_AUDIENCE`, rejects refresh tokens, and checks in Redis that the token is not blacklisted and that its session (created at login, deleted at logout) still exists, so logging out invalidates all access tokens of that session. Missing tokens give `401 UNAUTHORIZED`; invalid, expired or revoked tokens give `401 INVALID_TOKEN`. The `Authorization` header is still forwarded, and verified requests also carry `x-user-id` and `x-session-id` headers to the upstream. Client-supplied `x-user-id` and `x-session-id` headers are always removed. The project-service relies on `x-user-id` to scope every project to its owner.\n\n**Rate limiting.** Redis-backed, per client IP, shared across gateway instances, with a stricter limit on the credential routes (see the `429` response). If Redis is unavailable the limiter lets requests through while authenticated routes fail with `503`.\n\n**Request size.** Bodies larger than `MAX_REQUEST_BODY_BYTES` (or `MAX_WEBHOOK_BODY_BYTES` under `/webhooks`) are rejected with `413 PAYLOAD_TOO_LARGE`. Bodies are streamed to the upstream, never parsed.\n\n**Other behaviour.** Security headers, CORS (the single source of CORS headers; any `Access-Control-*` header sent by an upstream service is dropped), an `x-request-id` header (generated when absent and forwarded upstream) and `X-Forwarded-*` headers are added. Unknown routes return a `404` with the standard error envelope; upstream failures return `502`, `503` or `504` with the same envelope.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    {
      name: "Health",
      description: "Gateway liveness and upstream service checks.",
    },
    {
      name: "Auth",
      description:
        "GitHub sign-in, sessions and the current user, proxied to the auth-service. Public routes are listed in the API description; everything else requires a bearer token.",
    },
    {
      name: "Projects",
      description:
        "Create, list, read, update and delete the authenticated user's projects, proxied to the project-service. All routes require a bearer token.",
    },
    {
      name: "Deployments",
      description:
        "Builds of a project, proxied to the project-service. Redeploy an existing project to ship a new commit or changed environment variables. All routes require a bearer token.",
    },
    {
      name: "Environment variables",
      description:
        "Encrypted per-project variables passed to the install and build commands of each deployment, proxied to the project-service. All routes require a bearer token.",
    },
    {
      name: "Webhooks",
      description:
        "Inbound GitHub webhooks that deploy pushes to a project's production branch, proxied to the project-service. Public; authenticated by the webhook signature.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/auth/github": { get: githubAuthorize },
    "/auth/github/callback": { get: githubCallback },
    "/auth/refresh": { post: refresh },
    "/auth/logout": { post: logout },
    "/auth/me": { get: me },
    "/projects": { post: createProject, get: listProjects },
    "/projects/repositories": { get: listRepositories },
    "/projects/{id}": {
      get: getProject,
      patch: updateProject,
      delete: deleteProject,
    },
    "/projects/{id}/webhook": { post: enableAutoDeploy },
    "/projects/{id}/deployments": {
      post: createDeployment,
      get: listDeployments,
    },
    "/projects/{id}/deployments/{deploymentId}": { get: getDeployment },
    "/projects/{id}/deployments/{deploymentId}/cancel": {
      post: cancelDeployment,
    },
    "/projects/{id}/environment-variables": { get: listEnvironmentVariables },
    "/projects/{id}/environment-variables/{key}": {
      put: setEnvironmentVariable,
      delete: deleteEnvironmentVariable,
    },
    "/webhooks/github/projects/{projectId}": { post: githubWebhook },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Access token returned by `/auth/refresh` (call it right after GitHub sign-in). Verified by the gateway and again by the auth-service; the `Authorization` header is forwarded unchanged.",
      },
      refreshCookie: {
        type: "apiKey",
        in: "cookie",
        name: REFRESH_COOKIE_NAME,
        description:
          "HttpOnly refresh token cookie set by `/auth/github/callback` and `/auth/refresh`. Browsers send it automatically to `/auth/*`.",
      },
    },
    schemas,
    responses,
  },
};
