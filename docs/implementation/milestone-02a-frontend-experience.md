# Milestone 02A — Frontend experience

**Status:** In progress
**Estimated effort:** 4–6 development days after the measurement baseline

## Objective

Make the converter easier to understand and more pleasant to use across desktop
and mobile, using the funnel, intent responses, and written feedback from
Milestone 02 to prioritize the highest-impact problems.

## Entry checkpoint

Begin implementation after the Milestone 02 funnel is live and either two weeks
of representative traffic or at least 100 completed conversions have been
observed. Written feedback can accelerate a clearly supported improvement, but
the redesign should not delay obvious accessibility fixes.

**Decision:** Local implementation began on August 29, 2026 while Milestone 02
continues monitoring production traffic. The redesign will retain the existing
event funnel so the release can be evaluated against the established baseline.

## Discovery and design

- [ ] Review conversion drop-off, export usage, device mix, intent, and feedback
- [x] Test the current first-run, editing, progress, and export flows on desktop and mobile
- [x] Define the smallest revised information architecture that addresses observed friction
- [x] Preserve familiar project data and behavior while changing presentation
- [x] Create a before/after verification checklist for the core user journeys

## Selected direction

The production redesign will use the **Guided Studio** concept (Option A). It
prioritizes a calm, step-by-step first conversion while keeping projects and
progress available for returning users.

Visual direction:

- Forest green remains the structural/navigation color.
- Leather brown (`#76553f`) replaces the original coral accent on calls to
  action, progress, emphasis, and focus moments.
- Soft tan (`#e5d2bb`) supports selected steps, upload cues, and quiet surfaces.
- Warm ivory surfaces and dark green text preserve the handmade, approachable
  character of the concept.
- Modes and states must continue to use labels, shape, and placement—not color
  alone.

The local reference prototype lives at
`design-options/option-a.html`. Options B and C remain reference material for
future advanced editing and project-journal features, but are not the selected
production direction.

## Implementation

- [x] Clarify the first-run path from photo selection through pattern creation
- [x] Improve hierarchy, instructional copy, empty states, and privacy reassurance
- [x] Make progress tracking and pattern editing visually distinct and understandable
- [x] Group display controls and exports around the jobs users are trying to complete
- [x] Give the pattern canvas full workspace width and add a fit-to-width overview
- [x] Improve sidebar project navigation and the returning-user experience
- [ ] Improve touch targets, responsive layout, keyboard navigation, and focus states
- [ ] Integrate intent, feedback, privacy, and support surfaces without interrupting creation
- [ ] Establish a cohesive visual system for type, color, spacing, controls, and states

## Core journey verification

Use this checklist before each production release of the redesign:

- [x] Empty state explains the next action and photo privacy on desktop and phone.
- [x] Selecting a real image reveals compatible size, mesh, dimensions, and color controls.
- [x] Conversion creates a pattern without changing the existing browser-only data model.
- [x] An existing locally saved project opens with its original grid and settings.
- [x] Progress mode marks a stitch, persists it, and updates the visible summary.
- [x] Edit-colors mode exposes the palette control without being confused with progress mode.
- [x] Canvas display controls, thread legend, edit setup, and export controls remain reachable.
- [x] A 72 × 72 pattern uses the full desktop workspace and can fit within a phone viewport.
- [x] Feedback and privacy dialogs remain available without interrupting creation.
- [x] The create and pattern views have no page-level horizontal overflow at 390px.
- [ ] Verify all four downloaded file types after the final release build.
- [ ] Complete a keyboard-only pass through creation, editing, dialogs, and exports.

## Acceptance criteria

- A first-time visitor can create a pattern without needing external instructions.
- Progress and edit modes are distinguishable by labels, controls, and state—not color alone.
- The full create, edit, track, save, and export journeys work at phone and desktop widths.
- Existing locally saved projects open without data loss or unexpected changes.
- Keyboard focus is visible, controls have accessible names, and touch targets are usable.
- The release has no regression in completed conversions or exports after a representative sample.

## Relationship to SEO

This milestone precedes the homepage and content expansion in Milestone 03 so
that search visitors land on a product experience that is clear, trustworthy,
and aligned with the language users actually use in their feedback.
