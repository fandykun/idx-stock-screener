# Deployment guide

This project is a pnpm monorepo with two deployable services:

- API: Fastify service in `apps/api`
- Web: Vite/React static preview service in `apps/web`

The commands below are written for Railway, but the same build/start commands work on any Node.js host that supports pnpm and environment variables.

## Required services

Create these managed services in the Railway project:

- PostgreSQL
- Redis
- API service from this repository
- Web service from this repository

Do not commit generated database URLs, Redis URLs, bot tokens, Railway tokens, or service domains.

## API service

Use the repository root as the service root.

Build command:

```bash
corepack pnpm install --frozen-lockfile && corepack pnpm --filter @idx-screener/shared build && corepack pnpm --filter api build
```

Start command:

```bash
corepack pnpm start
```

Equivalent API-only command:

```bash
corepack pnpm --filter api start
```

Environment variables:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
WEB_ORIGIN=https://your-web-service.up.railway.app
LOG_LEVEL=info
```

Notes:

- The API reads `API_PORT`, then Railway's `PORT`, then falls back to `3000` for local development.
- `DATABASE_URL` is currently required for Prisma seed/scraper operations and future persistence work. The Phase 5 API can still serve deterministic demo data without database reads.
- `WEB_ORIGIN` should be the final public web origin to keep CORS narrow.

## Web service

Use the repository root as the service root.

Build command:

```bash
corepack pnpm install --frozen-lockfile && VITE_API_URL=https://your-api-service.up.railway.app corepack pnpm --filter @idx-screener/shared build && VITE_API_URL=https://your-api-service.up.railway.app corepack pnpm --filter web build
```

Start command:

```bash
corepack pnpm --filter web start
```

Environment variables:

```bash
VITE_API_URL=https://your-api-service.up.railway.app
PORT=${{PORT}}
```

Notes:

- Vite embeds `VITE_API_URL` during build, so set it before the web build runs.
- `apps/web/package.json` maps `PORT` to `vite preview` for Railway-compatible runtime binding.

## One-time database seed

After the API service has a valid `DATABASE_URL`, run this from a Railway shell or equivalent authenticated environment:

```bash
corepack pnpm --filter api seed:demo
```

The demo seed is idempotent and creates:

- demo user: `demo@idx-screener.app`
- watchlist: BBCA, TLKM, ASII, BBRI
- alerts: BBCA RSI < 30, ASII P/E < 10
- deterministic stock, candle, and fundamental data

## Post-deploy smoke check

After both API and web services are live:

```bash
API_BASE_URL=https://your-api-service.up.railway.app \
WEB_BASE_URL=https://your-web-service.up.railway.app \
corepack pnpm smoke
```

The smoke command validates API health, screener data, candles, personal demo routes, settings token generation, and the web app shell.

## Local deployment rehearsal

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
corepack pnpm test:coverage
corepack pnpm seed:demo
```

Then start the two runtime services:

```bash
corepack pnpm --filter api start
PORT=4173 corepack pnpm --filter web start
```

In another shell:

```bash
corepack pnpm smoke
```
