import { z } from "zod";

export abstract class DeploymentValidator {
  static readonly listLogs = {
    params: z.object({ id: z.uuid() }).strict(),
    query: z.object({
      after: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().min(1).max(1000).default(500),
    }),
  };
}
