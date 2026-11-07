import type {
  DeploymentStatus,
  DeploymentTrigger,
  PackageManager,
  Runtime,
} from "@/features/deployments/types";

export interface LatestDeployment {
  id: string;
  status: DeploymentStatus;
  trigger: DeploymentTrigger;
  branch: string;
  commitSha: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  slug: string;
  url: string;
  githubRepositoryId: number;
  private: boolean;
  name: string;
  description: string | null;
  repositoryUrl: string;
  branch: string;
  framework: "vite";
  rootDirectory: string;
  packageManager: PackageManager;
  runtime: Runtime;
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  autoDeploy: boolean;
  latestDeployment: LatestDeployment | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariableInput {
  key: string;
  value: string;
}

export interface CreateProjectInput {
  repositoryId: number;
  packageManager: PackageManager;
  installCommand?: string;
  buildCommand?: string;
  environmentVariables?: EnvironmentVariableInput[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  branch?: string;
  rootDirectory?: string;
  outputDirectory?: string;
  packageManager?: PackageManager;
  runtime?: Runtime;
  installCommand?: string;
  buildCommand?: string;
}
