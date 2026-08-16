# Standards Index

Each file below is loaded on-demand — only pull it in when its trigger applies, not all at once.

| File | Trigger |
|---|---|
| [commits.md](commits.md) | When creating a commit |
| [design-system.md](design-system.md) | When creating or modifying a UI component, or adding a color/spacing value |
| [security.md](security.md) | When touching auth, API routes, forms, server actions, logging, or user data |
| [architecture-guidelines.md](architecture-guidelines.md) | When deciding whether to add an abstraction, helper, or new module |
| [database.md](database.md) | When touching `prisma/schema.prisma`, running migrations, or touching database/env config |
| [documentation.md](documentation.md) | When writing code comments, TSDoc, or a README |
| [issues-workflow.md](issues-workflow.md) | When starting, committing, or merging feature work |
| [plans-workflow.md](plans-workflow.md) | When starting, updating, or finishing a plan in `docs/plans/` |
| [common-errors.md](common-errors.md) | When diagnosing an error |

Every file starts with a YAML frontmatter `description` restating its own trigger.
