<div align="center">

<img src="public/app-icon.svg" alt="Flowy" width="88" height="88" />

# 🌊 Flowy

**A personal finance manager that flows with you.**

Track income and expenses, plan budgets, save toward goals, and keep an eye on recurring subscriptions — alone or in shared spaces with the people you trust. Works offline, syncs in realtime, speaks Spanish and English.

[![Release](https://img.shields.io/github/v/release/GabrielCrackPro/flowy?style=flat-square&labelColor=24292f&logo=semver&logoColor=white)](https://github.com/GabrielCrackPro/flowy/releases)
[![Build](https://github.com/GabrielCrackPro/flowy/actions/workflows/ci.yml/badge.svg?branch=main)](.github/workflows/ci.yml)
[![Production](https://img.shields.io/github/deployments/GabrielCrackPro/flowy/Production?style=flat-square&label=production&labelColor=24292f&logo=vercel&logoColor=white)](https://flowy-jade.vercel.app)
[![Preview](https://img.shields.io/github/deployments/GabrielCrackPro/flowy/Preview?style=flat-square&label=preview&labelColor=24292f&logo=vercel&logoColor=white)](https://github.com/GabrielCrackPro/flowy/deployments)
[![Last commit](https://img.shields.io/github/last-commit/GabrielCrackPro/flowy?style=flat-square&labelColor=24292f&logo=git&logoColor=white)](https://github.com/GabrielCrackPro/flowy/commits/main)
[![License](https://img.shields.io/github/license/GabrielCrackPro/flowy?style=flat-square&labelColor=24292f)](LICENSE)

**Try it live → [flowy-jade.vercel.app](https://flowy-jade.vercel.app)**

</div>

---

## Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [FAQ](#-faq)
- [License](#-license)

---

## ✨ Features

| 💸 **Transactions** | 🎯 **Budgets** | 🏆 **Goals** |
| :--- | :--- | :--- |
| Income & expenses with categories, payment methods, notes, receipts and recurring entries | Monthly limits per category with live spending tracking | Savings targets with deadlines and progress tracking |

| 🔁 **Subscriptions** | 👥 **Spaces** | 🔔 **Alerts** |
| :--- | :--- | :--- |
| Recurring bills with billing cycles and next-payment dates | Shared workspaces with join codes, members, and per-space data | Overspending, low savings, upcoming payments, deadlines — deduplicated |

| 📊 **Dashboard** | 📝 **Comments & activity** | 📦 **Export** |
| :--- | :--- | :--- |
| Charts and configurable cards for balance, spending, and budget health | Discuss any entity and follow who changed what | Download transactions as a PDF |

**And every day, everywhere:**

- 📴 **Offline-first PWA** — installable, works without a connection, syncs when you're back
- ⚡ **Realtime sync** — changes show up across your devices instantly
- 🌍 **Spanish & English** — full i18n with a language switcher
- 🌗 **Themes** — light & dark, with customizable accent colors

## 📸 Screenshots

<div align="center">
  <img src="public/screenshots/screenshot-desktop.png" alt="Flowy desktop dashboard" width="70%" />
  <br />
  <em>Desktop dashboard</em>
  <br />
  <br />
  <img src="public/screenshots/screenshot-mobile.png" alt="Flowy mobile view" width="28%" />
  <br />
  <em>Mobile</em>
</div>

## 🧰 Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui on Base UI and phantom-ui |
| Database | PostgreSQL via Supabase, Prisma ORM |
| Auth | Supabase Auth with server-side session validation |
| Data fetching | TanStack Query, react-hook-form with Zod |
| Charts | Recharts |
| Real-time & offline | Supabase Realtime, custom offline sync + PWA service worker |
| Notifications | Web Push, in-app alerts |
| Other | framer-motion, i18next, next-themes, sonner, jspdf, lucide-react |

## 🚀 Quick Start

### Prerequisites

- **Node.js 24.x** (pinned in `package.json`; CI and the production migration workflow use the same version)
- **pnpm** (v11 — this repo uses a pnpm workspace)
- A **Supabase project** (free tier works)
- A **PostgreSQL connection string** for Prisma

### 1. Install dependencies

```bash
pnpm install --frozen-lockfile
```

`postinstall` runs `prisma generate`, so the Prisma client is ready right after.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values — required: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. See the [environment variables](#-environment-variables) table.

### 3. Apply the database schema

Schema changes live in two places: raw SQL under `supabase/migrations/` (RLS policies, triggers, realtime) and the Prisma schema. On a fresh database, apply the SQL migrations first, then the Prisma migrations:

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_init.sql
pnpm prisma migrate deploy
```

> ⚠️ Avoid `pnpm db:push` on a Supabase database — cross-schema references can break introspection.

### 4. Run it

```bash
pnpm dev
```

Open http://localhost:3000 — create an account, then add your first transactions and budgets. That's it. 🌊

## 📁 Project Structure

```text
src/app              Pages, API routes, auth, dashboard, manifest
src/components       Feature components and shared UI
src/hooks            Client hooks: data fetching, forms, filters
src/lib              Services, Supabase/Prisma clients, i18n, schemas, rate limiting
src/types            Shared TypeScript types
prisma               Prisma schema
supabase/migrations  SQL migrations (RLS, triggers, realtime, indexes)
.agents/skills       Agent skills for AI-assisted development
.githooks            Git hooks (pre-commit, commit-msg)
```

## 📜 Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Generate the Prisma client and build for production |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run Biome checks on the whole repo |
| `pnpm format` | Auto-format all files with Biome |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm generate:openapi` | Regenerate `public/openapi.json` from the route surface and Zod schemas |
| `pnpm lint:openapi` | Lint the OpenAPI spec with Redocly |
| `pnpm check:openapi-routes` | Fail if a route handler is undocumented (or a spec route no longer exists) |
| `pnpm check:openapi` | Full spec check: regenerate → drift diff → Redocly lint → route guard |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm prisma` | Run any Prisma CLI command |

## 📡 API Reference

Flowy ships an **OpenAPI 3.1** specification for its whole REST surface (53 operations across transactions, budgets, goals, subscriptions, categories, comments, activity, spaces, dashboard, stats, search, profile, notifications, push, uploads, account, cron and health).

- **Interactive docs:** open **`/api/docs`** in the running app — a Scalar-powered reference with "try it" support. The page is public, so it can be shared.
- **Raw spec:** [`public/openapi.json`](public/openapi.json) — machine-readable and consumed by Scalar.
- **Generated from code:** request-body schemas are derived from the Zod schemas in `src/lib/schemas` (`pnpm generate:openapi`), and the CI `api-docs` job regenerates the spec, fails on drift, lints it with Redocly, and verifies every route handler is documented — so the docs can't rot.
- **Auth:** send your Supabase session cookies or `Authorization: Bearer <access_token>`. **Rate limits** are per-route (see the `x-flowy-rate-limit` extension). Errors follow the `Error` schema with a `category` from `src/lib/errors/error-types.ts`.

## 🔐 Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string used by Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (publishable) key for the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key for admin/server operations — server only |
| `CRON_SECRET` | ✅ | Protects cron endpoints, e.g. `/api/cron/alerts` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | — | Web Push public key (generate with `npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | — | Web Push private key — server only |
| `VAPID_SUBJECT` | — | Contact for the push service (defaults to `mailto:no-reply@flowy.app`) |
| `RATE_LIMIT_ENABLED` | — | `false` disables API rate limiting (enabled by default) |
| `RATE_LIMIT_*_REQUESTS` / `RATE_LIMIT_*_WINDOW` | — | Per-route rate limit overrides (requests / window in ms) |
| GitHub `deploy-production` → `DATABASE_URL` | ✅ for migrations | Environment secret used by the approval-gated production migration workflow |

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is accepted as a fallback for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Every variable listed here is documented in `.env.example`.

## 🚢 Deployment

The project deploys on **Vercel**. `vercel.json` pins the build command, the region, and a daily cron that runs `/api/cron/alerts`.

1. Push the repo to GitHub and import it in Vercel
2. Add every variable from the [environment table](#-environment-variables) under Project Settings
3. Deploy — Vercel runs `pnpm install --frozen-lockfile` (generating the Prisma client), then `pnpm build`
4. For schema changes, apply Prisma migrations first from the protected **Migrate production** workflow, then deploy the compatible application code. Supabase SQL migrations still require the documented controlled database process because the repository contains both Prisma and Supabase migration histories.

💡 `vercel.json` uses `scripts/vercel-ignore-build.mjs` to skip only explicitly non-deployable commits. It also skips the intermediate Release Please metadata commit; the following changelog sync PR still deploys the in-app release data. Application, dependency, database, and deployment configuration changes always deploy.

▶️ **Manual deploy:** if a deploy was skipped or failed, run the **Manual Deploy** workflow from the Actions tab — pick `production` or `preview` and a ref (branch/tag/SHA) to force it. Uses the `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` secrets and validates the database-backed `/api/health` endpoint. **Production manual deploys require your approval** — they run in the protected `deploy-production` environment (required reviewer + `main`-only branch policy), kept separate from Vercel's own `Production` environment so auto-deploys are never blocked.

🗄️ **Production migrations:** when a PR changes Prisma migrations, run **Migrate production** with confirmation `APPLY` and approve the protected environment before deploying code that depends on the new schema. The workflow runs `pnpm prisma migrate deploy` from `main`; Supabase SQL migrations must be applied in their controlled order before the Prisma migration when both are needed. Configure `DATABASE_URL` as an environment secret on `deploy-production`.

### CI & Automation

Eight GitHub Actions workflows guard the repo:

| Workflow | What it does |
| --- | --- |
| **CI** (`ci.yml`) | `pnpm lint`, `pnpm typecheck`, `pnpm build` on every PR, and on pushes to `main` only when the merge touched code/config (docs/CI-only merges skip it). Typecheck & build skip on docs/config-only changes (the required check is always reported); a `Branch & PR conventions` guardrails job enforces branch naming, issue links, and keeps the push-trigger paths in sync with the code-change regex; an `API Docs` job regenerates the OpenAPI spec, fails on drift, and lints it with Redocly |
| **Commit conventions** | PR titles and commit messages match conventional commits |
| **Release** | Release Please opens a release PR from conventional commits — merge it on the desired release cadence; **only `feat`/`fix`/`perf` (and breaking changes) trigger a release**, while docs/CI work rides along silently |
| **Manual Deploy** (`deploy-manual.yml`) | Triggered from the Actions tab (`workflow_dispatch`): deploy any ref to `production` or `preview`, with a database-backed `/api/health` check. Production runs in the protected `deploy-production` environment (needs your approval; `main` only) |
| **Production smoke** (`production-smoke.yml`) | Checks `/api/health` after every successful Vercel Production deployment |
| **Migrate production** (`migrate-production.yml`) | Approval-gated `pnpm prisma migrate deploy` workflow for committed Prisma migrations |
| **Update Board on Merge** (`board-update.yml`) | Moves issues referenced with `Closes/Fixes/Resolves #N` to Done on the Flowy board |
| **Sync changelog data** (`sync-changelog.yml`) | Regenerates and deploys the in-app changelog after a Release Please publication |

`main` is protected by the **"Block main"** ruleset: pull requests required, no force-push/deletion, **squash-only** merges (merge commits and rebase are disabled repo-wide, and branches auto-delete on merge), strict up-to-date status checks, and the quality, API docs, changelog, branch/PR guardrails, and conventional-commit checks must pass before merge. Codeowner review is not required, so bot PRs (like the changelog sync) can auto-merge once the required checks are green.

## 🤝 Contributing

Flowy is a solo project developed in spare time, but contributions are welcome — the workflow is small and fast:

- **Branches, not `main`:** every change ships as a pull request. Create a `<type>/<kebab-slug>` branch, commit with a conventional message, push, and open a PR — never commit to `main` directly.
- **Commits** must follow [conventional commits](https://www.conventionalcommits.org) (`feat:`, `fix(scope):`, ...) — enforced by the local `commit-msg` hook and CI. Docs-only changes should carry `[skip deploy]`.
- **Quality gates**: pre-commit runs Biome (lint-staged) and typecheck when the commit touches TypeScript; CI runs lint, typecheck, build, API drift checks, changelog drift checks, branch/issue policy checks, and conventional-commit validation. Database changes must disclose the migration checkbox and an apply/rollback plan.
- **Schema changes** ship as both a numbered SQL migration in `supabase/migrations/` and the matching Prisma schema update. Apply compatible database changes before dependent application code using the protected migration workflow.
- **User-facing strings** must be added to both `src/lib/i18n/locales/en.ts` and `es.ts`.
- **AI-assisted development:** see [AGENTS.md](AGENTS.md) for the working strategy and conventions — it also documents the `github-issues` and `github-project-board` skills used to manage the Flowy board.

## ❓ FAQ

**Can I host this somewhere other than Vercel?**
Yes — it's a standard Next.js build and runs on any Node.js host that provides the environment variables. You lose Vercel's cron for alerts unless you schedule `/api/cron/alerts` yourself.

**Do I need the service role key in the browser?**
No. `SUPABASE_SERVICE_ROLE_KEY` is server-only. The browser uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and row-level security in `supabase/migrations/002_rls.sql` restricts what signed-in users can read and write.

## 📄 License

Flowy is released under the [MIT License](LICENSE). © 2026 Gabriel Vargas.

---

<div align="center">

[Issues](https://github.com/GabrielCrackPro/flowy/issues) · [Releases](https://github.com/GabrielCrackPro/flowy/releases) · [AGENTS.md](AGENTS.md) · [License](LICENSE)

<sub>Made with 💙 by [Gabriel Vargas](https://github.com/GabrielCrackPro)</sub>

</div>
