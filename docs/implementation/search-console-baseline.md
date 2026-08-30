# Search measurement baseline

**Status:** Awaiting owner account setup
**Requested on:** August 29, 2026

## Public baseline

- The production homepage is discoverable in Google with the former title,
  “Free Needlepoint Pattern Converter | Photo to Cross Stitch Pattern Maker.”
- The search result was still showing the pre-redesign page headings at the
  start of Milestone 03. Recrawling is expected after the new sitemap is
  submitted.
- No Google Search Console or Bing verification file or meta tag is present in
  the repository.

Public search results do not expose reliable click, impression, CTR, country,
device, index-coverage, or Core Web Vitals totals. Those values must come from
the verified webmaster accounts.

## Google Search Console owner checklist

- [ ] Add `needlepointmaker.com` as a Domain property.
- [ ] Add the provided DNS TXT verification record at the domain host. Do not
  commit the verification token or account credentials to this repository.
- [ ] Submit `https://needlepointmaker.com/sitemap.xml`.
- [ ] Inspect the homepage, calculator, three guides, and example URL; request
  indexing after the production release is live.
- [ ] Export the last 16 months, or all available history, by query, page,
  device, and country with clicks, impressions, CTR, and average position.
- [ ] Record Page indexing, HTTPS, and Core Web Vitals summary counts.

## Bing Webmaster Tools owner checklist

- [ ] Import the verified site from Google Search Console or add and verify it
  directly.
- [ ] Submit `https://needlepointmaker.com/sitemap.xml`.
- [ ] Record the indexed-page total and export available keyword and page data.

## Baseline snapshot template

| Metric | Google | Bing | Date |
| --- | ---: | ---: | --- |
| Indexed pages | — | — | — |
| Valid Core Web Vitals URLs | — | n/a | — |
| 28-day impressions | — | — | — |
| 28-day clicks | — | — | — |
| 28-day CTR | — | — | — |
| Top non-brand query | — | — | — |
| Top organic landing page | — | — | — |

Attach exported CSV files outside the public repository if they contain query
or geographic data that should not be published.
