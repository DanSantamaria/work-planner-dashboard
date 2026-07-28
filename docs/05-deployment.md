# 05 — Deployment

_Living doc — update as the deployment setup changes. Loaded when touching infra/deployment._

## Dev vs. production on Vercel

- **Production**: the `main` branch. Every push/merge to `main` on the Vercel-linked GitHub repo triggers a production deploy automatically.
- **Preview/dev**: pushing the `dev` branch (or any feature branch) creates a Vercel Preview Deployment at a unique URL — useful for testing a change before merging into `dev` or `main`, without touching production.
- Locally: `pnpm dev` runs against whatever database is configured in `.env.local` (should point at a dev/branch database in Neon, not the production one, once that separation is set up).

## Environment variables

Configured in the Vercel project dashboard, scoped per environment (Production / Preview / Development). Locally, set in `.env.local` (gitignored, never committed).

| Variable | Purpose |
|---|---|
| `POSTGRES_PRISMA_URL` | Pooled Postgres connection string Prisma uses at runtime (via the Neon adapter). |
| `DATABASE_URL` | Standard Postgres URL (used by some tooling / Prisma config fallback). |
| `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING` | Direct (non-pooled) connection — used for migrations/long-running operations. |
| `AUTH_SECRET` | NextAuth JWT signing secret. |
| `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `POSTGRES_*` | Individual Postgres connection parameters (Neon/Vercel integration provides these automatically). |
| `NEON_PROJECT_ID`, `NEON_AUTH_BASE_URL` | Neon project identifiers (Neon/Vercel integration). |

**Never commit real values for any of these** — see `docs/STANDARDS/security.md`.

## Deploy

Normal flow (see `docs/STANDARDS/issues-workflow.md` for the full branch flow):

```bash
# Preview deploy: push dev or a feature branch — Vercel deploys it automatically
git push origin dev

# Production deploy: merge dev into main, then push main
git checkout main
git merge dev
git push origin main
```

Manual deploy via CLI (if needed, e.g. to redeploy without a new commit):

```bash
vercel --prod       # deploy current directory straight to production
vercel               # deploy a preview
```

## Rollback

- **Fastest**: in the Vercel dashboard → Deployments → find the last known-good production deployment → "Promote to Production". This is instant and doesn't require a git revert.
- **Via git**: revert the merge commit on `main` and push:
  ```bash
  git checkout main
  git revert -m 1 <merge-commit-sha>
  git push origin main
  ```
