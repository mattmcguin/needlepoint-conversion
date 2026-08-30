# Milestone 01 — Backend foundation

**Status:** In progress
**Estimated effort:** 2–3 development days plus Railway account setup

## Objective

Create a small, production-shaped API that Railway can build from `/backend`,
connect to Railway PostgreSQL, and safely extend with analytics, feedback, and
Stripe webhooks.

## Deliverables

- [x] Isolated Node.js/TypeScript backend package
- [x] Environment validation and explicit origin allow-list
- [x] Liveness and database-readiness endpoints
- [x] Initial PostgreSQL schema for events, intent, feedback, and Stripe events
- [x] Repeatable database migration command
- [x] Graceful shutdown and structured request logging
- [x] Automated health and configuration tests
- [x] Railway project with API and PostgreSQL services
- [ ] Staging and production Railway environments
- [ ] Railway service root directory set to `/backend`
- [ ] Build, pre-deploy migration, start, and `/health` settings configured
- [x] Generated Railway domain (`needlepoint-api-production.up.railway.app`)
- [x] Non-secret Railway variables and private PostgreSQL reference added
- [ ] Add `api.needlepointmaker.com`
- [ ] Automated PostgreSQL backups enabled
- [x] Production liveness and database-readiness smoke tests
- [ ] Staging smoke test against the public Railway endpoint

## Acceptance criteria

- `npm run check` succeeds from `/backend`.
- `/health/live` returns `200` when the process is running.
- `/health` returns `200` only when PostgreSQL is reachable and `503` otherwise.
- The server listens on Railway's injected `PORT` and on `0.0.0.0`.
- Startup fails with a useful message when required configuration is missing.
- Database migrations are idempotent and run before a new deployment goes live.
- No uploaded image, filename, or grid data is accepted or stored.

## Railway handoff

See [railway-setup.md](railway-setup.md) after the local verification tasks are
complete. Railway's newer Infrastructure as Code can be adopted after the first
service is proven; deprecated `railway.toml` configuration is intentionally not
introduced for this new service.

The first deployment was uploaded directly from `/backend`. The production
start command also applies migrations as a safety measure. Once the GitHub
source is connected, configure Railway's pre-deploy command and then migration
can be removed from the start path if desired.
