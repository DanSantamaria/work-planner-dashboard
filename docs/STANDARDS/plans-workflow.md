---
description: Trigger - when starting, updating, or finishing a plan in docs/plans/
---

# Plans Workflow

`docs/plans/` is where feature specs live before/while they're being built. It exists so nothing gets implemented without a written-down, approved plan first.

## States

- **pending** (`docs/plans/pending/*.md`) — written, may or may not be approved yet, not fully implemented.
- **in-progress** — a pending plan actively being implemented (still lives in `pending/`; no separate folder — track progress with the plan's own checklist and TodoWrite during the session).
- **done / archived** (`docs/plans/_archive/*.md`) — fully implemented **and** verified working.

## The one rule

A plan only moves from `pending/` to `_archive/` once it is fully implemented **and** verified (manually tested, or confirmed by Daniel). Never archive a plan just because the code was written — verify first.

## Sync checklist (run after finishing a task)

- [ ] Does the plan's "Self-check before considering this done" list all pass?
- [ ] Has it been manually tested per the plan's "How to test" section?
- [ ] Have any of the numbered reference docs (`docs/01-architecture.md` etc.) changed as a result? Update them if so.
- [ ] Move the plan file from `docs/plans/pending/` to `docs/plans/_archive/`.
- [ ] Confirm no other pending plan referenced/depended on this one needing an update.

## Naming convention

`lowercase-with-hyphens.md`, optionally date-prefixed for ordering: `YYYY-MM-DD-short-description.md` (e.g. `2026-07-28-recepcion-badge.md`). Date prefix is optional — use it when the order plans were written in matters (e.g. dependent phases).

New plans start from `docs/plans/pending/_TEMPLATE.md`.
