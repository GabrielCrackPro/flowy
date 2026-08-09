# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

Flowy is a personal finance manager: track income/expenses, plan budgets per category, save toward goals, and monitor subscriptions — alone or in shared spaces with other people. It ships as a PWA with offline support, realtime sync, alerts, PDF export, i18n (en/es), and theming.

**Stack:** Next.js 16 (App Router), React 19, TypeScript · Tailwind CSS 4 + shadcn/ui (Base UI + phantom-ui) · Supabase (Postgres, Auth, Realtime) + Prisma ORM · TanStack Query, react-hook-form + Zod, Recharts, framer-motion, i18next, next-themes, sonner, web-push.

**Production URL:** https://flowy-jade.vercel.app

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server (http://localhost:3000) |
| `pnpm build` | `prisma generate` then production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Biome checks (whole repo) |
| `pnpm format` | Auto-format with Biome |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` / `pnpm prisma` | Prisma client / CLI |

**Do not run `pnpm db:push` on a Supabase database** — cross-schema references can break introspection. Ship schema changes as migrations instead (see below).

## Repository layout

```text
src/app             Pages, API routes (src/app/api/**), auth, dashboard, layout, manifest
src/components      Feature components + shared UI (transaction-form, data-table, command-palette, ...)
src/hooks           Client hooks: API queries, forms, filters, selection, theme, PWA, offline
src/lib             Services, Supabase/Prisma clients, i18n, Zod schemas, rate limiting, errors, offline engine
src/types           Shared TypeScript types
src/context         Providers (auth, theme, locale, offline, realtime, notifications)
prisma/schema.prisma  Prisma schema (mirrors the SQL schema)
supabase/migrations   SQL migrations: RLS, triggers, realtime, indexes
.githooks           pre-commit (Biome + typecheck) and commit-msg (commitlint) hooks
.agents/skills      Agent skills (load by name)
```

## Architecture & data flow

### The layered request path

```
UI component/hook → src/lib/api/* (fetch + token) → src/app/api/**/route.ts (auth + rate limit + zod)
→ src/lib/services/* (Prisma, multi-tenant, audit trail) → PostgreSQL (Supabase)
```

Every entity (transactions, budgets, goals, subscriptions, categories, comments, spaces) follows the same pattern. Build new features by mirroring an existing one end-to-end.

### API route template (`src/app/api/{entity}/route.ts`)

Every route handler follows this exact shape (see `src/app/api/transaction/route.ts`):

1. `const auth = await requireAuth();` then guard with `if (isAuthResponse(auth)) return auth;`
2. `const rateLimitResponse = await withRateLimit(auth.id, "routeName");` — return it if non-null. Route name must exist in `src/lib/rate-limit.ts` `DEFAULT_RATE_LIMITS` (add one for new routes).
3. Parse query/body and validate with the entity's Zod schema (`src/lib/schemas/*`); a `ZodError` → 400 with `error.issues`.
4. Delegate to the service (`TransactionService.create(auth.id, data)`).
5. Success responses get `applyRateLimitHeaders(response, auth.id, "routeName")`.
6. All other errors → `handleApiError(error, fallbackMessage)`.

Error-to-status mapping for common domain messages lives in `DOMAIN_ERROR_STATUS` in `src/lib/api/route-utils.ts` (e.g. `"Transaction not found"` → 404). **Note:** many service error strings are hardcoded Spanish (e.g. `"Transacción no encontrada"`) while route fallbacks mix en/es — keep new user-facing strings in i18n resources, and add new domain messages to `DOMAIN_ERROR_STATUS` if they should map to a specific status.

### Services layer (`src/lib/services/*`)

- Prisma client from `@/lib/prisma/client`; raw DB access only through services — routes never call Prisma directly.
- **Multi-tenancy is mandatory:** every query scopes by the user's active space via `SpaceService.getCurrent(userId)` → `spaceId` filter (personal data uses `spaceId: null`). Never query by `userId` alone.
- Mutations set `updatedBy: userId` and record an audit entry: `ActivityService.record({ userId, type: "entity.action", entityType, entityId, metadata })` — types use lowercase snake (`transaction.created`, `transaction.updated`, `transaction.deleted`, `budget.created`, ...). Use `replaceEntityHistoryWithDeletion` on deletes.
- Cross-entity validation lives in `src/lib/services/validators.ts` (e.g. `ensureUserCategory`).

### Client data layer

- `src/lib/api/factory.ts` — `createApi<T>(basePath)` generates list/get/create/update/delete fetchers; `src/lib/api/client.ts` — `authenticatedRequest` attaches the Supabase access token, retries 429s up to 3× honoring `Retry-After` + jitter, and throws a typed `RateLimitError`.
- `src/hooks/useEntityApi.ts` — the generic CRUD hook: optimistic updates with rollback, **offline queueing** (see below), toast feedback via i18n, and invalidation of the entity plus its dependent views.
- `src/lib/entity-query-keys.ts` — the single source of truth for query-key dependencies (`SINGULAR_QUERY_KEYS`, `DEPENDENT_QUERY_KEYS`). Both `useEntityApi` and the offline sync engine use it — **update it when an entity gains a dependent view** (e.g. dashboard aggregates depend on transactions).
- TanStack Query defaults (`src/lib/react-query/client.ts`): `staleTime` 30s, `networkMode: "offlineFirst"`, no retry on rate-limit errors. `useEntityApi` queries use `staleTime` 10s + `refetchInterval` 60s as a realtime backstop.

### Offline engine (`src/lib/offline/*`)

- Offline mutations are queued in IndexedDB (`pending.ts`/`storage.ts`) with temp IDs and a `PENDING_SYNC_FLAG` marker on optimistic rows.
- `flushOfflineQueue` replays FIFO, serialized across tabs with the **Web Locks API**; after 3 failed attempts a mutation is parked as `failed` and surfaced in the UI (`pending-sync-badge`, `sync-retry-button`).
- Create replays are at-least-once — duplicate creation on flaky retries is an accepted v1 tradeoff (an idempotency key would fix it). Temp IDs are remapped to server IDs after create.

### Realtime (`src/context/RealtimeSyncProvider.tsx`)

Supabase `postgres_changes` channels per table, filtered by `space_id`. **Realtime bypasses RLS**, so events are accepted only when `row.space_id === activeSpaceId`. Invalidations are coalesced with a 300ms debounce, and `TABLE_QUERY_KEYS` there mirrors `DEPENDENT_QUERY_KEYS` — keep them in sync.

### Auth

- `middleware.ts` protects routes and uses `supabase.auth.getUser()` (server-side JWT validation) — **never switch to `getSession()`** for protection, it trusts the client token. Auth paths: `/auth/login`, `/auth/register`, `/auth/forgot`.
- Route handlers re-validate via `requireAuth()` → `getCurrentUser()`.
- Server clients: `src/lib/supabase/server.ts` (SSR cookie client), `src/lib/supabase/admin.ts` (service-role, server-only, no session persistence). Browser client in `src/lib/supabase/client.ts`.

### Errors & degradation (`src/lib/errors/*`)

`AppError` hierarchy (`NetworkError`, `ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `RateLimitError`, `ServiceUnavailableError`, `DatabaseError`) with `classifyError`, category/severity/status, and i18n translation keys. UI-facing recovery helpers: `withGracefulDegradation`, `staleWhileRevalidate`, `withProgressiveLoading` (used by dashboard cards to keep showing stale data when a fetch fails).

### Rate limiting (`src/lib/rate-limit.ts`)

In-memory fixed-window limiter (per-instance — not distributed), default 20 req/120s for writes, configurable per route via `RATE_LIMIT_*` env vars, disabled with `RATE_LIMIT_ENABLED=false`. Returns 429 with `Retry-After`/`X-RateLimit-*` headers.

### Data model

Prisma schema maps 1:1 to the Supabase SQL schema (`@map`/`@@map`). Core tables (`profiles`, `spaces`, `space_members`, `categories`, `transactions`, `budgets`, `goals`, `subscriptions`, `comments`, `activities`, `push_subscriptions`, `alerts`). All owned entities carry `userId` and optional `spaceId`; mutable entities (categories, transactions, budgets, goals, subscriptions) also track `updatedBy`, and everything has `createdAt`/`updatedAt`. Schema changes ship as **both** a numbered SQL migration in `supabase/migrations/` (RLS + realtime) **and** the matching Prisma schema update.

## Conventions

- **Commits:** conventional format (`feat:`, `fix(scope):`, ...) — enforced by the local `commit-msg` hook and CI (`commit-conventions.yml`). Use `git commit --no-verify` only for docs-only changes.
- **Quality gates:** `pnpm typecheck` and `pnpm lint` run in the pre-commit hook and in `ci.yml`; `pnpm build` runs in CI. All three must pass before merge.
- **Auth/security:** `SUPABASE_SERVICE_ROLE_KEY` is server-only. The browser uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`; RLS in `supabase/migrations/002_rls.sql` is the data boundary. Never leak service-role keys or secrets into client code or commits (`.env*` are gitignored).
- **i18n:** any user-facing string must exist in both `src/lib/i18n/locales/en.ts` and `es.ts` — no hardcoded text (existing hardcoded Spanish error strings are a known debt; don't add more).
- **Offline/realtime:** mutations must remain consistent with the offline queue and realtime invalidation (temp IDs, `PENDING_SYNC_FLAG`, dependent keys). Session changes must not strand clients in a half-authenticated state.
- **Accessibility:** dynamic UI (sheets, dialogs, command palette, charts, transitions) must respect keyboard nav, focus management, ARIA, and `prefers-reduced-motion`.
- **Optimistic UI:** prefer `useEntityApi`'s optimistic pattern over plain refetch-on-success; if you add a new entity, wire it into `entity-query-keys.ts`, the offline `API_MAP`, and `RealtimeSyncProvider`'s `TABLE_QUERY_KEYS`.

## Working with GitHub

Repo: `GabrielCrackPro/flowy` (public). The `gh` CLI is authenticated on this machine (OAuth token in the Windows keyring; scopes `gist`, `project`, `read:org`, `repo`).

- In fresh shells use `export GH=~/ghcli/bin/gh.exe` (or just `gh` once on PATH).
- To create or update issues, load the **`github-issues`** skill — it encodes the project's issue template, labels, and `gh` commands.
- To read or update the **Flowy** project board, load the **`github-project-board`** skill (project/field/option IDs are documented there).
- Board writes and issue writes require explicit user confirmation.
- **Automation in this repo:** `ci.yml` runs a `guardrails` job on PRs (branch name must be `<type>/<kebab-slug>`, and `feat`/`fix`/`refactor`/`perf`/`test` PRs must link an issue). PRs authored by any bot account (`*[bot]` — e.g. `dependabot[bot]`, `github-actions[bot]`, `release-please[bot]`) are exempt, since tool-generated branches/PRs don't follow human conventions. `release-please` (`.github/workflows/release-please.yml`) auto-creates a changelog + GitHub releases on merges to `main`. `dependabot.yml` opens weekly dependency and monthly Actions updates.
- Merging a `release-please[bot]` PR bumps the version and creates a GitHub release; its merge triggers a harmless no-op Vercel redeploy (release commits can't carry `[skip deploy]`).

## Skills

Skills in `.agents/skills/` are loadable by name: `write-issues` (draft an issue in chat), `github-issues` (create/update issues on GitHub), `github-project-board` (read/triage the Flowy board), `github-workflow` (branch → commit → PR → ask-before-merge, with the `[skip deploy]` rule), plus the standard web/frontend/database review skills.

## Machine gotchas

- No Python installed — use Node (`node`) for one-off data formatting.
- No Docker, `vercel` CLI, or `supabase` CLI installed.
- The README references `.env.example`, but that file does not exist yet — create it if you need it (values are documented in the README's environment-variables table).
- Turbopack dev (`pnpm dev`) cannot be started from automation/session-0 contexts on this machine (child process spawn fails with `0xc0000142`). Run it from an interactive terminal, or test against the production URL instead.
