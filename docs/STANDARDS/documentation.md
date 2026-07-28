---
description: Trigger - when writing code comments, TSDoc, or a README
---

# Documentation Standards

## When to comment

Write a comment only when the code can't explain itself:
- **Business logic** that encodes a real-world rule (e.g. "AUSENTE clears every other task selection because an absent employee can't be assigned work").
- **Workarounds** for a specific bug, library quirk, or platform limitation — say what you're working around and why.
- **Non-obvious decisions** — a choice that looks wrong or unusual at a glance but is intentional.

## When NOT to comment

- Don't describe *what* the code does if the code already reads clearly (good names > comments).
- Don't reference the current task, ticket, or PR ("fixed for issue #123") — that context belongs in the commit message, not the code, and rots as the codebase evolves.
- Don't leave commented-out code — delete it (git history has it if needed).

## TSDoc reference (minimal)

Use TSDoc only on exported functions/types where the signature alone doesn't convey intent:

```ts
/** Returns the Monday..Friday dates for the week containing `fechaInicio`. */
function getWeekDays(fechaInicio: string) { ... }
```

Skip TSDoc on: internal (non-exported) helpers, anything with an obvious name + type signature, React components (props types are usually enough).

## Minimal README structure

Every README (root or per-package) should have, in this order:
1. **Requirements** — Node version, package manager, external services (e.g. Neon Postgres account).
2. **Install** — exact setup commands.
3. **Usage** — how to run it locally.
4. **Env vars** — table of required variables and what they're for (not their values).
5. **Scripts** — what each `package.json` script does.
6. **Folder structure** — pointer to `docs/02-project-structure.md` rather than duplicating it.
