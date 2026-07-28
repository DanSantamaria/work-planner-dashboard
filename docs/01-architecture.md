# 01 — Architecture

_Living doc — update this as the system evolves, don't treat it as a one-time snapshot._

## How the pieces talk

```
┌──────────────┐      ┌───────────────────────┐      ┌──────────────┐      ┌──────────────┐
│  Browser      │◀────▶│  Next.js (App Router) │◀────▶│  Prisma ORM  │◀────▶│  Neon         │
│  React client  │      │  Server Components    │      │  (adapter:    │      │  Postgres     │
│  components    │      │  + API routes          │      │  @prisma/     │      │  (serverless) │
│  ("use client")│      │  (src/app/api/**)      │      │  adapter-neon)│      │               │
└──────────────┘      └───────────────────────┘      └──────────────┘      └──────────────┘
                              ▲
                              │ session check on every request
                              │
                       ┌─────────────┐
                       │  NextAuth 5  │
                       │  (JWT session,│
                       │  Credentials  │
                       │  provider)    │
                       └─────────────┘
```

- **Client components** (`"use client"`, e.g. `SemanaGrid.tsx`, `TareaDropdown.tsx`) handle interactivity — dropdowns, forms, local UI state.
- **Server components** (default in `src/app`, e.g. page files) fetch data directly via Prisma and render on the server — no client-side fetch needed for initial page load.
- **API routes** (`src/app/api/**/route.ts`) are used for client-triggered writes/reads after the page has loaded (e.g. saving a `SemanaPlan` assignment from the grid).
- **Prisma** is the only thing that talks to Postgres. It's configured with the Neon serverless adapter (`@prisma/adapter-neon`) so it works over Neon's HTTP/WebSocket connection instead of a raw TCP pool — needed because Vercel serverless functions can't hold long-lived TCP connections.
- **NextAuth** protects routes via `middleware.ts`, which runs the `authorized` callback in `src/auth.config.ts` on every request (except `/api`, static assets). Session strategy is JWT (no session table) — role (`ADMIN`/`SUPERVISOR`) is embedded in the token and re-validated server-side (`requireRole` in `src/lib/api-auth.ts`) for API routes that need it.

## Auth flow

1. User submits credentials on `/login`.
2. `signIn("credentials", …)` calls the `Credentials` provider's `authorize()` in `src/auth.ts`, which looks up the user by email and checks the password with `bcryptjs`.
3. On success, NextAuth issues a JWT (via `jwt()` callback) carrying `id` and `role`.
4. `middleware.ts` runs the `authorized()` callback on every non-API request to redirect unauthenticated users to `/login` and gate `/usuarios` to `ADMIN` only.
5. API routes that need role checks call `requireRole([...])` directly (middleware doesn't cover `/api`).

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Database | Neon Postgres (serverless) | Works natively with Vercel's serverless functions; no connection pool exhaustion. |
| ORM | Prisma 7 + `@prisma/adapter-neon` | Type-safe queries; the Neon adapter avoids TCP connection limits in serverless. |
| Auth | NextAuth v5 (beta), Credentials provider, JWT sessions | Simple email/password login for internal staff tool — no need for OAuth providers or a session-table round trip. |
| Migrations | Not yet initialized — schema changes applied via `prisma db push` | Project is early-stage/single-environment; formal migrations (`prisma migrate`) should be adopted before this has multiple contributors touching schema at once. |
| Styling | Tailwind CSS v4, tokens in `globals.css` `@theme inline` | Utility-first, and the `@theme` block gives us CSS-variable-backed design tokens (see `docs/STANDARDS/design-system.md`). |
| Hosting | Vercel | Pairs natively with Next.js and Neon. |

## Running the whole stack locally from zero

```bash
# 1. Clone and install
git clone <repo-url>
cd work-planner-dashboard
pnpm install                 # postinstall runs `prisma generate` automatically

# 2. Set up environment variables
cp .env.local.example .env.local   # if an example file exists; otherwise create .env.local
# fill in: POSTGRES_PRISMA_URL, DATABASE_URL, AUTH_SECRET, etc. (see docs/05-deployment.md)

# 3. Push the Prisma schema to your database (no migrations yet — see table above)
npx prisma db push

# 4. (Optional) seed reference data (tareas, etc.)
npx tsx prisma/seed.ts

# 5. Run the dev server
pnpm dev
# open http://localhost:3000
```
