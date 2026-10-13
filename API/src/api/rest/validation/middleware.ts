import type { NextFunction, Request, Response } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';

const formatIssues = (error: ZodError) =>
	error.issues.map((issue) => ({
		field: issue.path.join('.'),
		message: issue.message,
	}));

export const validateQuery = (schema: ZodTypeAny) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const parsed = schema.safeParse(req.query);

		if (!parsed.success) {
			res.status(400).json({
				code: 'VALIDATION_ERROR',
				message: 'Invalid query parameters',
				details: formatIssues(parsed.error),
			});
			return;
		}

		res.locals.query = parsed.data;
		next();
	};
};

export const validateParams = (schema: ZodTypeAny) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const parsed = schema.safeParse(req.params);

		if (!parsed.success) {
			res.status(400).json({
				code: 'VALIDATION_ERROR',
				message: 'Invalid path parameters',
				details: formatIssues(parsed.error),
			});
			return;
		}

		res.locals.params = parsed.data;
		next();
	};
};
