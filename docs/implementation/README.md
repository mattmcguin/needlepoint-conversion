# Needlepoint Maker implementation roadmap

This directory is the source of truth for the product, backend, measurement,
monetization, and SEO work planned for Needlepoint Maker.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete
- `[!]` Blocked or awaiting an external decision

## Milestones

| Milestone | Status | Outcome |
| --- | --- | --- |
| [01 — Backend foundation](milestone-01-backend-foundation.md) | Complete | Railway-ready API, PostgreSQL schema, health checks, backups, and deployment runbook |
| [02 — Measurement and feedback](milestone-02-measurement-feedback.md) | Monitoring in parallel | Privacy-conscious events, intent prompts, feedback, and reporting |
| [02A — Frontend experience](milestone-02a-frontend-experience.md) | In progress | Guided Studio redesign of onboarding, pattern editing, progress, exports, and mobile use |
| [03 — SEO foundation](milestone-03-seo-foundation.md) | Not started | Search baseline, improved homepage, indexable page structure, and technical SEO |
| [04 — Core product improvements](milestone-04-core-product.md) | Not started | More mesh sizes, better progress, project resilience, and reusable app internals |
| [05 — Printable PDF](milestone-05-printable-pdf.md) | Not started | A stitch-ready, paginated PDF pattern and matching landing content |
| [06 — Real thread matching](milestone-06-thread-matching.md) | Not started | Purchasable thread colors, quantities, palette controls, and matching guide |
| [07 — Pattern cleanup](milestone-07-pattern-cleanup.md) | Not started | Previewable, undoable confetti cleanup and photo-preparation guidance |
| [08 — Stripe support](milestone-08-stripe-support.md) | Not started | Optional support Payment Link with click and payment attribution |

## Release principles

1. Photo pixels and filenames remain in the browser unless a future feature
   explicitly asks the user to upload them.
2. Existing free features are not removed to manufacture a paid tier.
3. Instrument outcomes before committing to expensive features such as cloud
   sync or physical fulfillment.
4. New search pages must contain original, useful material and a natural path
   into the product; no thin keyword pages.
5. Every production change includes an observable success metric and a rollback
   path.

## Cross-cutting success metrics

- Image selection to successful conversion rate
- Conversion to export or progress-tracking rate
- Seven-day and 30-day return rate
- Feature-intent distribution and feedback sentiment
- Organic impressions, clicks, click-through rate, and activated users
- Support-link click-through and completed-payment rate
