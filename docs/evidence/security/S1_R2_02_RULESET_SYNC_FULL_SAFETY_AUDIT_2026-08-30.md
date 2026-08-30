# S1-R2-02 — Ruleset Sync Full-Safety Audit

- Date: 2026-08-30
- Repository baseline at audit start: `main@4e3de6f489989e64962225874dd7dd69400fcd95`
- Work branch: `docs/s1-r2-02-signing-decision-20260830`
- Scope: `scripts/security/rulesetSync.mjs`, canonical expected policy and live `main-production-protection` ruleset
- Classification: **FULL APPLY BLOCKED / SCRIPT PRESERVATION GAP CONFIRMED**

## Audit objective

Before any Owner-gated `workflow_dispatch(mode=full)` execution, verify that the canonical ruleset reconciliation preserves the intended live controls and does not reintroduce commit-signing enforcement.

## Current live ruleset readback

The live provider state read during this work package contains:

- `non_fast_forward`;
- `pull_request` with CODEOWNER review enabled;
- strict issuer-bound `required_status_checks` for the intended four checks;
- `code_quality` with severity `warnings`;
- `required_linear_history`;
- empty `bypass_actors`;
- `current_user_can_bypass: never`.

`required_signatures` is not present and is intentionally no longer a mandatory governance control.

## Script audit result

`buildDesiredRuleset(expected)` currently constructs the desired ruleset from the canonical expected policy with:

- `non_fast_forward` when enabled;
- `deletion` when enabled;
- `pull_request`;
- `required_status_checks`.

The function does not construct either `required_linear_history` or `required_signatures`.

`preserveApprovedLiveRules(desired, current)` preserves only rule types listed in `PRESERVED_LIVE_RULE_TYPES`.

At the audited head, that set contains only:

```text
code_quality
```

Therefore:

1. `code_quality` is preserved by the current reconciliation path;
2. `required_linear_history` is **not** preserved and is absent from the desired payload;
3. a `PUT` full ruleset reconciliation can consequently remove the currently active `required_linear_history` rule;
4. `required_signatures` is neither constructed nor preserved, so the sync does **not** re-enable signing enforcement. This matches the current Owner decision.

## Apply-path verification

The audit also confirmed that both `apply-package-a` and `apply` reach the same ruleset write path when `rulesetChanged=true`:

`preserveApprovedLiveRules(...)` → normalized desired ruleset → `applyAndVerifyRuleset(...)` → `PUT /rulesets/{id}`.

Post-write verification compares the provider readback against that same incomplete desired ruleset. It would therefore consider removal of `required_linear_history` a successful reconciliation rather than detecting it as a regression.

`enforceRulesetFloor(...)` currently checks `non_fast_forward`, pull-request controls, required checks, bypass state, active enforcement and default-branch targeting, but it does not require `required_linear_history`. The floor therefore does not prevent this regression either.

## Security decision

`mode=full` and `apply-package-a` MUST NOT be executed while this preservation gap exists.

This is a fail-closed operational block, not a request to weaken the live ruleset.

## Required remediation before full apply

The canonical reconciliation implementation must be changed so that `required_linear_history` cannot be silently removed. The preferred architecture is policy ownership rather than accidental preservation:

- add an explicit canonical expected-policy field for linear-history enforcement;
- construct `required_linear_history` from that field in `buildDesiredRuleset`;
- enforce it in `enforceRulesetFloor`;
- add regression coverage proving full reconciliation retains it;
- keep `required_signatures` outside the mandatory desired set unless a future explicit Human/Owner decision reactivates signing enforcement;
- continue preserving `code_quality` until its policy ownership is separately decided.

## Negative tests required for remediation

A corrected implementation must demonstrate that:

- live `required_linear_history` cannot disappear after full reconciliation;
- absent `required_signatures` remains absent and is not recreated by sync;
- `code_quality` remains structurally preserved while non-policy-owned;
- `deletion=true` and `required_review_thread_resolution=true` can be added without removing unrelated approved controls;
- all four issuer-bound Required Checks remain exact;
- `bypass_actors` remains empty.

## Operational gate

Until the remediation above is merged and validated:

```text
Ruleset Sync mode=plan            ALLOWED
Ruleset Sync mode=apply-package-a BLOCKED
Ruleset Sync mode=full            BLOCKED
```

No Render, Supabase, Stripe or application-runtime mutation is part of this audit.
