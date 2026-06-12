# IDX Stock Screener

A full-stack Indonesian stock screener demo for filtering IDX names by valuation, momentum, and risk signals.

![Screener screenshot](docs/assets/screener.svg)

## Features

- Public screener API: `/screener`, `/stocks`, `/stocks/:ticker`, `/stocks/:ticker/candles`
- Technical indicators: RSI-14, SMA, EMA, MACD, Bollinger Bands, volume surge
- Fundamental filters: P/E, P/BV, ROE, DER, market cap tier, sector
- React screener page with sortable table and multi-rule filters
- Stock detail page with chart controls, technical snapshot, and fundamental context
- JWT-authenticated watchlist and alerts flows with refresh-token rotation
- `/login`, `/register`, and `/settings` pages with Telegram link-token generation
- WebSocket price feed at `/ws/prices`
- Alert evaluator with 4-hour cooldown logic
- Prisma schema and deterministic demo seed for local PostgreSQL
- Yahoo Finance scraper module with retry logic and IDX `.JK` ticker support

![Stock detail screenshot](docs/assets/stock-detail.svg)

## Live demo

- Web: https://web-production-416351.up.railway.app
- API health: https://api-production-9f35.up.railway.app/health

## Current scope

Implemented through Phase 6 authentication in source. The API ships with deterministic demo IDX data so it can run without PostgreSQL/Redis, while the Prisma schema and demo seed are available for database-backed local checks.

Watchlists, alerts, auth users, and refresh tokens are still stored in memory for the demo runtime. Production persistence and real Telegram delivery are still future production work.

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

Set `JWT_SECRET` before starting the API. The web app uses JWT auth: register or log in through `/register` or `/login`, then protected watchlist, alert, and settings requests include the logged-in user's access token.

## Environment variables

### API (`apps/api/.env`)

| Variable | Example | Required | Notes |
|---|---|---|---|
| `JWT_SECRET` | `change-me-in-development` | Yes | Signs access tokens. Use a long random secret outside local development. |
| `DATABASE_URL` | `postgresql://postgres:***@localhost:5432/idx_screener` | For Prisma seed/scraper | Used by Prisma scripts and future persistence work. |
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

curl -X POST -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"password123"}' \
  http://localhost:3000/auth/register
curl -X POST -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"password123"}' \
  http://localhost:3000/auth/login

# Save the accessToken from /auth/login as ACCESS_TOKEN, then call protected routes.
curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/watchlist
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/watchlist/BBCA
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"ticker":"BBCA","type":"TECHNICAL","metric":"rsi","operator":"lt","threshold":30}' \
  http://localhost:3000/alerts
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/settings/telegram-token
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
- `POST /auth/register`
- `POST /auth/login`
- `GET /watchlist` returns 401 without JWT
- `POST /watchlist/BBCA` with JWT
- `GET /watchlist` with JWT
- `POST /alerts` with JWT
- `GET /alerts` with JWT
- `POST /settings/telegram-token` with JWT
- `POST /auth/refresh` rotates the refresh token and rejects replay
- `POST /auth/logout` invalidates the active refresh token
- web app shell at `WEB_BASE_URL`

Environment overrides:

```bash
API_BASE_URL=https://api-production-9f35.up.railway.app \
WEB_BASE_URL=https://web-production-416351.up.railway.app \
SMOKE_EMAIL=smoke@example.com \
SMOKE_PASSWORD=password123 \
corepack pnpm smoke
```

`SMOKE_EMAIL` is optional; omit it for an auto-generated one-off smoke account.

## Verification

Latest verified commands:

- `corepack pnpm build`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm smoke` against local API and web preview
- `API_BASE_URL=https://api-production-9f35.up.railway.app WEB_BASE_URL=https://web-production-416351.up.railway.app corepack pnpm smoke` after the Phase 6 deployment is live

## Architecture notes

See [AGENT.md](AGENT.md), [PRD.md](PRD.md), [BUILD.md](BUILD.md), and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for implementation phases, architecture decisions, deployment steps, and development workflow.

## License

MIT — see [LICENSE](LICENSE).

## Next production work

- Move demo/in-memory auth, watchlist, and alert state to PostgreSQL.
- Wire Redis/BullMQ for alert delivery retries.
- Implement real Telegram account linking and commands.
- Redeploy Railway API/web with Phase 6 auth and rerun production smoke.
