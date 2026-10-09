# Backend learning features

A backlog of features that fit this project and teach backend development. The API already has REST + GraphQL, PostgreSQL (Neon), Redis, a Go scraper, Docker, Ansible, and a weekly data sync. These items fill gaps rather than repeating more “get a hadith” endpoints.

## Suggested order

1. Tests + error handling (safety net)
2. Pagination + validation
3. Indexes + better search
4. Rate limiting
5. Health / logging / metrics
6. Cache invalidation
7. Background jobs
8. Auth + collections
9. Webhooks

A strong first slice is **pagination + tests for existing endpoints**: small surface, immediately useful, and it locks in API behavior before bigger changes.

---

## 1. Pagination, filtering, and sorting

**Feature:** `GET /api/v2/:bookId?page=1&limit=50`, plus filters like `chapter`, `category`, `grading`.

**Why:** `/api/v2/:bookId` currently returns an entire book. Pagination forces you to think about cursors vs offset, stable sort keys, total counts, and GraphQL `first`/`after` connections.

**You’ll learn:** query design, index usage, API contracts, GraphQL pagination.

---

## 2. Real full-text search

**Feature:** Replace regex `$regex` search with PostgreSQL full-text search or a text index. Add ranking, language (English vs Arabic), highlighting, and `limit`.

**Why:** Search is the weakest part of the API (README even calls it simplistic). This is one of the most useful backend skills.

**You’ll learn:** indexes, scoring, stemming vs exact match, Arabic text handling, query performance.

---

## 3. Rate limiting and API keys

**Feature:** Public anonymous quota (e.g. 60 req/min) plus optional API keys with higher limits. Store keys hashed in PostgreSQL; return `429` with `Retry-After`.

**Why:** This API is public and scrape-friendly. Keys also let you add write endpoints later without making everything open.

**You’ll learn:** Express middleware, Redis counters, hashing secrets, HTTP semantics, abuse control.

---

## 4. Automated tests

**Feature:** Unit tests for `HadithService` (injected models you already have), plus integration tests that hit REST and GraphQL against a test PostgreSQL database.

**Why:** There are no test scripts in `package.json`. Tests will teach more than another endpoint.

**You’ll learn:** test doubles, HTTP contract tests, CI, refactoring with confidence.

---

## 5. Central error handling and consistent responses

**Feature:** A shared error type (`NotFoundError`, `ValidationError`), Express error middleware, GraphQL error formatting, and a uniform JSON shape (`code`, `message`, `details`).

**Why:** Controllers still `try/catch` and sometimes return `{ error: "..." }` with HTTP 200.

**You’ll learn:** middleware, HTTP status design, GraphQL vs REST error models.

---

## 6. Health, readiness, and graceful shutdown

**Feature:** `/health` (process up) and `/ready` (PostgreSQL + Redis ping). Keep SIGINT/SIGTERM shutdown, but drain in-flight requests.

**Why:** The app already deploys with Docker/Ansible. Health checks are how that deploy actually becomes reliable.

**You’ll learn:** liveness vs readiness, dependency checks, production process lifecycle.

---

## 7. Structured logging, request IDs, and metrics

**Feature:** `pino`/`winston` JSON logs, `X-Request-Id`, and Prometheus metrics (latency, status codes, cache hit rate). Optional: OpenTelemetry traces through Express → PostgreSQL.

**Why:** Some traffic goes to Plausible, but that’s product analytics, not ops.

**You’ll learn:** observability, correlation IDs, SLIs, debugging production.

---

## 8. Cache invalidation after scrape

**Feature:** After the Go scraper / weekly cron pushes new books, bust Redis keys (and Apollo cache) for `/allbooks`, `/ingredients`, and affected `/:bookId` routes.

**Why:** Cache is write-only TTL today (`cacheMiddleware`). Stale data after a weekly sync is a classic backend problem.

**You’ll learn:** cache keys, TTL vs explicit invalidation, pub/sub (`CACHE_BUST` from scraper → API).

---

## 9. Background jobs / scrape as a service

**Feature:** An admin-only `POST /admin/scrape` that enqueues a job (BullMQ + Redis you already run). Track job status: queued → running → success/fail.

**Why:** Scraping currently lives in a Go CLI + Ansible cron. Turning it into a job system is how real backends run long work.

**You’ll learn:** queues, idempotency, retries, timeouts, worker processes, status APIs.

---

## 10. Input validation layer

**Feature:** Zod or similar on query/path params (`q` length, `bookId` format, `id` as int, pagination bounds). Generate OpenAPI from the same schemas if you want extra credit.

**Why:** Validation is scattered (`Number.parseInt`, missing `q` checks). A schema layer is a standard Express pattern.

**You’ll learn:** validation, type-safe request objects, failing closed.

---

## 11. Share one service layer between REST and GraphQL

**Feature:** GraphQL resolvers call `HadithService` instead of duplicating `searchHadith` / `getRandomHadith`.

**Why:** REST and GraphQL already diverge slightly (regex escaping, empty-result handling). This is a clean architecture refactor with a real payoff.

**You’ll learn:** layering, DRY across protocols, testing one core.

---

## 12. Write path: collections / bookmarks (auth)

**Feature:** Users can save hadiths into named collections. JWT or session auth, password hashing, ownership checks.

**Why:** The API is read-only. One small write model teaches everything GET endpoints never will: auth, authorization, uniqueness, and “this user can only mutate their rows.”

**You’ll learn:** authn vs authz, bcrypt/argon2, JWT vs sessions, CSRF if you use cookies.

Keep this _user collections_, not edits to canonical hadiths, so scraped source data stays intact.

---

## 13. Webhooks for data updates

**Feature:** After a successful weekly scrape, POST to subscriber URLs: `{ "bookId": "...", "hadithCount": N }`. Sign payloads (HMAC), retry with backoff.

**Why:** Fits the existing cron and teaches a pattern used by GitHub, Stripe, etc.

**You’ll learn:** at-least-once delivery, signature verification, retry/dead-letter queues.

---

## 14. Database indexes and query profiling

**Feature:** Add indexes on `{ bookId, id }`, `{ bookId, chapter }`, text indexes; log slow queries; confirm `/query` and `/:bookId` plans.

**Why:** `englishText`/`arabicText` regex scans will get expensive as the corpus grows.

**You’ll learn:** `explain()`, compound indexes, when not to use regex.

---

## 15. ETag / conditional GET

**Feature:** `ETag` on book and hadith responses; honor `If-None-Match` with `304`.

**Why:** Complements Redis caching and is very relevant for a content API.

**You’ll learn:** HTTP caching headers, validators, bandwidth.
