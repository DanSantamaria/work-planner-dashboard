# 02 — Project Structure

_Living doc — update the tree below whenever a meaningful folder is added, renamed, or removed. Loaded when creating new files/directories._

```
work-planner-dashboard/
├── prisma/
│   ├── schema.prisma          # Data model (User, Empleado, Tarea, SemanaPlan, AsignacionSemanal, Ausencia)
│   └── seed.ts                 # Seeds reference data (e.g. task list including RECEPCION, OFICINA, AUSENTE)
├── public/                     # Static assets (logo, default Next.js icons)
├── src/
│   ├── app/
│   │   ├── (public)/           # Route group: authenticated app shell (Sidebar + Header via layout.tsx)
│   │   │   ├── layout.tsx      # Wraps children in Sidebar/Header/BusquedaProvider
│   │   │   ├── semana/         # "/semana" — weekly task planning grid
│   │   │   ├── calendario/     # "/calendario" — feriados, vacaciones, ausencias, notas, balances
│   │   │   ├── empleados/      # "/empleados" — employee management (ADMIN/SUPERVISOR)
│   │   │   ├── tareas/         # "/tareas" — task catalog management (ADMIN/SUPERVISOR)
│   │   │   └── usuarios/       # "/usuarios" — user/account management (ADMIN only)
│   │   ├── api/                # API routes, one folder per resource, REST-ish (route.ts + [id]/route.ts)
│   │   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   │   ├── empleados/
│   │   │   ├── semanas/            # includes semanas/[id]/asignaciones for grid cell writes
│   │   │   ├── tareas/
│   │   │   └── usuarios/
│   │   ├── login/              # "/login" — public login page
│   │   ├── page.tsx             # "/" — still create-next-app boilerplate, not yet built
│   │   └── globals.css         # Tailwind import + design tokens (@theme inline block)
│   ├── auth.ts                 # NextAuth instance (providers, callbacks wired to auth.config)
│   ├── auth.config.ts          # Route-protection rules used by both auth.ts and middleware.ts
│   ├── components/
│   │   ├── Sidebar.tsx / Header.tsx   # App shell chrome
│   │   ├── semana/              # Feature components for the weekly grid (SemanaGrid, TareaDropdown, ...)
│   │   ├── empleados/ tareas/ usuarios/  # Feature components (tables) per page
│   │   └── ui/                  # Layer-2 shared UI primitives (Badge, Button, Card, Input, Table, GridTable)
│   ├── context/                 # React context providers (BusquedaContext — global search state)
│   ├── generated/prisma/        # Prisma Client output (generated, gitignored — never edit by hand)
│   ├── hooks/                   # Shared React hooks (useClickOutside)
│   └── lib/                     # Framework-agnostic helpers (prisma client, date utils, api-auth, etc.)
├── middleware.ts                # NextAuth edge middleware, gates all non-API/static routes
├── docs/                        # This documentation set
└── .claude/                     # Claude Code project settings
```

## Naming conventions

- **Files**: React components use `PascalCase.tsx` (`SemanaGrid.tsx`). Non-component modules use `kebab-case.ts` (`date-utils.ts`, `api-auth.ts`).
- **Components**: named exports match the file name; one main component per file.
- **Routes**: folder names in `src/app` are the URL segments, in Spanish to match the domain language used throughout the app (`semana`, `empleados`, `tareas`, `usuarios`).
- **Domain language**: the codebase is written in Spanish for domain terms (variable names like `nombre`, `asignaciones`, `empleado`) since this is an internal Spanish-language operations tool — keep new code consistent with this rather than mixing in English domain terms.
- **Tests**: none exist yet in this project. When added, colocate as `ComponentName.test.tsx` next to the component, or under `src/lib/__tests__/` for lib helpers — decide and update this doc when the first test is added.
