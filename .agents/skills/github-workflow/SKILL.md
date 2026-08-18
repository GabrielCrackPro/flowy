---
name: github-workflow
description: The Flowy ship path — pull latest main, branch, commit with conventional commits, push, open a PR, and merge only after explicit user confirmation. Use when asked to "start a branch", "make a PR", "commit this", or "merge this". Load `release-deploy` when the task reaches release, deploy, or migration territory.
metadata:
  author: local
  version: "3.0.0"
  argument-hint: <change-or-task-brief | step-or-context>
---

# Shipping Flowy (branch → PR → merge)

Flowy ships continuously: **new branch → commit → push → PR → merge**, then `release-please` turns the accumulated conventional commits into versioned releases and Vercel auto-deploys every merge to `main`. This skill covers only that path. Release versioning, the deploy chain, manual deploy/migration fallbacks, and the `[skip deploy]` rule live in the **`release-deploy`** skill — load it once you're past the merge.

**The one rule that never changes: never merge without explicit user confirmation.**

**Production URL:** https://flowy-jade.vercel.app · **Health:** `/api/health` (database-backed, returns `{ "status": "healthy", "database": "connected" }`)

```text
pull latest main → branch (<type>/<kebab-slug>) → commit (conventional, optional [skip deploy])
→ push → open PR (Closes #N) → CI green → [user says merge] → squash merge + delete branch
   → sync local main  →  (see release-deploy for what happens next)
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
- **`[skip deploy]` rule:** append `[skip deploy]` only for changes with **no deploy-relevant content** (docs, README, workflows, `.env.example`, skill files). Full definition of "deploy-relevant" and the Vercel ignore script are in `release-deploy` — **never** use it for application, dependency, database, or deployment-configuration changes.
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
2. **Sync local:** `git checkout main && git pull`.
3. **Deploy/release follow-ups** — verify the production deploy and watch for a release-please PR per the `release-deploy` skill (skip deploy verification if the branch used `[skip deploy]`).

---

## 7. Guardrails

- **Merge requires explicit user approval — always.**
- Pushing a branch and opening a PR is a remote write: state clearly what you're creating and why; if anything is ambiguous (labels, base branch, issue link), ask first.
- Never force-push to shared branches; never delete branches other than the one you created.
- Keep commit messages honest: a `[skip deploy]` on real code changes would silently skip the production deploy.
- PR titles and commit messages must describe the change itself — never "ship", "deploy", "release", "land", or any delivery-process synonym.
- Use `github-issues` to create/link issues and `github-project-board` to update the Flowy board if the task asks for it.

## 8. Quick reference & top gotcha

```bash
export GH=~/ghcli/bin/gh.exe
git checkout main && git pull                            # latest main
git checkout -b <type>/<kebab-slug>                      # branch
git commit -m "<type>(<scope>): subject [skip deploy]"   # commit (skip marker optional)
git push -u origin <branch>                              # push
$GH pr create --base main --head <branch> --title "…" --body-file <pr-body.md> --label <area> --label "<Priority: X>" --assignee "@me"
$GH pr checks <branch> --watch                           # wait for CI
$GH pr merge <branch> --squash --delete-branch           # merge (after user confirmation)
git checkout main && git pull                            # sync local
```

**Guardrail "feat PRs must link an issue"** — `ci.yml`'s default `pull_request` trigger only fires on opened/synchronize/reopened, so **editing the PR body does NOT re-run it**. After adding `Closes #N`, re-run the failed job manually: `gh run rerun <run-id> --job <failed-job-id>` (the guardrails script reads the body at execution time). For a batch that spans an already-closed issue, reopen it or link it as a continuation (CI accepts a reference to a closed issue).

Related skills: `release-deploy` (release/deploy/migration after merge), `github-issues` (create/link issues), `github-project-board` (Flowy board triage), `write-issues` (draft an issue in chat).
