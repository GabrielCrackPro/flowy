# Flowy

Flowy is a personal finance manager built with Next.js and Supabase. You track income and expenses, plan budgets, save toward goals, and keep an eye on recurring subscriptions, alone or in shared spaces with other people.

## Features

- **Transactions**: log income and expenses with categories, payment methods, notes, and receipt uploads; mark transactions as recurring
- **Budgets**: set a monthly limit per category and track spending against it
- **Goals**: define savings targets with deadlines and track progress
- **Subscriptions**: list recurring bills with billing cycles and next payment dates
- **Spaces**: create shared workspaces with join codes and invite members; each space has its own transactions, budgets, and goals
- **Comments and activity**: discuss any transaction, budget, or goal, and see a timeline of who changed what
- **Alerts**: get notified about budget overspending, low savings, upcoming subscription payments, and goal deadlines, deduplicated and dismissible
- **Dashboard**: charts and configurable cards showing your balance, spending, and budget health
- **Export**: download your transactions as a PDF
- **Localization**: Spanish and English, with a language selector and locale-aware formatting
- **Themes**: light and dark mode with customizable accent colors

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui on Base UI and phantom-ui |
| Database | PostgreSQL via Supabase, Prisma ORM |
| Auth | Supabase Auth with server-side session validation |
| Data fetching | TanStack Query, react-hook-form with Zod |
| Charts | Recharts |
| Other | framer-motion, i18next, next-themes, sonner, lucide-react |

## Getting started

### Prerequisites

- Node.js 20 or newer (the Next.js 16 requirement)
- pnpm (this repo uses a pnpm workspace)
- A Supabase project (free tier works)
- A PostgreSQL connection string for Prisma

### Install dependencies

```bash
pnpm install
```

This runs `prisma generate` through the `postinstall` script, so the Prisma client is ready after install.

### Configure environment variables

```bash
cp .env.example .env
```

Fill in the values. The required variables are `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. See [Environment variables](#environment-variables) for the full list.

### Apply the database schema

Schema changes live in two places: raw SQL under `supabase/migrations/` (RLS policies, triggers, realtime) and Prisma migrations under `prisma/migrations/`. On a fresh database, apply the Supabase SQL migrations first, then the Prisma migrations:

```bash
psql "$DATABASE_URL" -f supabase/migrations/001_init.sql
pnpm prisma migrate deploy
```

Avoid `pnpm db:push` on a Supabase database: cross-schema references can break introspection, and the error only affects schema-push operations, not the migrations above.

### Run the development server

```bash
pnpm dev
```

Open http://localhost:3000. The first page creates an account, then you can add transactions and set up budgets.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (publishable) key for the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for admin and server-side operations; keep it server-only |
| `CRON_SECRET` | Yes | Secret that protects the cron endpoints, for example `/api/cron/alerts` |
| `RATE_LIMIT_ENABLED` | No | Set to `false` to disable API rate limiting (enabled by default) |

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is accepted as a fallback for `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the middleware and browser client.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Generate the Prisma client and build for production |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run Biome checks on the whole repo |
| `pnpm format` | Auto-format all files with Biome |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm db:push` | Push the Prisma schema to the database |
| `pnpm db:generate` | Regenerate the Prisma client |
| `pnpm prisma` | Run any Prisma CLI command |

## Git hooks

The repo ships hooks under `.githooks/`, activated via `git config core.hooksPath` in the `prepare` script:

- **pre-commit**: runs Biome `check --write` on staged files through lint-staged, then `pnpm typecheck`; a failure aborts the commit
- **commit-msg**: validates conventional commit messages with commitlint, for example `feat: add budget export` or `fix(auth): refresh session on redirect`

Keep commit messages in the conventional format so the hook does not block you.

## Deployment

The project deploys on Vercel. `vercel.json` pins the build command, the region, and a daily cron that runs `/api/cron/alerts`.

1. Push the repo to GitHub and import it in Vercel
2. Add every variable from the [Environment variables](#environment-variables) table under Project Settings
3. Deploy; Vercel runs `pnpm install` (which generates the Prisma client), then `pnpm build`

After deploying, run `pnpm prisma migrate deploy` against the production database once.

## Project structure

```text
src/app            App Router pages: auth, dashboard, and API routes
src/components     UI primitives and feature components
src/hooks          Client hooks: data fetching, forms, filters
src/lib            Services: Supabase, Prisma, i18n, schemas, rate limiting
src/types          Shared TypeScript types
prisma             Prisma schema
supabase/migrations  SQL migrations for the Supabase database
.githooks          Git hooks (pre-commit, commit-msg)
```

## FAQ

### Can I host this somewhere other than Vercel?

Yes. The app is a standard Next.js build, so it runs on any Node.js host that provides the environment variables. You lose the Vercel cron for alerts unless you schedule `/api/cron/alerts` yourself.

### Do I need the service role key in the browser?

No. `SUPABASE_SERVICE_ROLE_KEY` is server-only. The browser uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and row-level security in `supabase/migrations/002_rls.sql` restricts what signed-in users can read and write.
