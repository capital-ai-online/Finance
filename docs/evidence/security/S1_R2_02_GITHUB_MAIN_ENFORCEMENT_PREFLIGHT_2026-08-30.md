# S1-R2-02 — GitHub Default-Branch Enforcement Preflight / Post-Activation Evidence

- Date: 2026-08-30
- Baseline: `main@677a88ca5156b51060e9204aa06b9afdcf4e47b7`
- Repository: `SvenKulessa/Finance` (private)
- Ruleset: `main-production-protection`
- Mutation status: PARTIALLY IMPLEMENTED / CANONICAL RECONCILIATION PENDING

## Historical preflight

Before GitHub Pro activation, the private repository Rulesets API returned HTTP 403 and S1-R2-02 was correctly classified as `BLOCKED_BY_GITHUB_PLAN_CAPABILITY`. That historical observation is retained as preflight evidence and is superseded for current-state decisions by the provider readback below.

## Current provider readback

GitHub Pro capability is now operational for this repository. The repository Rulesets API is readable and reports `main-production-protection` with `enforcement: active`.

The current live ruleset contains:

- `non_fast_forward`;
- `pull_request` with `require_code_owner_review: true`;
- strict `required_status_checks`;
- `required_signatures`;
- `required_linear_history`;
- `bypass_actors: []`;
- `current_user_can_bypass: never`.

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

## Signed-commit enforcement

`required_signatures` is active on protected `main`. Merge candidates must therefore satisfy GitHub's verified-signature enforcement. The previous S1-R2-02 PR branch contained unsigned API-created commits and is not acceptable as final merge evidence under the active rule.

The remediation strategy is fail-closed: do not weaken `required_signatures`; recreate the bounded change set from current `main`, minimize commit count, and require a verified signed candidate before Human merge.

## Canonical reconciliation path

No direct ad-hoc Ruleset API mutation is authorized. After Human merge of the policy change, reconciliation must use the existing canonical workflow:

`.github/workflows/ruleset-sync.yml` → `workflow_dispatch(mode=full)` on `main` → protected environment `ruleset-admin` → `scripts/security/rulesetSync.mjs apply`.

The full reconciliation is expected to preserve the existing live controls and additionally apply:

- `deletion`;
- `required_review_thread_resolution: true`.

## Required post-apply readback

S1-R2-02 reaches `VERIFIED PASS` only when the provider readback confirms:

- `deletion` present;
- `non_fast_forward` present;
- `pull_request` present;
- `required_review_thread_resolution: true`;
- exactly the intended four required checks remain issuer-bound;
- `required_signatures` remains present;
- `bypass_actors: []`;
- `current_user_can_bypass: never`.

## Rollback

If the full reconciliation causes an event/check deadlock, roll back only the incompatible rule through the same Owner-gated ruleset-sync path. Do not remove PR enforcement, signed-commit enforcement, non-fast-forward protection or bypass-free posture merely to make a blocked change mergeable.

## Production boundary

This work does not mutate Render, Supabase, Stripe, application runtime, deployment state or production artifacts. Render production remains separately governed and must not be changed as a side effect of repository ruleset remediation.
