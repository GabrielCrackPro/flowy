## Summary

Major UI/UX overhaul across the app: a cohesive flat design system, mobile-first PWA chrome, unified sheets and controls, improved filters/export/command palette, and hardened file uploads. Closes the accumulated UI/UX audit work from this session.

## Type of change

- [x] ✨ Feature
- [x] ♻️ Refactor

## Changes

- **Design system:** flat solid surfaces for header/nav (no shadows on sheet/nav chrome), shared control tokens (`control-styles.ts`), card tokens, per-entity icon tints, first-name-only dashboard greeting.
- **Sheets:** every sheet now becomes a bottom sheet on mobile automatically (drag handle, swipe-to-dismiss, `max-h-[92dvh]`, rounded top), shared `EntitySheetHeader` / `SheetActionFooter` / `BottomSheet` components, contextual header subtitles and metadata, redesigned footers with mobile primary-action hierarchy.
- **Mobile chrome:** icon-only bottom nav with More menu and long-press profile quick actions (preferences/theme/sign-out via `usePressAndHold`), FAB speed-dial launcher for all entities opening forms in bottom sheets, flat header with logo mark, toasts above the nav.
- **Filters & tables:** unified filter trigger/selector/option styling with icons, mobile filter bottom sheet with sticky Apply/Clear, multi-select payment methods, improved date pickers and mobile table header layout.
- **Command palette:** redesigned on desktop and mobile with slide-up animation, localized command keywords, command registry, empty-state suggestions, reduced-motion support.
- **Exports:** shared responsive export selector + `DataExportMenu`, entity-specific totals, redesigned CSV/PDF documents with logo and cleaned header.
- **File uploads:** upload progress, full-screen receipt lightbox, compact receipt preview, storage cleanup on delete and on abandoned/failed transactions, no duplicate uploads.
- **Tooling:** removed TanStack Query + Next.js devtools (`devIndicators: false`), added `flowy-ui` design-system skill.
- **API/offline:** rate-limit retry honoring `Retry-After` with jitter, XHR upload progress path.

## Area & Priority

**Area:** `WEB`
**Priority:** `Priority: Medium`
**Labels applied:** `WEB`, `Priority: Medium`

## Test plan

- `pnpm lint` — Biome clean
- `pnpm typecheck` — clean
- `pnpm build` — production build passes (verified with `next build`; `prisma generate` blocked locally only by the running dev server locking the Windows engine DLL)
- Manually exercised: dashboard greeting, mobile bottom nav + FAB speed dial, entity form sheets on mobile (bottom) and desktop (right), filter/export bottom sheets, command palette, transaction detail sheet, profile long-press menu, sign-out confirmation, receipt upload/delete flows

## Deployment impact

- [ ] Requires a DB migration — **no**
- [ ] Requires new environment variables — **no**
- [ ] Should not deploy — **no**
