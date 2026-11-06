import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import {
  deploymentStatuses,
  deploymentTriggers,
  projectFrameworks,
} from "@repo/db";
import { packageManagers } from "../constants/package-manager";
import { runtimes } from "../constants/runtime";
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
  url: "http://brave-falcon.localhost:8080",
  githubRepositoryId: 715409281,
  private: false,
  name: "marketing-site",
  description: "Public marketing website",
  repositoryUrl: "https://github.com/acme/marketing-site",
  branch: "main",
  framework: "vite",
  rootDirectory: ".",
  packageManager: "npm",
  runtime: "node",
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
  packageManager: "npm",
  runtime: "node",
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

const examplePushDeployment = {
  ...exampleDeployment,
  trigger: "push",
  commitSha: "9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c",
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

const deploymentIdParameter: JsonObject = {
  name: "deploymentId",
  in: "path",
  required: true,
  description: "Identifier of a deployment that belongs to the project.",
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
  packageManager: {
    type: "string",
    enum: [...packageManagers],
    description:
      "Package manager used to install dependencies. Defaults to `npm`. The `installCommand` must be run with this package manager.",
    example: "npm",
  },
  runtime: {
    type: "string",
    enum: [...runtimes],
    description:
      "Runtime that executes the build. Defaults to `bun` when `packageManager` is `bun`, otherwise `node`. The `buildCommand` must run on this runtime: `node` runs the build through a Node-based package manager (`npm`/`npx`/`pnpm`/`pnpx`/`yarn`/`node`), `bun` runs it with `bun`/`bunx`.",
    example: "node",
  },
  installCommand: {
    type: "string",
    minLength: 1,
    maxLength: 500,
    description:
      "Must invoke the project's `packageManager`. Defaults to that package manager's install command (e.g. `npm install`, `pnpm install`, `yarn install`, `bun install`).",
    example: "npm install",
  },
  buildCommand: {
    type: "string",
    minLength: 1,
    maxLength: 500,
    description:
      "Must run on the project's `runtime`. Defaults to `bun run build` on the bun runtime, otherwise the package manager's build command (e.g. `npm run build`, `pnpm run build`, `yarn build`).",
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
  PackageManager: {
    type: "string",
    enum: [...packageManagers],
    description:
      "Supported package managers, used for the install command. `npm` is always available; `pnpm` and `yarn` are provided by corepack; `bun` is installed in the build image.",
  },
  Runtime: {
    type: "string",
    enum: [...runtimes],
    description:
      "Runtime that executes the build command, independent of the package manager. Both `node` and `bun` are available in the build image, so e.g. dependencies can be installed with pnpm or yarn and the build run on either runtime.",
  },
  CreateProjectRequest: {
    type: "object",
    additionalProperties: false,
    required: ["repositoryId"],
    description:
      "Imports one of the repositories returned by `GET /projects/repositories`. The name, description, repository URL, visibility and branch of the project are taken from GitHub. `packageManager` defaults to `npm` and `runtime` defaults to `bun` for a bun project and `node` otherwise; `installCommand` falls back to the package manager's default and `buildCommand` to the runtime's default when omitted. A supplied `installCommand` must invoke the package manager and a supplied `buildCommand` must run on the runtime. The remaining settings start with defaults. Everything except the repository can be changed later with `PATCH`.",
    properties: {
      repositoryId: {
        type: "integer",
        minimum: 1,
        description:
          "GitHub numeric repository id (`id` from `GET /projects/repositories`). The repository must be accessible with the user's GitHub token, the user must have push access, it must not be archived or disabled, and its default branch must be a Vite project.",
        example: 715409281,
      },
      packageManager: projectProperties["packageManager"],
      runtime: projectProperties["runtime"],
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
      "Partial update. At least one field is required; fields that are omitted stay unchanged. The repository, slug and framework cannot be changed. Changing `branch` or `rootDirectory` re-checks the new location with the GitHub API and requires it to still be a Vite project. `installCommand` must invoke the project's `packageManager` and `buildCommand` must run on its `runtime` (the ones being set in this request, otherwise the current ones). Switching `packageManager` without supplying an `installCommand` resets it to the new package manager's default; switching `packageManager` or `runtime` without supplying a `buildCommand` resets it to the runtime's default.",
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
      packageManager: projectProperties["packageManager"],
      runtime: projectProperties["runtime"],
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
      "packageManager",
      "runtime",
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
      packageManager: { $ref: "#/components/schemas/PackageManager" },
      runtime: { $ref: "#/components/schemas/Runtime" },
      installCommand: { type: "string" },
      buildCommand: { type: "string" },
      outputDirectory: { type: "string" },
      autoDeploy: {
        type: "boolean",
        description:
          "Whether a GitHub push webhook is installed on the repository, so pushes to the project's `branch` by the repository owner or a collaborator deploy automatically. Installing a webhook needs admin access to the repository, so this is `false` when the importing user is not a repository admin; enable it later with `POST /projects/{id}/webhook`.",
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  DeploymentTrigger: {
    type: "string",
    enum: [...deploymentTriggers],
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
        example: 'ref "refs/heads/feature" is not the production branch',
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
    enum: [...deploymentStatuses],
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
      "packageManager",
      "runtime",
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
      packageManager: { $ref: "#/components/schemas/PackageManager" },
      runtime: { $ref: "#/components/schemas/Runtime" },
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
        enum: [...deploymentStatuses, null],
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
          packageManagerCommandMismatch: {
            summary:
              "Install command does not use the project's package manager",
            value: errorExample(
              422,
              ErrorCode.PACKAGE_MANAGER_COMMAND_MISMATCH,
              ErrorMessage.PACKAGE_MANAGER_COMMAND_MISMATCH,
              { packageManager: "pnpm" },
            ),
          },
          runtimeCommandMismatch: {
            summary: "Build command does not run on the project's runtime",
            value: errorExample(
              422,
              ErrorCode.RUNTIME_COMMAND_MISMATCH,
              ErrorMessage.RUNTIME_COMMAND_MISMATCH,
              { runtime: "bun" },
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
  WebhookPermissionDenied: errorResponse(
    "The webhook could not be installed because the user does not have admin access to the repository (GitHub answered 403 or 404). Only a repository admin can install webhooks; the project keeps `autoDeploy: false`.",
    errorExample(
      422,
      ErrorCode.WEBHOOK_PERMISSION_DENIED,
      ErrorMessage.WEBHOOK_PERMISSION_DENIED,
    ),
  ),
  InvalidWebhookSignature: errorResponse(
    "The `X-Hub-Signature-256` header is missing or is not the HMAC-SHA256 of the raw request body with the project's webhook secret.",
    errorExample(
      401,
      ErrorCode.INVALID_WEBHOOK_SIGNATURE,
      ErrorMessage.INVALID_WEBHOOK_SIGNATURE,
    ),
  ),
  InvalidWebhookPayload: errorResponse(
    "The body is not JSON, a `push` event is missing the `X-GitHub-Delivery` header, or the push payload does not have the expected shape. Path parameter validation errors use `VALIDATION_ERROR` instead.",
    errorExample(
      400,
      ErrorCode.BAD_REQUEST,
      ErrorMessage.INVALID_WEBHOOK_PAYLOAD,
    ),
  ),
  WebhookProjectNotFound: errorResponse(
    "No active project with this id exists, or the project has no webhook installed.",
    errorExample(404, ErrorCode.NOT_FOUND, ErrorMessage.PROJECT_NOT_FOUND),
  ),
  DeploymentNotFound: errorResponse(
    "The project exists but has no deployment with this id. Deployments of other projects are reported the same way.",
    errorExample(404, ErrorCode.NOT_FOUND, ErrorMessage.DEPLOYMENT_NOT_FOUND),
  ),
  DeploymentNotCancelable: errorResponse(
    "The deployment is already in a terminal status (`ready`, `failed` or `canceled`), so it can no longer be canceled.",
    errorExample(
      409,
      ErrorCode.DEPLOYMENT_NOT_CANCELABLE,
      ErrorMessage.DEPLOYMENT_NOT_CANCELABLE,
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
    "Imports a repository picked from `GET /projects/repositories`. Using the user's GitHub token (fetched from the auth-service), the repository is looked up by id and must be accessible with push access, then the framework is detected from its default branch (no clone) and must be Vite. On success the project, its environment variables (encrypted) and its first `queued` deployment (trigger `create`) are stored in one transaction with a unique two-word slug, and the project is returned. Once that transaction has committed, a GitHub push webhook is installed on the repository pointing at `{PUBLIC_API_URL}/webhooks/github/projects/{id}` with a random per-project secret (stored encrypted), so later pushes to the project's `branch` deploy automatically; this needs admin access to the repository and never fails the request, and `autoDeploy` in the response tells whether it succeeded. Then the deployment is queued. Deployments are not started directly: the deployment is pushed onto a BullMQ queue (`deployments`, Redis) and the separate `deployment-worker` application launches an AWS ECS (Fargate) task running the deployment pipeline for it, with `DEPLOYMENT_ID`, `USER_ID` and `GITHUB_TOKEN_ENCRYPTED` (the user's GitHub token, fetched from the auth-service when the task is launched and AES-256-GCM encrypted with `ENV_ENCRYPTION_KEY`) passed as container environment variables. Each user runs at most one deployment at a time: the worker holds a per-user Redis lock while the deployment runs, and any other deployment of the same user stays `queued` until the running one finishes, while deployments of other users run in parallel. If the task cannot be started (ECS unreachable, rejected the request or returned no task), the queue cannot be reached, or the user's GitHub authorization is missing when the task is launched, the deployment is marked `failed` with a `[initialize]` error message. The project is still returned when the deployment fails to start, so the request does not fail. Environment variables are not part of the response; read them with `GET /projects/{id}/environment-variables`. If a random slug is already taken a new one is generated; `409 CONFLICT` is returned only after repeated collisions.",
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
    "Newest projects first, optionally filtered by `search`. Deleted projects and projects of other users are never returned.",
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
    {
      name: "search",
      in: "query",
      required: false,
      description:
        "Case-insensitive substring match against the project `name`, `slug` and `description`. Leading and trailing whitespace is ignored and a blank value disables the filter. `%`, `_` and `\\` are matched literally. `pagination.total` counts only the matching projects.",
      schema: { type: "string", maxLength: 100 },
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
    "Soft delete of the project together with everything it deployed. The project disappears from every endpoint and its name becomes available again. The request locks the project's database row (`SELECT ... FOR UPDATE`) for its whole duration, and then, in this order: removes the project's queued deployment jobs from the BullMQ queue, stops every AWS ECS task of its in-progress deployments and waits until they have stopped, deletes each deployment's build output from the S3 bucket (`__outputs/{deploymentId}/`), and deletes the deployment rows. The user's deployment lock is then released for any in-progress deployment that held it. Everything runs in one database transaction, so if stopping a task or deleting from S3 fails (`500`) nothing is deleted and the request can simply be retried. Because the row stays locked until the transaction ends, no ECS task can be started for the project while the request is processing: the `deployment-worker` and the deployment-creating routes (redeploy, push webhook) wait for the lock and then see the project as deleted, so a deployment created by a concurrent redeploy or push is rejected with `404` (redeploy) or skipped (webhook), and a job that was already queued is skipped by the worker without starting a task. Once the transaction has committed, if the project has a GitHub push webhook it is removed from the repository on a best-effort basis; a failure to remove it does not fail the request, and pushes delivered afterwards are rejected with `404`.",
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

const createDeployment: JsonObject = {
  tags: ["Deployments"],
  operationId: "createDeployment",
  summary: "Redeploy a project",
  description:
    "Starts a fresh deployment of an existing project without changing it, the equivalent of Vercel's \"Redeploy\". The project's current build settings (`branch`, `framework`, `rootDirectory`, `packageManager`, `runtime`, `installCommand`, `buildCommand`, `outputDirectory`) and its current environment variables are used, so this is how you ship an updated commit or pick up changed environment variables. The user's GitHub authorization is checked, then a new `queued` deployment (trigger `manual`) is created and queued exactly as on project creation. Deployments are not started directly: the deployment is pushed onto a BullMQ queue (`deployments`, Redis) and the separate `deployment-worker` application launches an AWS ECS (Fargate) task running the deployment pipeline for it, with `DEPLOYMENT_ID`, `USER_ID` and `GITHUB_TOKEN_ENCRYPTED` (the user's GitHub token, fetched from the auth-service when the task is launched and AES-256-GCM encrypted with `ENV_ENCRYPTION_KEY`) passed as container environment variables. Each user runs at most one deployment at a time: the worker holds a per-user Redis lock while the deployment runs, and any other deployment of the same user stays `queued` until the running one finishes, while deployments of other users run in parallel. If the task cannot be started (ECS unreachable, rejected the request or returned no task), the queue cannot be reached, or the user's GitHub authorization is missing when the task is launched, the deployment is marked `failed` with a `[initialize]` error message. The repository is not re-validated up front: if access was revoked or the branch no longer exists the deployment fails in its `cloning` step. A redeploy is accepted even while other deployments of the project or the user are running; it waits in `queued` until the user's running deployment finishes. The new deployment is returned with status `queued`; the response is `202 Accepted` because the build runs asynchronously.",
  security: userIdSecurity,
  parameters: [projectIdParameter],
  responses: {
    "202": {
      description: "The deployment was created and queued.",
      content: jsonContent("DeploymentResponse", {
        success: true,
        statusCode: 202,
        message: SuccessMessage.DEPLOYMENT_QUEUED,
        data: exampleDeployment,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...githubErrorResponses,
  },
};

const listDeployments: JsonObject = {
  tags: ["Deployments"],
  operationId: "listDeployments",
  summary: "List a project's deployments",
  description:
    "Every deployment of the project, newest first, including the one created when the project was imported. Use it to poll the status of a deployment started with `POST /projects/{id}/deployments`.",
  security: userIdSecurity,
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
        message: SuccessMessage.DEPLOYMENTS_RETRIEVED,
        data: {
          items: [examplePushDeployment, exampleReadyDeployment],
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        },
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    ...protectedErrorResponses,
  },
};

const getDeployment: JsonObject = {
  tags: ["Deployments"],
  operationId: "getDeployment",
  summary: "Get a deployment",
  description:
    "Returns a single deployment of the project, including its current status, the commit it built and any error message.",
  security: userIdSecurity,
  parameters: [projectIdParameter, deploymentIdParameter],
  responses: {
    "200": {
      description: "The deployment.",
      content: jsonContent("DeploymentResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.DEPLOYMENT_RETRIEVED,
        data: exampleReadyDeployment,
      }),
    },
    "400": ref("ValidationError"),
    "404": {
      description:
        "`PROJECT_NOT_FOUND`: the project does not exist for this user. `DEPLOYMENT_NOT_FOUND`: the project has no deployment with this id. Both use the `NOT_FOUND` error code.",
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
            deployment: {
              summary: "Deployment not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ErrorMessage.DEPLOYMENT_NOT_FOUND,
              ),
            },
          },
        },
      },
    },
    ...protectedErrorResponses,
  },
};

const deploymentLogsDeploymentIdParameter: JsonObject = {
  name: "id",
  in: "path",
  required: true,
  description:
    "Identifier of a deployment of a project owned by the authenticated user.",
  schema: { type: "string", format: "uuid" },
};

const listDeploymentLogs: JsonObject = {
  tags: ["Deployments"],
  operationId: "listDeploymentLogs",
  summary: "List a deployment's logs",
  description:
    "Returns the log events of a deployment in the order the pipeline emitted them (ascending `sequence`). The `deployment-service` publishes every event to the Kafka topic `deployment-logs` and the separate `log-worker` application stores them in the ClickHouse table `log_events`, so this route reads from ClickHouse and logs show up a moment after they are produced; The deployment must belong to a project owned by the user, otherwise `404`. Pages are cursor based: pass the `nextAfter` of the previous response as `after` to get the following events, which also lets a client poll a running deployment for new lines; `hasMore` tells whether the page was full. A deployment that has not emitted anything yet returns an empty `items` array. For a running deployment the live stream is served by the `realtime-service` over Socket.IO: subscribe there first, load the history here and merge by `sequence`. Events delivered twice by Kafka are returned once. If ClickHouse cannot be reached the response is `500`.",
  security: userIdSecurity,
  parameters: [
    deploymentLogsDeploymentIdParameter,
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
      schema: { type: "integer", minimum: 1, maximum: 1000, default: 500 },
    },
  ],
  responses: {
    "200": {
      description: "A page of log events.",
      content: jsonContent("DeploymentLogsResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.DEPLOYMENT_LOGS_RETRIEVED,
        data: exampleDeploymentLogs,
      }),
    },
    "400": ref("ValidationError"),
    "404": errorResponse(
      "`DEPLOYMENT_NOT_FOUND`: the deployment does not exist, or its project is not owned by this user or was deleted. Uses the `NOT_FOUND` error code.",
      errorExample(404, ErrorCode.NOT_FOUND, ErrorMessage.DEPLOYMENT_NOT_FOUND),
    ),
    ...protectedErrorResponses,
  },
};

const cancelDeployment: JsonObject = {
  tags: ["Deployments"],
  operationId: "cancelDeployment",
  summary: "Cancel a deployment",
  description:
    "Cancels a deployment that is still in progress (status `queued`, `cloning`, `installing`, `building` or `uploading`). The deployment is marked `canceled`: a deployment still waiting in the queue is removed from it and never started, a running one stops at its next pipeline step and a best-effort request is made to stop the AWS ECS task running it. The user's per-user deployment lock is released, so the user's next queued deployment starts right away. A deployment that has already reached a terminal status (`ready`, `failed` or `canceled`) cannot be canceled and returns `409`. Returns the canceled deployment.",
  security: userIdSecurity,
  parameters: [projectIdParameter, deploymentIdParameter],
  responses: {
    "200": {
      description: "The canceled deployment.",
      content: jsonContent("DeploymentResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.DEPLOYMENT_CANCELED,
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
        "`PROJECT_NOT_FOUND`: the project does not exist for this user. `DEPLOYMENT_NOT_FOUND`: the project has no deployment with this id. Both use the `NOT_FOUND` error code.",
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
            deployment: {
              summary: "Deployment not found",
              value: errorExample(
                404,
                ErrorCode.NOT_FOUND,
                ErrorMessage.DEPLOYMENT_NOT_FOUND,
              ),
            },
          },
        },
      },
    },
    "409": ref("DeploymentNotCancelable"),
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

const enableAutoDeploy: JsonObject = {
  tags: ["Projects"],
  operationId: "enableAutoDeploy",
  summary: "Enable automatic deployments on push",
  description:
    "Installs, or reinstalls, the GitHub push webhook for the project using the user's GitHub token, with a new random secret, and returns the project with `autoDeploy: true`. Use it for projects imported before automatic deployments existed, for projects whose webhook could not be installed at import time, or to repair a webhook deleted on GitHub. A previously installed webhook is deleted first; if GitHub reports a webhook with the same URL already exists it is updated instead. The user must have admin access to the repository.",
  security: userIdSecurity,
  parameters: [projectIdParameter],
  responses: {
    "200": {
      description: "The webhook is installed.",
      content: jsonContent("ProjectResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.AUTO_DEPLOY_ENABLED,
        data: exampleProject,
      }),
    },
    "400": ref("ValidationError"),
    "404": ref("ProjectNotFound"),
    "422": {
      description:
        "`INVALID_REPOSITORY`: the repository is no longer accessible with push access. `WEBHOOK_PERMISSION_DENIED`: the user is not an admin of the repository.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
          examples: {
            invalidRepository: {
              summary: "Repository not accessible",
              value: errorExample(
                422,
                ErrorCode.INVALID_REPOSITORY,
                ErrorMessage.INVALID_REPOSITORY,
              ),
            },
            permissionDenied: {
              summary: "Not a repository admin",
              value: errorExample(
                422,
                ErrorCode.WEBHOOK_PERMISSION_DENIED,
                ErrorMessage.WEBHOOK_PERMISSION_DENIED,
              ),
            },
          },
        },
      },
    },
    ...githubErrorResponses,
  },
};

const githubWebhook: JsonObject = {
  tags: ["Webhooks"],
  operationId: "receiveGithubWebhook",
  summary: "Receive a GitHub webhook delivery",
  description:
    "Called by GitHub, not by clients. The URL is installed as the project's push webhook. It needs no user authentication: the raw body (`application/json`, at most `WEBHOOK_MAX_BODY_BYTES`, default 5 MiB) must be signed with the project's webhook secret in `X-Hub-Signature-256`, and this route is excluded from the per-client rate limit.\n\n- `ping` events answer `200`.\n- Other events, and `push` events that do not deploy, answer `202` with `data.reason`. A push is skipped when it is not for the project's repository, its `ref` is not `refs/heads/{branch}` of the project, it deletes the branch, the project is deleted while the push is being handled, or its `X-GitHub-Delivery` id was already processed (deliveries are remembered in Redis for 24 hours, so redeliveries never deploy twice).\n- A push is only deployed when its sender is the repository owner, or a collaborator of the repository as reported by GitHub (`GET /repos/{owner}/{repo}/collaborators/{username}` called with the project owner's GitHub token). Pushes by anyone else are skipped.\n- An accepted push creates a `queued` deployment with trigger `push` and `commitSha` set to the pushed commit (`after`), queues it like any other deployment and answers `202` with `data.deploymentId`.\n\nIf processing fails with a `5xx`, the delivery id is forgotten so a redelivery from GitHub is processed again.",
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
      description: "Unique delivery id, required for `push` events.",
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
        message: SuccessMessage.WEBHOOK_PONG,
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
                message: SuccessMessage.WEBHOOK_DEPLOYMENT_QUEUED,
                data: { deploymentId: examplePushDeployment.id },
              },
            },
            ignored: {
              summary: "Event ignored",
              value: {
                success: true,
                statusCode: 202,
                message: SuccessMessage.WEBHOOK_IGNORED,
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
    "400": {
      description:
        "`VALIDATION_ERROR`: `projectId` is not a UUID. `BAD_REQUEST`: the payload could not be understood.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" },
          examples: {
            invalidPayload: {
              summary: "Invalid payload",
              value: errorExample(
                400,
                ErrorCode.BAD_REQUEST,
                ErrorMessage.INVALID_WEBHOOK_PAYLOAD,
              ),
            },
          },
        },
      },
    },
    "401": ref("InvalidWebhookSignature"),
    "404": ref("WebhookProjectNotFound"),
    "413": {
      description: "The body is larger than `WEBHOOK_MAX_BODY_BYTES`.",
    },
    "500": ref("InternalServerError"),
    "503": ref("GithubUnavailable"),
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "Project Service API",
    version: "1.0.0",
    description: `Project management for the React deployment platform. A project describes how to build a Vite app from one of the user's GitHub repositories (public or private) and is owned by exactly one user.\n\n**Authentication.** The service does not verify tokens. It trusts the \`${USER_ID_HEADER}\` header that the api-gateway sets after verifying the bearer token, so it must only be reachable through the gateway. Every \`/projects\` and \`/deployment\` route requires that header to be a UUID and only ever reads or changes projects, and the deployments of projects, owned by that user.\n\n**GitHub access.** Routes that talk to GitHub fetch the user's GitHub OAuth token from the auth-service (\`GET /internal/users/{id}/github-token\`, authenticated with \`INTERNAL_API_KEY\`) and call GitHub with it, so private repositories are supported and GitHub's per-user rate limit applies. Deployment logs are read from ClickHouse (\`CLICKHOUSE_URL\`), where the \`log-worker\` application stores them. Unknown routes return a \`404\` with the standard error envelope.`,
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Liveness and dependency checks." },
    {
      name: "Projects",
      description: "Create, list, read, update and delete projects.",
    },
    {
      name: "Deployments",
      description:
        "Builds of a project. Created on project import and on redeploy, then run asynchronously by the deployment pipeline.",
    },
    {
      name: "Environment variables",
      description:
        "Encrypted per-project variables passed to the install and build commands of each deployment.",
    },
    {
      name: "Webhooks",
      description:
        "Inbound GitHub webhooks that deploy pushes to a project's production branch.",
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
    "/projects/{id}/webhook": { post: enableAutoDeploy },
    "/projects/{id}/deployments": {
      post: createDeployment,
      get: listDeployments,
    },
    "/projects/{id}/deployments/{deploymentId}": { get: getDeployment },
    "/deployment/{id}/logs": { get: listDeploymentLogs },
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
