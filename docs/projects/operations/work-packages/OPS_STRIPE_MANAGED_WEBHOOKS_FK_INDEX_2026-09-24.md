# OPS — Stripe Managed Webhook FK Index

- **Work item:** `OPS-STRIPE-MANAGED-WEBHOOKS-FK-INDEX-01`
- **Date:** 2026-09-24
- **Project:** `CAPITAL-AI-OPS`
- **Owner / PVC:** PVC-02 with PVC-08 support
- **Priority:** P2
- **PR class:** R
- **State:** DRAFT / DEPENDENCY BLOCKED
- **Dependency:** PR #1416 must merge first and this branch must then be correlated against the new `main`.

## Provider evidence

Supabase Performance Advisor reports exactly one unindexed foreign key:

`stripe._managed_webhooks.fk_managed_webhooks_account`

Readback confirms:

- FK: `account_id → stripe.accounts(id)`;
- current indexes: primary key `(id)`, unique `(url, account_id)`, `(status)`, and `(enabled)`;
- the unique index cannot cover lookups by `account_id` because `account_id` is not its leading column;
- the table is owned by `postgres` and currently contains one enabled production webhook;
- Stripe Sync Engine 1.0.32 creates the FK but does not create a standalone `account_id` index.

## Bounded implementation

The versioned migration adds only:

```sql
create index if not exists idx_managed_webhooks_account_id
  on stripe._managed_webhooks (account_id);
```

No Stripe webhook, function, constraint, row, secret or existing index is changed. PostgreSQL remains free to choose a sequential scan while the table is tiny; the index exists for FK enforcement and future cardinality.

## Release gate

1. Merge PR #1416.
2. Rebase/correlate this branch against the resulting `main`.
3. Pass exact-head repository checks.
4. Human/CODEOWNER merge.
5. Apply through the canonical Supabase migration workflow.
6. Read back `pg_indexes`, rerun Performance Advisor and confirm `unindexed_foreign_keys = 0`.
7. Do not remove the 81 `unused_index` findings merely to silence INFO; index removal needs workload evidence.
