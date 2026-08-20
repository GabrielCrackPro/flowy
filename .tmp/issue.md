## Summary

Comprehensive UI polish and architecture improvements across the app: morph icon animations for loading states and transitions, sidebar hover-expand with user preference, consolidated profile preferences into a single JSON column, unified error/not-found pages, and various micro-interactions.

## Acceptance Criteria

- [ ] LoadingIcon component morphs between icons with spring physics and auto-success checkmark
- [ ] ~30 components use LoadingIcon for smooth loading transitions
- [ ] Sidebar expands on hover when collapsed (configurable per-user)
- [ ] Sidebar collapse animation uses snappy 300ms easing
- [ ] Profile preferences consolidated into single `preferences` JSON column
- [ ] `usePreferences` hook provides typed read/write for all preferences
- [ ] Error boundary and not-found page share consistent visual design
- [ ] Push delivery history has a clear button
- [ ] Transaction type toggle morphs between income/expense icons
- [ ] Select, calendar, and dropdown chevrons use MorphIcon
- [ ] All changes pass `pnpm typecheck` and `pnpm lint`

## Technical Notes

- New files: `src/components/shared/loading-icon.tsx`, `src/hooks/usePreferences.ts`, `src/types/ProfilePreferences.ts`
- New migrations: `034_sidebar_hover_expand.sql`, `035_consolidate_profile_preferences.sql`
- Updated: Prisma schema, Profile type, profile API/service, ~30 component files
- Preferences refactor consolidates `showLanguageSelector`, `sidebarHoverExpand`, `statusAlertsEnabled`, `statusAlertComponents`, `statusAlertSeverities` into `preferences JSONB`
- MorphIcon library (`morphicons/react`) already in `package.json`

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Code reviewed and approved
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
