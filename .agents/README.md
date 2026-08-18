# Agents

Dedicated agents for Flowy, defined as TypeScript `AgentDefinition` exports in this directory (`.agents/*.ts`). The main agent can spawn them by `id`.

## Layout

- `types/agent-definition.ts` — the `AgentDefinition` type (editor/tsc safety only).
- `frontend-engineer.ts` — components, styling, i18n, a11y, mobile/PWA, offline/realtime client.
- `backend-engineer.ts` — API routes, services, Prisma, Supabase migrations, rate limiting, errors.
- `reviewer.ts` — read-only pre-merge review.
- `shipper.ts` — ships a change end-to-end: branch → PR → ask-before-merge → release/deploy.

## Conventions

- Each file default-exports an `AgentDefinition` with a unique kebab-case `id`.
- Reference knowledge lives in `.agents/skills/` and is read via `read_files` when needed — agents do not inline the whole design system.
- Models default to the Freebuff model (`deepseek/deepseek-v4-flash`); change per-agent if needed.
- `spawnableAgents` references local agents by id (e.g. `["reviewer"]`).

## Creating an agent

1. Copy the shape of an existing `*.ts`.
2. Keep `systemPrompt` short (identity + which skills to read).
3. Put the step-by-step workflow in `instructionsPrompt`.
4. List other local agents in `spawnableAgents` when relevant.
