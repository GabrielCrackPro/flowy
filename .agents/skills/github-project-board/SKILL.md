---
name: github-project-board
description: Work with the Flowy GitHub Projects v2 board (read items, statuses, and fields; triage or update status) using the authenticated gh CLI. Use when asked to check, summarize, triage, or update the project board, roadmap, or kanban for this repo, or to read the "Flowy" GitHub project.
metadata:
  author: local
  version: "1.0.0"
  argument-hint: <action> [issue-number | status]
---

# GitHub Project Board (Flowy)

Read and update the **Flowy** GitHub Projects v2 board (`https://github.com/users/GabrielCrackPro/projects/1`) through the `gh` CLI.

## Setup facts (verified)

- Repo: `GabrielCrackPro/flowy` (public, default branch `main`)
- Board: **"Flowy"**, project number `1`
- Project node ID: `PVT_kwHOAoO6As4BfwO_`
- Auth: `gh` OAuth token in the Windows keyring, scopes include `repo` + `project` (covers both reading and updating the board)

**IMPORTANT — gh binary location:** fresh agent shells may not have `gh` on PATH yet. Always use the full path or export it first:

```bash
export GH=~/ghcli/bin/gh.exe
```

If `gh` is on PATH, plain `gh` works. Verify auth once with `$GH auth status`.

## Board reference (verified 2026-08-10)

**Status field** (single-select) — field ID `PVTSSF_lAHOAoO6As4BfwO_zhaA4l4`:

| Option | Option ID |
|---|---|
| Backlog (was Idea) | `29a1f406` |
| Ready (was Pending) | `68a4ccdc` |
| In Progress | `47fc9ee4` |
| Done | `98236657` |
| Blocked | `0c552fd9` |

Other board fields: Title, Assignees, Labels, Linked pull requests, Milestone, Repository, Reviewers, Parent issue, Sub-issues progress, Created, Updated, Closed.

**Custom fields** (all settable via `updateProjectV2ItemFieldValue` with `fieldId` + `singleSelectOptionId` / `iterationId`):

- **Effort** (S/M/L/XL) — field `PVTSSF_lAHOAoO6As4BfwO_zhaKNHY`: S `c5b1d4d3`, M `fa75e593`, L `687d75ec`, XL `172a5f53`
- **Type** (Frontend/Backend/Full-stack/DevOps/Docs) — field `PVTSSF_lAHOAoO6As4BfwO_zhaKNHc`: Frontend `b2cce8e4`, Backend `911ebdb5`, Full-stack `16078ad0`, DevOps `cc380ec3`, Docs `cd4d77fd`
- **Iteration** (rolling 7-day cycles, Mon–Sun) — field `PVTIF_lAHOAoO6As4BfwO_zhaKNHg`: Cycle 1 `dda595fe` (2026-08-10), Cycle 2 `db803409` (2026-08-17), Cycle 3 `560f59c0` (2026-08-24). **Gotcha:** rewriting the iteration configuration via `updateProjectV2Field` regenerates iteration IDs and silently drops item assignments — re-apply `iterationId` values afterwards.

**Views:** Tasks (board, id `PVTV_lAHOAoO6As4BfwO_zgLPLHI`), Frontend (board, filter `Type:Frontend`, id `PVTV_lAHOAoO6As4BfwO_zgLPM14`), Backend (board, filter `Type:Backend`, id `PVTV_lAHOAoO6As4BfwO_zgLPM6c`), Sprints (table, id `PVTV_lAHOAoO6As4BfwO_zgLQVEM`). All show Title, Status, Effort, Type, Iteration, Assignees, Labels. Grouping is UI-only — the API (`createProjectV2View`/`updateProjectV2View`) supports only `name`, `layout`, `filter`, and `visibleFieldIds`.

## 1. List the user's projects

```bash
$GH api graphql -f query='{ viewer { projectsV2(first: 20) { nodes { title number url } } } }'
```

## 2. Read the board (items + Status, like the MCP `projects_list`)

```bash
$GH api graphql -f query='{ user(login: "GabrielCrackPro") { projectV2(number: 1) { title fields(first: 30) { nodes { ... on ProjectV2FieldCommon { name } } } items(first: 50) { nodes { content { __typename ... on Issue { title number state } ... on PullRequest { title number state } } fieldValues(first: 15) { nodes { ... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2FieldCommon { name } } } ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2FieldCommon { name } } } } } } } } } }'
```

Summarize results grouped by the `Status` value (Backlog / Ready / In Progress / Done / Blocked). Note `fieldValues` entries are ordered like the board's columns; match on the `field.name` key, not position.

## 3. Resolve an item's node ID (needed to update it)

Items are addressed by **GraphQL node ID**, which differs from the issue number. Resolve it first:

```bash
$GH api graphql -f query='{ user(login: "GabrielCrackPro") { projectV2(number: 1) { items(first: 50) { nodes { id content { ... on Issue { number title } ... on PullRequest { number title } } } } } }'
```

## 4. Update an item's Status

Requires the **`project`** write scope (reads only need `read:project`). If the token lacks it, run `gh auth refresh -s project` (one-time browser authorization). **Always confirm with the user before mutating the board.**

```bash
$GH api graphql -f query='
mutation {
  updateProjectV2ItemFieldValue(
    input: {
      projectId: "PVT_kwHOAoO6As4BfwO_"
      itemId: "<ITEM_NODE_ID>"
      fieldId: "PVTSSF_lAHOAoO6As4BfwO_zhaA4l4"
      value: { singleSelectOptionId: "<OPTION_ID>" }
    }
  ) {
    projectV2Item { id }
  }
}'
```

Example — move issue #14 ("[W] Set up OAuth") to In Progress: resolve its node ID via step 3, then run the mutation with `itemId` = that node ID and `singleSelectOptionId` = `47fc9ee4`.

## 5. Common operations (worked examples, repo `GabrielCrackPro/flowy`)

Labels in use: `WEB` (frontend), `BACK` (backend), `Priority: Lowest/Low/Medium/High/Highest`, `DevOps`.

### 5.1 List issues by label

```bash
$GH issue list -R GabrielCrackPro/flowy --label WEB --state all --limit 100 --json number,title,state,labels
```

Combine labels to narrow (e.g. `--label WEB --label "Priority: High"`).

### 5.2 View an issue and get its node ID

```bash
$GH issue view 14 -R GabrielCrackPro/flowy --json number,id,title,state,labels
```

Returns the issue's **content node ID** (used by `addProjectV2ItemById`).

### 5.3 Create an issue (write — confirm with user first)

```bash
$GH issue create -R GabrielCrackPro/flowy --title "[W] New feature" --label WEB,"Priority: Low" --body "Description"
```

### 5.4 Add an issue to the Flowy board (write — confirm first)

Get the issue's content node ID via 5.2, then:

```bash
$GH api graphql -f query='
mutation {
  addProjectV2ItemById(
    input: {
      projectId: "PVT_kwHOAoO6As4BfwO_"
      contentId: "<ISSUE_NODE_ID>"
    }
  ) { item { id } }
}'
```

(Syntax + `project` scope verified; use a real `I_kw...` content ID.)

### 5.5 Move an issue to a Status (full walkthrough)

Example: set issue #14 to **In Progress**.

1. Get its content node ID: `$GH issue view 14 -R GabrielCrackPro/flowy --json id`
2. Resolve the **board item** node ID (different from the content ID!) with the step 3 query, matching on `content.number == 14`
3. Run the step 4 mutation with `itemId` = that node ID and `singleSelectOptionId` = `47fc9ee4` (In Progress)

### 5.6 Cross-reference issues vs. board

Pull the board via step 2 and issues via 5.1, then compare `content.number` sets to answer questions like "which open WEB issues are NOT on the board?"

## Gotchas

- **Two different node IDs:** the *content* node ID (from `gh issue view --json id`, used to *add* items) differs from the *project item* node ID (from the step 3 items query, used to *update* items). Don't mix them up.
- Board statuses live in the `Status` field; match field values by `field.name`, not by array position.

## Guardrails

- **Read-only by default.** Reads (steps 1–3) are always safe; writes (step 4) only after explicit user confirmation.
- Never reorder, delete, or add items unless asked directly.
- Scope errors: reads need `read:project`; writes need `project`. Fix with `gh auth refresh -s read:project` or `gh auth refresh -s project` (one-time browser authorization each).
- The board may change between sessions — always re-fetch rather than relying on stale IDs.
