---
name: github-workflow
description: The complete flowy shipping workflow, end to end — pull latest main, create a branch, commit with conventional commits and the `[skip deploy]` rule, open a PR, merge only after explicit user confirmation, then release-please versioning, Vercel auto-deploy, production verification, manual deploy/migration fallbacks, and failure modes. Use when asked to "start a branch", "make a PR", "commit this", "ship/merge this", "release", "deploy", "bump the version", or "verify the production deploy".
metadata:
  author: local
  version: "2.0.0"
  argument-hint: <change-or-task-brief | step-or-context>
---

# Shipping Flowy (end-to-end)

Flowy ships continuously. A change flows **new branch → commit → push → PR → merge**, then `release-please` turns the accumulated conventional commits into versioned releases, and Vercel auto-deploys every merge to `main`.

**The one rule that never changes: never merge without explicit user confirmation.**

**Production URL:** https://flowy-jade.vercel.app · **Health:** `/api/health` (database-backed, returns `{ "status": "healthy", "database": "connected" }`)

## Lifecycle at a glance

```
pull latest main → branch (<type>/<kebab-slug>) → commit (conventional, optional [skip deploy])
→ push → open PR (Closes #N) → CI green → [user says merge] → squash merge + delete branch
   → verify production deploy (skip if [skip deploy]) → sync local main
   → release-please watches main → release PR (only feat/fix/perf/breaking)
   → [user says merge] → version bump + changelog + GitHub release
   → changelog-sync PR deploys → production smoke checks /api/health
```

---

## 1. Preflight

```bash
export GH=~/ghcli/bin/gh.exe   # gh is on PATH in new shells; use the full path in fresh agent shells
git status --short             # confirm the working tree is clean before branching
git config core.hooksPath      # should print `.githooks` (set automatically by `pnpm install` via the `prepare` script)
```

- If `core.hooksPath` is empty, run `pnpm install` once to install the hooks.
- Pull the latest main before branching: `git checkout main && git pull --rebase origin main`.
- **Fast commits:** the pre-commit hook runs lint-staged always, but `pnpm typecheck` **only when the commit touches TypeScript files** (docs/config/JSON-only commits skip it — CI typechecks every PR regardless). A generous timeout (≥60s) is wise through automation; a timeout mid-hook aborts without creating the commit, so it's safe to re-run.
- **Bot PRs are exempt** from the branch-name/issue-link guardrails (CI skips any author ending in `[bot]`): `dependabot[bot]` (dependency bumps), `github-actions[bot]` (e.g. release-please PRs created with `GITHUB_TOKEN` — the actual author of release PRs, not `release-please[bot]`), and `release-please[bot]`. Don't try to make them follow human conventions.

## 2. New branch

- Base: `main` — pull latest first (`git checkout main && git pull`).
- **Naming:** `<type>/<short-kebab-slug>` where `<type>` matches the conventional-commit type, e.g. `feat/add-budget-export`, `fix/amount-input-parsing`, `chore/docs-audit`, `refactor/entity-sheet`.
- Create it: `git checkout -b <branch>`.
- If uncommitted changes belong to the task, branch with them (they carry over); if unrelated, stash first and say so.
- If a commit ever lands on local `main`, move it onto a branch (`git checkout -b <type>/<kebab-slug>`) and reset `main` back to `origin/main` before doing anything else.

## 3. Commit

- **Format:** conventional commits — `type(scope): subject`, e.g. `feat(export): add CSV download`, `fix(auth): refresh session on redirect`. Enforced by the local `commit-msg` hook and CI. Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `ci`, `perf`, `test`.
- The pre-commit hook runs Biome (lint-staged) automatically, plus `pnpm typecheck` when the commit touches TypeScript; a failure aborts the commit — fix it, don't bypass.
- **`[skip deploy]` rule:** append `[skip deploy]` to the commit message only when the change contains **no deploy-relevant changes** (docs, README, workflows, `.env.example`, skill files), e.g. `docs: update README [skip deploy]`. Full detail in §12 — **never** use it for application, dependency, database, or deployment-configuration changes.
- Multi-commit PRs: one conventional message per commit; Vercel checks the final commit and its changed paths, so a skip marker cannot hide code changes.
- If you can't tell whether a change is code vs. non-code, ask the user before committing.

## 4. Push & open the PR

```bash
git push -u origin <branch>
$GH pr create \
  --base main \
  --head <branch> \
  --title "<conventional type>: <summary>" \
  --body-file <pr-body.md> \
  --label <area-label> --label "<Priority: X>" \
  --assignee "@me"
```

- **Title** must be conventional (CI validates it) and concise (< ~70 chars). Prefix from the issue's labels (`[W]`, `[B]`, `[B][W]`, `[DevOps]`).
- **Body:** use `.github/PULL_REQUEST_TEMPLATE.md`; reference the issue with `Closes #N` (issue numbers via the `github-issues` skill). This is what drives the automated board update.
- **Labels:** area label + priority label matching the linked issue (`WEB` / `BACK` / `DevOps` + `Priority: ...`).
- After creating, report the PR URL and watch CI: `$GH pr checks <branch> --watch`. Do not recommend merging until CI is green.

### PR gates that must be green before merge

"Block main" requires five status checks (strict/up-to-date — a PR must be revalidated against current `main`). **Never rename these jobs without updating the ruleset:**

- **Lint, Typecheck & Build** (`ci.yml` — always reports; typecheck/build skip for docs-only PRs)
- **API Docs (OpenAPI drift + lint)** (`ci.yml` — `pnpm generate:openapi` must not drift `public/openapi.json`, then Redocly lint + route-inventory guard)
- **Changelog (drift guard)** (`ci.yml` — regenerates `src/lib/changelog/generated.json` from `CHANGELOG.md`, fails on drift; bot PRs exempt)
- **🛡️ Branch & PR conventions** (`ci.yml` guardrails — branch regex, issue link, migration disclosure; bot PRs exempt)
- **📝 Conventional commits** (`commit-conventions.yml` — PR title via `action-semantic-pull-request` **and** commit messages via commitlint; listens to `edited` too)

## 5. Merging — ALWAYS ASK FIRST

**Never merge without explicit user confirmation.** When the user says merge:

```bash
$GH pr merge <branch> --squash --delete-branch
```

- Prefer `--squash` so the merge commit message equals the PR title (conventional, passes CI).
- Before merging, confirm: CI green, tests/manual plan done, no open review comments, and (for schema changes) the migration has been applied or is scheduled.
- Merge method is **squash-only** (repo ruleset); `delete_branch_on_merge` is on, so branches die on merge.

## 6. After the feature merge

1. **Board update is automated** — `Update Board on Merge` (`.github/workflows/board-update.yml`) parses `Closes/Fixes/Resolves #N` from the merged PR and moves those issues to **Done** on the Flowy board. No manual step.
2. **Verify the production deploy** (unless the branch used `[skip deploy]`): `gh run list --branch main --limit 3` and, once the deploy finishes, smoke-test https://flowy-jade.vercel.app (HTTP 200) and `/api/health`.
3. **Sync local:** `git checkout main && git pull`.

---

## 7. When a release triggers (release-please)

`.github/workflows/release-please.yml` runs on every push to `main` (and `workflow_dispatch`):

- **A release is created only when the merge contains `feat`, `fix`, `perf`, or breaking-change commits.** `docs`/`chore`/`ci`/`refactor`/`test` sections are `hidden: true` in `release-please-config.json`, so those merges produce **no release** — release-please logs "No user facing commits found" and the changes ride along in the next real release.
- **Do not expect a release PR after docs/CI-only merges.** If one was expected and none appeared, the merge likely had no release-worthy commits (`git log --oneline -3 origin/main`).
- **Versioning while < 1.0** (`bump-minor-pre-major` + `bump-patch-for-minor-pre-major`): a `feat` is a **minor** (`0.1.x → 0.2.0`), a `fix`/`perf` is a **patch** (`0.1.36 → 0.1.37`), breaking changes flip to the next major. Current version: `.release-please-manifest.json`.
- Release-please **opens a PR** (e.g. `chore(main): release flowy 0.1.37`); it does **not** merge it. Merging bumps the version, rewrites `CHANGELOG.md`, creates the GitHub release + tag, and — via `extra-files` — writes the new version into `$.currentVersion` of `src/lib/changelog/generated.json`.
- Release PRs are **bot-authored** (`github-actions[bot]` is the actual author for GITHUB_TOKEN runs), so they're exempt from branch/issue conventions — but the **ask-before-merge rule still applies**.

## 8. The deploy pipeline after a release merge

Merging the release PR (`chore(main): release flowy X.Y.Z`) triggers, in order:

1. **CI push re-verification** — `ci.yml` re-runs on the merged commit, but only when the merge touched code/config (the `paths` filter). Inside `Lint, Typecheck & Build`, typecheck/build are skipped for docs/config-only merges ("Detect code changes" step); `Lint` always runs. The push-trigger `paths` list and the code-change regex are kept in sync by `scripts/check-ci-trigger-sync.mjs` (guardrails job) — **when you change one, change the other**.
2. **Release commit deploy is skipped** — `scripts/vercel-ignore-build.mjs` detects the `chore(main): release flowy` metadata commit and exits 0, so Vercel skips the intermediate redeploy. Deliberate and harmless.
3. **Changelog sync deploys** — `Sync changelog data` (`.github/workflows/sync-changelog.yml`) regenerates `src/lib/changelog/generated.json` (the in-app "What's new" data), opens a `chore: sync in-app changelog data` PR when it drifts, and **auto-merges** it. This commit deliberately does **not** carry `[skip deploy]` — production needs a redeploy to serve the new entries.
4. **Production smoke** — `Production smoke` (`.github/workflows/production-smoke.yml`) runs on every successful Vercel `Production` deployment and curls `/api/health` (5 attempts, 5s apart, `deployment_status` event).
5. **Board update** — the same `Update Board on Merge` workflow runs for release/changelog PRs too (moves linked issues to Done). Uses `FLOWY_PROJECT_TOKEN` (a PAT with `project` scope; set once via `gh auth token | gh secret set FLOWY_PROJECT_TOKEN`) falling back to `github.token`.

## 9. Shipping a release end-to-end (runbook)

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

## 10. Auto-deploy (the happy path)

- **Production:** every merge to `main` that touches deploy-relevant files triggers a Vercel production deployment (webhook, no human step). `scripts/vercel-ignore-build.mjs` gates it (§12).
- **Previews:** every PR branch gets a Vercel preview deployment; the URL is posted as a PR comment.
- **No approval gate on auto-deploys** — the protected `deploy-production` GitHub environment only gates the *manual* and *migration* workflows.

## 11. Manual fallbacks

**Manual Deploy** (`.github/workflows/deploy-manual.yml`, `workflow_dispatch`) deploys any ref to `production` or `preview`:

- **Inputs:** `environment` (production | preview), `ref` (branch/tag/SHA, default `main`).
- **Production runs in the protected `deploy-production` environment:** a **required reviewer must approve** the run in the Actions tab, and only `main` refs are allowed. Preview deploys are unapproved.
- Requires secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- After deploying it **health-checks** `/api/health` (5 attempts × 30s) and fails the job if it never returns healthy + database connected.
- **When to use:** auto-deploy was skipped by the ignore script but you still want a deploy, or an auto-deploy failed and you want to re-run the same ref.

**Migrate production** (`.github/workflows/migrate-production.yml`, `workflow_dispatch`, input `confirm` must be **APPLY**):

- Runs `pnpm prisma migrate deploy` against production, in the protected `deploy-production` environment with `DATABASE_URL` from secrets — needs a required reviewer approval.
- **Do not use `pnpm db:push` against Supabase** — cross-schema references can break introspection. Schema changes ship as numbered SQL migrations in `supabase/migrations/` (RLS + realtime) **and** the matching Prisma schema update.

## 12. `[skip deploy]` and the Vercel ignore script

`scripts/vercel-ignore-build.mjs` (Vercel `ignoreCommand`) skips a deployment when:

- The commit is the **release-please metadata commit** (§8), **or**
- The commit message contains `[skip deploy]` **and** the changed files contain **no deploy-relevant changes**.

Deploy-relevant = anything under `src/`, `public/`, `prisma/`, `supabase/`, `scripts/`, `.ts/.tsx/.js/.jsx/.mjs/.cjs/.css/.prisma/.json` anywhere, plus `package.json`, `pnpm-lock.yaml`, `vercel.json`. Docs/README/workflow/skill-only commits may carry `[skip deploy]`.

**Never use `[skip deploy]` for application, dependency, database, or deployment-configuration changes** — the script refuses to skip those, and hiding them would silently break production.

## 13. Database migrations (release-time)

Two separate paths — do not confuse them:

- **Prisma migrations** → `Migrate production` (§11): `pnpm prisma migrate deploy` in the right environment.
- **Supabase SQL migrations** (`supabase/migrations/`) are applied in their controlled order **before** dependent code deploys.

A PR that changes `prisma/schema.prisma` or adds a `supabase/migrations/` file must state the apply order and rollback plan in its test plan (CI enforces the disclosure). When a release carries schema changes: apply the Supabase SQL migrations, run `Migrate production` (approval + `APPLY`), then let the code deploy.

---

## 14. Guardrails

- **Merge requires explicit user approval — always.**
- Pushing a branch and opening a PR is a remote write: state clearly what you're creating and why; if anything is ambiguous (labels, base branch, issue link), ask first.
- Never force-push to shared branches; never delete branches other than the one you created.
- Keep commit messages honest: a `[skip deploy]` on real code changes would silently skip the production deploy.
- PR titles and commit messages must describe the change itself — never "ship", "deploy", "release", "land", or any delivery-process synonym.
- Use `github-issues` to create/link issues and `github-project-board` to update the Flowy board if the task asks for it.
- release-please PRs are exempt from branch-name conventions but **not** from the ask-before-merge rule. (Dependabot is disabled.)

## 15. Gotchas & failure modes

**Guardrail "feat PRs must link an issue"** — `ci.yml`'s default `pull_request` trigger only fires on opened/synchronize/reopened, so **editing the PR body does NOT re-run it**. After adding `Closes #N`, re-run the failed job manually: `gh run rerun <run-id> --job <failed-job-id>` (the guardrails script reads the body at execution time). For a batch that spans an already-closed issue, reopen it or link it as a continuation (CI accepts a reference to a closed issue).

| Symptom | Likely cause | Action |
| --- | --- | --- |
| No release PR after a merge | Merge had no `feat`/`fix`/`perf`/breaking commits | Nothing to do; it rides along in the next release |
| Release merged but no production deploy | Release metadata commit — intentionally skipped | Wait for the changelog-sync PR to deploy (it must deploy) |
| Guardrail: "feat PRs must link an issue" | PR body has no `Closes/Fixes/Resolves #N` | Add the link, then `gh run rerun <run> --job <id>` (body edits don't re-trigger CI) |
| `/api/health` failing after deploy | DB down, env misconfigured, bad migration | Check `Migrate production`/Supabase migrations; re-deploy via Manual Deploy |
| Deploy failed in Actions | Vercel build error, secrets missing | Read the failed run; fix and re-run, or Manual Deploy the same ref |
| A release PR needs merging | Standard flow | Ask the user before merging (bot PRs exempt from conventions, not from the merge rule) |
| Changelog sync PR didn't open | Data didn't drift, or already open for this version | Check `Sync changelog data` run; `workflow_dispatch` backfill exists |

## 16. Quick reference

```bash
export GH=~/ghcli/bin/gh.exe
git checkout main && git pull                            # latest main
git checkout -b <type>/<kebab-slug>                      # branch
git commit -m "<type>(<scope>): subject [skip deploy]"   # commit (skip marker optional)
git push -u origin <branch>                              # push
$GH pr create --base main --head <branch> --title "…" --body-file <pr-body.md> --label <area> --label "<Priority: X>" --assignee "@me"
$GH pr checks <branch> --watch                           # wait for CI
$GH pr merge <branch> --squash --delete-branch           # merge (after user confirmation)
gh run list --branch main --limit 5                      # release / CI / changelog-sync runs
gh run list --branch main --workflow production-smoke.yml --limit 2
curl -sf https://flowy-jade.vercel.app/api/health
git checkout main && git pull                            # sync local
```

Related skills: `github-issues` (create/link issues), `github-project-board` (Flowy board triage), `write-issues` (draft an issue in chat).
