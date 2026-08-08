## Summary

What this PR does and why. Link related issues: `Closes #123`.

## Changes

- ...

## Area & Priority

**Area:** BACK / WEB / DevOps
**Priority:** Lowest / Low / Medium / High / Highest
**Labels to apply:** the matching `BACK`/`WEB`/`DevOps` label + `Priority: X`

## Acceptance Criteria

- [ ] ...
- [ ] ... (list the issue's criteria when this PR closes one)

## Screenshots

_Add screenshots if the UI changes._

---

## Reviewer checklist (code owner approval)

Confirm every item before approving and merging:

- [ ] **CI passes** — `pnpm lint`, `pnpm typecheck`, and `pnpm build` are green
- [ ] **Conventional commit** — the merge commit message follows `feat:` / `fix:` / `chore:` / `refactor:` conventions
- [ ] **Schema changes carry a migration** — Prisma changes have a file under `prisma/migrations/`, and Supabase changes under `supabase/migrations/` (including RLS policies)
- [ ] **New env vars documented** — added to the README environment variables table
- [ ] **User-facing text localized** — any visible strings exist in both locales (Spanish and English)
- [ ] **No secrets or debug code** — no API keys, tokens, `console.log` leftovers, or commented-out code
- [ ] **Deploy decision made** — commit message includes `[skip deploy]` if this should not trigger a Vercel deployment
