import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).id;

  if (err instanceof ZodError) {
    return res.status(422).json({ error: "Validation failed", details: err.flatten(), requestId });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, requestId });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "Internal server error", requestId });
}
