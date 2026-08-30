# S1-R2-02 — Ruleset Sync Full-Safety Audit and Remediation

- Date: 2026-08-30
- Repository baseline: `main@460e8dd088a78f426cac392c20da104f5873ecad`
- Work branch: `docs/s1-r2-02-signing-decision-20260830`
- Scope: `scripts/security/rulesetSync.mjs`, canonical expected policy and live `main-production-protection`
- Classification: **REMEDIATION IMPLEMENTED IN PR / LIVE APPLY NOT AUTHORIZED**

## Live readback

The provider readback at 2026-08-30T19:08:51+02:00 contains only:

- `non_fast_forward`;
- `pull_request` with extra approval for unattributed changes, but without CODEOWNER review or review-thread resolution;
- `code_quality` with severity `warnings`;
- empty bypass actors.

The live ruleset does not contain `required_status_checks`, `required_linear_history`, `deletion` or `required_signatures`. Absence of `required_signatures` is intentional; the other missing controls are critical drift.

## Confirmed original defect

The pre-remediation `buildDesiredRuleset(expected)` constructed `non_fast_forward`, `deletion`, `pull_request` and `required_status_checks`, but did not construct `required_linear_history`.

`preserveApprovedLiveRules(...)` preserved only `code_quality`. A full `PUT /rulesets/{id}` could therefore remove linear-history protection and then validate the incomplete payload as successful.

## Remediation in this PR

The correction makes linear history policy-owned instead of accidentally preserved:

1. `.github/policies/main-production-protection.expected.json` declares `required_linear_history: true`.
2. The expected policy declares only `squash` and `rebase` as allowed merge methods.
3. `buildDesiredRuleset(expected)` constructs `required_linear_history`.
4. Normalization treats this rule as a parameterless security rule.
5. `enforceRulesetFloor(...)` fails closed when linear history is absent or merge commits are allowed.
6. `tests/unit/rulesetSyncContract.test.ts` locks policy, builder, normalizer and floor ownership.
7. `code_quality` remains structurally preserved until separately policy-owned.
8. `required_signatures` remains absent unless a later explicit Owner decision reactivates it.

## Negative contract

The corrected implementation must reject a desired ruleset when:

- `required_linear_history` is missing;
- a normal merge commit is included in the allowed merge methods;
- any of the four issuer-bound Required Checks is missing or spoofed;
- CODEOWNER review or review-thread resolution is disabled;
- bypass actors are present.

It must not recreate `required_signatures` under the current Owner decision.

## Operational gate

Until this PR is Human-merged and exact-head CI is green:

```text
Ruleset Sync mode=plan            ALLOWED on trusted main
Ruleset Sync mode=apply-package-a BLOCKED
Ruleset Sync mode=full            BLOCKED
```

After merge, the Owner first runs `mode=plan` and reviews the complete desired/live diff. A later apply is a separate protected mutation and is not authorized by this PR or this evidence.

## CI recursion finding

Both open PR branches were automatically synchronized after merge #614 by `sync-agent-pr-branches.yml` using `GITHUB_TOKEN`. The resulting `pull_request` workflow runs were attributed to `github-actions[bot]` and ended `action_required` with zero jobs. The corrective human-authorized branch commit in this PR creates a fresh exact head so normal PR checks can run again. The recurring auto-sync design requires a separate bounded workflow-reliability remediation; it is not silently mixed into this Ruleset patch.

## Production boundary

No Render, Supabase, Stripe, application-runtime or live GitHub Ruleset mutation is performed by this PR.
