import { z } from "zod";

export const DEFAULT_LOG_PAGE_SIZE = 500;
export const MAX_LOG_PAGE_SIZE = 1000;

export abstract class DeploymentLogValidator {
  static readonly list = {
    params: z.object({ id: z.uuid() }).strict(),
    query: z.object({
      after: z.coerce.number().int().min(0).default(0),
      limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_LOG_PAGE_SIZE)
        .default(DEFAULT_LOG_PAGE_SIZE),
    }),
  };
}
