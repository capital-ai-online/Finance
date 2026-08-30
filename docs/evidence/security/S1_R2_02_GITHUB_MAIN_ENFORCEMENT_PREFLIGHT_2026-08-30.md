# S1-R2-02 — GitHub Default-Branch Enforcement Preflight / Post-Activation Evidence

- Date: 2026-08-30
- Baseline: `main@460e8dd088a78f426cac392c20da104f5873ecad`
- Repository: `SvenKulessa/Finance` (private)
- Ruleset: `main-production-protection`
- Mutation status: PARTIALLY IMPLEMENTED / CANONICAL RECONCILIATION PENDING

## Historical preflight

Before GitHub Pro activation, the private repository Rulesets API returned HTTP 403 and S1-R2-02 was correctly classified as `BLOCKED_BY_GITHUB_PLAN_CAPABILITY`. That historical observation is retained as preflight evidence and is superseded for current-state decisions by the provider readback below.

## Current provider readback

Provider readback at 2026-08-30T19:08:51+02:00 reports the active `main-production-protection` ruleset with:

- `non_fast_forward`;
- `pull_request` with `require_extra_approval_for_unattributed_changes: true`, but CODEOWNER review and review-thread resolution disabled;
- `code_quality` with warning severity;
- `bypass_actors: []`;
- `current_user_can_bypass: never`.

The live ruleset currently lacks `required_status_checks`, `required_linear_history`, `deletion`, CODEOWNER review and review-thread resolution. This is critical protection drift against the canonical expected policy. `required_signatures` is intentionally absent under the Owner decision below.

## Commit signing decision

Owner decision dated 2026-08-30: commit signing is no longer a mandatory merge or protected-main control for CAPITAL-AI. `required_signatures` is intentionally disabled and must not be treated as a prerequisite for PR creation, CI execution, merge readiness or S1-R2-02 completion.

Signed commits remain permitted and may be used voluntarily for provenance or higher-assurance workflows, but the absence of a verified signature is not by itself a governance failure. Human/Owner merge authority, CODEOWNER review, required status checks, non-fast-forward protection, linear history and the bypass-free ruleset remain the authoritative controls.

This decision specifically removes the previous requirement to re-create agent/API-generated commits only to satisfy signature enforcement. It does not weaken the prohibition on direct agent changes to `main` or the requirement for Human/Owner merge decisions.

## Canonical reconciliation path

No direct ad-hoc Ruleset API mutation is authorized. Reconciliation must use the existing canonical workflow after the policy/script safety review is complete:

`.github/workflows/ruleset-sync.yml` → `workflow_dispatch(mode=full)` on `main` → protected environment `ruleset-admin` → `scripts/security/rulesetSync.mjs apply`.

This PR repairs `rulesetSync.mjs` so the canonical expected policy explicitly owns `required_linear_history`, enforces it in the fail-closed floor, restricts merge methods to squash/rebase and retains `code_quality` as an approved live rule. `required_signatures` remains outside the mandatory target.

No apply is performed from this PR. After Human merge and exact-head validation, the Owner must run `mode=plan` on trusted `main` before any separately authorized `mode=full` mutation.

The reconciliation target applies:

- `deletion`;
- `required_review_thread_resolution: true`.

## Required post-apply readback

S1-R2-02 reaches `VERIFIED PASS` only when the provider readback confirms:

- `deletion` present;
- `non_fast_forward` present;
- `pull_request` present with CODEOWNER review and `required_review_thread_resolution: true`;
- `deletion` present;
- exactly the intended four required checks remain issuer-bound;
- `required_linear_history` remains present;
- `required_signatures` remains absent unless a later explicit Owner decision re-enables it;
- `bypass_actors: []`;
- `current_user_can_bypass: never`.

## Rollback

If the full reconciliation causes an event/check deadlock, roll back only the incompatible rule through the same Owner-gated ruleset-sync path. Do not remove PR enforcement, required checks, non-fast-forward protection, linear-history protection or bypass-free posture merely to make a blocked change mergeable. Commit signing is optional under the current Owner decision and is not part of the rollback floor.

## Production boundary

This work does not mutate Render, Supabase, Stripe, application runtime, deployment state or production artifacts. Render production remains separately governed and must not be changed as a side effect of repository ruleset remediation.
