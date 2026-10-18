/**
 * Typed application errors.
 *
 * The shared service layer stays transport-agnostic (it returns data or
 * null); controllers translate those domain answers into these errors; and
 * the single error middleware (api/rest/middleware/errorHandler.ts) renders
 * them for REST. GraphQL, later, can map the same codes into extensions.code.
 *
 * This is the one thing thrown errors don't tell the compiler (TypeScript
 * has no checked exceptions): the contract "this can throw NotFoundError"
 * lives in tests and call sites, so keep the codes stable.
 */
export class AppError extends Error {
	readonly status: number;
	readonly code: string;
	readonly details?: unknown;

	constructor(
		status: number,
		code: string,
		message: string,
		details?: unknown,
	) {
		super(message);
		this.name = new.target.name;
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

export class NotFoundError extends AppError {
	constructor(message: string) {
		super(404, 'NOT_FOUND', message);
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super(400, 'VALIDATION_ERROR', message, details);
	}
}
