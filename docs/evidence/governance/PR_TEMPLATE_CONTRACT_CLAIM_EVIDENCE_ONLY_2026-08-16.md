# Evidence — PR-Vorlagenvertrag: Claim-Evidence only (2026-08-16)

**Date:** 2026-08-16  
**Related:** #368 (durable — no ephemeral head/main SHA body tokens), this follow-up

## Problem

After #368, claim-PRs still required `baseline.production.version` and `baseline.production.commitSha` to appear in the PR body.

Agents fill the body at PR-creation time, before CI preflight has queried production health. Common placeholders (`N/A — CI fills`) therefore failed the evidence match and caused recurring **PR-Vorlagenvertrag** failures even when the rest of the template was correct.

This is the same class of timing/ephemerality fragility that #368 fixed for head/main SHAs.

## Decision

For claim-PRs, body evidence is reduced to:

- `claim.claimId`
- claim file path (`.ai/work-claims/…`)

**No longer required in the body:**

- `production.version`
- `production.commitSha`
- head SHA / main SHA (already removed in #368)

Production identity continues to be enforced by:

1. `productionPreflight.mjs` (or the minimal body-edit baseline)
2. Presence of `CAPITAL_AI_PRODUCTION_BASELINE_START` / `END` markers

## Fail-closed retained

- Canonical marker `CAPITAL_AI_PR_TEMPLATE_VERSION: 1.4.0`
- All 15 required sections (dash-tolerant)
- Baseline governance IDs
- No unresolved `{{PLACEHOLDER}}`
- At most one new work-claim
- Explicit Human-/CODEOWNER merge line

## Validator

`scripts/pr/validatePrBody.mjs` — durableTokens for claim path now only claimId + claimPath.

## Non-goals

- No weakening of marker/section/placeholder rules
- No change to preflight rebase gate on code pushes
- No change to Human-only merge policy
