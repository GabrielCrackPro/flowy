## Summary

_What this PR does and why. Link the issue it closes: `Closes #123`._

## Type of change

- [ ] 🐛 Bug fix
- [ ] ✨ Feature
- [ ] ♻️ Refactor
- [ ] 🔧 Chore / tooling
- [ ] 📝 Docs
- [ ] 🤖 CI / GitHub Actions

## Changes

- _Bullet list of the main changes_

## Area & Priority

**Area:** `BACK` / `WEB` / `DevOps`
**Priority:** `Priority: Lowest` / `Low` / `Medium` / `High` / `Highest`
**Labels to apply:** the matching area label + priority label

## Acceptance Criteria

- [ ] _Criteria from the linked issue, ticked when met_
- [ ] ...

## Test plan

_This project has no automated test suite — describe the manual checks you ran: `pnpm lint`, `pnpm typecheck`, `pnpm build`, plus the app flows you exercised._

## Screenshots

_Add screenshots for UI changes (light and dark mode if relevant)._

## Deployment impact

- [ ] Requires a DB migration (`prisma/migrations/` or `supabase/migrations/`)
- [ ] Requires new environment variables (document them in the README)
- [ ] Should not deploy: include `[skip deploy]` in the commit message

---

## Reviewer checklist

Confirm every item before approving and merging:

- [ ] **CI green** — `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass
- [ ] **Conventional commit** — merge message follows `feat:` / `fix:` / `chore:` / `refactor:` conventions
- [ ] **Schema changes carry a migration** — Prisma under `prisma/migrations/`, Supabase under `supabase/migrations/` (including RLS policies)
- [ ] **New env vars documented** — added to the README environment variables table
- [ ] **User-facing text localized** — visible strings exist in both Spanish and English
- [ ] **No secrets or debug code** — no API keys, tokens, `console.log` leftovers, or commented-out code
- [ ] **Test plan actually run** — the steps in the Test plan section were verified
