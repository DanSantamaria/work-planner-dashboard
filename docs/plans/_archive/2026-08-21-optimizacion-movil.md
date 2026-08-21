# Optimización para pantallas móviles

## Learning objective
By the end of this, you'll understand that "responsive" is not shrinking a
desktop screen until it fits. It is three separate decisions:

1. **What is this screen *for* on a phone?** Some things (reading today's
   plan) belong there; others (reordering employees inside a group) don't.
2. **Which mechanism fits each problem** — a breakpoint (`md:`) when the
   layout must change shape, a flexible unit when it only needs to stretch,
   and a scroll container when content genuinely can't shrink (a table with
   31 columns won't fit a 390px phone, and no font size fixes that).
3. **Touch is not a small mouse.** There is no hover on a phone, so anything
   that only appears on hover is, on that device, invisible.

## Visual map
```
src/app/
├── layout.tsx                       ✅ viewport + dynamic viewport height
└── (public)/layout.tsx              ✅ shell: sidebar vs drawer

src/components/
├── Sidebar.tsx                      ✅ off-canvas drawer under md
├── Header.tsx                       ✅ compact header, search gets the room
├── ui/
│   ├── Table.tsx                    ✅ per-breakpoint scroll strategy
│   ├── GridTable.tsx                ✅ idem
│   ├── Tooltip.tsx                  ✅ must open on tap, not only hover
│   └── SegmentedControl.tsx         ⬜ already fine (small, tappable)
├── semana/
│   ├── SemanaView.tsx               ✅ default to Día on small screens
│   └── TareaDropdown.tsx            ✅ clamp the panel to the viewport
├── calendario/
│   ├── CalendarioView.tsx           ✅ toolbar reflow
│   └── BalanceTable.tsx             ✅ 14px reorder chevrons → tappable
└── */*Modal.tsx                     ✅ full-screen sheets under md

prisma/                              ⬜ untouched — this is presentation only
```

## Context
- Why it matters: the plan gets consulted away from a desk — on the floor,
  between shifts, on a phone. Right now the shell is built at fixed desktop
  sizes: the sidebar always occupies 64–256px, the header opens with a
  `text-4xl` "Bienvenido", and `h-screen` fights mobile browser chrome.
- Starting point, measured: breakpoint prefixes (`sm:`/`md:`/`lg:`) appear in
  only 5 files, none of them the shell. So this is not repair work — it is
  the first responsive pass.

### In scope
Every screen at 360–768px wide: shell, navigation, tables, dropdowns, modals,
tap targets.

### NOT in scope
- Any data model, API or business-logic change — this pass is presentation.
- A separate mobile app or offline support.
- Redesigning the desktop layout: at ≥1024px everything must look exactly as
  it does today. That is the regression bar for every step.

## Decisions to confirm before starting
These three shape the work; the plan assumes them unless Daniel says otherwise.

**D1 — Mobile is for consulting, not administering.** Reading the week, the
day, the calendar and balances works on a phone. Editing modes (task edit,
publishing a week, employee/user/task admin, group reordering) stay reachable
but are tuned for tablet and up; they aren't rebuilt as touch-first flows.
*Why*: those flows lean on dense grids and multi-select dropdowns, and
rebuilding them for touch is its own project, not a paragraph in this one.

**D2 — `/semana` opens in Día on small screens.** The daily view already
built is, in practice, the mobile view: one column fits a phone, five don't.
Semana stays one tap away.

**D3 — Below `md`, tables scroll inside their own box again.** Sticky headers
currently work because `<main>` scrolls in both directions; on a phone that
means the toolbar and title drift sideways whenever a table is wider than the
screen — much worse than losing a sticky header. So under `md` the wrapper
takes back `overflow-x-auto` and the header stops sticking; at `md` and up,
today's behavior is untouched.
*This deliberately re-opens the trade-off settled on 2026-08-21 for desktop*
(see `_archive/2026-08-21-ajustes-calendario-semana.md`, Step 7) — the answer
is different on a phone, which is exactly what breakpoints are for.

## Guided steps

### Step 1 — Foundations and a way to test
Set the viewport metadata explicitly, swap `h-screen` for the dynamic
viewport unit, and agree on the breakpoint vocabulary (`md` = 768px as the
phone/desktop line, since that is where the sidebar stops being affordable).

✅ Correct: `h-dvh` instead of `h-screen`. `vh` units on mobile are measured
against the browser's *largest* possible viewport, so with the URL bar
visible, `h-screen` is taller than the screen and pushes content under it.
❌ Common mistake: chasing this with JavaScript that measures
`window.innerHeight` on resize — `dvh` is the CSS answer and it doesn't
repaint on every scroll.

Also decide the test matrix now: 360 (small Android), 390 (iPhone), 768
(tablet portrait), 1024+ (desktop, the regression bar).

### Step 2 — The shell: sidebar and header
Under `md`, the sidebar becomes an off-canvas drawer opened from a button in
the header, with a backdrop and Escape/tap-outside to close. The header drops
the `text-4xl` greeting on small screens and gives the width to the search
box, which is the control people actually use.

✅ Correct: the drawer is the *same* `Sidebar` component with a different
presentation, so nav items and role filtering stay in one place.
❌ Common mistake: rendering a second mobile-only nav. It drifts — someone
adds a route to one and forgets the other.

⚠️ Watch: the sidebar currently toggles expand/collapse on *any* click on
itself. As a drawer, that becomes "tap anywhere to close", which will fire on
mistaps constantly.

### Step 3 — Tables on a phone
Apply D3: under `md` the wrapper scrolls horizontally and headers don't
stick; from `md` up, nothing changes. Frozen name columns stay useful in both
(they are what makes a sideways-scrolling row readable), but their widths
(`w-56`, `w-44`) eat half a 390px screen and need a smaller variant.

✅ Correct: Tailwind can flip both, e.g. `overflow-x-auto md:overflow-visible`
and `md:sticky` on the header cells.
❌ Common mistake: hiding columns on mobile with `hidden md:table-cell` in a
`table-fixed` grid — the layout algorithm still reserves their widths.

Open question for this step, worth a look before coding: whether
`/empleados`, `/tareas` and `/usuarios` read better on a phone as a **card
list** (one card per row) instead of a scrolling table. That is a bigger
change than a breakpoint, so it gets decided with a mockup, not in advance.

### Step 4 — Touch affordances
**Correction made while implementing:** the plan claimed an event's note was
unreachable on a phone. It isn't. The API strips `notas` for non-staff, so the
tooltip only ever renders for ADMIN/SUPERVISOR — and for them the cell is a
button that opens the modal, where the note is shown in full. Touch users get
a *degraded* path (open the modal), not a missing one.

That correction changes the fix. Making the tooltip open on tap would collide
with the tap that opens the modal: a cell with a note would stop responding to
the primary gesture in order to serve the secondary one. So the tooltip is
declared a pointer-only convenience via `@media (hover: hover)` and the note
stays the modal's job on touch — better a feature that politely doesn't apply
than a control that can never be triggered.

Also here: `TareaDropdown`'s panel is a hard 320×256px positioned from the
button — on a 360px screen it can hang off the edge, so it needs clamping to
the viewport (it already clamps horizontally; height and flip need the same).
And tap targets: the balance table's reorder chevrons are 14px icons, well
under the ~44px that a finger can reliably hit.

✅ Correct: keep hover for pointer devices and add tap; both can coexist.
❌ Common mistake: detecting "is mobile" by user-agent string. The question is
whether the device has hover, and CSS answers it directly:
`@media (hover: hover)`.

### Step 5 — Modals and forms
Modals are centered `max-w-md` cards. On a phone they should be full-height
sheets so long forms (the evento form especially) can scroll without the page
behind them scrolling too.

## Investigate this yourself
1. Open `/calendario` in Mes view in the browser's device toolbar at 390px.
   Scroll sideways: what else moves besides the table, and why? (That is D3
   in one screenshot.)
2. On a phone, tap an event dot that has a note. What happens, and what does
   that tell you about building anything on `:hover` alone?
3. `h-screen` vs `h-dvh`: open both on a phone and scroll down slowly while
   the URL bar hides. Which one changes height, and which one lied about the
   height to begin with?

## Self-check before considering this done
- [ ] At 390px: no horizontal scrollbar on the page itself; only tables scroll
- [ ] The sidebar is a drawer under `md`, and closes deliberately, not on
      every stray tap
- [ ] `/semana` opens in Día under `md`
- [ ] An event's note is reachable on touch (through the modal), and the
      tooltip doesn't render where it could never be triggered
- [ ] Every interactive control is at least ~44px tall to a finger
- [ ] Modals are usable with the on-screen keyboard open
- [ ] At 1024px+ every screen is pixel-identical to today
- [ ] `npx tsc --noEmit` passes

## How to test
```bash
pnpm dev                     # http://localhost:3001
npx tsc --noEmit
```
Browser: DevTools device toolbar at 360 / 390 / 768 / 1024.
Real device (worth it at least once, for the tap targets and the URL bar):
`pnpm dev -H 0.0.0.0`, then open `http://<IP-del-Mac>:3001` from the phone on
the same Wi-Fi.
