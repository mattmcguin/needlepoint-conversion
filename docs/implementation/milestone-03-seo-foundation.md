# Milestone 03 — SEO foundation

**Status:** Implementation complete — webmaster verification pending
**Estimated effort:** 5–8 development days, followed by ongoing content work

## Objective

Turn the single-page product into a small collection of useful search entry
points and connect organic acquisition to actual project activation.

## Baseline and technical work

- [!] Verify Google Search Console and Bing Webmaster Tools (owner account access required)
- [!] Export current query, page, device, country, click, impression, and CTR data (owner account access required)
- [!] Record current index coverage and Core Web Vitals (owner account access required)
- [x] Track landing page, approved UTM values, and referrer domain in events
- [x] Report converted and exported sessions by first landing page
- [x] Add unique titles, descriptions, canonicals, and social metadata per page
- [x] Generate the XML sitemap and accurate `lastmod` values
- [x] Add semantic navigation, footer, breadcrumbs, and a useful 404 page
- [x] Update and validate `WebSite` and `WebApplication` structured data
- [x] Remove the obsolete meta-keywords tag

## Initial content package

- [x] Rewrite homepage around “photo to needlepoint pattern” intent
- [x] Publish a needlepoint mesh calculator
- [x] Publish a guide to turning a photo into needlepoint
- [x] Publish a guide to choosing mesh size
- [x] Publish a guide to preparing photos for stitchability
- [x] Publish one permission-cleared, end-to-end example project
- [x] Add About, Privacy, Feedback, and Support pages

## Release notes

The August 29, 2026 implementation expands the site from one indexable product
page to ten purposeful pages. Every new page has a unique title, description,
canonical, social preview, one clear H1, semantic navigation, and a natural path
into the converter. Prototype design pages are explicitly marked `noindex`.

The protected product summary now attributes sessions, completed conversions,
and exported sessions to the first landing page in each anonymous session. This
connects search entry pages to product activation without collecting search
queries or photo data.

Account-only setup and the baseline export are tracked in
[`search-console-baseline.md`](search-console-baseline.md).

## Acceptance criteria

- Every indexable page has one clear purpose and useful original content.
- Guide and feature pages include a natural path into the converter.
- Search traffic can be segmented by landing page through conversion and export.
- No mass-produced, near-duplicate, or keyword-stuffed pages are published.
