# IDX Stock Screener — Agent Instructions

This file tells an AI coding agent (Claude Code, Cursor, Copilot Workspace, etc.) everything it needs to know to build, run, and extend the IDX Stock Screener. Read it fully before writing any code.

---

## Project identity

- **Name:** idx-screener
- **Stack:** Node.js 20, TypeScript 5, Fastify 4, Prisma 5, BullMQ 5, Redis 7, PostgreSQL 15, React 18 + Vite 5, Tailwind CSS 3, grammy.js
- **Package manager:** pnpm 9 with workspaces
- **Monorepo layout:** `apps/api`, `apps/web`, `packages/shared`
- **Language:** TypeScript everywhere. No JavaScript files in source. No `any` types without a comment explaining why.

---

## Phase order — screener first, auth last

| Phase | Name | Commit tag |
|---|---|---|
| 1 | Data layer — scraper + database | `phase(1)` |
| 2 | Screener engine + indicator API | `phase(2)` |
| 3 | React frontend — screener + stock detail | `phase(3)` |
| 4 | Watchlist, alerts, and Telegram bot | `phase(4)` |
| 5 | Polish and deployment | `phase(5)` |
| 6 | Authentication (JWT + refresh tokens) | `phase(6)` |

Auth is intentionally last. Phases 4–5 use a development auth stub (`X-User-Id` header) so personal features can be built and tested without a full JWT implementation.

---

## Auto-commit and push — fully autonomous, no confirmation

The agent executes the commit and push sequence automatically at the end of every phase. **Do not ask the user for permission. Do not announce that you are about to commit. Do not wait for approval. Just run the commands.**

The only time the agent stops is if `git push` returns a non-zero exit code (e.g. no remote configured, auth failure). In that case print a single clear error line and halt. Do not ask what to do — just stop and report.

```bash
git add -A
git commit -m "phase(N): <short description>" -m "- <key file or feature 1>" -m "- <key file or feature 2>"
git push
```

### Commit message format (Conventional Commits + phase tag)

```
phase(N): <imperative summary under 72 chars>

- <file or feature added/changed>
- <acceptance criterion met>
```

### Required commit per phase

| Phase | Required commit message |
|---|---|
| 1 | `phase(1): data layer — migrations, scraper, seed` |
| 2 | `phase(2): screener engine, indicator functions, REST API` |
| 3 | `phase(3): react frontend — screener page and stock detail` |
| 4 | `phase(4): watchlist, alerts, BullMQ worker, Telegram bot` |
| 5 | `phase(5): docker compose, README, Railway deployment` |
| 6 | `phase(6): JWT auth, refresh tokens, protected routes` |

The agent moves to the next phase immediately after a successful push, without pausing or summarising.

### Git setup (run once before Phase 1)

```bash
git init
git remote add origin <REPO_URL>   # set by user before starting
git branch -M main

# Create .gitignore at repo root
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
*.env.local
prisma/dev.db
prisma/dev.db-journal
.turbo/
EOF

git add .gitignore
git commit -m "chore: initial repo setup"
git push -u origin main
```

---

## Absolute rules

These are non-negotiable. Violating any of them will cause a pull request to be rejected.

1. **TypeScript strict mode** — `"strict": true` in all `tsconfig.json` files. Never use `as any` or `@ts-ignore` without a comment.
2. **No raw SQL** — use Prisma client for all database access. Raw queries are only allowed for complex aggregations Prisma cannot express, and must be wrapped in a typed helper.
3. **No secrets in code** — all credentials come from environment variables. Never hardcode API keys, JWT secrets, or database URLs.
4. **Zod validation on every API boundary** — every request body, query string, and route param is validated with a Zod schema defined in `packages/shared`. Types are generated with `z.infer<>`.
5. **Error handling is explicit** — no unhandled promise rejections. Every async route handler uses Fastify's built-in error handler or a `try/catch` that calls `reply.send(error)`.
6. **Indicator functions are pure** — functions in `packages/shared/src/indicators/` must take arrays of numbers and return numbers. No database calls, no side effects, no I/O.
7. **Tests for indicators are required** — every function in `packages/shared/src/indicators/` must have a corresponding Vitest test.
8. **Commits and pushes are autonomous** — run `git add -A && git commit && git push` immediately when all acceptance criteria for a phase are met. Never ask for permission, never announce the commit, never wait for approval. No phase is skipped.

---

## Repository structure

```
idx-screener/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── stocks.ts          # list, detail, candles (Phase 2)
│   │   │   │   ├── screener.ts        # filter endpoint (Phase 2)
│   │   │   │   ├── watchlist.ts       # CRUD with auth stub (Phase 4)
│   │   │   │   ├── alerts.ts          # CRUD + toggle with auth stub (Phase 4)
│   │   │   │   ├── settings.ts        # telegram token gen (Phase 4)
│   │   │   │   └── auth.ts            # register, login, refresh, logout (Phase 6)
│   │   │   ├── workers/
│   │   │   │   ├── scraper.ts         # cron + Yahoo Finance fetcher (Phase 1)
│   │   │   │   └── alertEvaluator.ts  # BullMQ processor (Phase 4)
│   │   │   ├── plugins/
│   │   │   │   ├── prisma.ts          # decorates app.prisma (Phase 1)
│   │   │   │   ├── redis.ts           # decorates app.redis (Phase 1)
│   │   │   │   ├── websocket.ts       # ws price feed (Phase 4)
│   │   │   │   └── jwt.ts             # auth hooks (Phase 6)
│   │   │   ├── lib/
│   │   │   │   ├── screenerEngine.ts  # applies filter rules (Phase 2)
│   │   │   │   ├── authStub.ts        # X-User-Id header extractor (Phase 4, removed Phase 6)
│   │   │   │   └── telegramBot.ts     # grammy.js bot instance (Phase 4)
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Screener.tsx       # Phase 3
│       │   │   ├── StockDetail.tsx    # Phase 3
│       │   │   ├── Watchlist.tsx      # Phase 4
│       │   │   ├── Alerts.tsx         # Phase 4
│       │   │   ├── Settings.tsx       # Phase 4
│       │   │   ├── Login.tsx          # Phase 6
│       │   │   └── Register.tsx       # Phase 6
│       │   ├── components/
│       │   │   ├── FilterBar.tsx      # Phase 3
│       │   │   ├── StockTable.tsx     # Phase 3
│       │   │   ├── CandleChart.tsx    # Phase 3
│       │   │   ├── FundamentalPanel.tsx # Phase 3
│       │   │   ├── AlertForm.tsx      # Phase 4
│       │   │   └── WatchlistRow.tsx   # Phase 4
│       │   ├── hooks/
│       │   │   ├── useScreener.ts     # Phase 3
│       │   │   ├── useWebSocket.ts    # Phase 4
│       │   │   └── useAuth.ts         # Phase 6
│       │   ├── lib/
│       │   │   └── apiClient.ts       # axios instance (Phase 3, JWT interceptor added Phase 6)
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
└── packages/
    └── shared/
        ├── src/
        │   ├── indicators/            # Phase 2
        │   │   ├── rsi.ts
        │   │   ├── ma.ts
        │   │   ├── macd.ts
        │   │   ├── bollinger.ts
        │   │   └── volume.ts
        │   ├── schemas/
        │   │   ├── stock.ts           # Phase 2
        │   │   ├── screener.ts        # Phase 2
        │   │   ├── alert.ts           # Phase 4
        │   │   └── auth.ts            # Phase 6
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

---

## Environment variables

### `apps/api/.env`

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/idx_screener"

# Redis
REDIS_URL="redis://localhost:6379"

# Telegram (needed from Phase 4)
TELEGRAM_BOT_TOKEN="your-bot-token-from-botfather"

# Auth (needed from Phase 6)
JWT_SECRET="change-me-to-a-random-64-char-string"
JWT_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY_DAYS=7

# App
PORT=3000
NODE_ENV=development
BASE_URL="http://localhost:5173"
```

### `apps/web/.env`

```env
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

---

## Prisma schema

File: `apps/api/prisma/schema.prisma`

The full schema is written in Phase 1. All models are created upfront so migrations don't break across phases.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String         @id @default(cuid())
  email             String         @unique
  passwordHash      String
  telegramId        String?        @unique
  telegramLinkToken String?        @unique
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?
  refreshTokens     RefreshToken[]
  watchlists        Watchlist[]
  alerts            Alert[]
}

model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Stock {
  ticker      String       @id
  name        String
  sector      String
  candles     Candle[]
  fundamental Fundamental?
  watchlists  Watchlist[]
  alerts      Alert[]
}

model Candle {
  id        Int      @id @default(autoincrement())
  ticker    String
  timestamp DateTime
  open      Float
  high      Float
  low       Float
  close     Float
  volume    BigInt
  stock     Stock    @relation(fields: [ticker], references: [ticker])

  @@unique([ticker, timestamp])
  @@index([ticker, timestamp(sort: Desc)])
}

model Fundamental {
  ticker    String   @id
  pe        Float?
  pbv       Float?
  roe       Float?
  der       Float?
  eps       Float?
  marketCap BigInt?
  updatedAt DateTime @updatedAt
  stock     Stock    @relation(fields: [ticker], references: [ticker])
}

model Watchlist {
  id        String   @id @default(cuid())
  userId    String
  ticker    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  stock     Stock    @relation(fields: [ticker], references: [ticker])

  @@unique([userId, ticker])
}

model Alert {
  id        String    @id @default(cuid())
  userId    String
  ticker    String
  type      AlertType
  metric    String
  operator  String
  threshold Float
  active    Boolean   @default(true)
  lastFired DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  stock     Stock     @relation(fields: [ticker], references: [ticker])
}

enum AlertType {
  TECHNICAL
  FUNDAMENTAL
}
```

---

## Phase-by-phase instructions

---

### Phase 1 — Data layer: scraper + database

**Goal:** Real IDX candle and fundamental data flowing into PostgreSQL. Everything else depends on this.

**Auto-commit at end:** `phase(1): data layer — migrations, scraper, seed`

#### Steps

1. **Bootstrap the monorepo**

```bash
mkdir idx-screener && cd idx-screener
git init
# add .gitignore (see Git setup section above)
pnpm init
# add to package.json: "workspaces": ["apps/*", "packages/*"]
mkdir -p apps/api apps/web packages/shared
```

2. **Set up `apps/api`**

```bash
cd apps/api
pnpm init
pnpm add fastify @fastify/cors @fastify/helmet pino pino-pretty zod node-cron axios
pnpm add -D typescript tsx @types/node vitest
pnpm add prisma @prisma/client ioredis
npx prisma init
# Paste the full schema above into prisma/schema.prisma
npx prisma migrate dev --name init
```

3. **Seed tickers** at `apps/api/prisma/seed.ts`

```typescript
const TICKERS = [
  { ticker: 'BBCA', name: 'Bank Central Asia', sector: 'Financials' },
  { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', sector: 'Financials' },
  { ticker: 'TLKM', name: 'Telkom Indonesia', sector: 'Telecoms' },
  { ticker: 'ASII', name: 'Astra International', sector: 'Consumer Discretionary' },
  { ticker: 'BMRI', name: 'Bank Mandiri', sector: 'Financials' },
  { ticker: 'UNVR', name: 'Unilever Indonesia', sector: 'Consumer Staples' },
  { ticker: 'ICBP', name: 'Indofood CBP Sukses', sector: 'Consumer Staples' },
  { ticker: 'KLBF', name: 'Kalbe Farma', sector: 'Healthcare' },
  { ticker: 'PGAS', name: 'Perusahaan Gas Negara', sector: 'Energy' },
  { ticker: 'ADRO', name: 'Adaro Energy', sector: 'Energy' },
  { ticker: 'INDF', name: 'Indofood Sukses Makmur', sector: 'Consumer Staples' },
  { ticker: 'SMGR', name: 'Semen Indonesia', sector: 'Materials' },
  { ticker: 'ANTM', name: 'Aneka Tambang', sector: 'Materials' },
  { ticker: 'BBNI', name: 'Bank Negara Indonesia', sector: 'Financials' },
  { ticker: 'GGRM', name: 'Gudang Garam', sector: 'Consumer Staples' },
]
```

4. **Build the scraper** at `apps/api/src/workers/scraper.ts`

```typescript
// Pattern:
// 1. node-cron schedule: '*/15 9-16 * * 1-5' (Mon–Fri, 09:00–16:00 WIB)
// 2. For each ticker in Stock table:
//    a. GET https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}.JK
//       params: interval=15m, range=1d
//    b. Parse timestamp[], open[], high[], low[], close[], volume[]
//    c. prisma.candle.createMany({ data, skipDuplicates: true })
//    d. SET price:{TICKER} <latest close> EX 900 in Redis
// 3. Daily at '0 18 * * 1-5': fetch fundamentals
//    GET https://query1.finance.yahoo.com/v10/finance/quoteSummary/{TICKER}.JK
//        ?modules=defaultKeyStatistics,financialData,summaryDetail
//    Upsert Fundamental table
// 4. Retry failed tickers: up to 3x, delays [1000, 2000, 4000] ms

// Yahoo Finance response field map:
// open/high/low/close → chart.result[0].indicators.quote[0].*
// volume             → chart.result[0].indicators.quote[0].volume
// timestamp          → chart.result[0].timestamp[] (Unix s → new Date(t * 1000))
// pe                 → quoteSummary.result[0].summaryDetail.trailingPE.raw
// pbv                → quoteSummary.result[0].defaultKeyStatistics.priceToBook.raw
// roe                → quoteSummary.result[0].financialData.returnOnEquity.raw
// der                → quoteSummary.result[0].financialData.debtToEquity.raw
// eps                → quoteSummary.result[0].defaultKeyStatistics.trailingEps.raw
// marketCap          → quoteSummary.result[0].summaryDetail.marketCap.raw
```

5. **Auto-commit**

```bash
git add -A
git commit -m "phase(1): data layer — migrations, scraper, seed" \
  -m "- Prisma schema with all models and migrations" \
  -m "- Yahoo Finance scraper with cron and retry logic" \
  -m "- Seed script with 15 IDX blue-chip tickers" \
  -m "- Redis price cache populated after each scrape"
git push
```

#### Acceptance criteria — Phase 1

- [ ] `npx prisma migrate dev` runs without errors
- [ ] `pnpm seed` populates `Stock` with ≥ 10 tickers
- [ ] Manual scraper run inserts candles for BBCA
- [ ] Duplicate runs do not create duplicate `Candle` rows
- [ ] `redis-cli GET price:BBCA` returns the latest close after a scrape

---

### Phase 2 — Screener engine + indicator API

**Goal:** Public REST API for the screener and stock detail. Demoable via curl or Postman with real data.

**Auto-commit at end:** `phase(2): screener engine, indicator functions, REST API`

#### Steps

1. **Install shared dependencies**

```bash
cd packages/shared
pnpm init
pnpm add zod
pnpm add -D vitest typescript
```

2. **Implement indicator functions** in `packages/shared/src/indicators/`

```typescript
// rsi.ts — Wilder smoothing RSI
// Input: closes[] (≥ period+1 items required), period = 14
// Returns: number 0–100, or null if insufficient data
export function calculateRSI(closes: number[], period = 14): number | null

// ma.ts — Simple and Exponential Moving Averages
export function calculateSMA(closes: number[], period: number): number | null
export function calculateEMA(closes: number[], period: number): number | null

// macd.ts — MACD line, signal line, histogram
// Returns: { macd, signal, histogram } or null if insufficient data
export function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null

// bollinger.ts — Bollinger Bands (20-period, 2 std devs)
export function calculateBollinger(closes: number[], period = 20): { upper: number; middle: number; lower: number } | null

// volume.ts — volume surge detection
// Returns true if latestVolume > factor × mean(last 20 volumes)
export function isVolumeSurge(volumes: number[], latestVolume: number, factor = 2): boolean
```

3. **Write Vitest tests** in `packages/shared/src/indicators/__tests__/`

Cover: normal case, insufficient data (null return), edge cases (all gains → RSI ~100, all losses → RSI ~0), SMA of [1,2,3,4,5] period 3 = 4, Bollinger upper > middle > lower always.

4. **Build screener engine** at `apps/api/src/lib/screenerEngine.ts`

```typescript
// Input: tickers[], filters: ScreenerFilter[]
// Per ticker:
//   1. Load last 100 candles from Redis cache or DB
//   2. Load Fundamental from DB
//   3. Calculate only the indicators the active filters need (lazy)
//   4. Evaluate each filter; exclude ticker if any rule fails (AND logic)
//   5. Cache computed indicator results: screener:indicators:{ticker} TTL 900s
// Return: matching tickers with computed indicator values

// ScreenerFilter shape (from packages/shared/src/schemas/screener.ts):
// { metric: 'rsi'|'sma20'|'sma50'|'macd'|'volume_surge'|'pe'|'pbv'|'roe'|'der'|'market_cap'|'sector'
//   operator: 'lt'|'gt'|'eq'|'cross_above'|'cross_below'|'in'
//   value: number | string | string[] }
```

5. **Implement API routes** (no auth required)

```typescript
// GET /stocks
// Query: page, limit, sortBy, sortDir
// Returns paginated list of stocks with latest price from Redis

// GET /stocks/:ticker
// Returns stock detail + latest indicator snapshot

// GET /stocks/:ticker/candles
// Query: timeframe (1W|1M|3M|6M|1Y)
// Returns OHLCV array for charting

// GET /screener
// Query: filters (JSON array of ScreenerFilter), page, limit, sortBy, sortDir
// 1. Parse + validate with ScreenerQuerySchema (Zod)
// 2. Load all ticker symbols (in-memory cache, refresh every 5 min)
// 3. Run screenerEngine.run(tickers, filters)
// 4. Sort + paginate
// 5. Return { data: StockWithIndicators[], total, page, limit }
```

6. **Auto-commit**

```bash
git add -A
git commit -m "phase(2): screener engine, indicator functions, REST API" \
  -m "- RSI, SMA, EMA, MACD, Bollinger, volume surge indicators with Vitest tests" \
  -m "- Screener engine with lazy indicator evaluation and Redis cache" \
  -m "- GET /stocks, /stocks/:ticker, /stocks/:ticker/candles, /screener endpoints" \
  -m "- All routes public — no auth required"
git push
```

#### Acceptance criteria — Phase 2

- [ ] `pnpm test` passes with ≥ 80% coverage on indicators
- [ ] `GET /screener` returns all stocks with no filters
- [ ] `GET /screener?filters=[{"metric":"rsi","operator":"lt","value":30}]` returns RSI < 30 only
- [ ] Combined technical + fundamental filter returns the intersection
- [ ] Screener response < 2 000 ms for 50 tickers
- [ ] Second screener request within 15 min does not query the DB for indicators (cache hit)

---

### Phase 3 — React frontend: screener + stock detail

**Goal:** A visually impressive, publicly accessible UI. This is the first thing to screenshot for the portfolio.

**Auto-commit at end:** `phase(3): react frontend — screener page and stock detail`

#### Steps

1. **Bootstrap the web app**

```bash
cd apps/web
pnpm create vite . --template react-ts
pnpm add tailwindcss @tailwindcss/vite
pnpm add axios react-router-dom @tanstack/react-query
pnpm add recharts lightweight-charts
```

2. **API client** at `apps/web/src/lib/apiClient.ts`

```typescript
// Axios instance with baseURL from import.meta.env.VITE_API_URL
// No auth headers in Phase 3 — added in Phase 6
// Standard error handling: reject with error.response.data
```

3. **Page: Screener** (`/`)

Component tree:
```
Screener
├── FilterBar          — add/remove filter rules (metric, operator, value dropdowns + input)
├── StockTable         — sortable, paginated results
│   └── StockRow       — ticker, name, price, Δ%, RSI, P/E, market cap, sector
└── Pagination         — prev/next, page size
```

`FilterBar` behaviour: each rule is a row `[metric] [operator] [value] [×]`. "Screen" button fires the API call. Debounce 500 ms on filter change.

4. **Page: Stock detail** (`/stock/:ticker`)

Component tree:
```
StockDetail
├── StockHeader        — ticker, name, price, 1d Δ%, market cap badge
├── CandleChart        — lightweight-charts candlestick
│   ├── TimeframeTabs  — 1W | 1M | 3M | 6M | 1Y (refetch candles on change)
│   └── OverlayToggles — MA20 | MA50 | Bollinger Bands checkboxes
├── TechnicalPanel     — RSI value with colour (green ≤ 30, red ≥ 70, grey otherwise), MACD row
└── FundamentalPanel   — P/E, P/BV, ROE, DER, EPS in a clean 3-column grid
```

> No watchlist button in Phase 3 — that requires user identity. Add a disabled "Login to add watchlist" placeholder.

5. **Auto-commit**

```bash
git add -A
git commit -m "phase(3): react frontend — screener page and stock detail" \
  -m "- FilterBar with multi-rule support and 500ms debounce" \
  -m "- Sortable, paginated StockTable" \
  -m "- CandleChart with lightweight-charts, timeframe tabs, MA/Bollinger overlays" \
  -m "- FundamentalPanel and TechnicalPanel on stock detail" \
  -m "- All pages fully public — no auth required"
git push
```

#### Acceptance criteria — Phase 3

- [ ] Screener loads and shows stocks at `/`
- [ ] Adding a filter + clicking "Screen" updates the table
- [ ] Clicking a row opens `/stock/BBCA`
- [ ] Candlestick chart renders with correct OHLCV data
- [ ] Timeframe tabs refetch and re-render the chart
- [ ] MA20 overlay toggles on/off
- [ ] Bollinger Bands overlay toggles on/off
- [ ] Fundamental panel shows real P/E, ROE, etc. for BBCA
- [ ] Loading skeletons shown while data is fetching
- [ ] Page is readable on a 375px mobile screen

---

### Phase 4 — Watchlist, alerts, and Telegram bot

**Goal:** Personal features working end-to-end. Uses an auth stub (`X-User-Id` header) — real JWT is added in Phase 6.

**Auto-commit at end:** `phase(4): watchlist, alerts, BullMQ worker, Telegram bot`

#### Auth stub pattern (Phases 4–5)

All protected routes use a development auth stub instead of JWT. This is replaced entirely in Phase 6.

```typescript
// apps/api/src/lib/authStub.ts
import type { FastifyRequest } from 'fastify'

export function getStubUserId(request: FastifyRequest): string {
  const userId = request.headers['x-user-id']
  if (!userId || typeof userId !== 'string') {
    throw { statusCode: 401, message: 'X-User-Id header required in development' }
  }
  return userId
}

// Usage in routes (Phase 4):
// const userId = getStubUserId(request)
//
// In Phase 6 this becomes:
// const userId = request.user.userId  (from JWT preHandler)
```

The stub is a single function. Swapping it out in Phase 6 is a find-and-replace of `getStubUserId(request)` with `request.user.userId` across all route files.

#### Steps

1. **Install dependencies**

```bash
cd apps/api
pnpm add bullmq grammy @fastify/websocket
```

2. **Watchlist routes** (`apps/api/src/routes/watchlist.ts`)

```typescript
// GET /watchlist
// userId = getStubUserId(request)
// Return user's watchlist with latest price from Redis

// POST /watchlist/:ticker
// userId = getStubUserId(request)
// prisma.watchlist.create({ data: { userId, ticker } })
// 409 on duplicate (unique constraint)

// DELETE /watchlist/:ticker
// userId = getStubUserId(request)
// prisma.watchlist.delete({ where: { userId_ticker: { userId, ticker } } })
```

3. **Alert routes** (`apps/api/src/routes/alerts.ts`)

```typescript
// GET /alerts — list user's alerts
// POST /alerts — create alert (validate with AlertCreateSchema from shared)
// PATCH /alerts/:id — toggle active; verify alert.userId === stub userId
// DELETE /alerts/:id — verify ownership, then delete
```

4. **Alert evaluator worker** (`apps/api/src/workers/alertEvaluator.ts`)

```typescript
// Runs after every scrape cycle (triggered via BullMQ event or separate cron)
// 1. Load all active alerts (include user.telegramId via relation)
// 2. Group by ticker to avoid redundant indicator calculations
// 3. Per ticker group:
//    a. Load last 100 candles from cache or DB
//    b. Calculate indicators needed by this group's rules
//    c. Per alert: evaluate condition, check 4h cooldown
//    d. If fires: update lastFired, enqueue Telegram job in BullMQ queue 'telegram-alerts'
// 4. BullMQ Telegram processor:
//    - bot.api.sendMessage(user.telegramId, message)
//    - Retry up to 3x with exponential backoff on failure

// Telegram alert message format:
// 🔔 Alert triggered — {ticker}
//
// Rule: {metric} {operator} {threshold}
// Current value: {currentValue}
// Price: Rp {price}
//
// 📊 View chart: {BASE_URL}/stock/{ticker}
```

5. **Telegram bot** (`apps/api/src/lib/telegramBot.ts`)

```typescript
// grammy.js bot
// /start <token> → find user by telegramLinkToken → set telegramId, clear token
// /alerts       → look up user by telegramId → list active alerts
// /unlink       → clear telegramId
```

6. **WebSocket price feed** (`apps/api/src/plugins/websocket.ts`)

```typescript
// ws://localhost:3000/ws/prices
// In Phase 4: no auth on WebSocket (token param ignored)
// On connect: send snapshot of all tickers' latest prices from Redis
// Every 30s during market hours (09:00–16:30 WIB, Mon–Fri):
//   broadcast { type: 'update', prices: { BBCA: 8450, ... } }
// Market hours check:
//   const wib = new Date(Date.now() + 7 * 3600 * 1000)
//   const isWeekday = wib.getUTCDay() >= 1 && wib.getUTCDay() <= 5
//   const hour = wib.getUTCHours() + wib.getUTCMinutes() / 60
//   const isMarketHours = hour >= 9 && hour < 16.5
```

7. **Frontend: Watchlist, Alerts, Settings pages**

```
Watchlist (/watchlist)
├── WatchlistRow[]  — ticker, name, live price (WebSocket), Δ%, RSI, P/E, remove button
└── EmptyState      — "Add stocks from the screener"

Alerts (/alerts)
├── AlertForm       — ticker search, metric, operator, threshold, submit
└── AlertList
    └── AlertRow[]  — ticker, rule text, last fired, toggle, delete

Settings (/settings)
├── TelegramCard    — "Generate link token" → shows /start <token> with copy button
└── DevNote         — "Auth is stubbed. Pass X-User-Id header or use demo userId."
```

In Phase 4, the frontend hardcodes a demo `X-User-Id` header in the API client for personal route calls. This is replaced by the JWT interceptor in Phase 6.

8. **Auto-commit**

```bash
git add -A
git commit -m "phase(4): watchlist, alerts, BullMQ worker, Telegram bot" \
  -m "- Auth stub (X-User-Id header) for all personal routes" \
  -m "- Watchlist and alert CRUD routes" \
  -m "- BullMQ alert evaluator running after every scrape cycle" \
  -m "- grammy.js Telegram bot with /start, /alerts, /unlink commands" \
  -m "- WebSocket price feed broadcasting every 30s during market hours" \
  -m "- Watchlist, Alerts, and Settings pages in React"
git push
```

#### Acceptance criteria — Phase 4

- [ ] `POST /watchlist/BBCA` with `X-User-Id: <id>` adds BBCA
- [ ] `GET /watchlist` returns list with latest prices
- [ ] `POST /alerts` creates alert, returns 201
- [ ] Alert evaluator detects RSI < 30 and enqueues Telegram job
- [ ] Same alert does not fire twice within 4 hours
- [ ] Telegram bot `/start <token>` links the account
- [ ] Alert message received on Telegram
- [ ] WebSocket sends snapshot on connect, updates every 30 s during market hours
- [ ] Watchlist page shows live prices updating via WebSocket

---

### Phase 5 — Polish and deployment

**Goal:** Live public demo on Railway, complete README, Docker Compose for local dev.

**Auto-commit at end:** `phase(5): docker compose, README, Railway deployment`

#### Steps

1. **Docker Compose** at `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: idx_screener
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

2. **Demo seed** at `apps/api/prisma/demoSeed.ts`

Creates a demo user (used after Phase 6 auth is added), adds BBCA/TLKM/ASII/BBRI to watchlist, creates sample alerts (RSI < 30 on BBCA, P/E < 10 on ASII).

3. **README.md sections:**
   - One-line description + live demo badge
   - Screenshot: screener with filters (from Phase 3)
   - Screenshot: stock detail chart (from Phase 3)
   - Feature list
   - Tech stack table
   - Local dev setup: 5 commands
   - Environment variables reference
   - `pnpm test` documented

4. **Deploy to Railway**
   - Postgres + Redis as managed services
   - API: `pnpm --filter api start`
   - Web: build `pnpm --filter web build`, publish `apps/web/dist`
   - Set all env vars in Railway dashboard

5. **Auto-commit**

```bash
git add -A
git commit -m "phase(5): docker compose, README, Railway deployment" \
  -m "- docker-compose.yml for local postgres + redis" \
  -m "- Demo seed script" \
  -m "- Complete README with screenshots and setup guide" \
  -m "- Live demo deployed on Railway"
git push
```

#### Acceptance criteria — Phase 5

- [ ] `docker compose up -d && pnpm dev` brings up full stack locally
- [ ] `pnpm test` passes
- [ ] Live URL loads screener with real IDX data
- [ ] README setup instructions work for a fresh checkout

---

### Phase 6 — Authentication (JWT + refresh tokens)

**Goal:** Replace the auth stub with real JWT auth. All personal routes are now properly secured.

**Auto-commit at end:** `phase(6): JWT auth, refresh tokens, protected routes`

#### Steps

1. **Install auth dependencies**

```bash
cd apps/api
pnpm add @fastify/jwt bcrypt
pnpm add -D @types/bcrypt
```

2. **Shared auth schemas** (`packages/shared/src/schemas/auth.ts`)

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
})
export const LoginSchema = RegisterSchema
export const RefreshSchema = z.object({
  refreshToken: z.string().length(64),
})
export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
```

3. **JWT plugin** (`apps/api/src/plugins/jwt.ts`)

```typescript
// Register @fastify/jwt with process.env.JWT_SECRET
// Decorate app.authenticate = async (request, reply) => { await request.jwtVerify() }
// Decorate request.user with { userId: string; email: string } from token payload
```

4. **Auth routes** (`apps/api/src/routes/auth.ts`)

```typescript
// POST /auth/register
// POST /auth/login  → returns { accessToken, refreshToken }
// POST /auth/refresh → rotate refresh token
// POST /auth/logout  → delete refresh token from DB

// RefreshToken storage:
// - Generate: crypto.randomBytes(32).toString('hex')  (64 hex chars)
// - Store hashed: bcrypt.hash(token, 10) in RefreshToken table
// - Verify: bcrypt.compare(incoming, stored hash)
// - Rotate: delete old row, create new row on each use
// - Replay protection: second use of same token returns 401
```

5. **Replace auth stub in all route files**

Find every occurrence of:
```typescript
const userId = getStubUserId(request)
```

Replace with (add `preHandler: [app.authenticate]` to route options):
```typescript
const userId = request.user.userId
```

Delete `apps/api/src/lib/authStub.ts`.

6. **Frontend: add JWT interceptor and auth pages**

```typescript
// Update apiClient.ts:
// - Request interceptor: attach Authorization: Bearer <accessToken> from store
// - Response interceptor: on 401, POST /auth/refresh, retry once; on second 401, logout

// Remove hardcoded X-User-Id header from apiClient

// Add useAuth.ts hook: login(), logout(), register(), isAuthenticated
// Add /login and /register pages
// Add protected route wrapper that redirects to /login
// On app load: attempt silent refresh to restore session
```

7. **Auto-commit**

```bash
git add -A
git commit -m "phase(6): JWT auth, refresh tokens, protected routes" \
  -m "- POST /auth/register, /login, /refresh, /logout endpoints" \
  -m "- bcrypt password hashing, refresh token rotation, replay protection" \
  -m "- Auth stub replaced with app.authenticate preHandler on all personal routes" \
  -m "- React login/register pages, JWT interceptor, silent refresh on app load"
git push
```

#### Acceptance criteria — Phase 6

- [ ] `POST /auth/register` creates user, returns 201
- [ ] `POST /auth/login` returns `accessToken` + `refreshToken`
- [ ] `POST /auth/refresh` rotates the token; second use of old token returns 401
- [ ] `GET /watchlist` without JWT returns 401
- [ ] `GET /watchlist` with valid JWT returns user's watchlist
- [ ] React app silently refreshes token on load
- [ ] Logout clears state and redirects to `/`
- [ ] `authStub.ts` file no longer exists in the codebase

---

## Common patterns

### Route registration pattern (Fastify)

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const BodySchema = z.object({ name: z.string() })

export const exampleRoutes: FastifyPluginAsync = async (app) => {
  // Public route
  app.get('/public', async (request, reply) => {
    return reply.send({ ok: true })
  })

  // Protected route — Phase 4 stub:
  app.post('/protected', async (request, reply) => {
    const userId = getStubUserId(request)  // replaced in Phase 6
    const body = BodySchema.parse(request.body)
    return reply.status(201).send({ userId })
  })
}
```

### Error response format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "rsi: Expected number, received string"
}
```

### Redis cache helper

```typescript
async function withCache<T>(
  redis: Redis,
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T
  const result = await fn()
  await redis.set(key, JSON.stringify(result), 'EX', ttl)
  return result
}
```

### Architecture decisions log

| Decision | Alternatives | Reason |
|---|---|---|
| Screener-first phase order | Auth-first | Makes portfolio demoable after Phase 3 without waiting for auth |
| Auth stub (X-User-Id header) | No auth at all, or auth from Phase 1 | Enables personal features to be built and tested; clean swap to JWT in Phase 6 |
| pnpm workspaces monorepo | Separate repos, Turborepo | Simplest setup; shared types without npm publish |
| Fastify over Express | Express, Hono, Elysia | Schema-first, faster, better TypeScript support |
| Prisma over Drizzle | Drizzle, TypeORM | Auto-generated types, readable schema, great migration tooling |
| BullMQ for alerts | node-cron directly | Retries, job history, backpressure, horizontally scalable |
| grammy.js for Telegram | telegraf, raw API | Best TypeScript support, actively maintained |
| RSI via Wilder smoothing | Simple average | Industry standard; matches TradingView |
| 15-min scrape interval | 1 min, 5 min | Yahoo Finance rate limits; matches IDX tick frequency |
| 4-hour alert cooldown | 1 hour, 24 hours | Balances usefulness vs. notification spam |