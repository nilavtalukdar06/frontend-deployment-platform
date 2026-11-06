import { z } from "zod";

export const deploymentLogEventSchema = z.looseObject({
  deploymentId: z.string().min(1),
  projectId: z.string().nullable(),
  message: z.string(),
});

export type DeploymentLogEventPayload = z.infer<
  typeof deploymentLogEventSchema
>;
