# OPS — Stripe Managed Webhook FK Index

- **Work item:** `OPS-STRIPE-MANAGED-WEBHOOKS-FK-INDEX-01`
- **Date:** 2026-09-24
- **Project:** `CAPITAL-AI-OPS`
- **Owner / PVC:** PVC-02 with PVC-08 support
- **Priority:** P2
- **PR class:** R
- **State:** EXACT_HEAD_VALIDATION
- **Dependency:** SATISFIED — PR #1416 merged as `29cd7b339be0aca587549f3a27a3658ea16fa59c`; branch correlated against that `main`.

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

1. ✅ PR #1416 merged as `29cd7b339be0aca587549f3a27a3658ea16fa59c`.
2. ✅ Branch correlated against that `main`.
3. Reconcile repository migration ledger: 61 local / 10 local-only while provider snapshot remains 78 remote.
4. Pass exact-head repository checks.
5. Human/CODEOWNER merge.
6. Apply through the canonical Supabase migration workflow.
7. Read back `pg_indexes`, rerun Performance Advisor and confirm `unindexed_foreign_keys = 0`.
8. Do not remove the 81 `unused_index` findings merely to silence INFO; index removal needs workload evidence.
