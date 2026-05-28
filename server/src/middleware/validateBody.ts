import { ZodSchema } from "zod";

export class ValidationError extends Error {
  constructor(public readonly fieldErrors: Record<string, string[] | undefined>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success)
    throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[] | undefined>);
  return result.data;
}
