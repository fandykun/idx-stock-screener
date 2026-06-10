# IDX Stock Screener

A full-stack Indonesian stock screener demo for filtering IDX names by valuation, momentum, and risk signals.

![Screener screenshot](docs/assets/screener.svg)

## Features

- Public screener API: `/screener`, `/stocks`, `/stocks/:ticker`, `/stocks/:ticker/candles`
- Technical indicators: RSI-14, SMA, EMA, MACD, Bollinger Bands, volume surge
- Fundamental filters: P/E, P/BV, ROE, DER, market cap tier, sector
- React screener page with sortable table and multi-rule filters
- Stock detail page with chart controls, technical snapshot, and fundamental context
- Auth-stubbed watchlist and alerts flows for the Phase 4/5 demo
- `/settings` page with Telegram link-token generation
- WebSocket price feed at `/ws/prices`
- Alert evaluator with 4-hour cooldown logic
- Prisma schema and deterministic demo seed for local PostgreSQL
- Yahoo Finance scraper module with retry logic and IDX `.JK` ticker support

![Stock detail screenshot](docs/assets/stock-detail.svg)

## Current scope

Implemented through Phase 5 local-dev polish. The API ships with deterministic demo IDX data so it can run without PostgreSQL/Redis, while the Prisma schema and demo seed are available for database-backed local checks.

Watchlists, alerts, and Telegram link tokens are still stored in memory for the demo. Production persistence, real Telegram delivery, and JWT/refresh-token auth are intentionally deferred to later phases.

## Tech stack

| Layer | Technology |
|---|---|
| API | Node.js, TypeScript strict mode, Fastify |
| Web | React 18, Vite, React Router, TanStack Query |
| Charts | lightweight-charts |
| Validation | Zod |
| Data model | Prisma, PostgreSQL |
| Jobs/realtime | BullMQ/Redis scaffold, WebSocket price feed |
| Bot scaffold | grammY |
| Testing | Vitest |
| Local services | Docker Compose with PostgreSQL and Redis |

## 5-command local setup

```bash
git clone https://github.com/fandykun/idx-stock-screener.git
cd idx-stock-screener && corepack pnpm install
docker compose up -d
cp apps/api/.env.example apps/api/.env
corepack pnpm build && corepack pnpm test && corepack pnpm seed:demo && corepack pnpm dev
```

Open `http://localhost:5173` for Vite dev, or run the production preview with:

```bash
corepack pnpm --filter api start
PORT=4173 corepack pnpm --filter web start
```

The demo web app sends `X-User-Id: demo-user` for stub-authenticated routes. For direct API calls to watchlist, alerts, and settings endpoints, include the same header.

## Environment variables

### API (`apps/api/.env`)

| Variable | Example | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/idx_screener` | For Prisma seed/scraper | Used by Prisma scripts and future persistence work. |
| `REDIS_URL` | `redis://localhost:6379` | For future alert jobs | Redis is scaffolded for BullMQ alert delivery. |
| `API_PORT` | `3000` | No | API defaults to `3000`. |
| `WEB_ORIGIN` | `http://localhost:5173` | No | CORS origin. Defaults to permissive development behavior. |
| `LOG_LEVEL` | `info` | No | Fastify logger level. |

### Web

| Variable | Example | Required | Notes |
|---|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | No | Browser API base URL. |
| `PORT` | `4173` | No | Used by `corepack pnpm --filter web start`. |

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

- `corepack pnpm build`
- `corepack pnpm test`
- `corepack pnpm test:coverage`
- `corepack pnpm seed:demo` twice to confirm idempotent demo data
- `corepack pnpm smoke` against local API and web preview

## Architecture notes

See [AGENT.md](AGENT.md), [PRD.md](PRD.md), and [BUILD.md](BUILD.md) for implementation phases, architecture decisions, and development workflow.

## License

MIT — see [LICENSE](LICENSE).

## Next production work

- Deploy API and web publicly for Phase 5 once Railway access is available.
- Move demo/in-memory state to PostgreSQL.
- Wire Redis/BullMQ for alert delivery retries.
- Implement real Telegram account linking and commands.
- Replace `X-User-Id` stub auth with JWT/refresh-token authentication in Phase 6.
