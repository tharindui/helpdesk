import { Sentry } from "../lib/sentry";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "./validateBody";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ValidationError)
    return void res.status(400).json({ errors: err.fieldErrors });

  Sentry.captureException(err);
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
