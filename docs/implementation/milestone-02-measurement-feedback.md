# Milestone 02 — Measurement, intent, and feedback

**Status:** Complete — monitoring continues
**Estimated effort:** 4–7 development days

**Baseline collection started:** August 29, 2026

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
- [x] Add a 64-character random `REPORT_TOKEN` Railway variable without exposing it in logs
- [x] Run retention cleanup at API startup and once daily
- [x] Release `analytics.js` and the frontend prompt changes
- [x] Run production readiness, event acceptance, CORS, and rejected-property smoke tests
- [x] Run the live page-view, conversion, export, prompt-rendering, privacy-control, and aggregate-report smoke tests
- [x] Confirm prompt delivery and a feedback submission from normal production traffic
- [x] Confirm the event schema rejects filenames, photo data, and unexpected properties before storage

The initial API deployment `93cde601-cde2-46da-87d9-48ffa8a1f095` completed on
August 29, 2026, followed by unload-safe delivery deployment
`e058ba74-acfb-464b-a784-7652789cd7c4`. Its startup
migration succeeded, `/health` returned ready, a synthetic allow-listed event
returned `202`, and an event containing a filename returned `400` before
storage. The GitHub-triggered deployment `8dc153dd-defb-434e-bbee-26e806c01e00`
then moved the client to `api.needlepointmaker.com` and enabled daily retention
cleanup. A live browser conversion and export subsequently reached the API with
`202` responses and no browser errors.

The protected 30-day aggregate report returned `200` with the expected live
funnel events and returned `401` without its Bearer token. The August 29 release
review contained 14 page views, 6 image selections, 6 conversion starts, 6
completed conversions, 5 exports, 12 project opens, 2 progress marks, 6 intent
prompt views, 2 outcome prompt views, 3 feedback opens, and 1 positive general
feedback response. No organic intent selection had arrived yet, so intent
distribution remains an ongoing monitoring item rather than a release blocker.

Railway did not expose a public database connection and the owner account did
not have a registered Railway SSH key, so the review could not run an additional
ad hoc raw-row query. Privacy enforcement was instead verified at the storage
boundary: the API has a strict property allow-list, its rejected-property tests
pass, and a live event containing a filename returned `400` before storage.

## Baseline review checkpoint

Review the first data-quality sample after 24 hours. Begin Milestone 02A after
either two weeks of representative traffic or 100 completed conversions,
whichever comes first, unless written feedback identifies an urgent
accessibility or usability issue sooner.

Implementation of Milestone 02A began with the owner's approval while this
baseline continues collecting. Measurement remains live and will be used to
validate and refine the redesign rather than blocking local implementation.

## Event funnel

`image_selected` → `conversion_started` → `conversion_completed` →
`export_clicked` or `progress_marked` → intent response / feedback submission

## Acceptance criteria

- No filenames, photo data, grid contents, free-form URLs, or raw IP addresses
  appear in analytics records.
- Failed analytics requests never block conversion, editing, or exports.
- Every prompt can be dismissed and does not reappear during the same project.
- Funnel and intent totals can be reviewed without reading raw personal data.
