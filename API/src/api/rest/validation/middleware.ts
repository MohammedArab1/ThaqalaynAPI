import type { NextFunction, Request, Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '../../../errors.js';

const formatIssues = (error: ZodError) =>
	error.issues.map((issue) => ({
		field: issue.path.join('.'),
		message: issue.message,
	}));

/**
 * These middlewares throw synchronously on purpose: Express catches
 * synchronous throws from middleware and forwards them to the error
 * middleware, where every error in the app is rendered
 * (see api/rest/middleware/errorHandler.ts).
 */
export const validateQuery = (schema: ZodTypeAny) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const parsed = schema.safeParse(req.query);

		if (!parsed.success) {
			throw new ValidationError(
				'Invalid query parameters',
				formatIssues(parsed.error),
			);
		}

		res.locals.query = parsed.data;
		next();
	};
};

export const validateParams = (schema: ZodTypeAny) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const parsed = schema.safeParse(req.params);

		if (!parsed.success) {
			throw new ValidationError(
				'Invalid path parameters',
				formatIssues(parsed.error),
			);
		}

		res.locals.params = parsed.data;
		next();
	};
};
