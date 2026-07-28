---
description: Trigger - when touching auth, API routes, forms, server actions, logging, or anything that reads/writes user data
---

# Security Standards

- **Never log secrets, credentials, tokens, or sensitive user data** — even in dev/debug builds. No `console.log(session)`, no dumping request bodies that contain passwords.
- **Validate input on every boundary**: API routes, forms, server actions. Never trust client-supplied data — re-check types, required fields, and ownership/permissions server-side even if the UI already validated them.
- **No secrets or credential files ever committed to git.** `.env*` is already gitignored — keep it that way, and never paste real secret values into docs, commit messages, or code comments.
- **User-facing errors show plain-language messages**, never raw stack traces or database error text. Log the real error server-side; show the user something like "No se pudo guardar el cambio."
- **NextAuth session/token handling**:
  - Never log session tokens or JWTs.
  - Validate the session server-side on every protected route/API handler (see `src/lib/api-auth.ts`'s `requireRole` helper) — don't rely on the client having hidden a button.
- **Prisma/Neon**: never construct raw SQL from user input. Use parameterized Prisma queries only (`prisma.model.findMany({ where: ... })`), never `$queryRawUnsafe` with interpolated user data.
