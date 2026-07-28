# 03 — Technical Design

_Living doc — update the version numbers and entities below as they change. Loaded when designing a feature that touches multiple layers (UI + API + DB)._

## Tech stack

| Layer | Technology | Version | Why (only where non-obvious) |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 | — |
| UI library | React | 19.2.4 | — |
| Language | TypeScript | ^5 | — |
| Styling | Tailwind CSS | ^4 | v4's `@theme inline` gives CSS-variable-backed tokens directly in `globals.css`, no separate `tailwind.config` needed. |
| Icons | lucide-react | ^1.24.0 | — |
| ORM | Prisma | ^7.8.0 | — |
| DB driver adapter | `@prisma/adapter-neon` + `@neondatabase/serverless` | ^7.8.0 / ^1.1.0 | Required to talk to Neon over HTTP/WebSocket from serverless functions instead of a pooled TCP connection. |
| Database | Neon Postgres | — | Serverless Postgres, pairs with Vercel's serverless deploy model. |
| Auth | NextAuth | 5.0.0-beta.31 | v5 is required for App Router + middleware-based route protection; still in beta upstream. |
| Password hashing | bcryptjs | ^3.0.3 | Pure-JS bcrypt — no native build step, works reliably in serverless. |
| Spreadsheet export | xlsx | ^0.18.5 | — |
| Package manager | pnpm | (via `pnpm-workspace.yaml`) | — |
| Hosting | Vercel | — | Native Next.js support, first-party Neon integration. |

## Prisma data model (main entities)

```
User            — login accounts (email, password hash, role: ADMIN | SUPERVISOR)
Empleado        — employee record (nombre, lob, turno, horario, vacation/medical-hours balances)
Tarea           — task catalog entry (nombre, descripcion, activa) — e.g. OFICINA, AUSENTE, RECEPCION
SemanaPlan      — one planning week (fechaInicio = Monday, fechaFin = Sunday, publicada flag)
AsignacionSemanal — join entity: one employee assigned one task on one day of one SemanaPlan
Ausencia        — an absence record for an employee (tipo, fecha, horas for medical type)
```

Relationships:
- `Empleado` 1—N `AsignacionSemanal`, 1—N `Ausencia`
- `Tarea` 1—N `AsignacionSemanal`
- `SemanaPlan` 1—N `AsignacionSemanal` (cascade delete — deleting a week deletes its assignments)

Enums: `Role` (ADMIN, SUPERVISOR), `LOB` (ESPAÑA, FRANCIA, IRLANDA, COORDINACION), `Turno` (MANANA, MEDIO, CIERRE, NOCTURNO), `TipoAusencia` (VACACIONES, BAJA_MEDICA, MEDICO, LLEGADA_TARDE, SALIDA_TEMPRANA, OTRO).

See `prisma/schema.prisma` for the authoritative, always-current definition — this doc is a summary for quick orientation, not a replacement.
