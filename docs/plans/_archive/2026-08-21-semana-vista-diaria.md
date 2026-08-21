# Vista diaria en /semana

## Learning objective
By the end of this, you'll understand how one screen serves two zoom levels
without duplicating itself: the same data, the same grid and the same edit
draft, with only *how much of it is on screen* and *what the arrows step
through* changing. The reusable lesson is that "a new view" is usually a new
piece of state plus a filter, not a new component tree.

## Visual map
```
src/components/
├── ui/
│   └── SegmentedControl.tsx     ⬜ (already built for /calendario, reused here)
└── semana/
    ├── SemanaView.tsx           ✅ vista state, day arrows, toolbar label
    ├── SemanaGrid.tsx           ✅ optional single-day column
    ├── SemanaEditBar.tsx        ⬜
    └── TareaDropdown.tsx        ⬜

src/lib/formato-fecha.ts             ✅ NEW — shared day/range labels
src/components/calendario/
├── CalendarioView.tsx               ✅ uses the shared helper
└── MonthGrid.tsx                    ✅ drops its duplicate month names

prisma/schema.prisma                 ⬜ no data model change: a day is a slice
                                       of the week already being loaded
```

## Context
- Why it matters: most days the question is "who's doing what *today*", and
  answering it means scanning one column out of five.
- **In scope**: a Día/Semana switch on `/semana`, day-by-day arrows while in
  Día, today as the default day, and aligning `/semana`'s date labels with the
  wording `/calendario` already uses.
- **NOT in scope**: a month view (weeks are the unit here), changing how weeks
  are created/published, and any API or schema change — the daily view is a
  filter over the week already in memory.

## Design decisions
1. **Default view is Semana**, so nothing changes for anyone who doesn't touch
   the switch. Entering Día lands on today.
2. **The arrows change what the current view is made of** — days in Día, weeks
   in Semana — mirroring `/calendario`, which Daniel asked to match. Stepping
   past Viernes moves to the next week's Lunes (and before Lunes, to the
   previous week's Viernes) when such a week exists; otherwise the arrow is
   disabled, exactly like the week arrows today.
3. **Weekends**: weeks run Lunes–Viernes, so on a Saturday or Sunday "today"
   has no column. Día then opens on the last weekday of the week being shown
   (Viernes) rather than showing an empty screen.
4. **Editing stays available in Día.** This costs nothing: `draftAsignaciones`
   already holds the whole week, and rendering one column doesn't drop the
   other four, so Guardar/Publicar keep acting on the full week from either
   view. (Flagged for Daniel: if it feels wrong to publish a week while
   looking at one day, hiding the pencil in Día is a two-line change.)
5. **The search box follows the view**: in Día, matching a task name looks only
   at that day's tasks — otherwise searching "RECEPCION" would keep showing
   people who are on reception some *other* day, which reads as a bug when the
   column in front of you doesn't say that.

## Guided steps

### Step 1 — The switch and the day state
`SemanaView` gains `vista: "DIA" | "SEMANA"` and `diaSeleccionado: 1..5`
(the `diaSemana` numbering the assignments already use), plus the shared
`SegmentedControl` in the toolbar.

✅ Correct: derive the initial day from today's date, clamped into 1..5.
❌ Common mistake: `new Date().getDay()`, which numbers Sunday as 0 and
Saturday as 6 — the grid's `diaSemana` is 1 = Lunes. Weekend days must be
clamped, not passed through.

### Step 2 — Arrows that step through the current unit
`irAnterior`/`irSiguiente` branch on `vista`: week navigation as today, or
day navigation that rolls over into the adjacent week.

✅ Correct: keep the existing unsaved-changes confirmation on any move that
changes week, whichever view triggered it.
❌ Common mistake: letting a day step silently cross into another week and
discard an in-progress edit draft.

### Step 3 — One column instead of five
`SemanaGrid` takes an optional `diaVisible?: number`; when present it renders
just that day's column, keeping the frozen Nombre/Horario columns.

✅ Correct: filter the `weekDays` array it already builds.
❌ Common mistake: hiding columns with CSS — the sticky/`table-fixed` layout
would still reserve their width and the table would look broken.

### Step 4 — One date vocabulary for the whole app
`/semana` currently labels itself "Semana 17/08 - 21/08" while `/calendario`
says "17-23 Agosto, 2026" and "21 Agosto, 2026". Two screens, two dialects,
for the same idea. `/semana` adopts the calendar's wording:

| View | Before | After |
|---|---|---|
| Semana | `Semana 17/08 - 21/08` | `17-21 Agosto, 2026` |
| Día | — | `21 Agosto, 2026` |

The range stays Lunes–Viernes here (5 days) against the calendar's 7 — same
format, different span, which is exactly why the helper takes two dates rather
than a week.

✅ Correct: lift the formatting out of `CalendarioView` into
`src/lib/formato-fecha.ts` as `formatearDia(fecha)` and
`formatearRango(inicio, fin)`, and have both screens call it. The month-name
array moves there too — it is currently copy-pasted in `CalendarioView` and
`MonthGrid`, so this removes a duplicate rather than adding an abstraction for
its own sake.
❌ Common mistake: writing a second formatter in `SemanaView` that happens to
produce the same strings. Two copies drift: someone changes "Agosto" to "AGO"
in one screen and not the other.

## Investigate this yourself
1. Why does `diaSemana` start at 1 while JavaScript's `getDay()` starts at 0,
   and what breaks first if you mix them up?
2. Open Día, edit a task, switch to Semana without saving — is the change still
   there? What does that tell you about where the draft lives?
3. The daily view needs no new API call. Which existing fetch already brought
   the data, and why was it enough?

## Self-check before considering this done
- [ ] `/semana` opens in Semana view, exactly as before
- [ ] Switching to Día shows today's column (or Viernes on a weekend)
- [ ] In Día the arrows move one day and roll into the adjacent week; in
      Semana they still move one week
- [ ] The arrow is disabled when there is no adjacent week to roll into
- [ ] Editing in Día and saving leaves the other four days untouched
- [ ] Searching a task name in Día matches only that day
- [ ] `/semana` reads "17-21 Agosto, 2026" / "21 Agosto, 2026", and
      `/calendario`'s labels are unchanged after moving the helper
- [ ] `npx tsc --noEmit` passes

## How to test
```bash
npm run dev          # http://localhost:3001
npx tsc --noEmit
```
Manual: `/semana` → switch to Día → arrows across a week boundary → edit a
cell, save, switch to Semana and confirm the rest of the week survived.
