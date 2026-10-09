# Migrate MongoDB to Postgres

Replace MongoDB Atlas with Neon (cloud PostgreSQL), using Drizzle ORM. V2 data is reloaded from per-book JSON via bash/`psql` `COPY` (not Node). V1 is a one-time snapshot in separate tables so `/api` remains frozen.

## Checklist

- [ ] Create Neon project and database; generate connection string with pooling enabled
- [ ] Add Drizzle schema, client, drizzle-kit config, and SQL migrations for V2 + V1 snapshot tables
- [ ] Replace mongoose models/contracts with repositories; rewrite HadithService, IngredientService, GraphQL resolvers, and API bootstrap
- [ ] Update `.env.example` and all environment configs to use `DATABASE_URL` for Neon
- [x] Replace `modifyDB.js` with bash + `psql` `COPY` from per-book JSON into staging tables, then atomic swap; both GitHub Actions and VPS cron can now load to Neon
- [ ] One-time Atlas dump + load into `books_v1` / `hadiths_v1`; V1 routes read snapshot tables only
- [ ] Remove mongoose deps; update README, `.env.example`, `BACKEND_LEARNING.md`
- [ ] Remove postgres service from docker-compose (no longer needed)

## Current state

- The API connects with `mongoose.connect(config.app.databaseUrl)` in [`API/src/index.ts`](API/src/index.ts) (`DATABASE_URL`).
- V2 REST/GraphQL use [`hadithV2.ts`](API/src/models/hadithV2.ts), [`bookNameV2.ts`](API/src/models/bookNameV2.ts), [`ingredientsV2.ts`](API/src/models/ingredientsV2.ts) (`strict: false`, so extra JSON fields like `volume` and `gradingsFull` already leak into REST responses).
- V1 `/api` uses separate collections `AllBooks` / `bookNames` via [`API/src/api/rest/routes/v1/hadith.ts`](API/src/api/rest/routes/v1/hadith.ts).
- Services talk to a mongoose-shaped [`HadithModelLike`](API/src/models/contracts.ts) (`find`, `findOne`, `findOneRandom`).
- Ingest is [`V2/Deploy/load.sh`](V2/Deploy/load.sh), invoked by [`V2/Makefile`](V2/Makefile). Both GitHub Actions and the VPS cron run `make scrape_all`, which loads to Neon.
- Compose today: API + Redis only ([`docker-compose.yml`](docker-compose.yml)). Neon will replace the self-hosted postgres container, so compose will remain API + Redis only.

## Target architecture

```mermaid
flowchart LR
  scraper[Go scraper]
  files[Per-book JSON in ThaqalaynData]
  loader["load.sh plus psql COPY"]
  neon[(Neon PostgreSQL)]
  api[Express API]
  gql[Apollo GraphQL]
  scraper --> files
  files --> loader
  loader --> neon
  api --> neon
  gql --> neon
  redis[Redis cache]
  api --> redis
```

Neon provides a cloud PostgreSQL instance with connection pooling. Both GitHub Actions and VPS cron can connect directly via `DATABASE_URL`. Local development can also connect to Neon or use a local postgres container with `DATABASE_URL=localhost`.

## Schema

Use **snake_case columns**, map to **existing API JSON field names** in repositories so clients do not break (`BookName`, `behbudiGrading`, `gradingsFull`, etc.).

**V2 (live, replaced on each scrape load)**

- `books`: `book_id` unique, `book_name`, `author`, `id_range_min/max`, `book_description`, `book_cover`, `english_name`, `translator`, `volume`
- `hadiths`: unique `(book_id, hadith_id)`; text columns for english/arabic/french; grading strings; `chapter_in_category_id`; `thaqalayn_sanad` / `thaqalayn_matn`; **`gradings_full jsonb`** (nested author objects stay as JSON, matching current REST)
- `ingredients`: `ingredient` unique; `statuses`, `info`, `other_names`, `unknown` as `text[]` (nullable)

**V1 (frozen snapshot, never touched by weekly load)**

- `books_v1`, `hadiths_v1` — same columns as needed for current V1 responses (dump from Atlas will define extras; store unknown leftovers in a `raw jsonb` column if needed)

Indexes: `(book_id, hadith_id)`, `book_id`, `ingredient`. Search stays `ILIKE` / `~*` to match today’s escaped case-insensitive regex; `pg_trgm` can wait.

Random: `ORDER BY RANDOM() LIMIT 1` (replaces `mongoose-simple-random`). Fine at current corpus size.

## Neon setup

1. Create a Neon project at https://neon.tech
2. Create a database (default `neondb` is fine)
3. Generate a connection string with connection pooling enabled (recommended format: `postgres://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true`)
4. Store as `DATABASE_URL` in:
   - `.env` for local development
   - GitHub Actions secrets (as `DATABASE_URL`)
   - VPS environment (via Ansible or manual setup)
5. Neon provides automatic backups, time travel, and serverless scaling — no need for manual volume management or backup scripts.

## API data layer

Add:

- [`API/src/db/schema.ts`](API/src/db/schema.ts) — Drizzle tables
- [`API/src/db/client.ts`](API/src/db/client.ts) — `postgres` driver + `drizzle()`
- [`API/drizzle.config.ts`](API/drizzle.config.ts) — `drizzle-kit` migrations under `API/drizzle`
- Repositories with explicit methods (`listBooks`, `bookExists`, `randomHadith`, `searchHadiths`, `listHadithsByBook`, `getHadithById`, `listIngredients`) instead of faking mongoose `find`

Rewrite [`HadithService`](API/src/api/rest/services/hadithService.ts) / [`IngredientService`](API/src/api/rest/services/ingredientService.ts) and GraphQL resolvers to use those repositories. Drop [`API/src/models/contracts.ts`](API/src/models/contracts.ts) mongoose interfaces.

[`API/src/index.ts`](API/src/index.ts): connect via `DATABASE_URL`, run pending Drizzle migrations on boot (or a one-shot migrate before `listen`), close the pool on SIGINT/SIGTERM.

Config: use `DATABASE_URL` in [`API/src/config/index.ts`](API/src/config/index.ts), [`.env.example`](.env.example), compose, and the cron image.

Remove `mongoose` and `mongoose-simple-random` from [`package.json`](package.json). Add `drizzle-orm`, `postgres`, `drizzle-kit` (dev).

Keep GraphQL types aligned with REST extras that clients already see (`volume`, `gradingsFull` as a JSON scalar or nested type). Do not silently drop fields that mongoose `strict: false` currently returns.

## Docker / server

Update [`docker-compose.yml`](docker-compose.yml):

- **Remove** the postgres service (not needed with Neon)
- `api` service: `DATABASE_URL` environment variable for Neon connection string
- Compose remains API + Redis only

Update [`pipelines/Dockerfile`](pipelines/Dockerfile) / [`pipelines/cron.sh`](pipelines/cron.sh) to pass `DATABASE_URL` (Neon connection string).

**GitHub Actions vs VPS:** Since Neon is cloud-hosted, both GitHub Actions and VPS cron can connect directly. Keep [`.github/workflows/main.yml`](.github/workflows/main.yml) running `make scrape_all` which now loads to Neon via `psql` using the `DATABASE_URL` secret.

## Data ingest architecture

Keep **scrape → versioned files → load into Postgres**. Do not have the scraper write to the DB, and do not load through Node/Drizzle.

**Why files in the middle are the right contract**

- JSON on disk is replayable: rebuild or replace Postgres without re-hitting Thaqalayn (credentials, 10s delays, flaky network).
- Git (or the VPS checkout) is an auditable snapshot; the DB is a query materialization of that snapshot.
- The API should keep using SQL (search, random, indexes). Serving raw JSON files would regress those.

**What is weak today (and we should drop)**

- The old Node `deleteMany` + `insertMany` loader was a Mongo leftover, not idiomatic for Postgres, and emptied the live collection mid-load.
- `allBooks.json` is a giant concatenated array (scraper even comments out writing it). Loading it as one JSON value is slow and memory-heavy. Per-book files (`1.json`, `2.json`, …) already exist and should be the ingest source.

**Loader: bash + `psql` `COPY`, not JavaScript**

Bash/`psql` is the right tool once files are COPY-shaped. Nested JSON arrays are a poor `COPY` source, so the script will:

1. `jq -c '.[]'` each per-book JSON file into **NDJSON** (one object per line), streaming — do not slurp `allBooks.json`.
2. `COPY hadiths_staging_raw (doc) FROM STDIN` into a `jsonb` staging table (same idea for books and ingredients).
3. `INSERT INTO hadiths_staging SELECT ... FROM hadiths_staging_raw` mapping JSON keys → columns (`gradingsFull` stays jsonb).
4. **Atomic swap** so the API does not see an empty table: in one transaction, `TRUNCATE hadiths` + `INSERT INTO hadiths SELECT * FROM hadiths_staging`, or `ALTER TABLE ... RENAME`. Weekly load never touches `*_v1` tables.

Run via `psql` using the `DATABASE_URL` connection string from [`V2/Makefile`](V2/Makefile) (`load_books`, `load_hadiths`, `load_ingredients`, `load_all`). The loader lives in [`V2/Deploy/load.sh`](V2/Deploy/load.sh); the old `modifyDB.js` has been removed.

**GitHub Actions:** Now runs full `make scrape_all` which loads to Neon via `psql` using the `DATABASE_URL` secret. VPS cron also runs `make scrape_all` to Neon.

**V1 one-time path**

1. `mongoexport` from Atlas (`AllBooks`, `bookNames`) to NDJSON — no Node dump script.
2. Same `COPY` + promote path into `hadiths_v1` / `books_v1`.
3. After verified, Atlas leaves runtime config.

First production cutover: set up Neon project → run Drizzle migrations → `load_all` from repo JSON → load V1 export → smoke REST/GraphQL.

## Docs / learning file

Update README developer setup (Neon `DATABASE_URL`, `make load_all`). Note in [`BACKEND_LEARNING.md`](BACKEND_LEARNING.md) that search/indexes/health now target Postgres (Neon), not Mongo.

## Out of scope

- Pagination, rate limits, auth, full-text ranking (`tsvector` / `pg_trgm` as a follow-up)
- Normalizing `gradings_full` into child tables
