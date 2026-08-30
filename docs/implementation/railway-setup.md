# Railway setup runbook

This runbook covers the external Railway steps for Milestone 01. It is kept
separate because these actions require the project owner's Railway account.

## Project and services

- [x] Create a Railway project named `needlepoint-maker`.
- [x] Add a PostgreSQL service.
- [x] Add an empty service named `needlepoint-api`.
- [ ] Connect this GitHub repo after the Phase 1 changes are committed.
- [ ] Set the service root directory to `/backend`.
- [ ] Limit watch paths to `/backend/**` and the lockfile used by the backend.
- [ ] Use Railway's detected Node build, or explicitly set build to `npm run build`.
- [ ] Set the pre-deploy command to `npm run db:migrate`.
- [ ] Set the start command to `npm run start`.
- [ ] Set the healthcheck path to `/health`.

## Variables

Reference PostgreSQL's private `DATABASE_URL`, then add:

```text
NODE_ENV=production
APP_ORIGINS=https://needlepointmaker.com
DATA_RETENTION_DAYS=365
REPORT_TOKEN=<at-least-32-random-characters>
LOG_LEVEL=info
```

Stripe variables are added only in Milestone 08. Seal all sensitive variables
after entering them.

`REPORT_TOKEN` enables `GET /v1/reports/summary`. Keep it sealed and send it
only as a Bearer token. Without the variable, the report route is not
registered.

## Environments and networking

- [ ] Create a staging environment before production analytics work.
- [x] Generate a Railway domain and run the production smoke tests.
- [ ] Add `api.needlepointmaker.com` after staging is stable.
- [ ] Update `APP_ORIGINS` only with explicit production and local origins.
- [ ] Enable automated PostgreSQL backups.
- [x] Run retention cleanup in the API process at startup and once daily.

## Smoke tests

```text
GET /health/live -> 200 and {"status":"ok"}
GET /health      -> 200 and {"status":"ready"}
Unknown route    -> 404 JSON response
Disallowed CORS origin -> no access-control allow-origin header
```

After Milestone 02 deploys, also verify that valid event, intent, and feedback
requests return `202`, invalid properties return `400`, and the report endpoint
returns `401` without its Bearer token.

## Direct-upload safeguard

Until the GitHub source and service root are configured, run direct uploads
from the repository root with an explicit archive root:

```text
railway up ./backend --path-as-root --service needlepoint-api
```

Running `railway up` from `/backend` without that explicit path can still use
the repository-level Railway link and package the static frontend instead.
