import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => Promise<unknown>;

/**
 * Express 4 does not forward rejected promises to error middleware: calling
 * an async handler returns a promise that Express never inspects, so a
 * `throw` inside becomes an unhandled rejection and the error middleware
 * never runs. This wrapper converts that rejection into next(error), which
 * triggers the error middleware. (Express 5 does this automatically.)
 */
export const asyncHandler = (handler: AsyncRequestHandler): RequestHandler => {
	return (req, res, next) => {
		void Promise.resolve(handler(req, res, next)).catch(next);
	};
};
