import type { DeploymentStep } from "../constants/deployment-step.enum";

export class DeploymentError extends Error {
  constructor(
    public readonly step: DeploymentStep,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "DeploymentError";
  }
}
