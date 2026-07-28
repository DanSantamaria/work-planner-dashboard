# Work Planner Dashboard

An internal Spanish-language operations tool for planning weekly employee task assignments (who's doing what task, on which day, in which line of business). Built with Next.js (App Router) + React, Prisma ORM against Neon Postgres, NextAuth v5 (JWT credentials login) for auth, and Tailwind CSS for styling, deployed on Vercel. The weekly planning grid (`/semana`), employee management (`/empleados`), task catalog (`/tareas`), and user management (`/usuarios`) are built and in production use; the calendar view (`/calendario`) and the app's root `/` route are still placeholders/unbuilt.

## Docs On-Demand

Only load a doc when its trigger applies — don't pull all of these into context up front.

| Doc | Trigger |
|---|---|
| [docs/01-architecture.md](01-architecture.md) | When understanding or changing how pieces of the system talk to each other |
| [docs/02-project-structure.md](02-project-structure.md) | When creating new files/directories |
| [docs/03-technical-design.md](03-technical-design.md) | When designing a feature that touches multiple layers (UI + API + DB) |
| [docs/04-ui-design.md](04-ui-design.md) | When creating or modifying a component/page |
| [docs/05-deployment.md](05-deployment.md) | When touching infra/deployment |
| [docs/STANDARDS/commits.md](STANDARDS/commits.md) | When creating a commit |
| [docs/STANDARDS/design-system.md](STANDARDS/design-system.md) | When creating or modifying a UI component, or adding a color/spacing value |
| [docs/STANDARDS/security.md](STANDARDS/security.md) | When touching auth, API routes, forms, server actions, logging, or user data |
| [docs/STANDARDS/architecture-guidelines.md](STANDARDS/architecture-guidelines.md) | When deciding whether to add an abstraction, helper, or new module |
| [docs/STANDARDS/documentation.md](STANDARDS/documentation.md) | When writing code comments, TSDoc, or a README |
| [docs/STANDARDS/issues-workflow.md](STANDARDS/issues-workflow.md) | When starting, committing, or merging feature work |
| [docs/STANDARDS/plans-workflow.md](STANDARDS/plans-workflow.md) | When starting, updating, or finishing a plan in `docs/plans/` |
| [docs/STANDARDS/common-errors.md](STANDARDS/common-errors.md) | When diagnosing an error |

## Working rules

- Before starting any new feature, check `docs/plans/pending/` for a spec covering it. If none exists, write one there first and pause for my approval before implementing anything.
- When a plan is fully implemented and verified, move it from `docs/plans/pending/` to `docs/plans/_archive/`.
- Never commit secrets, credentials, or `.env` files.
- Follow the security and design-system rules in their respective `docs/STANDARDS/` files once those exist.
- Never commit directly to `main`. All work happens on `dev` or feature branches off `dev`; `main` only updates via a tested merge from `dev`.

## Working with Daniel (junior developer, self-taught + bootcamp, graphic design + call center background)

- Explain concepts before/during implementation, using real-world analogies where possible, not just jargon or a doc link.
- Don't assume prior knowledge of a technology or pattern unless I've already used it in this project or said I know it.
- Explain non-trivial code blocks and terminal commands as you go.
- Prefer clarity over cleverness — straightforward code I can read and maintain later beats a terse one-liner.
