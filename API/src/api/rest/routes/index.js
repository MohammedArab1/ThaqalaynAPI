// api/rest/routes/index.js
import { Router } from 'express';
import v1Router from './v1/hadith.js';
import v2Router from './v2/hadith.js';

const router = Router();


router.get('/', (req, res) => {
	res.send(
		`<h1>Welcome to my REST API for thaqalayn.net</h1>
		<h2>Please visit <a href='https://github.com/MohammedArab1/ThaqalaynAPI'>my github page</a> for instructions on how the API works.</h2>
		</br> <h2>Visit the <a href='https://www.thaqalayn-api.net/api-docs'>SwaggerUI interface</a> to see all the API endpoints. </h2>
		</br> <h2>GraphQL API: <a href='https://www.thaqalayn-api.net/graphql'>https://www.thaqalayn-api.net/graphql</a></h2> 
		</br> <h3>view all books to query from (v1 - old): <a href='https://www.thaqalayn-api.net/api/allbooks'>https://www.thaqalayn-api.net/api/allbooks</a></h3>   
		</br> <h3>view all books to query from (v2): <a href='https://www.thaqalayn-api.net/api/v2/allbooks'>https://www.thaqalayn-api.net/api/v2/allbooks</a></h3>  
		</br> <h3>view halal/haram ingredients fetched from <a href='https://al-m.ca/halalguide/'>Al-maarif.com</a> (v2): <a href='https://www.thaqalayn-api.net/api/v2/ingredients'>https://www.thaqalayn-api.net/api/v2/ingredients</a></h3>  
		`
	);
});

// Version 2 routes
router.use('/api/v2', v2Router);

// Version 1 routes
router.use('/api', v1Router);


// Global error handler
router.use((err, req, res, next) => {
	console.error('Global error handler:', err);
	res.status(500).json({ error: 'Internal server error' });
});

export default router;
