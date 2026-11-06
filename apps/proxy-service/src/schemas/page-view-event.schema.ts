import { z } from "zod";

export const pageViewEventSchema = z.object({
  site: z.string().min(1),
  deploymentId: z.string().min(1),
  route: z.string().min(1),
});

export type PageViewEventPayload = z.infer<typeof pageViewEventSchema>;
