# Security PVC Owner Convergence — DATA → FINTECH

**Correlation ID:** `CAPITAL-AI-SEC-DATA-FINTECH-PVC-OWNER-CONVERGENCE-01`  
**Project:** `CAPITAL-AI-SEC`  
**Baseline:** `main@16b0eb730ed5d72fcc08e67e84027349d04a4095`  
**Branch:** `agent/security-data-fintech-pvc-owner-convergence-20260920`  
**Trigger:** Follow-up recorded by merged PR #1096 after DATA productive ownership was superseded by FINTECH.

## Observed before state

- PR #1100 is merged; the physical `docs/projects/data/` compatibility surface has been archived/retired from current project routing.
- `AGENTS.md`, `docs/projects/PROJECT_VALUE_CHAIN.md`, and ADR-0104 resolve `PVC-09..17` to `CAPITAL-AI-FINTECH`.
- `scripts/security/validateSecurityAssessment.mjs` still resolves `PVC-09..11` to `CAPITAL-AI-DATA`.
- The stale Security projection can therefore reject owner-correct FINTECH assessments or accept superseded DATA ownership.

## Bounded SEC delta

- Change only `PVC-09`, `PVC-10`, and `PVC-11` in the Security validator from `CAPITAL-AI-DATA` to `CAPITAL-AI-FINTECH`.
- Preserve all Security assessment semantics, 18-stage cardinality, fail-closed mismatch handling, remediation controls, and foreign-owner boundaries.
- Add a regression test that asserts FINTECH ownership for `PVC-09..11` and rejects the superseded DATA owner projection.

## Validation state

- Static repository/readback validation only in this slice preparation.
- Hosted CI/workflows: `NOT_RUN / OWNER_APPROVAL_REQUIRED`.
- No Production, IAM, Billing, Secret, DNS, deployment, or other protected external mutation.

## Exit gate

The Security assessment validator must project `PVC-09..17` consistently to `CAPITAL-AI-FINTECH`, while continuing to fail closed on owner mismatch. Human/CODEOWNER review and required PR checks remain external merge gates.
