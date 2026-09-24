# OPS-SH02-STALE-COORDINATION-FRESHNESS-01

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-08`  
**Supporting PVC:** `PVC-02`, `PVC-18`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Execution baseline:** `main@c06a907ab42bb118133951a27e77f154c8c4cba0`  
**Status:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`

## Goal

Converge evidence-backed stale OPS coordination metadata and define the bounded path for repository-wide work-claim freshness without creating a second Self-Healing, Governance, PR-autofix, writer, scheduler or EventMesh authority.

## Observed state

Repository search exposes numerous historical work-claim files that still contain `exclusive=true` text. A text hit is not sufficient evidence of a stale active writer: released or superseded historical records may legitimately retain older fields, and foreign-project claims remain owner-correct handoffs.

Five OPS claims were independently correlated against GitHub provider state and satisfy their own release conditions because their associated branches were Human/CODEOWNER-merged:

| Claim | Terminal PR | Merge SHA |
|---|---:|---|
| `OPS-08-B-SH-02-POLICY-HOMOGENEITY-20260920` | #1147 | `f0c14ed5571a4b681c4360e27bc84bbd0ab3527f` |
| `OPS-SH02-BASELINE-EVIDENCE-HANDOFF-20260924` | #1360 | `8a173021a03d6776fa7323523c1e2acd713c3c5b` |
| `CAPITAL-AI-OPS-MERGE-CADENCE-RUNTIME-20260923` | #1338 | `72a22038c88d3cc170cbecac6d04547d7226853d` |
| `OPS-PUBLIC-VISIBILITY-MODE-20260923` | #1324 | `f65753961359d74cdf19de996bace459a98725b9` |
| `OPS-08-B-SH-02-11-RETRY-SAFE-ACTIVATION-20260923` | #1330 | `f4b00e7c04e3b4c68a84d9c70936da692be3f570` |

These records are coordination metadata only. Their implementation/evidence history remains unchanged.

## Existing architecture reused

No new detector/controller is introduced.

Current repository mechanisms already provide the required primitives:

- `scripts/pr/validateWorkClaim.mjs` detects active/exclusive claims whose linked PR is no longer open, branches without an open PR, and uncorrelatable claim lifecycle.
- `scripts/governance/controlPlaneFreshnessRules.mjs` owns current-state projection freshness semantics.
- `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION` is the existing bounded Self-Healing path for deterministic repository projection drift.
- `REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT` already represents deterministic repository work-graph expectation drift.
- Exact-head validation and Human/CODEOWNER merge authority remain unchanged.

## Self-Healing fit

Work-claim freshness fits the existing Observe → Detect → Diagnose → Plan → Verify loop, but repository-wide automatic claim release is **not activated** by this slice.

1. **Observe:** current claim state plus exact GitHub PR/branch provider state.
2. **Detect:** active/exclusive claim whose explicit linked PR is terminal, or whose branch lacks an open PR.
3. **Diagnose:** resolve project/PVC/owner and distinguish terminal proof from merely uncorrelated branch state.
4. **Plan:** owner-correct deterministic release only when the claim's own release condition is proven.
5. **Remediate:** current slice performs bounded branch-only normalization only for the five provider-proven OPS claims above.
6. **Verify:** exact-head readback must show `status=released` and `exclusive=false` while preserving terminal PR/merge identity.
7. **Converge / Escalate:** foreign-owner, branch-only, ambiguous or protected cases remain `DETECT_ONLY / HANDOFF_REQUIRED`.

### Why automatic repository-wide release remains held

The currently assured Self-Healing generation is `self-healing-contract/1.2.0` plus `sh-02.10-fault-convergence/1.3.0` with 17 independently SEC/QM-verified scenarios. Extending that executable generation or adding a new claim-mutation writer would invalidate the existing generation-bound assurance and would risk creating a second repository writer.

Therefore this slice does **not** mutate the Self-Healing runtime contract or fault suite. A future owner-correct GOV/OPS integration may reuse the existing repository projection lane only after:

- one canonical exact-claim writer is identified or extended;
- project/PVC ownership is resolved before mutation;
- terminal PR state is read from GitHub, not inferred from branch absence alone;
- exact-head/main generation is rebound immediately before write;
- the action is idempotent with one bounded attempt;
- independent SEC/QM assurance is refreshed for any changed Self-Healing generation.

## Acceptance criteria

- The five provider-proven stale OPS claims are released/non-exclusive.
- Historical evidence is not rewritten or deleted.
- No foreign-project claim is mutated.
- No new Self-Healing action, workflow, controller or writer is created.
- `DEPLOYMENT_QUEUED` remains expected cadence state and is never treated as stale Production.
- Existing v1.2.0 / v1.3.0 Self-Healing assurance remains byte-semantically untouched.
- Exact branch-head readback proves the intended claim state.
