import { z } from 'zod';

export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const bookListQuerySchema = paginationQuerySchema.extend({
	chapter: z.string().trim().min(1).max(200).optional(),
	category: z.string().trim().min(1).max(200).optional(),
	grading: z.string().trim().min(1).max(200).optional(),
});

export const searchQuerySchema = paginationQuerySchema.extend({
	q: z.string().trim().min(1).max(500),
	lang: z.enum(['en', 'ar', 'any']).default('any'),
	// Strict two-value enum + transform, NOT z.coerce.boolean():
	// Boolean() coercion treats ANY non-empty string ("false", "0",
	// "yes") as true, which would make the flag impossible to turn off
	// and would accept garbage instead of failing closed.
	highlight: z
		.enum(['true', 'false'])
		.default('false')
		.transform((value) => value === 'true'),
});

export const bookParamsSchema = z.object({
	bookId: z.string().trim().min(1).max(200),
});

export const hadithParamsSchema = z.object({
	bookId: z.string().trim().min(1).max(200),
	id: z.coerce.number().int().min(1),
});

export type BookListQuery = z.infer<typeof bookListQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type BookParams = z.infer<typeof bookParamsSchema>;
export type HadithParams = z.infer<typeof hadithParamsSchema>;
