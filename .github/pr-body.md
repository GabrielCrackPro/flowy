## Summary

Third UI/UX + PWA polish batch: bottom sheets gain multi-detent snap points (drag up to expand), the transaction detail sheet and the remaining `SheetLayout` users migrate onto the shared `BottomSheet` chrome, MFA enrollment becomes a two-step stepper flow with QR/manual modes, and the PWA gets splash screens and rotation support — plus an in-app changelog page and a status-surface refresh. `Closes #181`.

## Type of change

- [x] ✨ Feature
- [x] ♻️ Refactor
- [x] 🐛 Bug fix

## Changes

- **Snap-point sheets:** new `useBottomSheetDetents` hook plus `snapPoints`/`defaultSnapPoint` on `BottomSheet` — on mobile the drag handle expands/collapses between detents and dismisses past the smallest. Applied to filters, changelog, space switcher, space members, and the status component detail.
- **Sheet chrome consolidation:** migrated the remaining `SheetLayout` users (change-password, theme-customization, MFA setup, space edit/members, status detail sheets) and the transaction detail modal to `BottomSheet`; deleted `SheetLayout`. Added a three-action footer (`footerPrimary`/`footerSecondary`/`footerTertiary`), right-aligned lone `footerRight`, and `externalHref` that closes the sheet before navigating.
- **MFA enrollment:** two-step stepper (scan → verify) with a new shared `Stepper`; QR/manual segmented mode switch (the manual key collapses and auto-expands on QR render failure); QR loading skeleton plus light/dark crossfade; verify header shows the authenticator name and a masked tap-to-copy setup key.
- **Status & changelog:** new in-app `/changelog` page (the changelog sheet links to it), unified status row-card treatment between the popover and sheet, and an extracted services status list.
- **PWA:** splash-screen generation script (`generate:splash` + `sharp`), Apple startup links, manifest/service-worker updates, and screen rotation enabled.
- **Polish:** destructive buttons unified to a solid red gradient; `ConfirmDialog` is the single confirm surface (MFA unenroll migrated); color picker rebuilt on shared control tokens; pull-to-refresh and system-back overlay dismissal polish.
- **Docs:** merged `github-workflow` and `deploy-release` into one end-to-end shipping skill, and updated the `flowy-ui` skill for the `BottomSheet` mandate and new APIs.

## Area & Priority

**Area:** `WEB`
**Priority:** `Priority: Medium`
**Labels applied:** `WEB`, `Priority: Medium`

## Test plan

- `pnpm typecheck` — clean
- `pnpm exec next build` — production build passes (route map emitted). Local `pnpm build` hits a Prisma engine DLL lock from the running dev server (port 3000); CI runs `prisma generate` cleanly on Linux.
- `pnpm lint` — all changed files are Biome-clean. Whole-repo `biome check` flags only pre-existing CRLF line endings in untouched config files on Windows; CI checks out LF on Linux.
- Manually exercised where possible: MFA scan → verify flow, QR ↔ manual switch, snap-point drag on the filter sheet, and the transaction detail sheet (desktop card + mobile detents).

## Deployment impact

- [ ] Requires a DB migration — **no**
- [ ] Requires new environment variables — **no**
- [ ] Should not deploy — **no** (code + `sharp` devDependency; must deploy)
