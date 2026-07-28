---
description: Trigger - when deciding whether to add an abstraction, helper, or new module
---

# Architecture Guidelines

- **YAGNI (You Aren't Gonna Need It)**: don't build functionality the current feature doesn't need yet, even if it "might be useful later."
- **Composition over inheritance**: prefer small, focused modules/functions that combine, over large multi-purpose ones that try to handle every case.
- **No premature abstraction**: don't extract a shared abstraction (helper function, shared component, generic hook) until a pattern repeats for the **3rd time**. Two similar blocks of code are fine — a third copy is the signal to extract.
- **Reuse before creating**: before writing a new utility or component, check `src/lib/`, `src/components/ui/`, and `src/hooks/` for something that already does it (or close to it).

## When it's OK to add complexity

| Situation | OK to add complexity? |
|---|---|
| Same logic repeated 3+ times | Yes — extract it |
| Measured performance need (not a guess) | Yes — optimize the measured hotspot |
| Security requirement (e.g. input validation, auth check) | Yes — always |
| Real domain requirement (a rule the business actually has) | Yes |
| "We might need this later" | No — wait until it's real |
| "This would be more elegant/generic" | No — elegance isn't a requirement |
