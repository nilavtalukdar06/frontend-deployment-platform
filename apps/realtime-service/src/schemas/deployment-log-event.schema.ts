import { z } from "zod";

export const deploymentLogEventSchema = z.looseObject({
  deploymentId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  message: z.string(),
  timestamp: z.string().optional(),
});

export const subscribePayloadSchema = z.object({
  deploymentId: z.uuid(),
});

export type DeploymentLogEvent = z.infer<typeof deploymentLogEventSchema>;
