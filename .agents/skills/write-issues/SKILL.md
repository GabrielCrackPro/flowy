---
name: write-issues
description: Given a task brief, produce a complete, well-structured GitHub issue (title + body) that follows the project's engineering task template. Use when asked to "write an issue", "create an issue", "file a bug", "draft a ticket", "turn this into a GitHub issue", or when handed a task brief to structure into an engineering issue.
metadata:
  author: flowy
  version: "1.0.0"
  argument-hint: <task-brief-or-description>
---

# Write Issues

Turn a brief task description into a complete, copy-paste-ready GitHub issue that follows the project's template at `.github/ISSUE_TEMPLATE/engineering-task.yml`.

## Input

- A task brief: a sentence, paragraph, or rough description of work to be done.
- Any context already in the conversation: related files, the stack, existing conventions, prior discussion. Use it to make the issue concrete.

## Process

1. **Read the template** at `.github/ISSUE_TEMPLATE/engineering-task.yml` and mirror its sections exactly. The issue must fill every section the template defines.
2. **Parse the brief** into the template's sections:
   - *Summary* — what needs to be done and why. Lead with the user-visible problem or outcome, then the proposed work.
   - *Acceptance Criteria* — concrete, independently verifiable outcomes, one per bullet. If the brief is vague on criteria, draft plausible ones and flag them as assumptions.
   - *Steps to Reproduce* — only include when the brief describes a bug. Order steps 1., 2., 3. and state expected vs. actual behavior.
   - *Technical Notes* — map the brief onto the codebase when you can identify the relevant files, services, or areas (e.g., a specific hook, API route, or migration). Note implementation approach, constraints, and anything non-obvious.
   - *Definition of Done* — the template's checklist (acceptance criteria met, code reviewed, `pnpm typecheck`/`pnpm lint` passing, build succeeding). Preserve it as-is; nothing for the user to fill.
   - *Area & Priority* — recommend values for the template's dropdowns. Map the brief to an area using the repo's conventions: UI components, hooks, pages, charts, or styling → `WEB`; API routes, services, Prisma schema, or Supabase migrations → `BACK`; workflows, deployment, environment, or infrastructure → `DevOps`. Suggest a priority from `Priority: Lowest` to `Priority: Highest` based on the brief's impact and urgency.
3. **Title conventions**: imperative mood, concise (under ~70 characters), no trailing period. Use the template's `[Task]: ` prefix by default; use `[Bug]: ` when the brief clearly describes a bug.
4. **Ask before assuming**: if the brief is too vague to write acceptance criteria or a summary, ask the user one focused clarifying question rather than inventing the whole scope.
5. **Output the issue** as a single fenced markdown block so it can be copied straight into GitHub. Start the block with the recommended **Area** and **Priority** (e.g. `Area: WEB — Priority: Medium`) so the user can set the template's dropdowns in one glance. After the block, list anything you assumed or inferred so the user can correct it.

## Rules

- Draft the issue in the chat response only — do not create the issue in GitHub, open the repo, or call any git/GitHub commands.
- Keep the language of the issue consistent with the user's brief and the project's conventions.
- Do not pad the issue with fluff. Omit a section only when the brief gives it nothing to work with — e.g., no *Steps to Reproduce* when the brief describes no bug. Otherwise fill every section the template defines.
- If the template changes, the issue must follow the current version of the file — re-read it each time.
