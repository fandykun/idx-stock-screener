# IDX Stock Screener — Product Requirements Document

**Version:** 1.1  
**Status:** Active  
**Last updated:** 2026-06-07  
**Change:** Screener-first phase order; auth deprioritised to Phase 6; auto-commit/push added after every phase.

---

## 1. Overview

### 1.1 Product summary

IDX Stock Screener is a full-stack web application that enables investors to filter, analyze, and monitor Indonesian Exchange (IDX) stocks using both technical and fundamental criteria. Users can create personal watchlists, configure price and indicator alerts, and receive notifications via Telegram when conditions are met.

### 1.2 Problem statement

Indonesian retail investors currently lack a free, fast, and developer-quality tool for screening IDX-listed stocks. Existing tools (RTI Business, Stockbit) are either paywalled, slow, or do not expose programmatic alert rules. This project fills that gap and demonstrates full-stack engineering capability in a domain-specific context.

### 1.3 Target users

| User type | Description |
|---|---|
| Retail investor | Screens stocks by valuation or momentum signals before buying |
| Swing trader | Sets RSI / MA crossover alerts to time entries and exits |
| Portfolio reviewer | Monitors a personal watchlist for daily price and fundamental changes |

### 1.4 Goals

- Ship a visually compelling, working product on a public URL as early as possible
- Prioritise the screener and stock detail features — these are the portfolio centrepiece
- Add auth, watchlist, and alerts only after the core screener is demoable
- Produce clean, documented code suitable for GitHub portfolio review
- Every completed phase is automatically committed and pushed to the remote repository

### 1.5 Non-goals

- Order execution or brokerage integration
- Paid subscription tiers or billing
- Mobile app (responsive web only)
- Coverage of non-IDX markets

---

## 2. Development phase order

Phases are sequenced to make the project demoable as fast as possible. The screener works publicly without any auth. Auth and user-specific features are added last.

| Phase | Name | Public demo after? |
|---|---|---|
| 1 | Data layer — scraper + database | No (data only) |
| 2 | Screener engine + indicator API | Yes — API demoable via curl |
| 3 | React frontend — screener + stock detail | **Yes — fully visual, shareable URL** |
| 4 | Watchlist, alerts, and Telegram bot | Yes — with auth stub |
| 5 | Polish and deployment | Yes — live on Railway |
| 6 | Authentication (JWT + refresh tokens) | Yes — full product |

> After each phase the AI agent runs `git add -A && git commit -m "phase(N): <description>" && git push`. See AGENT.md for the exact commit convention.

---

## 3. User stories

### Screener (Phase 2–3, no auth required)

- As a visitor, I can open the screener and see all IDX stocks in a paginated, sortable table.
- As a visitor, I can add one or more filter rules from the following dimensions:
  - **Technical:** RSI-14 above/below threshold, 20/50 MA crossover (bullish/bearish), MACD signal line cross, volume surge (> N× 20-day average), price % change over 1d / 5d / 20d.
  - **Fundamental:** P/E ratio range, P/BV ratio range, ROE ≥ threshold, DER ≤ threshold, market cap tier (small < 1T IDR, mid 1–10T, large > 10T), sector filter.
- As a visitor, filter results update within 2 seconds of applying a rule change.
- As a visitor, I can sort results by any visible column (ticker, price, RSI, P/E, market cap, etc.).
- As a visitor, I can click any stock row to open its detail page.

### Stock detail (Phase 3, no auth required)

- As a visitor, I can view a candlestick chart with adjustable timeframe (1W, 1M, 3M, 6M, 1Y).
- As a visitor, I can toggle technical overlays: 20 MA, 50 MA, Bollinger Bands.
- As a visitor, I can see a fundamental summary panel: P/E, P/BV, ROE, DER, EPS, market cap, sector.

### Watchlist (Phase 4, auth stub → full auth in Phase 6)

- As a user, I can view all stocks I have added to my watchlist with their latest price and 1-day change.
- As a user, I can remove a stock from my watchlist.
- As a user, watchlist prices update in real time via WebSocket during market hours.

### Alerts (Phase 4, auth stub → full auth in Phase 6)

- As a user, I can create an alert for any stock with the following rule types:
  - Price above / below a value
  - RSI-14 above / below a value
  - 20/50 MA bullish or bearish crossover
  - P/E ratio above / below a value
  - ROE above a value
- As a user, I can see all my active alerts in a list showing ticker, rule, and last-checked time.
- As a user, I can toggle (pause/resume) or delete any alert.
- As a user, when an alert fires, I receive a Telegram message with: ticker, rule description, current value, and a link to the stock detail page.
- As a user, an alert fires at most once every 4 hours for the same rule to prevent spam.

### Telegram bot (Phase 4)

- As a user, I can link my Telegram account by running `/start <token>` in the bot, where the token is generated in my profile settings.
- As a linked user, I receive alert messages automatically.
- As a user, I can run `/alerts` in the bot to see a summary of my active alerts.
- As a user, I can run `/unlink` to disconnect my Telegram account.

### Authentication (Phase 6 — lowest priority)

- As a visitor, I can register with email and password so that I have a personal account.
- As a registered user, I can log in and receive a JWT access token and a refresh token.
- As a logged-in user, my session persists across page refreshes via silent token refresh.
- As a logged-in user, I can log out and have my refresh token invalidated.

---

## 4. Functional requirements

### 4.1 Data ingestion

| ID | Requirement |
|---|---|
| DR-01 | The system fetches OHLCV candle data for all tracked IDX tickers from Yahoo Finance (suffix `.JK`). |
| DR-02 | Candle data is fetched on a 15-minute interval, Monday–Friday, 09:00–16:30 WIB only. |
| DR-03 | Fundamental data (P/E, P/BV, ROE, DER, EPS, market cap) is fetched once daily at 18:00 WIB. |
| DR-04 | The scraper retries failed tickers up to 3 times with exponential backoff before logging and skipping. |
| DR-05 | All raw candles are stored in PostgreSQL. Duplicate inserts are ignored via `ON CONFLICT DO NOTHING`. |
| DR-06 | The latest price for each ticker is cached in Redis with a 15-minute TTL. |

### 4.2 Indicator calculation

| ID | Requirement |
|---|---|
| IC-01 | RSI-14 is calculated server-side using the Wilder smoothing method on the last 100 closes. |
| IC-02 | Simple Moving Averages (20-day, 50-day) are computed from stored candle closes. |
| IC-03 | MACD is computed as EMA-12 minus EMA-26, with a 9-period signal line. |
| IC-04 | Bollinger Bands use a 20-period SMA with 2 standard deviations. |
| IC-05 | Volume surge is flagged when current volume exceeds 2× the 20-day average volume. |
| IC-06 | Indicator values are computed on-demand for the screener and cached in Redis for 15 minutes per ticker. |

### 4.3 Screener

| ID | Requirement |
|---|---|
| SC-01 | The screener endpoint accepts an array of filter rules and returns stocks matching ALL rules (AND logic). |
| SC-02 | Results are sortable by ticker, price, RSI, P/E, market cap, volume. |
| SC-03 | Results are paginated: default 50 per page, max 200. |
| SC-04 | The screener endpoint requires no authentication. |
| SC-05 | Screener p95 response time ≤ 2 000 ms for up to 800 tickers. |

### 4.4 Alert evaluation

| ID | Requirement |
|---|---|
| AL-01 | After each scrape cycle, the alert evaluator worker checks all active alerts against the latest indicators. |
| AL-02 | If a condition is met and `lastFired` is null or > 4 hours ago, a Telegram job is enqueued in BullMQ. |
| AL-03 | The `lastFired` timestamp is updated atomically when the job is enqueued. |
| AL-04 | Failed Telegram deliveries are retried up to 3 times with exponential backoff. |
| AL-05 | Fundamental alerts (P/E, ROE) are evaluated once per day after the daily fundamental fetch. |

### 4.5 Real-time feed

| ID | Requirement |
|---|---|
| RT-01 | The API exposes a WebSocket endpoint at `/ws/prices`. |
| RT-02 | On connection, the server sends a snapshot of the latest prices for all tickers in the user's watchlist. |
| RT-03 | During market hours, price updates are broadcast every 30 seconds. |
| RT-04 | Outside market hours, the WebSocket connection stays open but no updates are broadcast. |

### 4.6 Authentication (Phase 6)

| ID | Requirement |
|---|---|
| AU-01 | Passwords are hashed with `bcrypt` (cost factor 12) before storage. |
| AU-02 | Access tokens are JWT, signed with HS256, with a 15-minute expiry. |
| AU-03 | Refresh tokens are opaque random strings (32 bytes), stored hashed in PostgreSQL, with a 7-day expiry. |
| AU-04 | The frontend silently refreshes access tokens 60 seconds before expiry. |
| AU-05 | Refresh token rotation: each use issues a new refresh token and invalidates the old one. |

---

## 5. Pages and routes

### Frontend pages

| Route | Page | Auth required | Phase |
|---|---|---|---|
| `/` | Screener | No | 3 |
| `/stock/:ticker` | Stock detail + chart | No | 3 |
| `/watchlist` | Personal watchlist | Auth stub → full in Phase 6 | 4 |
| `/alerts` | Alert management | Auth stub → full in Phase 6 | 4 |
| `/settings` | Profile + Telegram link | Auth stub → full in Phase 6 | 4 |
| `/login` | Login form | No | 6 |
| `/register` | Registration form | No | 6 |

### API routes

| Method | Path | Auth | Phase |
|---|---|---|---|
| `GET` | `/stocks` | No | 2 |
| `GET` | `/stocks/:ticker` | No | 2 |
| `GET` | `/stocks/:ticker/candles` | No | 2 |
| `GET` | `/screener` | No | 2 |
| `GET` | `/watchlist` | Stub → JWT | 4 |
| `POST` | `/watchlist/:ticker` | Stub → JWT | 4 |
| `DELETE` | `/watchlist/:ticker` | Stub → JWT | 4 |
| `GET` | `/alerts` | Stub → JWT | 4 |
| `POST` | `/alerts` | Stub → JWT | 4 |
| `PATCH` | `/alerts/:id` | Stub → JWT | 4 |
| `DELETE` | `/alerts/:id` | Stub → JWT | 4 |
| `POST` | `/settings/telegram-token` | Stub → JWT | 4 |
| `WS` | `/ws/prices` | No auth → JWT in Phase 6 | 4 |
| `POST` | `/auth/register` | No | 6 |
| `POST` | `/auth/login` | No | 6 |
| `POST` | `/auth/refresh` | No | 6 |
| `POST` | `/auth/logout` | JWT | 6 |

> **Auth stub (Phases 4–5):** watchlist and alert routes use a hardcoded `X-User-Id` header for development. The header is replaced by proper JWT verification in Phase 6.

---

## 6. Data model summary

See AGENT.md for the full annotated Prisma schema.

**Core entities:** `User`, `Stock`, `Candle`, `Fundamental`, `Watchlist`, `Alert`

**Key constraints:**
- `Candle` has a unique index on `(ticker, timestamp)` — prevents duplicate scrape inserts
- `Watchlist` has a unique index on `(userId, ticker)` — one entry per user per stock
- `Alert.lastFired` is null until first trigger; cooldown check uses `Date.now() - lastFired > 4h`

---

## 7. Auto-commit convention

The AI agent commits and pushes at the end of every phase using the following format:

```
phase(N): <short description of what was completed>

- <bullet summarising key files added or changed>
- <bullet summarising acceptance criteria met>
```

Examples:
- `phase(1): data layer — scraper, migrations, seed`
- `phase(2): screener engine, indicator functions, REST API`
- `phase(3): react frontend — screener page, stock detail, candle chart`

---

## 8. Out of scope (v1)

- Real-time WebSocket price streaming from a market data vendor (we use 15-min scrape + 30s broadcast)
- Historical backtesting of alert rules
- Email notification delivery
- Social features (public watchlists, shared screens)
- iOS / Android app

---

## 9. Success metrics

| Metric | Target |
|---|---|
| Demo uptime | Live demo accessible during portfolio review |
| Screener latency | p95 < 2 s for full filter pass on all IDX tickers |
| Time to first visual demo | After Phase 3 is committed and pushed |
| Alert delivery | Alert fires within one 15-min scrape cycle of condition being met |
| Test coverage | ≥ 80% line coverage on the indicator calculation package |