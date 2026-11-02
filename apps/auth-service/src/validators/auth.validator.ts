import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email().min(3).max(320));

export abstract class AuthValidator {
  static readonly register = {
    body: z
      .object({
        email,
        password: z.string().min(10).max(128),
      })
      .strict(),
  };

  static readonly login = {
    body: z
      .object({
        email,
        password: z.string().min(1).max(128),
      })
      .strict(),
  };
}
