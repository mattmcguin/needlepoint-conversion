# Milestone 07 — Pattern cleanup

**Status:** Not started
**Estimated effort:** 5–8 development days

## Objective

Help users turn noisy photo conversions into more stitchable canvases without
silently changing their work.

## Deliverables

- [ ] Detect isolated and low-support “confetti” stitches
- [ ] Rank plausible neighboring replacement colors
- [ ] Preview every proposed change before applying it
- [ ] Apply all accepted changes as one undoable action
- [ ] Show before/after stitch and color counts
- [ ] Measure preview, acceptance, undo, and feedback rates
- [ ] Publish photo-preparation and cleanup guidance

## Acceptance criteria

- No cleanup change is applied without explicit confirmation.
- The entire cleanup operation can be undone and redone safely.
- Cleanup never introduces a color absent from the selected palette.
- Users can inspect changed locations before accepting.
