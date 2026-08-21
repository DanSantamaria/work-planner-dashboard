# Ajustes UI /calendario y /semana

## Learning objective
By the end of this, you'll understand three CSS/React ideas that explain
all six bugs at once:

0. **Sticky and overflow are measured against the nearest scrolling
   ancestor** — a header can only stick if the box containing it is the one
   that scrolls, and a container that clips one axis clips both.
1. **Centering only works when there is leftover space** — `mx-auto` on an
   element inside a shrink-to-fit wrapper (`inline-block`) centers nothing,
   because the wrapper is exactly as wide as its content.
2. **Stacking (`z-index`) and clipping (`overflow`) are what make popups
   disappear** — an element without a layer loses to one that declares it,
   and a container that clips one axis clips both.
3. **A `useState` seeded from props is a snapshot, not a subscription** — it
   captures the value once, on mount, and never hears about later changes.

## Visual map
```
src/app/(public)/layout.tsx          ✅ (7) padding off the scroll container

src/components/
├── Sidebar.tsx                      ✅ (5) popover layer
├── ui/
│   ├── GridTable.tsx                ✅ (6) forwardRef dropped, (7) sticky header
│   ├── Tooltip.tsx                  ⬜
│   └── Table.tsx                    ✅ (2) row hover, (7) sticky header
├── calendario/
│   ├── CeldaCalendario.tsx          ✅ (1) center the dot when it has a note
│   ├── DayView.tsx                  ✅ (2) row hover
│   ├── WeekGrid.tsx                 ✅ (2) row hover
│   ├── MonthGrid.tsx                ✅ (2) row hover
│   ├── BalanceTable.tsx             ✅ (2)(4)(6) hover + single number + prop sync
│   └── CalendarioView.tsx           ✅ (6) refresh balances after saving an event
└── semana/
    ├── SemanaGrid.tsx               ⬜ (only if the ref prop becomes unused)
    └── TareaDropdown.tsx            ✅ (6) portal + fixed height

src/hooks/useClickOutside.ts         ✅ (6) optional second ref for the portal
```

## Context
- Why it matters: six small defects that all show up during everyday use —
  a misaligned dot, stale balances, a clipped menu and a clipped dropdown —
  each eroding trust in what the screen is showing.
- **In scope**: the six adjustments listed under "Guided steps".
- **NOT in scope**: any DB/schema change, the balance math itself
  (`lib/evento-balance.ts` is correct — only its display was stale) and
  `/semana`'s own layout.

## Guided steps

### Step 1 — Center the event dot when it carries a note
`CeldaCalendario` renders a dot with `mx-auto block` (auto side margins split
the leftover space evenly → centered). When the event has `notas`, the dot is
wrapped in `<Tooltip>`, whose root is `inline-block`: a box shrunk to its
content, so there is no leftover space left to split, and it sits wherever the
text alignment puts it (left).

✅ Correct: in compact mode, wrap the tooltip in a full-width block that
centers its inline content (`block text-center`), so the shrink-to-fit
tooltip is centered as a whole.
❌ Common mistake: adding `mx-auto` to the Tooltip itself — it is
`inline-block`, so auto margins have nothing to distribute.

### Step 2 — Highlight the whole row on hover (every table)
Each row is `<tr className="bg-white">` and its first cell is `sticky` with its
**own** `bg-white`. A `hover:` on the row alone leaves the name cell painted
white on top of the tint.

✅ Correct: mark the row `group` + `hover:bg-*`, and give the sticky name cell
`group-hover:bg-*` with the same color, so the tint reads as one line.
❌ Common mistake: only `hover:bg-*` on the `<tr>` — the sticky cell keeps
covering it.

Applies to every table in the app: the calendar grids (`DayView`, `WeekGrid`,
`MonthGrid`), `SemanaGrid`, and — via the shared `TableRow` — `/empleados`,
`/tareas`, `/usuarios` and Grupos y Totales. The tint lives in one token,
`--color-row-hover`.

Daniel also asked for the tint to win over every other cell background, so the
row reads as one continuous band with only badges and dots floating on top.
That means the day cells carry `group-hover:bg-row-hover` too, overriding the
feriado gray and the event tint for as long as the cursor is on the row. The
LOB stripe survives on its own because it is an inset box-shadow, which paints
over the background, and `/semana`'s AUSENTE/OFICINA accents survive because
they are borders, not backgrounds.

⚠️ Known trade-off, accepted deliberately: while hovering, a feriado column
loses its gray on that one row — the gray is the only marker of a closed day.
Chosen over visual inconsistency; reverting is one class in one file.

### Step 3 — Put the sidebar's "Ajustes" popover above the calendar
The popover declares no `z-index`; the calendar's sticky cells declare `z-10`
/`z-20`, so they paint over it.

✅ Correct: give the popover a high layer and the `<aside>` its own
positioned layer, so the whole sidebar sits above page content.
❌ Common mistake: bumping only the popover's `z-index` — inside a parent that
creates no stacking context this works today but breaks the moment the sidebar
gets a transform/filter; making the sidebar itself a positioned layer is the
stable fix.

### Step 4 — One number that is both the balance and the editable value
`BalanceCelda` printed `restante / total`. Mid-year the yearly total is dead
information: nobody remembers what each agent started with, and every agent
starts from a different figure. The only number that means anything is the
balance left today — and it has to be editable, so hours/days can be added or
removed by hand.

The DB keeps two columns per concept (total + consumed) and that stays as is —
no migration, no lost history. Instead the **UI stops speaking the database's
language**: it shows `total - usado`, and on save it translates back,
storing `total = saldo escrito + usado` so the subtraction renders exactly what
was typed.

> vacaciones: total 20, usado 8 → shows **12**. Type **15** → stores
> `total = 23`, still shows 15. Log one vacation day → `usado` becomes 9 →
> shows **14**.

✅ Correct: keep the translation in one place (`BalanceCelda` for display,
`guardarEdicion` for saving) and comment *why* the number saved differs from
the number typed.
❌ Common mistake: sending the typed number straight to the `diasVacaciones`
column — it would silently wipe out everything already consumed this year, so
the balance would jump instead of landing on what was typed.

### Step 5 — Balances that update without a reload
`BalanceTable` seeds `useState(initialEmpleados)` — a snapshot taken on mount.
Saving an event updates the DB (`/api/eventos` → `balanceUpdateParaEvento`) but
nothing tells that snapshot it is stale.

✅ Correct: `CalendarioView.handleGuardado` (already fired on both save and
delete) also calls `router.refresh()`, which re-runs the server component and
sends down fresh employees while preserving client state (open panel, current
month); `BalanceTable` then resyncs using React's *adjust state while
rendering* pattern — compare the incoming array against the previous one and
call `setState` during render, not from an effect.
❌ Common mistake 1: re-fetching `/api/empleados` from the client — that route
is staff-only, so the balance table would break for regular users, who are
allowed to see it.
❌ Common mistake 2: syncing with `useEffect(() => setEmpleados(props), [props])`
— ESLint's `react-hooks/set-state-in-effect` rejects it, and it renders twice,
flashing the stale balance before the fresh one.

### Step 6 — A task dropdown that no longer gets clipped
`GridTable`'s wrapper is `overflow-x-auto overflow-y-hidden`. Per CSS, a
container that clips on one axis clips on the other too — there is no "clip
horizontally but let things escape vertically". With the table filtered to one
row the wrapper is ~60px tall and beheads the panel. The existing flip logic
also measures against the table's bottom edge instead of the viewport's.

✅ Correct: render the panel through a React **portal** (moved out of the table
in the DOM, still controlled by the same component), positioned `fixed` from the
button's on-screen rectangle, with a **fixed height** and its own scrollbar;
flip upwards only when the viewport has no room below.
❌ Common mistake 1: trying to make `GridTable` `overflow-y-visible` — the
browser silently turns it back into a scroll container as long as the other axis
clips.
❌ Common mistake 2: leaving `useClickOutside` pointed at the button's container
only — the portalled panel is elsewhere in the DOM, so every click on a checkbox
would read as "outside" and slam the panel shut. Hence its new optional second
ref.

Two consequences that come with `position: fixed`: the panel no longer travels
with the page, so scroll (capture phase — the scrolling element is the table or
`<main>`, which don't bubble to `window`) and resize close it; and the ref
plumbing `SemanaGrid` used to thread into the dropdown became dead, taking
`GridTable`'s `forwardRef` with it.

### Step 7 — Sticky table headers
Scrolling a long table left you looking at columns with no headings. Sticky is
the fix, but it positions against the nearest *scrolling ancestor*, and every
table wrapper only scrolled horizontally — vertical scrolling happened further
out, in `<main>`. A header can't stick to a box that never moves.

✅ Correct: strip every `overflow` off the table wrappers so `<main>` — the
layout's scrolling element — is the ancestor sticky measures against, then
`sticky top-0` on the header cells. The table rides up with the page, its
header parks under the top bar, and it unsticks on its own when the table
ends: sticky is bounded by its containing block, no JS needed.

An earlier attempt gave each table its own `max-h-[70vh] overflow-auto` box.
It worked, but it read as a window inside a window: the wheel did nothing
unless the cursor was over the table, and the page had two scrollbars. Rejected
in review for the page-level version above. The cost, accepted knowingly: a
table wider than the screen now scrolls the page title and toolbar sideways
with it.
❌ Common mistake 1: `sticky top-0` on the header while leaving the wrapper
scrolling only horizontally — nothing happens, and it looks like a CSS bug.
❌ Common mistake 2: forgetting that a sticky cell carries its own background.
`TableHead` paints `bg-sidebar` on the `<tr>`, which stays behind; the `<th>`
needs the color too or the header goes transparent over the scrolling rows.
❌ Common mistake 3: putting `position: sticky` on the `<tr>` — Safari ignores
it. It goes on the cells, which is why `TableHead` reaches them with `[&>th]:`.
❌ Common mistake 4: leaving the padding on the scroll container itself.
`<main>` used to be `overflow-auto p-8`, and sticky offsets from the padding
edge, so every header parked 8 units below the top bar with rows sliding
visibly through the gap. The padding moved to an inner `<div>`; `top-0` now
means the real top. Compensating with a negative `top` instead would tie the
header to a number living in another file.

Grupos y Totales opts out via `<TableHead sticky={false}>`: it sits inside the
collapsible panel, whose `overflow-hidden` (needed for the open/close
animation) would capture the sticking anyway.

Layering, from back to front: body frozen name cells `z-10` → day headers
`z-20` → the `NombreHeaderCell` corner `z-30`, which is frozen on both axes and
therefore has to cover both.

⚠️ Watch for: these tables use `border-collapse`, where borders belong to the
table grid rather than to individual cells, and some browsers leave a sticky
header's bottom border behind while scrolling. If that shows up, swap that one
border for a box-shadow.

## Investigate this yourself
1. Open DevTools on a filtered `/semana`, select the dropdown panel and toggle
   `overflow: hidden` off on the table wrapper — why does the panel reappear?
2. In `/calendario`, why does the name column stay readable when you scroll
   sideways? Which property does that, and why does it force the extra
   `group-hover` rule in Step 2?
3. After Step 5, add a vacation event and watch the Network tab — how many
   requests fire, and which one carries the new balance?
4. Set the wrapper in Step 7 back to `overflow-x-auto` with the sticky header
   still in place. Why does the header stop sticking, and what does that tell
   you about which ancestor sticky actually measures against?

## Self-check before considering this done
- [ ] A dot with a note is centered in Mes view, exactly like one without
- [ ] Hovering any row in Día/Semana/Mes, Grupos y Totales, `/semana`,
      `/empleados`, `/tareas` and `/usuarios` tints the whole line — sticky
      cells, feriado gray and event tint included, with only badges/dots on top
- [ ] The Ajustes menu is fully visible on top of the calendar
- [ ] Grupos y Totales shows a single number per column, and editing it
      lands on exactly the number typed (check a row where usado > 0)
- [ ] Saving a vacation/hours event lowers that number with no page reload
- [ ] Deleting the same event raises it back, also with no reload
- [ ] Non-staff still see the numbers but get no edit affordance
- [ ] In `/semana`, filtered to a single employee, the task dropdown opens at
      full height and is fully visible
- [ ] Scrolling anywhere on the page (not only over the table) moves the table
      up; its header parks under the top bar and unsticks when the table ends
- [ ] Grupos y Totales has no sticky header
- [ ] Scrolling a wide month sideways keeps the "Nombre" corner above both the
      day headers and the frozen name column
- [ ] `npx tsc --noEmit` passes

## How to test
```bash
npm run dev    # http://localhost:3000
npx tsc --noEmit
```
Manual: `/calendario` (Mes → dot with note; hover rows; Ajustes menu; add a
vacation event and watch Grupos y Totales; delete it) and `/semana` (search a
single employee, then open a task dropdown).
