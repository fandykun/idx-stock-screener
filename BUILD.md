# IDX Stock Screener — Build Log

This file is your running build journal. Check off tasks as you complete them, log blockers, and record decisions. It doubles as a portfolio narrative for anyone reading the repo.

> **Phase order:** Screener first, auth last. The project is visually demoable after Phase 3.  
> **Small-step commits:** The agent runs `git add -A && git commit && git push` after every small verified step, not only at phase boundaries, so breaking changes can be reverted cleanly.

## Commit discipline

- Work in small, independently revertible steps.
- Commit one coherent change at a time: one route group, one component slice, one schema change, one test-backed utility, or one documentation/config update.
- Run the narrowest relevant verification before each commit and mention it in the commit body.
- Push every commit immediately.
- Keep phase milestone commits only as final markers after all acceptance criteria for that phase pass.
- If a change breaks verification, fix it before committing; do not commit known-broken work unless the commit is explicitly a failing RED test in a TDD cycle.

---

## Project status

| Phase | Name | Status | Committed | Live demo |
|---|---|---|---|---|
| 1 | Data layer — scraper + database | Demo scaffold complete; production DB flow pending | `a78c005` | — |
| 2 | Screener engine + indicator API | Complete with deterministic demo data | `a78c005` | API demoable |
| 3 | React frontend — screener + stock detail | Complete | `a78c005` | **First visual demo** |
| 4 | Watchlist, alerts, Telegram bot | Complete with auth stub and in-memory personal state | `86ecc78` | Personal flows demoable |
| 5 | Polish and deployment | In progress | `c57707b` smoke check | **Public URL** |
| 6 | Authentication | Not started | — | — |

Current baseline before continuing Phase 5:

- Latest pushed commit: `c57707b chore(smoke): add deployment smoke check`.
- Verified commands: `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm smoke`, `git diff --check`.
- Docker Engine and Compose are available on this host.
- Phase 5 should proceed in small commits: local Docker verification, demo seed/data polish, README/screenshots, deployment configuration, then Railway deployment.

---

## Phase 1 — Data layer: scraper + database

### Goal
Real IDX candle and fundamental data in PostgreSQL. No API, no UI yet — just the foundation.

### Checklist

**Repo setup**
- [ ] `pnpm init` at root, workspaces `["apps/*", "packages/*"]` in `package.json`
- [ ] `apps/api`, `apps/web`, `packages/shared` directories created
- [ ] Root `tsconfig.base.json` with `"strict": true`
- [ ] `.gitignore` excludes `.env`, `node_modules/`, `dist/`, `prisma/dev.db`
- [ ] `git remote add origin <REPO_URL>` and `git push -u origin main` done

**Database**
- [ ] `apps/api/prisma/schema.prisma` written (full schema from AGENT.md — all models including User, RefreshToken, Alert, Watchlist)
- [ ] `DATABASE_URL` set in `apps/api/.env`
- [ ] `npx prisma migrate dev --name init` runs cleanly
- [ ] Tables confirmed: `User`, `RefreshToken`, `Stock`, `Candle`, `Fundamental`, `Watchlist`, `Alert`
- [ ] Indexes confirmed: `Candle UNIQUE(ticker, timestamp)`, `Candle INDEX(ticker, timestamp DESC)`

**Seed**
- [ ] `apps/api/prisma/seed.ts` written with ≥ 15 IDX blue-chip tickers
- [ ] `pnpm seed` runs without errors
- [ ] `SELECT ticker FROM "Stock";` shows all seeded tickers

**Scraper**
- [ ] `apps/api/src/workers/scraper.ts` written
- [ ] Manual run: `npx tsx src/workers/scraper.ts`
- [ ] `SELECT COUNT(*) FROM "Candle" WHERE ticker = 'BBCA';` returns > 0
- [ ] Duplicate run does not increase row count (idempotent)
- [ ] `SELECT * FROM "Fundamental" WHERE ticker = 'BBCA';` returns pe, pbv, roe, der, eps, marketCap

**Redis**
- [ ] `REDIS_URL` in `.env`, `ioredis` client connected
- [ ] `redis-cli GET price:BBCA` returns latest close after scraper run

**Cron**
- [ ] Schedule `'*/15 9-16 * * 1-5'` correct for WIB market hours
- [ ] Test log confirms cron does not trigger on weekends

**Auto-commit** (agent runs this — do not skip)
```bash
git add -A
git commit -m "phase(1): data layer — migrations, scraper, seed" \
  -m "- Prisma schema with all models and indexes" \
  -m "- Yahoo Finance scraper with 15-min cron and retry logic" \
  -m "- Seed script with 15 IDX blue-chip tickers" \
  -m "- Redis price cache populated after each scrape"
git push
```
- [ ] Commit pushed successfully

### Blockers / notes
```
Date:
Issue:
Resolution:
```

### Decisions made
```
Date:
Decision:
Reason:
```

---

## Phase 2 — Screener engine + indicator API

### Goal
Public REST API. Screener and stock detail endpoints fully working. Demoable via curl or Postman with real data.

### Checklist

**Indicator functions** (`packages/shared/src/indicators/`)
- [ ] `rsi.ts` — `calculateRSI(closes, period?)` returns `number | null`
- [ ] `ma.ts` — `calculateSMA` and `calculateEMA` return `number | null`
- [ ] `macd.ts` — returns `{ macd, signal, histogram } | null`
- [ ] `bollinger.ts` — returns `{ upper, middle, lower } | null`
- [ ] `volume.ts` — `isVolumeSurge(volumes, latestVolume, factor?)` returns `boolean`

**Tests** (`packages/shared/src/indicators/__tests__/`)
- [ ] `rsi.test.ts` — normal case, null on insufficient data, all-gains, all-losses
- [ ] `ma.test.ts` — SMA([1,2,3,4,5], 3) === 4, EMA convergence
- [ ] `macd.test.ts` — histogram === macd − signal, null on insufficient data
- [ ] `bollinger.test.ts` — upper > middle > lower, middle === SMA20
- [ ] `volume.test.ts` — surge detected, not detected
- [ ] `pnpm test` passes with 0 failures
- [ ] Coverage ≥ 80% on indicators

**Screener engine** (`apps/api/src/lib/screenerEngine.ts`)
- [ ] Accepts `ScreenerFilter[]`, returns matching tickers with computed values
- [ ] Lazy evaluation — only calculates indicators needed by active filters
- [ ] Redis cache: `screener:indicators:{ticker}` TTL 900s
- [ ] Cache miss → DB → compute → cache; cache hit → no DB query

**API routes**
- [ ] `GET /stocks` — paginated, sortable, no auth
- [ ] `GET /stocks/:ticker` — detail + latest indicator snapshot
- [ ] `GET /stocks/:ticker/candles?timeframe=1M` — OHLCV for charting
- [ ] `GET /screener` — applies filters, sorts, paginates
- [ ] `GET /screener?filters=[{"metric":"rsi","operator":"lt","value":30}]` works
- [ ] Combined technical + fundamental filter returns intersection
- [ ] Invalid filter metric returns 400 with clear message
- [ ] Response < 2 000 ms for 50 tickers

**Manual curl test**
```bash
# All stocks
curl http://localhost:3000/stocks

# RSI < 30 screen
curl 'http://localhost:3000/screener?filters=%5B%7B%22metric%22%3A%22rsi%22%2C%22operator%22%3A%22lt%22%2C%22value%22%3A30%7D%5D'

# BBCA candles (1 month)
curl 'http://localhost:3000/stocks/BBCA/candles?timeframe=1M'
```

**Auto-commit** (agent runs this — do not skip)
```bash
git add -A
git commit -m "phase(2): screener engine, indicator functions, REST API" \
  -m "- RSI, SMA, EMA, MACD, Bollinger, volume indicators with Vitest tests" \
  -m "- Screener engine with lazy evaluation and Redis caching" \
  -m "- GET /stocks, /stocks/:ticker, /stocks/:ticker/candles, /screener" \
  -m "- All routes public — no auth required"
git push
```
- [ ] Commit pushed successfully

### Blockers / notes
```
Date:
Issue:
Resolution:
```

### Decisions made
```
Date:
Decision:
Reason:
```

---

## Phase 3 — React frontend: screener + stock detail

### Goal
First visual demo. A recruiter can open the URL and immediately understand the product. Screenshot for the portfolio.

### Checklist

**Project setup**
- [ ] Vite + React + TypeScript in `apps/web`
- [ ] Tailwind CSS configured
- [ ] `react-router-dom`, `@tanstack/react-query`, `axios` installed
- [ ] `recharts`, `lightweight-charts` installed
- [ ] `apiClient.ts` — Axios instance, no auth headers yet
- [ ] Routes: `/` → Screener, `/stock/:ticker` → StockDetail

**Screener page (`/`)**
- [ ] StockTable renders with columns: ticker, name, price, Δ%, RSI, P/E, market cap, sector
- [ ] FilterBar supports adding multiple rules (metric / operator / value / remove button per row)
- [ ] "Screen" button fires API call
- [ ] Results debounce 500 ms on filter change
- [ ] Table sortable by clicking column headers
- [ ] Pagination (next/prev, page size)
- [ ] Empty state when no stocks match

**Stock detail page (`/stock/:ticker`)**
- [ ] Candlestick chart renders with `lightweight-charts`
- [ ] Timeframe tabs (1W / 1M / 3M / 6M / 1Y) refetch candle data
- [ ] MA20 overlay toggled on/off
- [ ] MA50 overlay toggled on/off
- [ ] Bollinger Bands overlay toggled on/off
- [ ] FundamentalPanel shows real P/E, P/BV, ROE, DER, EPS, market cap
- [ ] TechnicalPanel shows RSI value with colour (green ≤ 30, red ≥ 70)
- [ ] "Login to add watchlist" placeholder (disabled, no auth yet)

**General UI**
- [ ] Loading skeletons on all data-fetching components
- [ ] Error state with retry on all data-fetching components
- [ ] Readable on 375px mobile (table scrolls horizontally)
- [ ] No layout shift on page load

**Screenshots to capture**
- [ ] Screener with 2–3 filters applied showing real results
- [ ] Stock detail for BBCA with candlestick chart and MA overlays

**Auto-commit** (agent runs this — do not skip)
```bash
git add -A
git commit -m "phase(3): react frontend — screener page and stock detail" \
  -m "- FilterBar with multi-rule support and debounce" \
  -m "- Sortable, paginated StockTable" \
  -m "- CandleChart with lightweight-charts, timeframe tabs, MA/Bollinger overlays" \
  -m "- FundamentalPanel and TechnicalPanel on stock detail" \
  -m "- Loading skeletons, error states, mobile-responsive layout"
git push
```
- [ ] Commit pushed successfully

### Blockers / notes
```
Date:
Issue:
Resolution:
```

### Decisions made
```
Date:
Decision:
Reason:
```

---

## Phase 4 — Watchlist, alerts, and Telegram bot

### Goal
Personal features working end-to-end. Auth stub (`X-User-Id` header) used throughout — replaced in Phase 6.

### Auth stub reminder

All personal routes extract `userId` from `getStubUserId(request)` (reads `X-User-Id` header).  
The frontend passes `X-User-Id: <demo-user-cuid>` as a hardcoded header on all personal route calls.  
This is fully replaced by JWT in Phase 6.

### Checklist

**Auth stub**
- [ ] `apps/api/src/lib/authStub.ts` created — `getStubUserId(request)` throws 401 if header missing
- [ ] Frontend `apiClient.ts` adds `'X-User-Id': '<demo-user-id>'` header for personal routes
- [ ] Demo user exists in DB (run `pnpm seed` or create manually via Prisma Studio)

**Watchlist routes**
- [ ] `GET /watchlist` returns user's list with latest prices from Redis
- [ ] `POST /watchlist/BBCA` adds BBCA, returns 201
- [ ] `POST /watchlist/BBCA` again returns 409
- [ ] `DELETE /watchlist/BBCA` removes entry, returns 204

**Alert routes**
- [ ] `POST /alerts` creates alert, returns 201 with alert object
- [ ] `POST /alerts` with invalid metric returns 400
- [ ] `GET /alerts` returns user's alerts
- [ ] `PATCH /alerts/:id` toggles `active`; other user's alert returns 403
- [ ] `DELETE /alerts/:id` removes alert, verifies ownership

**Alert evaluator**
- [ ] Worker runs after each scrape cycle
- [ ] RSI < 30 condition detected on test data
- [ ] `Alert.lastFired` updated when alert fires
- [ ] Same alert does not re-fire within 4 hours
- [ ] Fundamental alerts evaluate against `Fundamental` table

**BullMQ**
- [ ] Telegram jobs in queue `telegram-alerts`
- [ ] Failed jobs retry up to 3× with exponential backoff
- [ ] After 3 failures, job moves to failed state (not retried again)

**Telegram bot**
- [ ] `TELEGRAM_BOT_TOKEN` in `.env`, bot starts without errors
- [ ] `/start <token>` links Telegram account to user
- [ ] Alert message received on Telegram with correct format
- [ ] `/alerts` command lists active alerts
- [ ] `/unlink` clears telegramId

**WebSocket**
- [ ] `ws://localhost:3000/ws/prices` connects
- [ ] Snapshot received on connect: `{ type: 'snapshot', prices: {...} }`
- [ ] Update received every 30 s during market hours
- [ ] No updates sent outside market hours

**Settings route**
- [ ] `POST /settings/telegram-token` generates link token, stores on user
- [ ] Token is single-use: cleared after bot `/start`

**Frontend pages**
- [ ] Watchlist page shows rows with ticker, name, live price (WebSocket), Δ%
- [ ] Remove button works with optimistic UI update
- [ ] Alerts page: form creates alert, list shows it immediately
- [ ] Toggle switch pauses/resumes alert (optimistic update)
- [ ] Settings page: generate token button, copy-able `/start <token>`

**Auto-commit** (agent runs this — do not skip)
```bash
git add -A
git commit -m "phase(4): watchlist, alerts, BullMQ worker, Telegram bot" \
  -m "- Auth stub (X-User-Id header) for all personal routes" \
  -m "- Watchlist and alert CRUD with ownership checks" \
  -m "- BullMQ alert evaluator with 4h cooldown and retry logic" \
  -m "- grammy.js Telegram bot (/start, /alerts, /unlink)" \
  -m "- WebSocket price feed with 30s market-hours broadcasts" \
  -m "- Watchlist, Alerts, Settings pages in React"
git push
```
- [ ] Commit pushed successfully

### Blockers / notes
```
Date:
Issue:
Resolution:
```

### Decisions made
```
Date:
Decision:
Reason:
```

---

## Phase 5 — Polish and deployment

### Goal
Live public demo on Railway, complete README, Docker Compose for one-command local dev.

### Checklist

**Docker Compose**
- [x] `docker-compose.yml` at repo root with `postgres:15-alpine` and `redis:7-alpine`
- [ ] `docker compose up -d` starts both cleanly (blocked on this host by existing Redis bound to `127.0.0.1:6379`; compose config itself validates)
- [x] `pnpm dev` (repo root) starts API and web concurrently
- [ ] Fresh checkout → `docker compose up -d` → `pnpm install` → `pnpm dev` works in < 10 min

**Tests**
- [x] `pnpm test` runs all Vitest indicator tests
- [x] All tests pass
- [x] Coverage ≥ 80% on `packages/shared/src/indicators/`

**Demo seed**
- [x] `apps/api/prisma/demoSeed.ts` creates demo user (`demo@idx-screener.app`; auth remains stubbed until Phase 6)
- [x] Demo watchlist: BBCA, TLKM, ASII, BBRI
- [x] Demo alerts: RSI < 30 on BBCA, P/E < 10 on ASII

**Deployment (Railway)**
- [ ] Railway project created with managed Postgres + Redis
- [x] API deployment build/start commands documented
- [x] Web deployment build/start commands documented
- [x] Env vars reference documented for Railway
- [ ] API deployed, start command: `pnpm --filter api start`
- [ ] Web deployed as static site, build: `pnpm --filter web build`, publish: `apps/web/dist`
- [ ] All env vars set in Railway dashboard
- [ ] Live URL loads screener with real IDX data

**README.md**
- [ ] One-line description + live demo badge at top (live demo badge pending URL)
- [x] Screener screenshot embedded
- [x] Stock detail screenshot embedded
- [x] Feature list
- [x] Tech stack table
- [x] 5-command local setup (clone → install → docker up → env → dev)
- [x] Env vars reference
- [x] `pnpm test` command documented
- [x] Link to `AGENT.md` for architecture detail
- [x] MIT license file added

**GitHub**
- [x] Repository is public
- [x] `PRD.md`, `AGENT.md`, `BUILD.md`, and `docs/DEPLOYMENT.md` committed
- [x] All phase commits visible in git log

**Auto-commit** (agent runs this — do not skip)
```bash
git add -A
git commit -m "phase(5): docker compose, README, Railway deployment" \
  -m "- docker-compose.yml for local postgres + redis" \
  -m "- Demo seed script with watchlist and alerts" \
  -m "- Complete README with screenshots and setup guide" \
  -m "- Live demo deployed to Railway"
git push
```
- [ ] Commit pushed successfully

### Blockers / notes
```
Date: 2026-06-10
Issue: `docker compose up -d` could not fully start on the shared host because an existing Redis service already binds `127.0.0.1:6379`.
Resolution: Verified `docker compose config --quiet`, cleaned up the partial compose stack with `docker compose down --volumes --remove-orphans`, and left compose-up validation pending for a clean host/CI environment.

Date: 2026-06-10
Issue: Railway CLI is not installed globally and this shell is not authenticated to Railway. `npx -y @railway/cli@5.8.0 --version` works, but `whoami` returns unauthorized.
Resolution: Deployment is ready to run once Railway authentication/project access is provided; use `npx -y @railway/cli@5.8.0 login` or provide a Railway token via a secure environment variable, never committed to the repo.
```

### Decisions made
```
Date:
Decision:
Reason:
```

---

## Phase 6 — Authentication (JWT + refresh tokens)

### Goal
Replace the auth stub with real JWT auth. All personal routes properly secured. Full product complete.

### Checklist

**Dependencies**
- [ ] `@fastify/jwt`, `bcrypt`, `@types/bcrypt` installed in `apps/api`

**Shared schemas**
- [ ] `packages/shared/src/schemas/auth.ts` — `RegisterSchema`, `LoginSchema`, `RefreshSchema`
- [ ] Types exported: `RegisterInput`, `LoginInput`

**JWT plugin**
- [ ] `apps/api/src/plugins/jwt.ts` registers `@fastify/jwt`
- [ ] `app.authenticate` preHandler hook available
- [ ] `request.user` typed as `{ userId: string; email: string }`

**Auth routes**
- [ ] `POST /auth/register` — creates user, hashes password (bcrypt cost 12), returns 201
- [ ] `POST /auth/register` — duplicate email returns 409
- [ ] `POST /auth/login` — correct credentials return `{ accessToken, refreshToken }`
- [ ] `POST /auth/login` — wrong password returns 401
- [ ] `POST /auth/refresh` — returns new token pair, old token invalidated
- [ ] `POST /auth/refresh` — replay attack (same token twice) returns 401
- [ ] `POST /auth/logout` — deletes refresh token from DB

**Auth stub removal**
- [ ] All `getStubUserId(request)` replaced with `request.user.userId`
- [ ] `preHandler: [app.authenticate]` added to all personal route handlers
- [ ] `apps/api/src/lib/authStub.ts` deleted
- [ ] Frontend `apiClient.ts` — hardcoded `X-User-Id` header removed

**Frontend**
- [ ] `useAuth.ts` hook — `login()`, `logout()`, `register()`, `isAuthenticated`
- [ ] `apiClient.ts` — request interceptor attaches `Authorization: Bearer <token>`
- [ ] `apiClient.ts` — response interceptor: on 401, POST `/auth/refresh`, retry once; on second 401, logout
- [ ] `/login` page — form, submits, stores access token in memory, redirects to `/`
- [ ] `/register` page — form, submits, redirects to `/login`
- [ ] Protected route wrapper: redirects to `/login` when unauthenticated
- [ ] On app load: silent refresh attempt to restore session
- [ ] Logout clears state and redirects to `/`

**Security**
- [ ] JWT secret from `process.env.JWT_SECRET` — never hardcoded
- [ ] Access token expiry 15 minutes
- [ ] Refresh token expiry 7 days
- [ ] No auth secrets in any log output
- [ ] `authStub.ts` no longer exists anywhere in the codebase

**Manual test**
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'

# Protected route with JWT
curl http://localhost:3000/watchlist \
  -H "Authorization: Bearer <accessToken>"

# Replay attack — second use of same refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<oldToken>"}' # should return 401
```

**Auto-commit** (agent runs this — do not skip)
```bash
git add -A
git commit -m "phase(6): JWT auth, refresh tokens, protected routes" \
  -m "- POST /auth/register, /login, /refresh, /logout" \
  -m "- bcrypt password hashing (cost 12), refresh token rotation, replay protection" \
  -m "- Auth stub replaced with app.authenticate preHandler on all personal routes" \
  -m "- React login/register pages, JWT interceptor, silent refresh on app load" \
  -m "- authStub.ts deleted — auth is now fully production-grade"
git push
```
- [ ] Commit pushed successfully

### Blockers / notes
```
Date:
Issue:
Resolution:
```

### Decisions made
```
Date:
Decision:
Reason:
```

---

## Architecture decisions log

| Date | Decision | Alternatives | Reason |
|---|---|---|---|
| — | Screener-first phase order | Auth-first | Makes portfolio demoable after Phase 3 |
| — | Auth stub (X-User-Id header) for Phases 4–5 | No auth / full auth from Phase 1 | Builds personal features without auth complexity; clean swap in Phase 6 |
| — | Auto-commit + push after every phase | Manual commits | Ensures clean git history; each phase is a reviewable milestone |
| — | pnpm workspaces monorepo | Separate repos | Shared types without npm publish; one repo to show |
| — | Fastify over Express | Express, Hono | Schema-first, faster, better TypeScript support |
| — | Prisma over Drizzle | Drizzle, TypeORM | Readable schema, great migration tooling, auto-generated types |
| — | BullMQ for alerts | node-cron only | Retries, job history, backpressure |
| — | grammy.js | telegraf, raw API | Best TypeScript support, actively maintained |
| — | RSI via Wilder smoothing | Simple average | Industry standard; matches TradingView |
| — | 15-min scrape interval | 1 min, 5 min | Yahoo Finance rate limits |
| — | 4-hour alert cooldown | 1 hour, 24 hours | Balances usefulness vs. spam |

---

## Known limitations

- **Yahoo Finance unofficial API** — not stable for production; a real product would use a paid provider (Polygon.io, Twelve Data, or IDX's official API).
- **Single-node WebSocket** — in-process state; horizontal scaling requires Redis Pub/Sub.
- **15-minute data resolution** — not real-time; a production screener would need exchange-provided real-time feeds.
- **Auth stub in Phases 4–5** — watchlist and alert data is not user-isolated during development; any caller with a valid `X-User-Id` can read any user's data. This is intentional for dev speed and is fully resolved in Phase 6.
- **No backtesting** — alert rules evaluated on current state only.
- **Demo credentials** — `demo1234` is predictable; a real product would use invite-only or OAuth.