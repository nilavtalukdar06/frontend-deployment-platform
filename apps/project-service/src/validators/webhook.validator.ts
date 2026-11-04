import { z } from "zod";

export abstract class WebhookValidator {
  static readonly github = {
    params: z.object({ projectId: z.uuid() }).strict(),
  };
}
