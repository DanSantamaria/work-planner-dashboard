---
description: Trigger - when touching prisma/schema.prisma, running database migrations, or touching database/env config
---

# Database Standards

- **Two separate databases.** Production has its own Neon branch. Preview and Development share a different `dev` branch. Never assume a change on one exists on the other — it doesn't, until it ships through a migration.
- **Schema changes always go through `prisma migrate`, never `prisma db push`.** Run `npx prisma migrate dev --name describe_change` locally — this applies the change to the `dev` database and writes a migration file to `prisma/migrations/`. Commit that folder, then push. `db push` skips the migration history everything below depends on — don't use it on this project.
- **Migrations apply automatically on deploy.** `package.json`'s `build` script runs `prisma migrate deploy && next build`, so whichever database a deployment targets gets any pending migrations applied before the app builds. Nothing needs to be run manually against Preview or Production.
- **The real connection variable is `POSTGRES_PRISMA_URL`**, read by both `src/lib/prisma.ts` and `prisma.config.ts`. `DATABASE_URL` also exists in the env but nothing in the app reads it — don't reach for it in ad-hoc scripts, or you'll silently hit the wrong database.
- **Vercel env var gotchas**:
  - `vercel env rm KEY <environment>` can delete the variable for *all* environments, not just the one named, if it was originally added as a single multi-environment entry. Confirm scope with `vercel env ls` right after any removal.
  - A variable added via `vercel env add` can come back typed "Sensitive," which makes it write-only — `vercel env pull` returns it as an empty string afterward, even to the project owner. If you need the value again, re-supply it from its original source (e.g. the Neon dashboard).
