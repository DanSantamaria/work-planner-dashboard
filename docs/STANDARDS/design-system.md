---
description: Trigger - when creating or modifying a UI component, or adding a color/spacing value
---

# Design System Standards

## Design tokens are the single source of truth

All colors, spacing, and other design values live in `src/app/globals.css` (Tailwind `@theme inline` block) as CSS variables. Never hardcode a color or spacing value directly in a component (no `bg-[#FFE0E0]`, no `style={{ color: '#123' }}`).

- New color? Add a `--color-*` token in `globals.css` first, then reference it as a Tailwind class (`bg-recepcion-bg`).
- Need a new UI color family (like a badge variant)? Follow the existing pattern: `--color-{name}-bg` and `--color-{name}-text`.

## Two-layer component rule

If a shadcn/ui or Radix primitive is ever introduced:

- **Layer 1 — installed primitives.** Whatever the library gives you (e.g. `components/ui/primitives/*`). Never edit these files directly; if the primitive needs different behavior, wrap it instead.
- **Layer 2 — our own wrapper components** (e.g. `src/components/ui/Badge.tsx`, `Button.tsx`). These extend Layer 1 with our variants, tokens, and defaults.

Feature code (pages, feature components under `src/components/semana`, `empleados`, etc.) only imports from Layer 2, never straight from a Layer 1 primitive. This keeps every button/badge/input consistent and gives us one place to change styling project-wide.
