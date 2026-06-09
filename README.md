# IDX Stock Screener

A full-stack IDX stock screening demo with a Fastify API, shared TypeScript indicator package, and React/Vite frontend.

## Current scope

Implemented as a working Phase 1–3 MVP:

- Public screener API: `/screener`, `/stocks`, `/stocks/:ticker`, `/stocks/:ticker/candles`
- Technical indicators: RSI-14, SMA, EMA, MACD, Bollinger Bands, volume surge
- Fundamental filters: P/E, P/BV, ROE, DER, market cap tier, sector
- React screener page with sortable table and multi-rule filters
- Stock detail page with candlestick chart, timeframe tabs, MA/Bollinger overlays, technical and fundamental panels
- Prisma schema and seed script matching the PRD data model
- Yahoo Finance scraper module with retry logic and IDX `.JK` ticker support

The API currently ships with deterministic demo IDX data so it runs without local PostgreSQL/Redis services. The Prisma schema and seed script are ready for the database-backed phase once PostgreSQL is available.

## Stack

- Node.js + TypeScript strict mode
- Fastify API
- React 18 + Vite
- lightweight-charts
- Zod validation
- Vitest
- Prisma schema for PostgreSQL

## Local development

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
corepack pnpm --filter api start
corepack pnpm --filter web preview -- --port 4173
```

Open `http://localhost:4173`.

## API examples

```bash
curl http://localhost:3000/health
curl 'http://localhost:3000/screener?limit=5'
curl 'http://localhost:3000/screener?filters=%5B%7B%22metric%22%3A%22pe%22%2C%22operator%22%3A%22lt%22%2C%22value%22%3A10%7D%5D'
curl 'http://localhost:3000/stocks/BBCA/candles?timeframe=1W'
```

## Verification

Latest verified commands:

- `corepack pnpm build` — passes
- `corepack pnpm test` — passes
- `corepack pnpm test:coverage` — indicator package line coverage is 100%, statement coverage is 91.48%
- Browser smoke test: `/` renders screener table; `/stock/BBCA` renders stock detail with chart controls
