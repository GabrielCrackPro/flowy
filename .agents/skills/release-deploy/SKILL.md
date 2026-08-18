---
name: release-deploy
description: Flowy release & deploy reference — release-please versioning, the post-merge deploy chain, the release runbook, Vercel auto-deploy, manual deploy/migration fallbacks, the `[skip deploy]` rule and Vercel ignore script, and release-time database migrations. Load after a merge (or when asked to "release", "deploy", "bump the version", "verify the production deploy", or "run the migration").
metadata:
  author: local
  version: "1.0.0"
  argument-hint: <step-or-context>
---

# Releasing & deploying Flowy

The branch → PR → merge path is `github-workflow`. Everything after the merge lives here: how `release-please` versions Flowy, what the deploy chain does, the manual fallbacks, the `[skip deploy]` rule, and release-time migrations.

**Production URL:** https://flowy-jade.vercel.app · **Health:** `/api/health` (database-backed)

```text
merge to main → release-please opens release PR (only feat/fix/perf/breaking)
   → [user says merge] → version bump + changelog + GitHub release
   → changelog-sync PR deploys → production smoke checks /api/health
```

---

## 1. When a release triggers (release-please)

`.github/workflows/release-please.yml` runs on every push to `main` (and `workflow_dispatch`):

- **A release is created only when the merge contains `feat`, `fix`, `perf`, or breaking-change commits.** `docs`/`chore`/`ci`/`refactor`/`test` sections are `hidden: true` in `release-please-config.json`, so those merges produce **no release** — release-please logs "No user facing commits found" and the changes ride along in the next real release.
- **Do not expect a release PR after docs/CI-only merges.** If one was expected and none appeared, the merge likely had no release-worthy commits (`git log --oneline -3 origin/main`).
- **Versioning while < 1.0** (`bump-minor-pre-major` + `bump-patch-for-minor-pre-major`): a `feat` is a **minor** (`0.1.x → 0.2.0`), a `fix`/`perf` is a **patch** (`0.1.36 → 0.1.37`), breaking changes flip to the next major. Current version: `.release-please-manifest.json`.
- Release-please **opens a PR** (e.g. `chore(main): release flowy 0.1.37`); it does **not** merge it. Merging bumps the version, rewrites `CHANGELOG.md`, creates the GitHub release + tag, and — via `extra-files` — writes the new version into `$.currentVersion` of `src/lib/changelog/generated.json`.
- Release PRs are **bot-authored** (`github-actions[bot]` is the actual author for GITHUB_TOKEN runs), so they're exempt from branch/issue conventions — but the **ask-before-merge rule still applies**.

## 2. The deploy pipeline after a release merge

Merging the release PR (`chore(main): release flowy X.Y.Z`) triggers, in order:

1. **CI push re-verification** — `ci.yml` re-runs on the merged commit, but only when the merge touched code/config (the `paths` filter). Inside `Lint, Typecheck & Build`, typecheck/build are skipped for docs/config-only merges ("Detect code changes" step); `Lint` always runs. The push-trigger `paths` list and the code-change regex are kept in sync by `scripts/check-ci-trigger-sync.mjs` (guardrails job) — **when you change one, change the other**.
2. **Release commit deploy is skipped** — `scripts/vercel-ignore-build.mjs` detects the `chore(main): release flowy` metadata commit and exits 0, so Vercel skips the intermediate redeploy. Deliberate and harmless.
3. **Changelog sync deploys** — `Sync changelog data` (`.github/workflows/sync-changelog.yml`) regenerates `src/lib/changelog/generated.json` (the in-app "What's new" data), opens a `chore: sync in-app changelog data` PR when it drifts, and **auto-merges** it. This commit deliberately does **not** carry `[skip deploy]` — production needs a redeploy to serve the new entries.
4. **Production smoke** — `Production smoke` (`.github/workflows/production-smoke.yml`) runs on every successful Vercel `Production` deployment and curls `/api/health` (5 attempts, 5s apart, `deployment_status` event).
5. **Board update** — the same `Update Board on Merge` workflow runs for release/changelog PRs too (moves linked issues to Done). Uses `FLOWY_PROJECT_TOKEN` (a PAT with `project` scope; set once via `gh auth token | gh secret set FLOWY_PROJECT_TOKEN`) falling back to `github.token`.

## 3. Shipping a release end-to-end (runbook)

Assumes the feature PRs are already merged and CI is green.

1. **Wait for release-please** — `gh pr list --search "release"`. It appears within a minute or two; sometimes it takes several code merges before one is warranted.
2. **Review the release PR** — confirm the version bump and changelog contain the expected user-facing commits.
3. **Merge it (after user confirmation)** — `gh pr merge <n> --squash --delete-branch`.
4. **Verify the deploy chain:**
   ```bash
   gh run list --branch main --limit 5           # expect: Release (success), CI (success), Sync changelog data
   gh run list --branch main --workflow production-smoke.yml --limit 2
   curl -sf https://flowy-jade.vercel.app/api/health   # {"status":"healthy","database":"connected"}
   curl -s -o /dev/null -w "%{http_code}\n" https://flowy-jade.vercel.app/   # 200 or 307 = up
   ```
   The **changelog sync PR must deploy** — the in-app "What's new" sheet reads `src/lib/changelog/generated.json`, so production only shows the new entries once the sync commit deploys.
5. **Sync local:** `git checkout main && git pull`.

## 4. Auto-deploy (the happy path)

- **Production:** every merge to `main` that touches deploy-relevant files triggers a Vercel production deployment (webhook, no human step). `scripts/vercel-ignore-build.mjs` gates it (§6).
- **Previews:** every PR branch gets a Vercel preview deployment; the URL is posted as a PR comment.
- **No approval gate on auto-deploys** — the protected `deploy-production` GitHub environment only gates the *manual* and *migration* workflows.

## 5. Manual fallbacks

**Manual Deploy** (`.github/workflows/deploy-manual.yml`, `workflow_dispatch`) deploys any ref to `production` or `preview`:

- **Inputs:** `environment` (production | preview), `ref` (branch/tag/SHA, default `main`).
- **Production runs in the protected `deploy-production` environment:** a **required reviewer must approve** the run in the Actions tab, and only `main` refs are allowed. Preview deploys are unapproved.
- Requires secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- After deploying it **health-checks** `/api/health` (5 attempts × 30s) and fails the job if it never returns healthy + database connected.
- **When to use:** auto-deploy was skipped by the ignore script but you still want a deploy, or an auto-deploy failed and you want to re-run the same ref.

**Migrate production** (`.github/workflows/migrate-production.yml`, `workflow_dispatch`, input `confirm` must be **APPLY**):

- Runs `pnpm prisma migrate deploy` against production, in the protected `deploy-production` environment with `DATABASE_URL` from secrets — needs a required reviewer approval.
- **Do not use `pnpm db:push` against Supabase** — cross-schema references can break introspection. Schema changes ship as numbered SQL migrations in `supabase/migrations/` (RLS + realtime) **and** the matching Prisma schema update.

## 6. `[skip deploy]` and the Vercel ignore script

`scripts/vercel-ignore-build.mjs` (Vercel `ignoreCommand`) skips a deployment when:

- The commit is the **release-please metadata commit** (§2), **or**
- The commit message contains `[skip deploy]` **and** the changed files contain **no deploy-relevant changes**.

Deploy-relevant = anything under `src/`, `public/`, `prisma/`, `supabase/`, `scripts/`, `.ts/.tsx/.js/.jsx/.mjs/.cjs/.css/.prisma/.json` anywhere, plus `package.json`, `pnpm-lock.yaml`, `vercel.json`. Docs/README/workflow/skill-only commits may carry `[skip deploy]`.

**Never use `[skip deploy]` for application, dependency, database, or deployment-configuration changes** — the script refuses to skip those, and hiding them would silently break production.

## 7. Database migrations (release-time)

Two separate paths — do not confuse them:

- **Prisma migrations** → `Migrate production` (§5): `pnpm prisma migrate deploy` in the right environment.
- **Supabase SQL migrations** (`supabase/migrations/`) are applied in their controlled order **before** dependent code deploys.

A PR that changes `prisma/schema.prisma` or adds a `supabase/migrations/` file must state the apply order and rollback plan in its test plan (CI enforces the disclosure). When a release carries schema changes: apply the Supabase SQL migrations, run `Migrate production` (approval + `APPLY`), then let the code deploy.

---

## 8. Gotchas & failure modes

| Symptom | Likely cause | Action |
| --- | --- | --- |
| No release PR after a merge | Merge had no `feat`/`fix`/`perf`/breaking commits | Nothing to do; it rides along in the next release |
| Release merged but no production deploy | Release metadata commit — intentionally skipped | Wait for the changelog-sync PR to deploy (it must deploy) |
| `/api/health` failing after deploy | DB down, env misconfigured, bad migration | Check `Migrate production`/Supabase migrations; re-deploy via Manual Deploy |
| Deploy failed in Actions | Vercel build error, secrets missing | Read the failed run; fix and re-run, or Manual Deploy the same ref |
| A release PR needs merging | Standard flow | Ask the user before merging (bot PRs exempt from conventions, not from the merge rule) |
| Changelog sync PR didn't open | Data didn't drift, or already open for this version | Check `Sync changelog data` run; `workflow_dispatch` backfill exists |

Related skills: `github-workflow` (branch → PR → merge), `github-issues` (create/link issues), `github-project-board` (Flowy board triage).
