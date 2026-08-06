# Calendario — Ajustes de diseño (Incidencia + layout de mockups)

## Learning objective

By the end of this, you'll understand the difference between a **display
label** (the text a user reads) and an **internal identifier** (the name
your code and database use) — and why renaming one doesn't always require
renaming the other. You'll also see two common UI patterns: **progressive
disclosure** (hiding a section behind a toggle button, shown only when
asked for) and **precedence in a lookup function** — `resolverCelda`
already picks one winner among several things that could be true about a
day (feriado? weekend? an event?); this plan adds one more layer to that
same precedence question rather than a new mechanism.

## Context

The calendar itself is already fully built — schema, API routes, and every
component from the original plan exist and are committed (see `git log`).
This isn't a from-scratch plan, it's a redesign pass comparing your hand-
made mockups (`public/Daily.jpg`, `Weekly.jpg`, `Monthly.jpg`,
`TableSummary.jpg`) against what's actually on screen right now.

This version of the plan reflects a clarification round — the first draft
had one real gap (the date-jump picker wasn't in scope anywhere) and a
couple of assumptions that turned out wrong (weekends/feriados needed more
thought than "just recolor them"). Everything below already has your
answers folded in; the one open item left is called out explicitly near
the bottom, before Step 5.

**In scope**: renaming the "Nota" label to "Incidencia", recoloring it to
blue, reshaping the calendar's header controls to match the mockup layout,
dropping the "3 meses" mode, building a Teams-style date-jump picker,
changing how weekends/feriados render (and confirming they must stay
clickable so agents who work those days can still get a personal event
recorded), and hiding the balance table behind a toggle.

**NOT in scope**: any change to the underlying data model — `TipoEvento`
already has a `NOTA` value in the database, and this plan doesn't touch
that (see Step 1 for why). No new Prisma fields or migrations anywhere in
this plan.

## What's different, mockup vs. current code

| | Mockup | Current code |
|---|---|---|
| Label | "INCIDENCIA" | "Nota" (`Leyenda.tsx`, `CeldaCalendario.tsx`, `EventoModal.tsx`) |
| Color | Blue | Purple (`--color-nota-bg` / `--color-nota-text` in `globals.css`) |
| Top-left controls | "Hoy" + `◀ 20 Julio, 2026 ▶` (arrows flank a date label) | Separate `←` / `Hoy` / `→` buttons, no date label shown |
| "+" button | One "+ Evento" button with a dropdown arrow | Two separate buttons: "+ Evento" and "+ Feriado" |
| Balance table | Hidden behind a "Grupos y Totales" dropdown button | Always visible below the calendar (`page.tsx` renders `<BalanceTable />` unconditionally) |
| Month view dots | Small colored dots per day | ✅ Already matches — nothing to change here |
| Funnel icon | A Teams-style popover: mini month-calendar (left) + year/month grid (right) to jump straight to a date, not a data filter | Not present |
| "3 meses" toggle | Not visible in any mockup | Exists in `CalendarioView.tsx` as a 4th mode — **dropping it** |
| Weekend/feriado cells | Plain gray column/cell, no visible label, no name-on-hover | A "Feriado" badge/dot renders on both, plus a `Tooltip` shows the feriado's name on hover |
| Weekend/feriado clickability | Not shown in mockups, but confirmed separately: some agents work those days, so a supervisor must still be able to add a personal Vacación/Ausencia/Incidencia for one employee on a day that's gray for everyone else | Currently blocked — `handleDiaClick` no-ops on a weekend cell entirely |
| Day view badge | Fills the whole day cell with a matching background tint | A small pill, same size as Week/Month |

## Decisions from the clarification round

- **Funnel icon** → a date-jump popover, not a filter. Two panels side by
  side: a mini month-calendar on the left (current week/day highlighted,
  ↑/↓ to change month) and a 12-month grid for the year on the right
  (current month highlighted, ↑/↓ to change year, plus a "Today"
  shortcut). Picking a day/month jumps `CalendarioView`'s `fecha` state
  and closes the popover — this is new UI, not in the original plan's
  four steps, hence the new Step 4 below.
- **3 meses** → dropped entirely. Only Día/Semana/Mes remain.
- **Weekends and feriados** → both render as a plain gray cell/column,
  no visible badge, no `Tooltip` name-on-hover either — you only need to
  know a day is closed, not which holiday it is.
- **Day view's badge** → gets the full-width tinted-cell treatment from
  the mockup; Week/Month keep their current small-pill style.

## Open question before Step 5

Weekend/feriado cells need to become clickable again (they're currently a
no-op), but *what* clicking one opens depends on a case that didn't exist
before: a feriado cell can now mean two different things at once — "the
office is closed" (an org-wide `Feriado` row, editable via `FeriadoForm`)
**and**, for one specific employee, "this person has a personal event
recorded on this day anyway" (an `Evento` row, editable via
`EventoModal`). Both can be true on the same cell for the same day, for
different employees in different rows.

**My recommendation** (confirm before I build Step 5): route by what
*that employee* actually has on *that day*, not by the day's general
status —

- That employee has an `Evento` on this day (regardless of
  weekend/feriado) → click opens `EventoModal` in edit mode. An agent's
  actual recorded Vacación/Ausencia/Incidencia always takes priority over
  the day's closed status once it exists.
- That employee has no `Evento`, and it's a weekend (no `Feriado` row
  behind it at all) → click opens `EventoModal` in create mode, pre-filled
  for that employee/day — there's nothing else a weekend cell could mean.
- That employee has no `Evento`, and it's a real `Feriado` → this is the
  ambiguous one. Click could open `EventoModal` in create mode (assume
  you're adding a personal event for the person who's working that
  holiday), or it could still open `FeriadoForm` (assume you're managing
  the holiday itself, same as today). I'd lean toward **always
  `EventoModal` here too**, and moving `Feriado` management (create/edit/
  delete the closure day itself) exclusively behind the header's
  "+ Evento" dropdown's Feriado option — one predictable rule ("clicking
  a day cell is always about that employee's event") beats a rule that
  depends on whether a personal event happens to exist yet.

If you'd rather keep a way to edit/delete an existing `Feriado` by
clicking its cell directly, say so and I'll adjust Step 5 to keep that
path for cells with no personal event on them.

## Guided steps

Difficulty noted on each — the first two are good ones to try yourself.

### Step 1 — Rename the label, not the identifier (🟢 good first attempt)
✅ Correct: change only the **display text** in three places — the string
`"Nota"` becomes `"Incidencia"` in `Leyenda.tsx` (`<Badge variant="nota">
Nota</Badge>`), in `CeldaCalendario.tsx`'s `ETIQUETAS` map (`nota: "Nota"`),
and in `EventoModal.tsx`'s `TIPO_OPTIONS` array (`{ valor: "NOTA",
etiqueta: "Nota", variant: "nota" }` → `etiqueta: "Incidencia"`). Leave
`TipoEvento.NOTA` in `schema.prisma`, the `variant: "nota"` values, and the
CSS token names (`--color-nota-bg`) exactly as they are.
❌ Common mistake: renaming the enum value itself (`NOTA` → `INCIDENCIA`
in `schema.prisma`). That's a bigger, riskier change — it touches the
database's enum type, requires `pnpm prisma db push` again, and means
updating every file that references `TipoEvento.NOTA` in code (API
routes, `evento-balance.ts`, `calendario-celda.ts`). The label the user
reads and the name your code uses internally don't have to match — plenty
of real apps have this gap on purpose, precisely so a wording change
doesn't ripple into the database.

### Step 2 — Recolor to blue (🟢 good first attempt)
✅ Correct: in `src/app/globals.css`, change `--color-nota-bg` and
`--color-nota-text` to a blue pair (e.g. `#DBEAFE` / `#1D4ED8` — similar
weight to your existing `--color-oficina-bg`/`-text` pair, easy to nudge
later since it's one place). Nothing else needs to change — `Badge.tsx`
and every component already reference the token name, not a hardcoded
color.
❌ Common mistake: searching for the hex code in multiple files and
editing it in each place — if you ever find yourself doing that, it means
somewhere a color got hardcoded instead of using the token, which breaks
the whole point of `design-system.md`.

### Step 3 — Header controls layout (🟡 more involved)
✅ Correct: in `CalendarioView.tsx`'s header `<div>`, three changes at
once: (1) group the `←`/`→` arrows around a date-range label in the
middle (e.g. `◀ 20 Julio, 2026 ▶` for day view, `◀ 20-26 Julio, 2026 ▶`
for week, `◀ Julio, 2026 ▶` for month) instead of three standalone
buttons with nothing between them — this label is also Step 4's click
target for opening the date-jump popover. (2) Combine "+ Evento" and
"+ Feriado" into one button with a small dropdown (two menu items) —
`handleNuevoEvento` and `handleNuevoFeriado` already exist and don't need
to change, only what triggers them. (3) Remove the "3 meses" `Modo` value
entirely — the `Modo` type, `ETIQUETAS_MODO`, `calcularRango`, `avanzar`,
and the multi-month rendering branch all currently handle it and can drop
that case.
❌ Common mistake: building a whole new dropdown component from scratch
for the "+ Evento" menu — check if a simple pattern (native
`<details>`/`<summary>`, or a small local `useState` for open/closed) is
enough before reaching for a library.

### Step 4 — Date-jump picker (🔴 the hard one — new component, not a tweak)
✅ Correct: a new `SelectorFecha.tsx`, opened by clicking the date-range
label from Step 3. Two panels: a mini month-calendar (left) showing the
day-of-week header, the visible month's days, and the currently
active day/week highlighted, with ↑/↓ next to the month name to change
month; a 12-month grid for one year (right), current month highlighted,
↑/↓ next to the year to change year, plus a "Today" link. Picking a day
or a month updates `CalendarioView`'s `fecha` state (reuse `getMonday`/
`addDays` from `date-utils.ts` the same way the existing arrow buttons
do) and closes the popover. This is genuinely new interaction, not a
restyle — budget more time for this step than the others.
❌ Common mistake: trying to reuse `MonthGrid.tsx` for the mini-calendar
— that component is built for the main employee-rows grid (sticky name
column, per-employee cells) and isn't a general-purpose date picker.
Build a small, separate day-grid just for this popover instead of forcing
an unrelated component to do double duty.

### Step 5 — Weekends & feriados: plain gray, still clickable (🟡 more involved)
✅ Correct (pending the open question above): in `calendario-celda.ts`,
change `resolverCelda`'s precedence so a matching `Evento` for *that
employee* wins over the feriado/weekend check, instead of feriado/weekend
short-circuiting first. In `CeldaCalendario.tsx`, drop the `Tooltip`
wrapper and the visible label for the `feriado`/`finDeSemana` cases —
just the gray background, no text, no hover content. In
`CalendarioView.tsx`'s `handleDiaClick`, remove the early `return` for
`finDeSemana` and change the `feriado` branch per however the open
question above gets resolved.
❌ Common mistake: only fixing the *rendering* (making the cell gray) and
forgetting `handleDiaClick` still no-ops on weekends — the plain-gray
look would be right but agents who worked a Saturday still couldn't get
it recorded, which is the actual problem this step exists to fix.

### Step 6 — Day view's full-width badge (🟢 good first attempt)
✅ Correct: in `CeldaCalendario.tsx`, when a `compact` prop-equivalent
signal for "this is Day view" is present (`DayView.tsx` is the only
caller that needs this), render the badge's background color across the
full cell instead of as a small inline pill. Simplest approach: an extra
prop (e.g. `anchoCompleto`) that `DayView.tsx` passes and `WeekGrid`/
`MonthGrid` don't.
❌ Common mistake: detecting "is this Day view" by checking `celda`'s
shape or some other indirect signal — just pass an explicit prop from
the one caller that needs the different look.

### Step 7 — "Grupos y Totales" toggle (🟡 more involved)
✅ Correct: wrap `<BalanceTable />` in `page.tsx` behind a show/hide toggle
driven by a button labeled "Grupos y Totales", collapsed by default to
match the mockup. Since `page.tsx` is a server component and the toggle
needs client-side state, the cleanest fix is a small client wrapper
component (e.g. `BalanceTablePanel.tsx`) that holds `useState` for
open/closed and renders the button + conditionally renders
`<BalanceTable />` — similar to how `CalendarioView.tsx` already holds its
own UI state.
❌ Common mistake: turning `page.tsx` itself into a `"use client"`
component just to add one piece of toggle state — that would lose the
server-side data fetching it currently does. Keep the toggle in a small
client child instead.

## Self-check before considering this done

- [ ] Every place a user reads "Nota" now reads "Incidencia"; nothing in
      `schema.prisma` or the API code changed
- [ ] The Incidencia badge/dot renders blue, matching the mockup, from a
      single token change
- [ ] Header shows a date-range label between the prev/next arrows, for
      Día/Semana/Mes only — "3 meses" is gone from the mode switcher and
      from `CalendarioView.tsx`'s code
- [ ] "+ Evento" and "+ Feriado" are reachable from one button
- [ ] Clicking the date-range label opens the two-panel picker; picking a
      day or month jumps the calendar to it and closes the popover;
      "Today" jumps back to today
- [ ] Weekends and feriados render plain gray with no visible label and
      no hover tooltip
- [ ] An employee who works a weekend/feriado can still get a personal
      Vacación/Ausencia/Incidencia added by clicking their cell on that
      day — confirm this against however the open question got resolved
- [ ] Day view's badge fills the cell; Week/Month keep the small-pill style
- [ ] Balance table is hidden by default and appears when "Grupos y
      Totales" is clicked
- [ ] Month view still shows dots (should need zero changes from this
      plan's steps — confirms nothing here accidentally broke it)

## How to test

```bash
pnpm dev
```
1. Open `/calendario`, confirm the legend and any Incidencia entries read
   "Incidencia" in blue, not "Nota" in purple.
2. Switch through Día / Semana / Mes — confirm "3 meses" is gone and the
   date-range label updates correctly in the header for each mode.
3. Click the date-range label, confirm the two-panel picker opens; pick a
   different month on the right, confirm the left mini-calendar updates;
   pick a day, confirm the main calendar jumps there and the popover
   closes. Click "Today" from a different month, confirm it jumps back.
4. Confirm a weekend day and a real feriado both render plain gray, no
   badge, no tooltip on hover.
5. Click a weekend cell for an employee with nothing recorded — confirm
   `EventoModal` opens in create mode, pre-filled for that employee/day.
   Save a Vacación there, confirm the gray cell now shows the vacación
   color for that one employee's row, while the rest of the row/column
   stays gray for everyone else.
6. Switch to Día view, confirm a Vacación/Ausencia/Incidencia badge fills
   the whole cell width, not just a small pill.
7. Click "Grupos y Totales", confirm the balance table appears; click
   again, confirm it hides.
8. Create a new event via the combined "+" button, confirm both the
   Evento and Feriado paths still work.
