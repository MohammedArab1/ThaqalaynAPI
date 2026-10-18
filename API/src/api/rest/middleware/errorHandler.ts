import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../errors.js';

/**
 * The single place where REST errors become JSON. Every error in the app
 * arrives here: validation middleware throws synchronously (Express catches
 * that), controllers throw inside async handlers (asyncHandler converts the
 * rejection into next(error)), and anything else lands here as unknown.
 *
 * The rendered bodies are pinned by contract tests:
 * `{ code, message }` (+ `details` when present).
 */
export const errorHandler = (
	error: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void => {
	if (error instanceof AppError) {
		// 4xx are expected outcomes, not operational problems: don't log them
		// as errors. 5xx indicate a bug and get logged with the stack.
		if (error.status >= 500) {
			console.error('Application error:', error);
		}

		res.status(error.status).json({
			code: error.code,
			message: error.message,
			...(error.details !== undefined ? { details: error.details } : {}),
		});
		return;
	}

	// Unexpected errors: log server-side, never leak internals in production.
	console.error('Unexpected error:', error);
	res.status(500).json({
		code: 'INTERNAL_SERVER_ERROR',
		message: 'Internal server error',
		...(process.env.NODE_ENV === 'development' && error instanceof Error
			? { details: error.message }
			: {}),
	});
};
