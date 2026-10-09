import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

// this file imports the v1 export files and loads them into the database
// the v1 export files come from MongoDB. They are not updated anymore
// this file is used to load the v1 data into the new postgres database for backup purposes

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
const DATA_DIR = path.join(__dirname, '.');

if (!DATABASE_URL) {
	console.error('DATABASE_URL is required');
	process.exit(1);
}

async function loadV1Data() {
	try {
		console.log('Connecting to PostgreSQL...');
		const pool = new pg.Pool({ connectionString: DATABASE_URL });

		console.log('Reading V1 export files...');

		// Read bookNames.json
		const bookNamesPath = path.join(DATA_DIR, 'bookNames.json');
		const bookNamesData = fs.readFileSync(bookNamesPath, 'utf-8');
		const bookNames = JSON.parse(bookNamesData);
		console.log(`Loaded ${bookNames.length} book names`);

		// Read AllBooks.json
		const allBooksPath = path.join(DATA_DIR, 'AllBooks.json');
		const allBooksData = fs.readFileSync(allBooksPath, 'utf-8');
		const allHadiths = JSON.parse(allBooksData);
		console.log(`Loaded ${allHadiths.length} hadiths`);

		// Clear existing V1 data
		console.log('Clearing existing V1 data...');
		await pool.query('TRUNCATE TABLE books_v1, hadiths_v1 RESTART IDENTITY');

		// Insert books
		console.log('Inserting books...');
		for (const book of bookNames) {
			await pool.query(
				'INSERT INTO books_v1 (book_id, book_name, author, id_range_min, id_range_max) VALUES ($1, $2, $3, $4, $5)',
				[
					book.bookId,
					book.BookName,
					book.author,
					book.idRangeMin || book.idrangemin,
					book.idRangeMax || book.idrangemax,
				],
			);
		}
		console.log(`Inserted ${bookNames.length} books`);

		// Insert hadiths in batches
		console.log('Inserting hadiths...');
		const batchSize = 1000;
		let insertedCount = 0;

		for (let i = 0; i < allHadiths.length; i += batchSize) {
			const batch = allHadiths.slice(i, i + batchSize);
			const client = await pool.connect();
			try {
				await client.query('BEGIN');
				for (const h of batch) {
					await client.query(
						`INSERT INTO hadiths_v1 (book_id, id, book, category, category_id, chapter, author, translator, english_text, arabic_text, majlisi_grading, behdudi_grading, mohseni_grading, url)
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
						[
							h.bookId,
							h.id,
							h.book,
							h.category,
							h.categoryId,
							h.chapter,
							h.author,
							h.translator,
							h.englishText,
							h.arabicText,
							h.majlisiGrading,
							h.behbudiGrading || h.BehdudiGrading,
							h.mohseniGrading || h.MohseniGrading,
							h.URL,
						],
					);
				}
				await client.query('COMMIT');
			} catch (e) {
				await client.query('ROLLBACK');
				throw e;
			} finally {
				client.release();
			}
			insertedCount += batch.length;
			console.log(`Inserted ${insertedCount}/${allHadiths.length} hadiths`);
		}

		console.log('V1 data loaded successfully!');

		// Verify
		const bookCount = await pool.query('SELECT COUNT(*) FROM books_v1');
		const hadithCount = await pool.query('SELECT COUNT(*) FROM hadiths_v1');
		console.log(
			`Verification: ${bookCount.rows[0].count} books, ${hadithCount.rows[0].count} hadiths`,
		);

		await pool.end();
	} catch (error) {
		console.error('Error during load:', error);
		process.exit(1);
	}
}

loadV1Data();
