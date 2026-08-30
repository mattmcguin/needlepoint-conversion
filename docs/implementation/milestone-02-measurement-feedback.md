# Milestone 02 — Measurement, intent, and feedback

**Status:** In progress
**Estimated effort:** 4–7 development days

## Objective

Measure whether visitors successfully create stitchable projects, learn which
improvements they value, and collect actionable feedback without uploading
their photos.

## Backend work

- [x] `POST /v1/events/batch` with a strict event and property allow-list
- [x] `POST /v1/intent` for one-click feature interest
- [x] `POST /v1/feedback` with optional email and follow-up consent
- [x] Rate limits, request-size limits, and spam-resistant validation
- [x] Protected aggregate summary endpoint or repeatable reporting queries
- [x] Retention cleanup for expired analytics data

## Frontend work

- [x] Anonymous visitor UUID and 30-minute session UUID
- [x] Batched event delivery with unload-safe `sendBeacon`
- [x] Post-conversion feature-intent prompt
- [x] Post-export “ready to stitch?” outcome prompt
- [x] Persistent sidebar feedback entry point
- [x] Optional contact permission separated from feedback submission
- [x] Analytics opt-out and concise privacy explanation

## Release work

- [x] Deploy migration `0001_violet_moonstone.sql` and the API routes to Railway
- [ ] Add a sealed 32+ character `REPORT_TOKEN` Railway variable
- [ ] Schedule `npm run data:cleanup` at least monthly
- [ ] Release `analytics.js` and the frontend prompt changes
- [x] Run production readiness, event acceptance, CORS, and rejected-property smoke tests
- [ ] Run production intent, feedback, opt-out, and aggregate-report smoke tests after the frontend release
- [ ] Confirm the first 24 hours contain no filenames, photo data, or unexpected properties

The initial API deployment `93cde601-cde2-46da-87d9-48ffa8a1f095` completed on
August 29, 2026, followed by unload-safe delivery deployment
`e058ba74-acfb-464b-a784-7652789cd7c4`. Its startup
migration succeeded, `/health` returned ready, a synthetic allow-listed event
returned `202`, and an event containing a filename returned `400` before
storage.

## Event funnel

`image_selected` → `conversion_started` → `conversion_completed` →
`export_clicked` or `progress_marked` → intent response / feedback submission

## Acceptance criteria

- No filenames, photo data, grid contents, free-form URLs, or raw IP addresses
  appear in analytics records.
- Failed analytics requests never block conversion, editing, or exports.
- Every prompt can be dismissed and does not reappear during the same project.
- Funnel and intent totals can be reviewed without reading raw personal data.
