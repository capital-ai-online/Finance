# M10 Phase 5 — Atomic CI Consumption Evidence

Status: IMPLEMENTED ON BRANCH — PR/CI + PRODUCTION MIGRATION + LIVE DISPATCH VERIFICATION PENDING  
Date: 2026-08-19  
Branch: `agent/m10-phase5-atomic-ci-consumption`  
Baseline: `main@275fdf4c06a91dea91e7aaea18bcfb3801a120c0`  
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`, M10 Threat Model

## Baseline verification

Before Phase 5 implementation:

- PR #417 / Phase 4 was Human-merged into `main` as `275fdf4c06a91dea91e7aaea18bcfb3801a120c0`.
- Phase 4 WebAuthn assertion verification is therefore part of the authoritative repository baseline.
- Production Supabase contains one active, non-revoked Owner credential for the canonical Owner actor. Only non-sensitive lifecycle metadata was inspected; credential ID, public key and authenticator material were not copied into evidence.
- Production still had only `m10_owner_credentials` and `m10_registration_challenges`; durable PR-authorization challenges, Phase-4 approvals and Phase-5 CI-consumption evidence did not yet exist.
- `ci.yml` still starts `build-and-test` directly on `pull_request`; M10 is not authoritative yet.
- The only open PR observed during branch creation was #414; its changed-file scope does not overlap the Phase-5 files in this branch.

## Implemented Phase-5 scope

### 1. Durable authorization state

Migration `supabase/migrations/20260819040000_m10_pr_ci_authorization.sql` adds:

- `m10_authorization_challenges` — short-lived PR authorization challenge bound to exact trusted GitHub state;
- `m10_approval_evidence` — immutable Owner WebAuthn approval evidence;
- `m10_ci_consumptions` — durable CI-consumption/dispatch evidence.

Browser roles receive no table privileges or RLS policies. Service-role access remains server-side only.

### 2. Atomic one-run-per-head claim

`claim_m10_ci_consumption(...)` executes in one PostgreSQL transaction and:

1. locks the approval row;
2. verifies repository, PR, head SHA and authorization digest;
3. serializes attempts for the exact repository/PR/head through a transaction advisory lock;
4. rejects an already consumed approval;
5. rejects any prior CI-consumption for that exact PR head;
6. transitions approval `consumed_at` exactly once;
7. inserts a `PENDING` CI-consumption record.

The database additionally enforces `UNIQUE(repository, pr_number, head_sha)` for consumption evidence. Two separate passkey approvals for the same unchanged head therefore cannot purchase two normal expensive CI runs.

### 3. Runtime Phase-5 logic

`server/m10/atomicCiConsumption.ts` performs the required order:

1. load immutable Phase-4 approval;
2. re-resolve live GitHub PR state;
3. reject base/head/file-set/diff drift;
4. claim approval + PR head atomically;
5. perform one external CI dispatch attempt;
6. persist terminal dispatch state.

Outcomes are explicit:

- `DISPATCHED` — GitHub accepted one dispatch and terminal evidence was persisted;
- `DEDUPE` — approval or exact PR head was already consumed;
- `DENY` — trust/context/store precondition failed before external dispatch;
- `DISPATCH_UNCERTAIN` — approval is already consumed but external outcome or terminal evidence is ambiguous.

### 4. No automatic retry after durable claim

`server/m10/githubCiDispatcher.ts` performs exactly one GitHub Actions `workflow_dispatch` request. It contains no retry loop.

This is deliberate. After a durable claim, a network error can be ambiguous: GitHub may already have accepted the request. Retrying automatically could create a second expensive run. `FAILED_UNCERTAIN` therefore requires explicit Human reconciliation against GitHub workflow state before any recovery action.

The adapter is not production-wired by this branch. The controlled-cutover work package will supply the authoritative workflow target and runtime credential only after Phase 6 Shadow evidence is verified.

## Tests added

`tests/unit/m10AtomicCiConsumption.test.ts` covers:

- exact state → one claim → one dispatch → terminal `DISPATCHED` evidence;
- changed PR head/diff → `DENY` before claim/dispatch;
- consumed approval → `DEDUPE`;
- second approval for already-claimed head → `DEDUPE`;
- non-accepted dispatch → terminal uncertainty, no retry;
- network ambiguity after claim → terminal uncertainty, no retry;
- GitHub accepted but evidence finalization failed → never report success.

`tests/unit/m10AuthorizationSupabaseStore.test.ts` covers:

- exact challenge context persistence;
- revoke single-use state guards;
- authenticator counter compare-and-set;
- immutable approval insert;
- transactional claim RPC usage;
- database head dedupe propagation;
- terminal dispatch RPC usage.

`tests/unit/m10GithubCiDispatcher.test.ts` covers:

- one and only one workflow-dispatch HTTP request;
- exact M10 binding inputs in the dispatch request;
- non-204 response without retry;
- fail-closed invalid token/workflow configuration before network access.

## Production mutation boundary

This branch does **not** apply `20260819040000_m10_pr_ci_authorization.sql` to production and does **not** configure a GitHub Actions credential in Render.

Both are external Class-M mutations and are intentionally deferred until this Phase-5 PR is Human-merged and rechecked against the then-current `main`.

## Phase 6 / Controlled Cutover prerequisites

Controlled Cutover remains blocked until all of the following are true:

1. this Phase-5 implementation is Human-merged;
2. the Phase-5 migration is applied and post-verified in production;
3. Phase-4/5 HTTP/browser live wiring exists for the Owner approval ceremony;
4. a retry-free GitHub dispatcher credential is configured through the canonical Render secret path;
5. Phase 6 Shadow Mode operates while the current simplified CI path remains authoritative;
6. mandatory negative tests and recovery evidence are `VERIFIED PASS` in production/shadow;
7. only then is `ci.yml` changed so passkey-backed `AUTHORIZE_PR_CI` becomes the authoritative expensive-CI gate.

Human-only merge remains separate throughout. No checkbox/emoji authorization path may be reintroduced.

## Rollback

Before cutover, rollback is repository-only: revert the Phase-5 PR. If the additive Phase-5 migration has already been applied, leave evidence tables in place unless a separately authorized destructive migration proves they are empty and safe to remove.

After a future cutover, never restore checkbox/emoji authorization. Use the controlled M10 recovery path defined by the runbook.
