# S1-R2-02 — GitHub Default-Branch Enforcement Preflight

- Date: 2026-08-30
- Baseline: `main@677a88ca5156b51060e9204aa06b9afdcf4e47b7`
- Repository: `SvenKulessa/Finance` (private)
- Mutation status: PREPARED / NOT APPLIED

## Current platform state

GitHub reports `main` as `protected: false`. Branch protection is disabled and no required status checks are configured.

The repository Rulesets API returns HTTP 403 with the provider message that GitHub Pro is required for this private repository. Therefore a repository ruleset cannot currently be used as an enforceable control on the active plan.

## Observed current check identities

Stable successful check identities observed on a recent fully executing PR head:

- `build-and-test`
- `PR Governance (Kosten / Workflow / Vorlage)`
- `Hardened image / HIGH+CRITICAL CVE gate`
- `GitGuardian Security Checks`

Observed checks that MUST NOT be made required without a separate event/applicability contract:

- `Supabase Preview` — currently skipped
- `Deployment verifiziert / Render-Produktion` — can be skipped on PR validation

The current main merge commit itself has no canonical repository-hosted push-CI check evidence; only a skipped Supabase Preview check is visible. This is a separate exact-main evidence gap and must not be hidden by branch-protection configuration.

## Smallest safe enforcement mutation

No workflow-only substitute is equivalent to native default-branch enforcement.

Preferred minimal mutation after plan capability is available:

1. enable native protection for `main`;
2. require pull request before merge;
3. block force pushes and branch deletion;
4. retain Human/CODEOWNER merge authority;
5. require only stable, event-compatible checks that are proven to be emitted for the protected merge path;
6. start with `build-and-test` and `PR Governance (Kosten / Workflow / Vorlage)` as repository-hosted candidates;
7. add `Hardened image / HIGH+CRITICAL CVE gate` and `GitGuardian Security Checks` only after exact app/event compatibility is confirmed for every intended PR class;
8. do not require skipped Supabase Preview or PR-only deployment verification checks;
9. read back the protection state and prove a merge cannot bypass required checks.

## Current blocker

`BLOCKED_BY_GITHUB_PLAN_CAPABILITY` — native private-repository ruleset access is unavailable on the current plan. A plan upgrade or another native GitHub protection capability available to this private repository is required before S1-R2-02 can reach VERIFIED PASS.

## Rollback

If protection is later applied and produces a deadlock due to obsolete or event-incompatible required checks, remove only the offending required-check binding while retaining PR requirement, force-push prevention and deletion prevention where supported. Record the readback before and after rollback.

## No production mutation

This preflight does not modify Render, Supabase, Stripe, runtime code, workflow YAML or GitHub branch settings.
