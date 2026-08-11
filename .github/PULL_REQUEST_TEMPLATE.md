> **PR title:** must be conventional (CI validates it) — `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:` — e.g. `feat(export): add CSV download`. Keep it under ~70 chars.

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
**Labels applied:** the matching area label + priority label

## Preview

**Vercel preview URL:** _paste the deployment preview link (auto-generated for this branch)_

## Acceptance Criteria

- [ ] _Criteria from the linked issue, ticked when met_
- [ ] ...

## Test plan

_This project has no automated test suite — describe the manual checks you ran: `pnpm lint`, `pnpm typecheck`, `pnpm build`, plus the app flows you exercised (online and offline if relevant)._

## Screenshots

_Add screenshots for UI changes (light and dark mode if relevant)._

## Deployment impact

- [ ] Requires a DB migration (`prisma/migrations/` or `supabase/migrations/` — RLS policies included); if checked, describe apply order and rollback/forward-fix plan in the Test plan
- [ ] Requires new environment variables (document them in the README)
- [ ] Should not deploy: include `[skip deploy]` in the latest commit message (documentation, workflow, or skill-only changes; never application, dependency, database, or deployment configuration changes)

---

## Reviewer checklist

Confirm every item before approving and merging:

- [ ] **CI green** — `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass
- [ ] **Conventional title** — matches the `feat:` / `fix:` / `chore:` / `refactor:` conventions checked by CI
- [ ] **Schema changes carry a migration** — Prisma under `prisma/migrations/`, Supabase under `supabase/migrations/` (including RLS policies and realtime config)
- [ ] **New env vars documented** — added to the README environment variables table
- [ ] **User-facing text localized** — visible strings exist in both Spanish and English (`src/lib/i18n/locales/`)
- [ ] **No secrets or debug code** — no API keys, tokens, `console.log` leftovers, or commented-out code
- [ ] **Offline/realtime considered** — changes stay consistent with the offline queue and realtime invalidation (temp IDs, dependent query keys) if they touch mutations or data
- [ ] **Accessibility** — keyboard nav, focus management, ARIA, and `prefers-reduced-motion` respected for any UI change
- [ ] **Test plan actually run** — the steps in the Test plan section were verified
