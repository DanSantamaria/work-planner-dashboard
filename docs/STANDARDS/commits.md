---
description: Trigger - when creating a commit
---

# Commit Standards

## Format

Conventional Commits: `type: description`

Types:
- `feat:` — a new feature
- `fix:` — a bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `chore:` — tooling, deps, config, anything not user-facing

## Rules

- Imperative mood — "add", "fix", "update", not "added", "fixes", "updating".
- Max ~72 characters in the subject line.
- No trailing period.
- Optionally add a scope: `type(scope): description`. Scopes in use on this project: `auth`, `ui`, `api`, `db`, `prisma`, `deploy`.

Examples:
- `feat(ui): add RECEPCION badge with yellow color scheme`
- `fix(api): validate empleado id before update`
- `chore(prisma): bump prisma to 7.8.0`

## No AI attribution

Never include AI-attribution text in commit messages — no "Generated with Claude Code", no `Co-Authored-By` lines for AI. Commits should read as written by a person.
