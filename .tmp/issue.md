## Summary

Settings needs to feel like a real settings app, spaces should support pictures like profiles, and uploads should ride the app's standard authenticated/rate-limited request path.

**Settings & profile overhaul** — the settings page gets a sticky sidebar rail with scroll-spy (section pills on mobile), consistent icon chips on every card, a reworked push-notifications card (master toggle, per-alert preferences, device list with typed icons, test section), polished spaces section (localized member text, colored member avatars, creation/join dates), a dedicated refactored change-password sheet with Zod validation + localized errors, polished create/join space cards, and an improved About Flowy card (brand hero, latest-release preview with scope badges, GitHub/changelog links).

**Space pictures** — spaces gain an optional `avatar_url` (Prisma + Supabase migration), a space-avatar upload endpoint and compact uploader in the rename sheet, and image rendering in the settings cards, sidebar switcher, and header pill.

**Upload hardening** — the receipts upload route and `FileUpload` now go through `authenticatedRequest` (auth token, rate-limit retries, typed errors) like the rest of the app; all three upload routes (receipt/avatar/space) are rate-limited (10 req/120s, env-overridable); images are compressed client-side (resize + WebP) before upload and validated server-side by magic bytes (PNG/JPEG/WebP + PDF).

## Acceptance Criteria

- [ ] Settings page shows a sticky section nav (sidebar rail on desktop, horizontal pills on mobile) with scroll-spy and working anchor scrolling
- [ ] Push notifications card shows the master toggle, per-alert-type preferences, and a device list with distinct mobile/tablet/desktop icons
- [ ] Spaces list shows member avatars with deterministic colors, creation date, and member join dates (localized)
- [ ] Change-password sheet validates with Zod per-field errors, has visibility toggles, and shows localized errors (no raw Spanish)
- [ ] About Flowy card shows brand hero + latest-release preview with scope badges + GitHub/changelog links, with no duplicated info
- [ ] Spaces can upload/remove a picture, shown in settings cards, sidebar switcher, and header pill
- [ ] Receipts/avatars/space uploads go through `authenticatedRequest`; upload routes are rate-limited and return localized error codes
- [ ] i18n (en/es) covers every new user-facing string; `pnpm typecheck` / `pnpm lint` / `pnpm build` pass

## Technical Notes

- Settings page: `src/app/dashboard/profile/page.tsx`, `src/components/profile/settings-nav.tsx` (new), `push-notifications.tsx`, `space-card.tsx`, `space-members-sheet.tsx`, `space-manager.tsx`, `account-security-actions.tsx` + `change-password-sheet.tsx` (new), `profile-form.tsx`
- About card: latest changelog entry rendered via `src/lib/changelog/scope.ts` (new shared scope colors, reused by `changelog-sheet.tsx`)
- Space pictures: `spaces.avatar_url` via `prisma/migrations/20260812_add_space_avatar/` + `supabase/migrations/019_space_avatar.sql`; storage helpers in `src/lib/services/storage.ts`; upload route `src/app/api/upload/space/route.ts` (new); client resize via `src/lib/image-utils.ts` (new); glyph rendering in `space-card.tsx`, `SpaceSwitcher.tsx`, `space-switcher-pill.tsx`
- Upload hardening: FormData support + error-code fallback in `src/lib/api/client.ts`; `src/lib/api/upload.ts` (new) and `FileUpload` use `authenticatedRequest`; `upload` rate limit added to `src/lib/rate-limit.ts`; receipts compressed client-side, PDF magic-byte validation in `src/lib/services/storage.ts`
- OpenAPI: uploads documented with `x-flowy-rate-limit` (10 req/120s), `/api/upload/space` added — spec regenerated

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Code reviewed and approved
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
