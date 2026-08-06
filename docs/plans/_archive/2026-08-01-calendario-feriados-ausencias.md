# Calendario — Feriados, Vacaciones, Ausencias y Notas

## Learning objective

By the end of this, you'll understand two patterns that show up a lot in
real apps: (1) one flexible table covering several related "kinds" of
record via a `tipo` field and nullable kind-specific columns — you already
have a small example of this in `AsignacionSemanal.oficina`; and (2) the
difference between a field that drives real logic (a balance you subtract
from) and a field that's just a label for display/reporting (a tag that
doesn't affect any calculation) — that distinction is why `origenVacacion`
below doesn't touch the balance math.

## Context

Right now feriados, vacaciones, ausencias, and shift-anomaly notes for
every employee live in one Excel file, hand-formatted with codes
(`v5`/`v6` green, `au` orange, `nt` blue) and Excel comments for detail. A
second Excel tab tracks remaining medical hours separately. Supervisors
edit one file; agents view a read-only mirror that hides the comments.
This plan rebuilds that as a real page (`/calendario`), replacing manual
copy-paste and dual-file upkeep with one source of truth.

**In scope**:
- A calendar page with Daily/Weekly/Monthly/multi-month views and a name
  filter.
- Weekends rendered automatically as non-working (no data needed);
  Spain's bank holidays and company-decided closure days stored and
  rendered the same way, in their own color.
- One unified "add/edit event" modal (openable from a top button or by
  clicking a day) covering vacaciones, ausencias, and notas.
- A combined balance table (vacation days, overtime-compensation hours,
  medical hours — all in one place instead of two files).
- Role-gated detail: logged-in ADMIN/SUPERVISOR can edit and see notes;
  logged-out public/agent view is read-only and never receives note text,
  same rule as the rest of the app.
- A simple manual way to group and order employees (e.g. by shift team),
  replacing the grouped layout in the Excel — **without** automatic
  yearly-rotation/priority logic.

**NOT in scope for this plan** (explicitly deferred):
- Automatic yearly rotation + staffing-coverage warnings for the `Grupo`
  priority system — group membership/order is manual data for now.
- Auto-syncing an `AUSENCIA` entry into the weekly planner's
  `AsignacionSemanal` grid.

## Design system — reuse what exists

Per `docs/STANDARDS/design-system.md`, this plan doesn't invent new
components or hardcoded colors — it extends what's already there:

- **Colors**: new tokens go in `src/app/globals.css` next to the existing
  ones (`--color-oficina-bg`, `--color-ausente-bg`, `--color-recepcion-bg`),
  following the same `--color-{name}-bg` / `--color-{name}-text` pattern.
  `AU` reuses the **existing** `--color-ausente-bg`/`-text` tokens as-is
  (today that's a red/pink `#FFE0E0` / `#E81414`, not orange — flagging
  that in case you actually want it recolored, otherwise I'll leave it
  untouched since it's already shipped on the weekly planner). New tokens
  needed: `--color-vacacion-bg`/`-text` (green), a second shade for
  `origenVacacion` (e.g. `--color-vacacion-anterior-bg`), `--color-nota-bg`/
  `-text` (purple — avoids clashing with FRANCIA's existing light blue LOB
  tag), and `--color-feriado-bg`/`-text` (gray). Exact hex values are easy
  to tweak later since they're centralized — I'll propose starting values
  in the schema/UI step below.
- **Components**: the calendar grid, balance table, and forms reuse
  `src/components/ui/Badge.tsx`, `Table.tsx`, `Card.tsx`, `Button.tsx`, and
  `Input.tsx` — extending `Badge`'s `BadgeVariant` union with `vacacion`,
  `vacacionAnterior`, `nota`, and `feriado` (same pattern as the existing
  `oficina`/`ausente`/`recepcion` variants), rather than writing one-off
  styled `<div>`s. `EventoModal` and `FeriadoForm` reuse `Input`/`Button`
  the same way `NuevaSemanaModal` already does.

## Data model

### `Feriado` — non-working days that apply to everyone

Weekends don't need a database row — the calendar can tell Saturday/Sunday
apart from any date on its own. What *does* need storing is anything that
doesn't follow a simple day-of-week rule: Spain's official bank holidays,
plus the extra days the company itself decides to close.

```prisma
model Feriado {
  id     String   @id @default(cuid())
  fecha  DateTime @unique
  nombre String   // "Fiesta Nacional de España", "Puente decidido por la empresa"...

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("feriados")
}
```
Visible to everyone (no privacy concern — it's just "office closed"),
editable only by ADMIN/SUPERVISOR, rendered in its own dark/gray shade,
separate from the vacation greens, ausencia orange, and nota blue.

### The balance fields on `Empleado`

One combined vacation-days pool per your last answer — no separate
2025-vs-2026 tracking. Two new fields for the overtime-hours pool, which
*is* genuinely separate since it's a different unit (hours, not days) and
never gets merged into the day count:

```prisma
model Empleado {
  // ...existing fields...

  // Combined vacation-day entitlement for the year (already existed;
  // varies per employee, e.g. 20 vs 25 — set manually at year start)
  diasVacaciones        Int   @default(22)
  diasVacacionesUsados  Int   @default(0)

  // NEW — hours earned from working extra ("exceso de jornada"),
  // spent like vacation time but tracked in hours, never merged into days
  horasExceso        Float @default(0)
  horasExcesoUsadas  Float @default(0)

  // Medical appointment hours (already existed, unchanged)
  horasMedicasTotal     Float @default(16)
  horasMedicasUsadas    Float @default(0)
}
```

### `Evento` — replaces the unused `Ausencia` model

One table, one row per employee per day. `tipo` decides which of the
extra fields matter — same idea as `AsignacionSemanal.oficina` already in
your schema.

```prisma
enum TipoEvento {
  VACACION
  AUSENCIA
  NOTA
}

// Label only — for the two-shades-of-green display and for Paloma's
// reporting. Does NOT decide which balance field gets decremented; every
// VACACION event increments the same diasVacacionesUsados regardless.
enum OrigenVacacion {
  ANIO_ANTERIOR
  ANIO_ACTUAL
}

model Evento {
  id        String     @id @default(cuid())
  fecha     DateTime
  tipo      TipoEvento
  notas     String?    // free text; internal only, never sent to public view

  // Only set when tipo = VACACION — which year's days does this look
  // like it came from? Purely descriptive, see comment on the enum above.
  origenVacacion OrigenVacacion?

  // Only set when tipo = AUSENCIA — was it justified? null = still
  // waiting on the agent to explain, needs supervisor follow-up
  justificada Boolean?

  // Only set when tipo = NOTA and it was a medical appointment
  esCitaMedica Boolean @default(false)
  horas        Float?  // hours to subtract from horasMedicasUsadas

  empleado   Empleado @relation(fields: [empleadoId], references: [id])
  empleadoId String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([empleadoId, fecha]) // one entry per employee per day
  @@map("eventos")
}
```

When the modal's date-range picker is used (e.g. a week of vacation), the
API creates one `Evento` row per day in the range — not one row spanning a
range — so each day stays individually editable or deletable later, same
as today when you fix a single day in the Excel without touching the rest
of the week.

### `Grupo` — manual organization only

```prisma
model Grupo {
  id     String @id @default(cuid())
  nombre String @unique // "Supervisores", "Grupo 1", "Fines de Semana y Nocturno"...
  orden  Int    @default(0) // display order of the group itself

  empleados Empleado[]

  @@map("grupos")
}
```

`Empleado` gets `grupoId String?` + `grupo Grupo? @relation(...)` +
`ordenEnGrupo Int @default(0)` (edited from `/empleados` with an up/down
control — no automatic rotation).

## Visual map

✅ Touched:
- `prisma/schema.prisma` — new `Feriado`, `Evento`, `Grupo`, `TipoEvento`,
  `OrigenVacacion`; new balance fields on `Empleado`; drop unused
  `Ausencia` / `TipoAusencia`
- `src/app/(public)/calendario/page.tsx` — replace the placeholder
- `src/components/calendario/` — new: `CalendarioView.tsx` (view-mode
  switcher), `MonthGrid.tsx`, `WeekGrid.tsx`, `DayView.tsx`,
  `EventoModal.tsx`, `BalanceTable.tsx`, `NombreFilter.tsx`, `Leyenda.tsx`
- `src/app/api/eventos/route.ts` + `[id]/route.ts` — new
- `src/app/api/feriados/route.ts` + `[id]/route.ts` — new
- `src/app/api/grupos/route.ts` + `[id]/route.ts` — new
- `src/components/empleados/EmpleadosTable.tsx` — add group + manual
  order editing
- `src/app/globals.css` — add `vacacion`, `vacacion-anterior`, `nota`,
  `feriado` color tokens
- `src/components/ui/Badge.tsx` — extend `BadgeVariant` with the same
  four new variants
- `src/components/ui/Tooltip.tsx` — new, hover preview for notes on a
  calendar cell

⬜ Untouched:
- `src/lib/api-auth.ts`, `src/lib/prisma-errors.ts` — reused as-is
- `src/components/semana/*` — weekly planner unchanged (auto-sync between
  the two is a separate future plan)

## Guided steps

### Step 1 — Schema changes
✅ Correct: add `Feriado`, `Evento`, `Grupo`, the two enums, and the two
new `Empleado` balance fields, then `pnpm prisma db push` (this project
uses `db push`, not migration files).
❌ Common mistake: forgetting `@@unique([empleadoId, fecha])` on `Evento`
— without it, nothing stops two entries existing for the same employee on
the same day.

### Step 2 — API routes for `feriados`
✅ Correct: mirror `src/app/api/tareas/route.ts`'s pattern
(`requireRole`, `isPrismaError`) — `GET` open to everyone, `POST`/`PATCH`/
`DELETE` behind `requireRole(["ADMIN", "SUPERVISOR"])`.
❌ Common mistake: gating the `GET` — feriados have no privacy concern,
public callers need them too to render the calendar correctly.

### Step 3 — API routes for `eventos`
✅ Correct: `POST` accepts `fechaInicio`, `fechaFin`, `empleadoId`, `tipo`,
and the type-specific fields, and loops to create one `Evento` per day in
the range inside a `prisma.$transaction`. On `VACACION`, also increment
`diasVacacionesUsados` (regardless of `origenVacacion` — that field is
just stored, not branched on). On a `NOTA` with `esCitaMedica: true`, also
increment `horasMedicasUsadas`.
❌ Common mistake: doing the balance update as a separate API call after
creating the event — do it inside the same transaction so the two can't
get out of sync if one fails.

### Step 4 — `GET /api/eventos` must hide sensitive fields from non-staff callers
✅ Correct: strip `notas`, `justificada`, and the medical detail when the
caller isn't ADMIN/SUPERVISOR. Public callers only need `fecha`, `tipo`,
`origenVacacion` (for the two-tone green), and `empleadoId` to color a
cell correctly.
❌ Common mistake: sending the full object and hiding fields in the UI only.

### Step 5 — Balance table component
✅ Correct: one table, visible to everyone, showing per employee: días de
vacaciones restantes, horas exceso restantes, horas médicas restantes.
Group and order rows by `Grupo.orden` then `Empleado.ordenEnGrupo`.
❌ Common mistake: recomputing remaining balances in the frontend — always
read `total - usados` straight from the API response.

### Step 6 — Calendar views + filter
✅ Correct: `CalendarioView.tsx` holds the active mode (Daily / Weekly /
Monthly / multi-month) and the name filter in state; each sub-view fetches
just the visible date range, including feriados for that range. Add a
"Hoy" button that jumps back to the current date from anywhere. For
ADMIN/SUPERVISOR, wrap each day cell that has a `notas` value in the new
`Tooltip` component so hovering previews the note — same idea as Excel's
cell comments, but since hover doesn't exist on touch/keyboard, clicking
the cell (Step 7) must always work as the reliable way to see the same
info, not just as a fallback.
❌ Common mistake: fetching the entire year up front — load per visible
range, same reasoning as why `/semana` loads one week at a time. Also
avoid relying on the native HTML `title` attribute for this — it's
unstyled, slow to appear, and inconsistent across browsers; a small
custom `Tooltip` component keeps it on-brand and reliable.

### Step 7 — Unified `EventoModal`
✅ Correct: one modal, opened two ways — a "+" button in the page header
(starts empty) and clicking any day cell (pre-fills that employee/date).
Fields: empleado select, tipo select (Vacación / Ausencia / Nota — shown
using the new `Badge` variants so the color swatch matches the calendar
exactly), date range pickers, then conditionally: origen radio (only for
Vacación — "¿del año pasado o de este año?"), justificada toggle (only
for Ausencia), "es cita médica" checkbox + horas input (only for Nota).
Built from `Input`/`Button` the same way `NuevaSemanaModal` already is.
Editing an existing day opens the same modal pre-filled, with a Delete
button. A separate, simpler modal (or the same one with `tipo` locked)
handles creating/editing a `Feriado`.
❌ Common mistake: building separate modals per tipo, or styling the color
swatches by hand instead of through `Badge` — one modal with conditional
fields and shared components is less code and stays visually consistent.

### Step 8 — Manual group/order editing
✅ Correct: on `/empleados`, add a group dropdown + up/down reorder
control per row, backed by `Grupo`/`ordenEnGrupo`.
❌ Common mistake: building drag-and-drop for this — up/down buttons are
enough for a first version and much less code.

## A few things worth adding (you asked)

- **"Hoy" button** — folded into Step 6.
- **Color legend** — a small fixed key always visible on the page: gray
  for feriados/weekends, two greens for vacación (labeled by year), the
  existing ausente color for ausencia, purple for nota — new supervisors
  won't know the codes the way your team does today.
- **Over-balance warning** — when a `VACACION` entry would push
  `diasVacacionesUsados` past `diasVacaciones` (or the same for the hours
  pools), show a warning instead of silently allowing it. Not a hard
  block, since you may sometimes approve it anyway.
- **Origen breakdown for Paloma** — since she likes seeing the
  2025-vs-2026 split, the balance table (or a small toggle on it) can
  show "used this year: X (Y from last year's leftover, Z from this
  year's)" by grouping `Evento` rows on `origenVacacion` — cheap to add
  since the data's already tagged, no separate balance math needed.
- **Print/export month view** — worth considering later if anyone still
  needs a paper schedule, but I'd leave it out of this plan unless you
  need it soon.

## Investigate this yourself

1. Look at how `AsignacionSemanal` uses a boolean (`oficina`) that only
   means something in certain cases — how is that similar to `Evento`
   using `tipo` to decide which other fields matter?
2. Compare `origenVacacion` (a label, doesn't affect the balance
   calculation) to `esCitaMedica` (does affect a balance calculation) —
   why does one need an `if` branch in the API code and the other doesn't?

## Self-check before considering this done

- [ ] `Feriado`, `Evento`, `Grupo`, and the new `Empleado` fields exist in
      the Neon DB
- [ ] Creating a `VACACION` with a 5-day range creates 5 `Evento` rows and
      increments `diasVacacionesUsados` by 5, regardless of which
      `origenVacacion` was picked
- [ ] Logged out: calendar shows colors only (feriados included);
      `notas`/`justificada`/medical detail never appear in the Network
      tab response
- [ ] Logged in as SUPERVISOR: can create/edit/delete a feriado and any
      evento type from the modal, opened both from the top button and
      from clicking a day
- [ ] Balance table shows all three numbers per employee, grouped/ordered
      by `Grupo`
- [ ] Daily, Weekly, Monthly, and multi-month views all load, weekends
      render as non-working automatically, and the name filter narrows
      the visible rows
- [ ] No AI-attribution text in any commit made for this plan

## How to test

```bash
pnpm dev
```
1. Log in as SUPERVISOR, add a `Feriado` for a future date, confirm it
   renders gray for every employee, logged in or out.
2. Create a `VACACION` for an employee spanning 3 days, `ANIO_ACTUAL`
   origen. Confirm 3 green cells appear and `diasVacacionesUsados` went
   up by 3 on `/empleados`.
3. Click one of those 3 days, delete it. Confirm only that day clears and
   the balance goes back down by 1.
4. Create a second `VACACION` day with `ANIO_ANTERIOR` origen, confirm it
   renders the other shade of green and still increments the same
   `diasVacacionesUsados` counter.
5. Create a `NOTA` marked as a medical appointment with 2 hours. Confirm
   `horasMedicasUsadas` increases by 2.
6. Open an incognito window (logged out) on the same month — confirm you
   see the colors but clicking a day shows no note text, and the balance
   table still shows the numbers.

---

**Reminder of deferred follow-ups**: (1) automatic yearly rotation +
staffing-coverage warnings for the `Grupo` priority system, (2)
auto-syncing an `AUSENCIA` into the weekly planner grid. Both are good
next plans once this one is built and verified.
