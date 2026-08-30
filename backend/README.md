# Needlepoint Maker API

Small Railway-hosted API for anonymous product analytics, intent, feedback, and
Stripe webhook attribution. Photo processing and project data remain in the
browser in the initial implementation.

## Local setup

1. Use Node.js 20.19 or newer.
2. Copy `.env.example` to `.env` and provide a PostgreSQL `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. Build with `npm run build`.
5. Apply migrations with `npm run db:migrate`.
6. Start development mode with `npm run dev`.

The production `npm start` command applies pending migrations before starting
the compiled server. Railway can later move migration execution to a dedicated
pre-deploy command once GitHub deployments are connected.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the TypeScript server in watch mode |
| `npm run typecheck` | Type-check source, tests, and tool configuration |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm run test` | Run unit and route tests |
| `npm run check` | Build and test |
| `npm run db:generate` | Generate migrations from the Drizzle schema |
| `npm run db:migrate` | Apply generated migrations |
| `npm run data:cleanup` | Manually delete product research data older than `DATA_RETENTION_DAYS` |

## Health endpoints

- `GET /health/live` checks process liveness.
- `GET /health` checks PostgreSQL readiness and is the Railway healthcheck.

## Product measurement endpoints

- `POST /v1/events/batch` accepts up to 20 strictly allow-listed anonymous events.
- `POST /v1/intent` records one-click feature interest.
- `POST /v1/feedback` records explicit feedback and separately granted follow-up consent.
- `GET /v1/reports/summary?days=30` returns aggregate counts when `REPORT_TOKEN` is configured and supplied as a Bearer token.

The API rejects unknown fields, including filenames, photo data, full URLs, and
pattern contents. Event IDs are unique so retried batches do not double-count.
Expired product-research data is cleaned at process startup and once daily;
`npm run data:cleanup` remains available for manual operations.

## Telegram notifications

Set both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to receive private alerts
for major product signals: first-time and updated conversions, exports, stitch
progress, written feedback, feature-question answers, and readiness answers.
Each alert includes a short anonymous visitor code and whether that browser
has converted, exported, or used stitch tracking before. Telegram delivery is
best-effort and never changes the response returned to a visitor. Notification
messages exclude submitted email addresses.

Deployment steps are tracked in
[`docs/implementation/railway-setup.md`](../docs/implementation/railway-setup.md).
