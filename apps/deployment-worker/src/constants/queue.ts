export const DEPLOYMENT_QUEUE_NAME = "deployments";

export const DEPLOYMENT_JOB_ATTEMPTS = 3;

export interface DeploymentJobData {
  deploymentId: string;
  userId: string;
}
