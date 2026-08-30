# Milestone 04 — Core product improvements

**Status:** Not started
**Estimated effort:** 5–8 development days

## Objective

Improve the current free product's usefulness and resilience while preparing
the code for PDF, thread-catalog, and cleanup features.

## Deliverables

- [ ] Add 10, 13, and 14 mesh options alongside 12 and 18
- [ ] Centralize mesh and dimension calculations
- [ ] Show completion percentage and stitches remaining
- [ ] Show completed and remaining stitches per color
- [ ] Allow project renaming
- [ ] Add versioned local-storage migrations
- [ ] Export and import a portable `.needlepoint.json` project backup
- [ ] Update only affected grid cells rather than rerendering the entire grid
- [ ] Define a stable project data model shared by later exports
- [ ] Add automated tests for dimensions, persistence, and project migration
- [ ] Publish or update mesh-related SEO content with the release

## Acceptance criteria

- Existing browser projects migrate without loss.
- Backup files round-trip into an equivalent editable project.
- Progress totals remain correct after painting, undo, editing settings, and reload.
- Physical dimensions are correct for every supported mesh size.
