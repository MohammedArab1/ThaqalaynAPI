#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
	echo "DATABASE_URL is required" >&2
	exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${DATA_DIR:-"$SCRIPT_DIR/../ThaqalaynData"}"
MODE="${1:-all}"

command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }
command -v psql >/dev/null || { echo "psql is required" >&2; exit 1; }

load_all() {
	psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --single-transaction <<SQL
CREATE TEMP TABLE books_staging_raw (doc jsonb);
CREATE TEMP TABLE hadiths_staging_raw (doc jsonb);
CREATE TEMP TABLE ingredients_staging_raw (doc jsonb);

\copy books_staging_raw(doc) FROM PROGRAM 'jq -r ".[] | [tojson] | @csv" "$DATA_DIR/BookNames.json"' WITH (FORMAT csv);
\copy ingredients_staging_raw(doc) FROM PROGRAM 'jq -r ".[] | [tojson] | @csv" "$DATA_DIR/Ingredients/ingredients.json"' WITH (FORMAT csv);
\copy hadiths_staging_raw(doc) FROM PROGRAM 'for file in "$DATA_DIR"/[0-9]*.json; do jq -r ".[] | [tojson] | @csv" "\$file"; done' WITH (FORMAT csv);

CREATE TEMP TABLE books_loaded AS
SELECT
	doc->>'bookId' AS book_id,
	doc->>'BookName' AS book_name,
	doc->>'author' AS author,
	(doc->>'idRangeMin')::integer AS id_range_min,
	(doc->>'idRangeMax')::integer AS id_range_max,
	doc->>'bookDescription' AS book_description,
	doc->>'bookCover' AS book_cover,
	doc->>'englishName' AS english_name,
	doc->>'translator' AS translator,
	(doc->>'volume')::integer AS volume
FROM books_staging_raw;

CREATE TEMP TABLE hadiths_loaded AS
SELECT
	doc->>'bookId' AS book_id,
	(doc->>'id')::integer AS id,
	doc->>'book' AS book,
	(doc->>'volume')::integer AS volume,
	doc->>'category' AS category,
	doc->>'categoryId' AS category_id,
	doc->>'chapter' AS chapter,
	doc->>'author' AS author,
	doc->>'translator' AS translator,
	doc->>'englishText' AS english_text,
	doc->>'arabicText' AS arabic_text,
	doc->>'frenchText' AS french_text,
	doc->>'majlisiGrading' AS majlisi_grading,
	doc->>'behdudiGrading' AS behdudi_grading,
	doc->>'mohseniGrading' AS mohseni_grading,
	doc->>'URL' AS url,
	doc->>'chapterInCategoryId' AS chapter_in_category_id,
	doc->>'thaqalaynSanad' AS thaqalayn_sanad,
	doc->>'thaqalaynMatn' AS thaqalayn_matn,
	COALESCE(doc->'gradingsFull', '[]'::jsonb) AS gradings_full
FROM hadiths_staging_raw;

CREATE TEMP TABLE ingredients_loaded AS
SELECT
	doc->>'ingredient' AS ingredient,
	ARRAY(SELECT jsonb_array_elements_text(COALESCE(doc->'statuses', '[]'::jsonb))) AS statuses,
	CASE WHEN doc ? 'info' THEN ARRAY(SELECT jsonb_array_elements_text(doc->'info')) END AS info,
	CASE WHEN doc ? 'otherNames' THEN ARRAY(SELECT jsonb_array_elements_text(doc->'otherNames')) END AS other_names,
	CASE WHEN doc ? 'unknown' THEN ARRAY(SELECT jsonb_array_elements_text(doc->'unknown')) END AS unknown
FROM ingredients_staging_raw;

TRUNCATE hadiths_v2, books_v2, ingredients_v2;
INSERT INTO books_v2 SELECT * FROM books_loaded;
INSERT INTO hadiths_v2 SELECT * FROM hadiths_loaded;
INSERT INTO ingredients_v2 SELECT * FROM ingredients_loaded;
SQL
}

case "$MODE" in
	all)
		load_all
		;;
	*)
		echo "Usage: $0 [all]" >&2
		exit 1
		;;
esac
