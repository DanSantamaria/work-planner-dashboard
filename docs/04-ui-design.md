# 04 — UI Design

_Living doc — update the route map and layout notes as pages are built out. Loaded when creating or modifying a component/page._

## Page / route map

| Route | Page | Access | Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Public | Placeholder — still create-next-app boilerplate |
| `/login` | `src/app/login/page.tsx` | Public | Built |
| `/semana` | `src/app/(public)/semana/page.tsx` | Logged in | Built — weekly task planning grid |
| `/calendario` | `src/app/(public)/calendario/page.tsx` | Public (edit gated to ADMIN/SUPERVISOR) | Built — feriados, vacaciones, ausencias, notas, and balances |
| `/empleados` | `src/app/(public)/empleados/page.tsx` | Logged in | Built |
| `/tareas` | `src/app/(public)/tareas/page.tsx` | Logged in | Built |
| `/usuarios` | `src/app/(public)/usuarios/page.tsx` | ADMIN only | Built |

## Layout

```
┌─────────────────────────────────────────────┐
│ Sidebar │              Header                │
│ (icons  ├─────────────────────────────────────┤
│ collapse│                                     │
│/expand) │           page content              │
│         │        (children of layout)         │
│         │                                     │
└─────────────────────────────────────────────┘
```

All logged-in routes share `src/app/(public)/layout.tsx`: `Sidebar` (left, collapsible, `ClockPlus`/`CalendarRange`/etc. icons) + `Header` (top, includes global search via `BusquedaContext`) + page content in a scrollable `<main>`.

## Checklist before creating or modifying a component

Mirrors the two-layer rule in `docs/STANDARDS/design-system.md`.

- [ ] Does a component doing this (or close to it) already exist in `src/components/ui/`? Reuse or extend it before writing a new one.
- [ ] Any color/spacing used is a design token from `globals.css`, not a hardcoded value.
- [ ] If this is a generic, reusable primitive → it belongs in `src/components/ui/` (Layer 2). If it's feature-specific (only makes sense on the semana grid, for example) → it belongs in the feature folder (`src/components/semana/`, etc.).
- [ ] Feature code imports the component from Layer 2 (`src/components/ui/`), never wraps a raw third-party primitive inline.
- [ ] New badge/status colors follow the `--color-{name}-bg` / `--color-{name}-text` token pattern (see `Badge.tsx` for the existing `oficina`/`ausente`/`recepcion` variants).
