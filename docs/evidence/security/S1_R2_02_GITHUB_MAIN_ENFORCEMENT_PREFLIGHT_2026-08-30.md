# S1-R2-02 — GitHub Default-Branch Enforcement Preflight / Post-Activation Evidence

- Date: 2026-08-30
- Baseline: `main@4e3de6f489989e64962225874dd7dd69400fcd95`
- Repository: `SvenKulessa/Finance` (private)
- Ruleset: `main-production-protection`
- Mutation status: PARTIALLY IMPLEMENTED / CANONICAL RECONCILIATION PENDING

## Historical preflight

Before GitHub Pro activation, the private repository Rulesets API returned HTTP 403 and S1-R2-02 was correctly classified as `BLOCKED_BY_GITHUB_PLAN_CAPABILITY`. That historical observation is retained as preflight evidence and is superseded for current-state decisions by the provider readback below.

## Current provider readback

GitHub Pro capability is operational for this repository. The repository Rulesets API is readable and reports `main-production-protection` with `enforcement: active`.

Provider readback dated 2026-08-30 after the Owner signing decision reports the current live ruleset contains:

- `non_fast_forward`;
- `pull_request` with `require_code_owner_review: true`;
- strict `required_status_checks`;
- `required_linear_history`;
- `code_quality` with warning severity;
- `bypass_actors: []`;
- `current_user_can_bypass: never`.

`required_signatures` is not present in the current live ruleset.

The current required status checks are:

- `build-and-test`;
- `PR Governance (Kosten / Workflow / Vorlage)`;
- `Hardened image / HIGH+CRITICAL CVE gate`;
- `GitGuardian Security Checks`.

`Supabase Preview` and `Deployment verifiziert / Render-Produktion` remain outside the pre-merge required-check set because their event contract permits `skipped` states.

## Current drift against canonical expected policy

Two bounded differences remain between the active provider state and `.github/policies/main-production-protection.expected.json`:

1. the live ruleset does not yet contain a `deletion` rule, while the canonical expected policy requires `deletion_protection: true`;
2. the live pull-request rule reports `required_review_thread_resolution: false`, while the canonical expected policy requires `true`.

The canonical expected policy therefore keeps both controls enabled as the desired state. The historical single-owner deletion exception is superseded by the explicit Owner decision dated 2026-08-30.

## Commit signing decision

Owner decision dated 2026-08-30: commit signing is no longer a mandatory merge or protected-main control for CAPITAL-AI. `required_signatures` is intentionally disabled and must not be treated as a prerequisite for PR creation, CI execution, merge readiness or S1-R2-02 completion.

Signed commits remain permitted and may be used voluntarily for provenance or higher-assurance workflows, but the absence of a verified signature is not by itself a governance failure. Human/Owner merge authority, CODEOWNER review, required status checks, non-fast-forward protection, linear history and the bypass-free ruleset remain the authoritative controls.

This decision specifically removes the previous requirement to re-create agent/API-generated commits only to satisfy signature enforcement. It does not weaken the prohibition on direct agent changes to `main` or the requirement for Human/Owner merge decisions.

## Canonical reconciliation path

No direct ad-hoc Ruleset API mutation is authorized. Reconciliation must use the existing canonical workflow after the policy/script safety review is complete:

`.github/workflows/ruleset-sync.yml` → `workflow_dispatch(mode=full)` on `main` → protected environment `ruleset-admin` → `scripts/security/rulesetSync.mjs apply`.

Before `mode=full` is executed, `rulesetSync.mjs` must be verified to preserve or canonically own all intended live controls, especially `required_linear_history` and `code_quality`, while keeping `required_signatures` disabled.

The reconciliation target additionally applies:

- `deletion`;
- `required_review_thread_resolution: true`.

## Required post-apply readback

S1-R2-02 reaches `VERIFIED PASS` only when the provider readback confirms:

- `deletion` present;
- `non_fast_forward` present;
- `pull_request` present;
- `required_review_thread_resolution: true`;
- exactly the intended four required checks remain issuer-bound;
- `required_linear_history` remains present;
- `required_signatures` remains absent unless a later explicit Owner decision re-enables it;
- `bypass_actors: []`;
- `current_user_can_bypass: never`.

## Rollback

If the full reconciliation causes an event/check deadlock, roll back only the incompatible rule through the same Owner-gated ruleset-sync path. Do not remove PR enforcement, required checks, non-fast-forward protection, linear-history protection or bypass-free posture merely to make a blocked change mergeable. Commit signing is optional under the current Owner decision and is not part of the rollback floor.

## Production boundary

This work does not mutate Render, Supabase, Stripe, application runtime, deployment state or production artifacts. Render production remains separately governed and must not be changed as a side effect of repository ruleset remediation.
