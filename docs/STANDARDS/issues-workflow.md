---
description: Trigger - when starting, committing, or merging feature work
---

# Issues / Branch Workflow

## Branch naming

Off of `dev`, name feature branches:

- `feat/<short-description>` — new functionality
- `fix/<short-description>` — bug fix
- `improve/<short-description>` — refactor/improvement to existing functionality

Examples: `feat/recepcion-badge`, `fix/semana-dropdown-clip`, `improve/prisma-query-perf`.

## Rules

- Never commit directly to `main` — `main` only updates via a tested merge from `dev`.
- Never commit directly to `dev` once there is feature work in progress — branch off `dev` for each feature/fix.
- Small, self-contained fixes may be committed straight to `dev` if there's no active feature-branch work in flight and the change is trivial — when in doubt, branch.

## Flow

```
main ──────────────────────────────●───────────────▶  (production)
                                    ▲
                                    │ merge (tested & confirmed)
dev  ───●───────●───────●──────────●───────────────▶
        ▲       ▲       ▲
        │merge  │merge  │merge (PR into dev)
        │       │       │
feat/x ─●       │       │
fix/y ──────────●       │
feat/z ─────────────────●
```

1. Branch off `dev`: `git checkout dev && git checkout -b feat/my-feature`
2. Commit your changes on the feature branch (see `commits.md`).
3. Run tests / type-check locally.
4. Push the branch: `git push -u origin feat/my-feature`
5. Open a PR into `dev`.
6. Merge the PR, then delete the branch (local + remote).
7. Periodically, once `dev` is confirmed stable (tested, deployed to a preview, checked manually), merge `dev` into `main`.

## Checklist before opening a PR into `dev`

- [ ] Branch was created off the latest `dev`
- [ ] `npx tsc --noEmit` passes
- [ ] Feature manually tested (UI changes checked in the browser)
- [ ] Commit messages follow `commits.md`
- [ ] No secrets/`.env` files staged
- [ ] Related plan file in `docs/plans/pending/` updated or moved (see `plans-workflow.md`)

## Checklist before merging `dev` into `main`

- [ ] Everything currently in `dev` has been manually tested
- [ ] No known regressions
- [ ] Daniel has confirmed it's ready for production
