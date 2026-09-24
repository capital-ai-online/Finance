# OPS — PR Governance Ready-Event Autofix

**Work package:** `OPS-PR-GOVERNANCE-READY-EVENT-AUTOFIX-01`  
**Project:** `CAPITAL-AI-OPS`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-08`  
**Source:** routed Issue #1427  
**Baseline:** `main@ea9fafc03aa9e05ee9e2f801da09c50392cd1ecc`  
**Status:** `IMPLEMENTATION_IN_PROGRESS / HUMAN_MERGE_REQUIRED`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Problem

The historical Ready/Event Governance regression was fixed by Human-merged PR #1425, but the existing bounded PR autofix registry has no repairer for the exact stale test expectation that caused the repeated CI failure. The previous PR-autofix claim from PR #1174 is also terminal but remained `active/exclusive`.

## Scope

1. Release the terminal PR #1174 claim as `released/non-exclusive`.
2. Register exactly one signature: `PR_GOVERNANCE_READY_EVENT_CONTRACT_V1`.
3. Bind the signature to exact CI evidence for the historical stale Ready/Event assertion.
4. Permit mutation of only `tests/unit/prReadyForReviewPipelineGate.test.ts`.
5. Replace only the exact historical stale block with the Human-merged PR #1425 invariant:
   - `opened, reopened, synchronize, ready_for_review`;
   - body-only `edited` explicitly excluded;
   - concurrency remains PR + head SHA + base SHA;
   - `github.event.action` remains excluded from the snapshot key.
6. Reuse the existing PR autofix controller/registry; create no second Self-Healing control plane.

## Fail-closed boundaries

- Incomplete evidence => `BLOCKED_NOT_PROVEN`.
- Unknown lookalikes => `BLOCKED_UNKNOWN`.
- Same signature on an autofix head => `BLOCKED_REPEAT_AUTOFIX`.
- No workflow, Runtime, Security, provider, credential, database or merge-authority mutation.
- The repairer must refuse semantic guessing and refuse already-converged/altered target blocks.
- Human/CODEOWNER merge remains mandatory.

## Exit evidence

- stale claim is released/non-exclusive;
- registry entry has one exact signature, exact evidence tokens and one allowed path;
- classifier recognizes the exact historical failure family only;
- repairer unit test proves bounded convergence and second-attempt no-change behavior;
- existing classifier/registry/controller regressions remain green;
- exact-head CI, Governance and Security checks pass before merge.
