---
name: github-issues
description: Create and update GitHub issues for the flowy repo with high-quality, code-grounded descriptions, following the project's engineering task template. Use when asked to "create an issue", "open a new issue", "file a task", "update/improve existing issues", or "write a ticket" for this project.
metadata:
  author: local
  version: "1.0.0"
  argument-hint: <task-brief | issue-number>
---

# GitHub Issues (flowy)

Create and maintain GitHub issues in `GabrielCrackPro/flowy` with descriptions that are grounded in the actual codebase, using the project's conventions. The quality bar: every issue leads with the user-visible outcome, has verifiable acceptance criteria, and points at the real files involved.

To draft an issue in chat without any GitHub writes, use the `write-issues` skill instead.

## Preflight

```bash
export GH=~/ghcli/bin/gh.exe
$GH auth status   # verify once; token lives in the Windows keyring (scopes: gist, project, read:org, repo)
```

## Conventions

- **Template**: mirror `.github/ISSUE_TEMPLATE/engineering-task.yml` — sections: Summary, Acceptance Criteria, Technical Notes, Definition of Done (+ Steps to Reproduce only for bugs).
- **Labels**: area — `WEB` (UI/hooks/pages/charts/styling), `BACK` (API routes/services/Prisma/Supabase migrations), `DevOps` (workflows/deploy/env); plus a `Priority: Lowest/Low/Medium/High/Highest` label.
- **Title**: imperative, `<70` chars, no trailing period, `[Task]: ` or `[Bug]: ` prefix matching the label mix (`[W]`, `[B]`, `[B][W]`, `[DevOps]`).
- **Definition of Done** (always): acceptance criteria met / code reviewed / `pnpm typecheck` / `pnpm lint` / `pnpm build`.
- **i18n**: any user-facing text must note both locales (`src/lib/i18n/locales/en.ts`, `es.ts`).

## Process

1. **Explore before writing.** Read the relevant files (pages, hooks, services, schemas) so every Technical Note references real paths. Never invent file paths — verify with a read or a code search first.
2. **Draft** the issue following the template below, grounded in the current code: note what already exists (so the issue doesn't re-ask for built features), the approach, and measurable acceptance criteria.
3. **Confirm scope** with the user before creating (title, area, priority). Then create:

```bash
$GH issue create -R GabrielCrackPro/flowy \
  --title "[W] Short imperative title" \
  --label WEB,"Priority: Medium" \
  --body-file .tmp/issue.md
```

To update an existing issue:

```bash
$GH issue edit 14 -R GabrielCrackPro/flowy --body-file .tmp/issue.md
$GH issue edit 14 -R GabrielCrackPro/flowy --add-label WEB --remove-label "Priority: Low"
```

4. **Add to the board** when relevant (load the `github-project-board` skill for IDs/commands): resolve the issue's content node ID with `$GH issue view <n> -R GabrielCrackPro/flowy --json id`, then `addProjectV2ItemById` with `projectId: "PVT_kwHOAoO6As4BfwO_"`.
5. Clean up draft files (`.tmp/`) after edits.

## Issue body template

```markdown
## Summary

What needs to be done and why. Lead with the user-visible problem or outcome,
then the proposed work. One or two sentences of current-state context.

## Acceptance Criteria

- [ ] Concrete, independently verifiable outcome
- [ ] Another criterion (include i18n, offline/realtime, and a11y where relevant)

## Technical Notes

- Relevant files: `src/...` (real paths, verified)
- What already exists and should be reused
- Approach, constraints, open questions

## Definition of Done

- [ ] Acceptance criteria met
- [ ] Code reviewed and approved
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
```

## Guardrails

- **Confirm before creating/editing** — these are public repo writes.
- Keep labels consistent with the template's Area/Priority options; don't invent new labels.
- Mention cross-dependencies between issues (e.g. #14 OAuth ↔ #9 sign-up defaults, #10 sessions).
- If the task is a bug, include Steps to Reproduce with expected vs. actual.
