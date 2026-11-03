import { z } from "zod";

export abstract class InternalValidator {
  static readonly githubToken = {
    params: z.object({ id: z.uuid() }).strict(),
  };
}
