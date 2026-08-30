# Milestone 01 — Backend foundation

**Status:** Complete
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
- [x] Production Railway environment; staging intentionally omitted at current scale
- [x] Railway service connected to GitHub with root directory `/backend`
- [x] GitHub watch path, detected Node build, package start, and `/health` configured
- [x] Move migration execution from start to Railway pre-deploy
- [x] Generated Railway domain (`needlepoint-api-production.up.railway.app`)
- [x] Non-secret Railway variables and private PostgreSQL reference added
- [x] Add `api.needlepointmaker.com`
- [x] Daily automated PostgreSQL backups enabled
- [x] Production liveness and database-readiness smoke tests
- [x] Production-only deployment strategy documented; no staging smoke test required

## Acceptance criteria

- `npm run check` succeeds from `/backend`.
- `/health/live` returns `200` when the process is running.
- `/health` returns `200` only when PostgreSQL is reachable and `503` otherwise.
- The server listens on Railway's injected `PORT` and on `0.0.0.0`.
- Startup fails with a useful message when required configuration is missing.
- Database migrations are idempotent and run before a new deployment goes live.
- No uploaded image, filename, or grid data is accepted or stored.

## Environment decision

Needlepoint Maker will use a single production Railway environment for now.
The small team and low deployment frequency do not justify the cost and
operational overhead of duplicated preview or staging services. Every release
must continue to pass local checks before `main` is pushed, followed by a
production health smoke test. A staging environment can be reconsidered if the
backend begins handling paid entitlements or higher-risk data migrations.

## Railway handoff

See [railway-setup.md](railway-setup.md) after the local verification tasks are
complete. Railway's newer Infrastructure as Code can be adopted after the first
service is proven; deprecated `railway.toml` configuration is intentionally not
introduced for this new service.

The first deployment was uploaded directly from `/backend`. After the GitHub
source was connected, migrations moved to Railway's `npm run db:migrate`
pre-deploy command and the runtime start command became `npm run start`.
