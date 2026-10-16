# Backend learning features

A backlog of features that fit this project and teach backend development. The API already has REST + GraphQL, PostgreSQL (Neon), Redis, a Go scraper, Docker, Ansible, and a weekly data sync. These items fill gaps rather than repeating more “get a hadith” endpoints.

> **Maintain this file.** Whenever a feature below is finished, mark its section `✅ Done` with a one-line note of what shipped (and what, if anything, remains). Treat this as a living log so the backlog always reflects reality.
>
> **Working agreement:** this backlog is a learning tool, not a ticket queue to burn down. Before any code is written or any file is changed, follow the learning protocol below.

## Learning protocol (read before every session)

The goal is **the user's understanding**, not shipped lines. A session where no code is written but the user designs the solution perfectly is a success; a session where code lands but the user can't explain why is a failure.

**Before any changes are made, always ask the user how they think the problem should be solved and what the solution should be.** They must propose the approach themselves — the data model/schema, the endpoints or functions involved, where the code lives, and how they'd verify it works. Only after they've demonstrated they understand the best solution does implementation begin.

1. **Ask first.** Never touch a file, write code, or run a migration until the user has proposed their own solution for the item at hand.
2. **Probe the design.** Ask targeted follow-ups about what they skipped: edge cases, failure modes, trade-offs (offset vs cursor pagination, TTL vs explicit invalidation, JWT vs sessions, etc.). Make them commit to specific choices and justify them.
3. **Judge honestly.**
   - **Wrong or weak answer:** do not start coding. Explain precisely *why* it fails — use a concrete counterexample or a failing scenario where possible — point at the relevant concept, and ask them again.
   - **Still stuck after a real attempt:** give **one hint at a time** — a nudge, then a sharper question, then narrower options. Only state the answer outright as a last resort, and only after they can explain why their earlier idea didn't work.
   - **Correct answer:** confirm it, but make them name the trade-off, not just the recipe ("it works" is not understanding).
4. **Restate before building.** Have the user restate the agreed approach in their own words. If they can't, they don't understand it yet — go back to step 1.
5. **Then implement, and keep them in the loop.** Explain each non-obvious decision as it happens. If a new fork appears mid-task, stop and ask instead of silently choosing.
6. **Close the loop.** When done, have the user summarize what they learned, then update this file per the maintenance note.

> Quick reference: **ask → evaluate → hint → user restates → only then code.**

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

> ✅ **Done (as `/api/v3`).** Pagination (`page`/`limit`) and filters (`chapter`, `category`, `grading` — matches `grade_en`/`grade_ar` case-insensitively) shipped as a new V3 REST version returning a `{ data, pagination }` envelope. Implemented as V3 to avoid breaking V2. Remaining: user-facing sorting and GraphQL `first`/`after` connections.

**Feature:** `GET /api/v2/:bookId?page=1&limit=50`, plus filters like `chapter`, `category`, `grading`.

**Why:** `/api/v2/:bookId` currently returns an entire book. Pagination forces you to think about cursors vs offset, stable sort keys, total counts, and GraphQL `first`/`after` connections.

**You’ll learn:** query design, index usage, API contracts, GraphQL pagination.

---

## 2. Real full-text search

> ✅ **Done.** Search now uses PostgreSQL full-text search instead of `ILIKE` substring matching. GIN expression indexes on `to_tsvector('english', english_text)` and `to_tsvector('simple', arabic_text)` (migration `0002`), `ts_rank` scoring (results sorted best-first, each item has a `score`), an optional `lang` query param (`en`/`ar`/`any`) on V3, opt-in `ts_headline` highlighting (`highlight=true`), and a properly implemented `|` OR separator. Shipped through the shared repository, so V2, V3, and GraphQL search all use it. Remaining: expose `lang`/`score` in GraphQL, V1 search intentionally stays on the old ILIKE (frozen snapshot), `websearch_to_tsquery` as a possible upgrade, and tests for the new behavior (see item 4).

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

> ✅ **Done (as `/api/v3`).** Zod schemas (`validation/schemas.ts`) plus `validateQuery`/`validateParams` middleware (`validation/middleware.ts`) validate every V3 query/path param, failing closed with a uniform `400 { code, message, details }` body.

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
