---
name: supabase-postgres-best-practices
description: "Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including choosing column types), schema design, migrations and declarative schema files, RLS policies and the tests that verify them, indexes, triggers, database functions, queues and scheduled jobs (pg_cron, pgmq), vector/semantic search (pgvector), and restoring dumps (pg_restore) or importing data. Also load it when diagnosing slow queries, high CPU, timeouts, EXPLAIN plans, connection exhaustion, locking, bloat, or rows visible to the wrong user or tenant. This is not just a performance guide — schema, migration, security, and SQL authoring tasks need these rules too, even for a one-column change or a single query."
license: MIT
metadata:
  author: supabase
  version: "1.1.1"
  organization: Supabase
  date: January 2026
  abstract: Comprehensive Postgres performance optimization guide for developers using Supabase and Postgres. Contains performance rules across 8 categories, prioritized by impact from critical (query performance, connection management) to incremental (advanced features). Each rule includes detailed explanations, incorrect vs. correct SQL examples, query plan analysis, and specific performance metrics to guide automated optimization and code generation.
---

# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase. Contains rules across 8 categories, prioritized by impact to guide automated query optimization and schema design.

## Flowy specifics (read first)

This skill is generic upstream reference material. In **this** repo, apply every rule through these project facts:

- **ORM:** Flowy uses Prisma, not raw SQL. `prisma/schema.prisma` maps 1:1 to the SQL schema via `@map`/`@@map` (snake_case columns). The SQL examples below describe what Prisma generates — don't hand-author DDL outside `supabase/migrations/`.
- **Migrations:** schema changes ship as a numbered SQL file in `supabase/migrations/` (`001_init` … `031_personal_space_trigger`) **and** the matching `prisma/schema.prisma` update. **Never run `pnpm db:push`** against Supabase — cross-schema references can break introspection. Apply SQL migrations in order before dependent code deploys.
- **Multi-tenancy / RLS:** ownership is the nullable `space_id` column, not `user_id` alone. Personal data uses `space_id: null`; shared data belongs to a `spaces` row via `space_members`. Policies live in `supabase/migrations/002_rls.sql` and must resolve the caller's space membership — application code must never query by `userId` alone either.
- **Realtime:** Supabase `postgres_changes` channels **bypass RLS**, so events are accepted client-side only when `row.space_id === activeSpaceId`. Never assume a realtime payload is database-authorized.
- **Indexes:** FK + composite indexes already exist — `space_members(space_id)` (`008_spaces.sql`), and `transactions(space_id, date)` + `budgets(space_id, month, year)` (`015_composite_indexes.sql`). New multi-column queries should ship a matching composite index in the same migration.
- **Connections:** Prisma connects to Supabase's pooled endpoint (transaction-mode pgbouncer). Let the Prisma client manage statements; don't use named session-scoped `prepare` in raw SQL.

## When to Apply

Reference these guidelines when:
- Writing SQL queries or designing schemas
- Implementing indexes or query optimization
- Reviewing database performance issues
- Configuring connection pooling or scaling
- Optimizing for Postgres-specific features
- Working with Row-Level Security (RLS)

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | `query-` |
| 2 | Connection Management | CRITICAL | `conn-` |
| 3 | Security & RLS | CRITICAL | `security-` |
| 4 | Schema Design | HIGH | `schema-` |
| 5 | Concurrency & Locking | MEDIUM-HIGH | `lock-` |
| 6 | Data Access Patterns | MEDIUM | `data-` |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | `monitor-` |
| 8 | Advanced Features | LOW | `advanced-` |

## How to Use

Read individual rule files for detailed explanations and SQL examples:

```
references/query-missing-indexes.md
references/query-partial-indexes.md
references/_sections.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect SQL example with explanation
- Correct SQL example with explanation
- Optional EXPLAIN output or metrics
- Additional context and references
- Supabase-specific notes (when applicable)

## References

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
