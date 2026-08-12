## Summary

Ship the public **status page** (`/status`): a GitHub-status-style page showing live component health, uptime history, incidents, and scheduled maintenance — plus admin tooling to manage incidents and per-user notification preferences. Today the app has no way to communicate outages or planned maintenance to users; this adds the full loop: detection → incident → banner → notification → resolution.

## Acceptance Criteria

- [ ] Public `/status` renders: overall banner, 5 component rows (API, Database, Auth, Push, Storage), 90-day uptime bars, per-component uptime %, last-failure info, active incidents with timelines, and scheduled maintenance with live countdown
- [ ] Clicking a component row opens a detail sheet with check/latency stats, a Recharts latency chart, and a failure list; all timestamps show relative times ("42m ago") in the user's locale
- [ ] Admins (profile `role = 'admin'`) see a Status & incidents panel on `/status` to create/update/delete incidents, post timeline updates, and schedule maintenance (calendar + custom time picker)
- [ ] Status checks auto-create **draft** incidents when a component goes down; drafts stay hidden from the public page until an admin publishes them (one click)
- [ ] Push notifications fire on down, degraded, and **recovered** transitions, honoring per-user status alert preferences (master switch + per-component opt-out) via the Get-notified card on `/status`
- [ ] Active incidents surface as a dismissible banner across the dashboard; a status summary shows in the sync popover
- [ ] En/es translations for all new UI; `pnpm typecheck`, `pnpm lint`, `pnpm build` pass

## Technical Notes

- Relevant files: `src/app/status/page.tsx`, `src/components/shared/incident-admin-panel.tsx`, `src/components/shared/incident-banner.tsx`, `src/lib/services/status.ts`, `src/app/api/status/**`, `src/app/api/cron/status/route.ts`, `src/lib/services/push.ts`, `src/lib/api/push.ts`, `src/lib/rate-limit.ts`
- Reuses existing infra: `RelativeTime` component, `SheetLayout`, Recharts, `usePushNotifications`, `pushApi`, `requireAuth`
- Schema changes (Supabase migrations `020_service_checks` → `025_status_alert_preferences` + matching Prisma migrations): `service_checks`, `incidents` + `incident_updates`, `profiles.role`, incident `type`/`severity`/`draft`/schedule columns, `profiles.status_alerts_enabled` + `status_alert_components`
- Cron (`/api/cron/status`, `CRON_SECRET`, configured in `vercel.json`) persists checks, fires transition pushes, and auto-creates draft incidents
- Public routes (`/status`, `/api/status*`) bypass the auth middleware; incident management routes are admin-guarded via `requireAdmin()`

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Code reviewed and approved
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
