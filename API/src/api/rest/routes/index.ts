import {
	Router,
	type NextFunction,
	type Request,
	type Response,
} from 'express';
import path from 'path';
import v1Router from './v1/hadith.js';
import v2Router from './v2/hadith.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
	const filePath = path.join(
		process.cwd(),
		'API',
		'src',
		'api',
		'rest',
		'public',
		'index.html',
	);

	res.sendFile(filePath, (err) => {
		if (err) {
			console.error('Error sending index.html:', err);
			res.status(500).send('Internal server error');
		}
	});
});

router.use('/api/v2', v2Router);
router.use('/api', v1Router);

router.use(
	(error: unknown, _req: Request, res: Response, _next: NextFunction) => {
		console.error('Global error handler:', error);
		res.status(500).json({ error: 'Internal server error' });
	},
);

export default router;
