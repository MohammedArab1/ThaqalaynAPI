import { STATUS_CODES } from "node:http";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../errors.js";

/**
 * Non-AppError errors can still carry an HTTP status. Body-parser, for
 * example, raises a SyntaxError with status/statusCode 400 for malformed
 * JSON. Honoring that keeps the status correct while still rendering the
 * uniform `{ code, message, details }` shape.
 */
const getErrorStatus = (error: unknown): number => {
  if (typeof error !== "object" || error === null) return 500;

  const candidate =
    (error as { status?: unknown }).status ??
    (error as { statusCode?: unknown }).statusCode;

  if (typeof candidate === "number" && candidate >= 400 && candidate < 600) {
    return candidate;
  }

  return 500;
};

/**
 * The single place where REST errors become JSON. Every error in the app
 * arrives here: validation middleware throws synchronously (Express catches
 * that), controllers throw inside async handlers (asyncHandler converts the
 * rejection into next(error)), the rate limiter rejects, and body parsing
 * failures are raised before routing.
 *
 * The rendered bodies are pinned by contract tests:
 * `{ code, message }` (+ `details` when present).
 */
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // If a response already started, delegate to Express's default handler so
  // it can close the connection instead of throwing "headers already sent".
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    // 4xx are expected outcomes, not operational problems: don't log them
    // as errors. 5xx indicate a bug and get logged with the stack.
    if (error.status >= 500) {
      console.error("Application error:", error);
    }

    res.status(error.status).json({
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
    return;
  }

  const status = getErrorStatus(error);

  if (status >= 500) {
    console.error("Unexpected error:", error);
  }

  const message =
    status >= 500
      ? "Internal server error"
      : (STATUS_CODES[status] ?? "Bad request");

  res.status(status).json({
    code: status >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST",
    message,
    ...(process.env.NODE_ENV === "development" && error instanceof Error
      ? { details: error.message }
      : {}),
  });
};
