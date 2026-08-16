---
description: Trigger - when diagnosing an error
---

# Common Errors

Add an entry here every time a real bug takes more than a few minutes to diagnose — symptom, cause, fix. Future you (or a teammate) will hit the same thing again.

## `PrismaClientKnownRequestError` P2023 "Value 'X' not found in enum" on some routes but not others (2026-08-16)

**Symptom**: `/semana` and `/empleados` intermittently returned 500s in production with `Value 'FIN_DE_SEMANA' not found in enum 'LOB'`, while `/calendario` and `/login` looked fine.

**Cause**: Production (`main`) and dev/preview shared one database. A new LOB enum value and real employee rows using it were added while developing on `dev` — they went live against the shared database immediately, before `main`'s older code (which didn't know that enum value existed) ever got the matching schema. Any route that selected the `lob` column on one of those rows crashed; routes that happened not to touch that column looked fine.

**Fix**: merged `dev` into `main` and deployed, so the running code matched the live schema again. Root cause fixed by splitting Production and dev/preview into separate Neon database branches — see [database.md](database.md).
