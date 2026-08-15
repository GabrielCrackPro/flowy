## Summary

Second major UI/UX polish batch: the mobile space switcher becomes a full in-sheet manager (create / join / edit / members / leave without stacking sheets), the join code gets a segmented OTP-style input, dashboard banners collapse into one animated stack, loading/error/not-found pages get a branded treatment with a route progress bar, and the PWA chrome (FAB, bottom nav, profile actions) is refined with hide-on-scroll and bottom-sheet interactions.

## Type of change

- [x] ✨ Feature
- [x] ♻️ Refactor
- [x] 🐛 Bug fix

## Changes

- **Space switcher sheet (mobile):** every space operation now lives inside one bottom sheet — create and join with animated inline forms, per-row action accordion (copy code / manage members / rename / leave-delete) instead of a popover menu, inline edit form, inline members view with live updates, and an inline destructive leave/delete confirm. No more stacked sheets; the only remaining overlay is the member-removal alert dialog.
- **Space forms extracted to shared components:** `SpaceCreateForm`, `SpaceJoinForm`, `SpaceEditForm`, `SpaceMembersList`, `SpaceLeaveConfirm`, `SpaceGlyph`, `useSpaceLeave`, plus `SpaceAvatarUploader`/`SpaceMembersSheet` moved from `profile/` to `shared/` — the profile page and the switcher sheet share one code path. Creating or joining a space auto-activates it.
- **Segmented code input:** generalized the auth OTP input into a shared `SegmentedCodeInput` (length + alphanumeric modes). The space join code is now entered in six uppercase boxes with shake-on-error, auto-submit at full length, and inline error feedback; MFA flows reuse the same component.
- **Dashboard banners:** offline / push / incident strips collapse into a single `BannerStack` with a shared dismiss-all affordance, mount/unmount slide-fade stagger, one-tap push enable (was: navigate to profile), and the offline banner rebuilt on the shared `Banner`.
- **Loading / error / 404 / progress:** shared `list-page-loading`, `full-page-error`, `not-found-page`, and `decorative-backdrop` components wired into `loading.tsx`/`error.tsx`/`not-found.tsx`/`global-error.tsx`; new route progress bar (time-based nprogress-style, offline-aware) with `route-prefetch`; fixed a Next 16 `cacheComponents` prerender failure in `RoutePrefetch`.
- **PWA chrome:** FAB and bottom nav now share `useHideOnScroll` (hide on scroll-down, reveal on scroll-up); the More tab and the long-press profile actions both open the shared bottom sheet (profile sheet with identity card, preferences, sign out — theme row removed, email metadata trimmed); touch-target audit raised undersized controls in the space sheet flows.
- **Fixes:** fixed a `Maximum update depth exceeded` infinite loop in the banner stack; `next build` greps now look for the real failure markers (the catch-all prerender error was previously missed).

## Area & Priority

**Area:** `WEB`
**Priority:** `Priority: Medium`
**Labels applied:** `WEB`, `Priority: Medium`

## Test plan

- `pnpm lint` — Biome clean
- `pnpm typecheck` — clean
- `pnpm build` — production build passes, 57/57 static pages
- Manually exercised: mobile space switcher sheet (switch/create/join/edit/members/leave modes and animations), join code entry + auto-submit, dashboard banner stack (offline + push + incident, dismiss-all, stagger), loading/error/not-found pages, route progress bar, FAB + bottom nav hide-on-scroll, More and profile bottom sheets, long-press preview

## Deployment impact

- [ ] Requires a DB migration — **no**
- [ ] Requires new environment variables — **no**
- [ ] Should not deploy — **no**
