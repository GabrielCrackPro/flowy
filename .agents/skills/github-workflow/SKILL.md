---
name: github-workflow
description: Drive the flowy GitHub workflow end-to-end: create a branch, commit with conventional commits (adding "[skip deploy]" for non-code changes so Vercel skips the production deploy), open a pull request to main, and merge only after explicit user confirmation. Use when asked to "start a branch", "make a PR", "commit this", "open a pull request", or "ship/merge this change".
metadata:
  author: local
  version: "1.0.0"
  argument-hint: <change-or-task-brief>
---

# GitHub Workflow (flowy)

Standard workflow for shipping changes to `GabrielCrackPro/flowy`. The flow is always:

**new branch → commit → push → open PR to `main` → ask before merging.**

## Preflight

```bash
export GH=~/ghcli/bin/gh.exe   # gh is on PATH in new shells, but use the full path in fresh agent shells
git status --short             # confirm the working tree is clean before branching
git config core.hooksPath      # should print `.githooks` (set automatically by `pnpm install` via the `prepare` script)
```

- If `core.hooksPath` is empty, run `pnpm install` once to install the hooks.
- Pull the latest main before branching: `git checkout main && git pull --rebase origin main`.
- **Slow commits:** the pre-commit hook runs lint-staged **and a full `pnpm typecheck`** (~1–2 min). When running `git commit` through automation, use a generous timeout (≥180s). A timeout mid-hook aborts the commit without creating it — it is safe to simply re-run.
- **Bot PRs are exempt** from the branch-name/issue-link guardrails (CI handles them): `dependabot[bot]` (dependency bumps) and `release-please[bot]` (release PRs). Don't try to make them follow human conventions.

## 1. New branch

- Base: `main` — pull latest first: `git checkout main && git pull`.
- **Naming:** `<type>/<short-kebab-slug>` where `<type>` matches the conventional-commit type, e.g. `feat/add-budget-export`, `fix/amount-input-parsing`, `chore/docs-audit`, `refactor/entity-sheet`.
- Create it: `git checkout -b <branch>`.
- If there are uncommitted changes that belong to the task, branch with them (`git checkout -b <branch>` keeps them on the new branch); if they're unrelated, stash first and say so.

## 2. Commit

- **Format:** conventional commits — `type(scope): subject`, e.g. `feat(export): add CSV download`, `fix(auth): refresh session on redirect`. Enforced by the local `commit-msg` hook and CI (`commit-conventions.yml`). Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `ci`, `perf`, `test`.
- The pre-commit hook runs Biome + `pnpm typecheck` automatically; a failure aborts the commit — fix it, don't bypass.
- **`[skip deploy]` rule:** if the change contains **no code changes** (docs, screenshots, config-only, README, workflows, `.env.example`, skill files), append `[skip deploy]` to the commit message (e.g. `docs: update README [skip deploy]`). Vercel's `ignoreCommand` (`vercel.json`) greps the **latest** commit message and exits 0 (canceling the production deploy) when it matches — so put it in the latest commit of the branch. Real code changes must NOT include it.
- Multi-commit PRs: one conventional message per commit; the final commit message is what Vercel checks.
- If you can't determine whether the change is code vs. non-code, ask the user before committing.

## 3. Push & open the PR

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
- **Body:** use the project's `.github/PULL_REQUEST_TEMPLATE.md`; reference the issue with `Closes #N` (issue numbers are known via the `github-issues` skill).
- **Labels:** apply the area label + priority label matching the linked issue (`WEB` / `BACK` / `DevOps` + `Priority: ...`).
- After creating, report the PR URL and check CI: `$GH pr checks <branch> --watch` (ci.yml runs `pnpm lint`, `pnpm typecheck`, `pnpm build`). Do not recommend merging until CI is green.

## 4. Merging — ALWAYS ASK FIRST

**Never merge without explicit user confirmation.** When the user says merge:

```bash
$GH pr merge <branch> --squash --delete-branch
```

- Prefer `--squash` so the merge commit message equals the PR title (which is conventional and passes CI's semantic-PR check).
- Before merging, confirm: CI green, tests/manual plan done, no open review comments, and (for schema changes) the migration has been applied or is scheduled (`pnpm prisma migrate deploy` in the right environment).
- After merging, the default branch update triggers Vercel deploy and CI automatically (unless `[skip deploy]` was in the message).

## 5. After merging

1. **Update the Flowy board** (via the `github-project-board` skill): resolve the linked issue's board-item node ID, then move its Status to **Done** (`singleSelectOptionId: "98236657"`). Confirm with the user first (board writes are confirmed writes).
2. **Verify the production deploy** (unless the branch used `[skip deploy]`): `gh run list --branch main --limit 3` and, once the deploy finishes, smoke-test https://flowy-jade.vercel.app (HTTP 200).
3. **Sync local:** `git checkout main && git pull`.
4. **Release PRs:** merging a `release-please[bot]` PR bumps the version + changelog and creates the GitHub release; it triggers a **no-op Vercel redeploy** (release commits can't carry `[skip deploy]`) — harmless, same code.

## Guardrails

- **Merge requires explicit user approval — always.**
- Pushing a branch and opening a PR is a remote write: state clearly what you're creating and why; if anything is ambiguous (labels, base branch, issue link), ask first.
- Never force-push to shared branches; never delete branches other than the one you created.
- Keep commit messages honest: a `[skip deploy]` on real code changes would silently skip the production deploy.
- Use the `github-issues` skill to create/link issues and `github-project-board` to update the Flowy board if the task asks for it.
- Dependabot and release-please PRs exist in this repo and are exempt from branch-name conventions — but still apply the ask-before-merge rule to them.
