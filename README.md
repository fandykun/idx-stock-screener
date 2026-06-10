# IDX Stock Screener

A full-stack IDX stock screening demo with a Fastify API, shared TypeScript indicator package, and React/Vite frontend.

## Current scope

Implemented through Phase 4 of the PRD:

- Public screener API: `/screener`, `/stocks`, `/stocks/:ticker`, `/stocks/:ticker/candles`
- Technical indicators: RSI-14, SMA, EMA, MACD, Bollinger Bands, volume surge
- Fundamental filters: P/E, P/BV, ROE, DER, market cap tier, sector
- React screener page with sortable table and multi-rule filters
- Stock detail page with candlestick chart, timeframe tabs, MA/Bollinger overlays, technical and fundamental panels
- Auth-stubbed watchlist API and `/watchlist` page
- Auth-stubbed alerts API and `/alerts` page
- `/settings` page with Telegram link-token generation
- WebSocket price feed at `/ws/prices`
- Alert evaluator with 4-hour cooldown logic
- Telegram bot scaffold for future account linking and alert delivery
- Prisma schema and seed script matching the PRD data model
- Yahoo Finance scraper module with retry logic and IDX `.JK` ticker support

The API currently ships with deterministic demo IDX data so it runs without local PostgreSQL/Redis services. Watchlists, alerts, and Telegram link tokens are stored in memory for the Phase 4 demo and will be moved to PostgreSQL in a later production-readiness step.

## Stack

- Node.js + TypeScript strict mode
- Fastify API
- React 18 + Vite
- lightweight-charts
- Zod validation
- Vitest
- Prisma schema for PostgreSQL
- WebSocket price feed via `@fastify/websocket`
- BullMQ/Redis dependency scaffold for alert delivery
- grammY Telegram bot scaffold

## Local development

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
corepack pnpm seed:demo
corepack pnpm --filter api start
corepack pnpm --filter web preview -- --port 4173
```

Open `http://localhost:4173`.

The demo web app sends `X-User-Id: demo-user` for stub-authenticated routes. For direct API calls to watchlist, alerts, and settings endpoints, include the same header.

## API examples

```bash
curl http://localhost:3000/health
curl 'http://localhost:3000/screener?limit=5'
curl 'http://localhost:3000/screener?filters=%5B%7B%22metric%22%3A%22pe%22%2C%22operator%22%3A%22lt%22%2C%22value%22%3A10%7D%5D'
curl 'http://localhost:3000/stocks/BBCA/candles?timeframe=1W'
curl -H 'X-User-Id: demo-user' http://localhost:3000/watchlist
curl -X POST -H 'X-User-Id: demo-user' http://localhost:3000/watchlist/BBCA
curl -X POST -H 'X-User-Id: demo-user' -H 'Content-Type: application/json' \
  -d '{"ticker":"BBCA","type":"TECHNICAL","metric":"rsi","operator":"lt","threshold":30}' \
  http://localhost:3000/alerts
curl -X POST -H 'X-User-Id: demo-user' http://localhost:3000/settings/telegram-token
```

## Smoke verification

Start the API and web preview in separate terminals, then run:

```bash
corepack pnpm smoke
```

The smoke script checks:

- `GET /health`
- `GET /screener`
- `GET /stocks/BBCA/candles`
- `POST /watchlist/BBCA`
- `GET /watchlist`
- `POST /alerts`
- `GET /alerts`
- `POST /settings/telegram-token`
- web app shell at `WEB_BASE_URL`

Environment overrides:

```bash
API_BASE_URL=https://your-api.example.com WEB_BASE_URL=https://your-web.example.com corepack pnpm smoke
```

## Verification

Latest verified commands:

- `corepack pnpm build` — passes
- `corepack pnpm test` — passes
- `corepack pnpm test:coverage` — indicator package line coverage is 100%, statement coverage is 91.48%
- Browser smoke test: `/` renders screener table; `/stock/BBCA` renders stock detail with chart controls; `/watchlist`, `/alerts`, and `/settings` exercise Phase 4 personal flows

## Next production work

- Deploy API and web publicly for Phase 5.
- Move demo/in-memory state to PostgreSQL.
- Wire Redis/BullMQ for alert delivery retries.
- Implement real Telegram account linking and commands.
- Replace `X-User-Id` stub auth with JWT/refresh-token authentication in Phase 6.
