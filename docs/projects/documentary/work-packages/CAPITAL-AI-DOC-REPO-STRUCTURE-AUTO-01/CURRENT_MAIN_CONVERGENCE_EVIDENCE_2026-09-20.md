# CAPITAL-AI-DOC — Repository Structure Current-Main Convergence Evidence

**Work package:** `CAPITAL-AI-DOC-REPO-STRUCTURE-AUTO-01`  
**Project / PVC:** `CAPITAL-AI-DOC / PVC-03`  
**Initial execution baseline:** `main@f0e145cea02e2ddd72df5f35aee8ee8426c67f8d`  
**Fresh synchronization baseline:** `main@c9980602f691b855fd6f8c66a49822e7a9611b4a`  
**Execution branch:** `agent/documentary-repo-structure-auto-convergence-20260920`  
**Scope:** documentary routing/projection convergence only  
**Runtime/provider/secret/IAM/database/production mutation:** none

## Canonical ownership readback

| Surface | Observed state at fresh synchronization baseline | Result |
|---|---|---|
| `/AGENTS.md@CURRENT_MAIN` | DATA superseded; `PVC-09..17 -> CAPITAL-AI-FINTECH` | PASS |
| `docs/projects/README.md` | FINTECH is the sole current project-folder route for `PVC-09..17` | PASS |
| `docs/projects/PROJECT_VALUE_CHAIN.md` | `PVC-09`, `PVC-10`, `PVC-11` and `PVC-12..17` resolve to FINTECH | PASS |
| `docs/projects/fintech/README.md` | former DATA stages are internal FINTECH stages | PASS |
| `docs/projects/data/` | absent from current main | PASS |

The first implementation baseline moved by five unrelated Frontend commits during execution. Those commits changed only the landing-page implementation/test/work-claim surface and had zero changed-file overlap with this work package. The work branch was therefore reset to `main@c9980602f691b855fd6f8c66a49822e7a9611b4a` and the bounded documentary changes were reapplied from that fresh base.

## Bounded current-projection repairs

| File | Before | After | Classification |
|---|---|---|---|
| `AUTOMATIC_WORK_PACKAGE.md` | owner-gated hosted CI/pipeline wording | workflow-autonomous validation; Human Owner final merge | CURRENT_OPERATIONAL |
| `docs/fintech/CAPITAL-AI-FINTECH/mappings/VALUE_CHAIN_OWNERSHIP.md` | `PVC-09..11` stated as current DATA ownership | current `PVC-09..17 -> FINTECH`; DATA retained only as historical provenance | CURRENT_ROUTING_PROJECTION |
| `docs/projects/fintech/WORK_PACKAGES.md` | FIN-12/FIN-19/FIN-20 modeled former DATA work as a foreign current dependency | internal fail-closed `FINTECH PVC-09..11 -> PVC-12` dependency | CURRENT_SUPPORTING_PROJECTION |
| `docs/social-media/CAPITAL-AI-SOCIAL/mappings/CROSS_PROJECT_HANDOFFS.md` | current Security-routing prose named DATA as a productive target | historical DATA-era traceability distinguished from current FINTECH routing | CURRENT_CROSS_PROJECT_PROJECTION |

## Provenance-preserved exclusions

The following classes are intentionally not rewritten by this work package:

- `docs/archive/**`;
- `docs/evidence/**` and project-local dated evidence records;
- dated Security/Compliance assessment and work-package evidence whose purpose is point-in-time provenance;
- released/historical `.ai/work-claims/**`;
- tests that intentionally use `CAPITAL-AI-DATA` as a negative/stale-owner fixture;
- `.ai/schemas/security-assessment.schema.json`, where DATA remains a syntactically accepted historical value while current-owner validators reject DATA for `PVC-09..11`;
- `docs/projects/operations/controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`, explicitly marked `Lifecycle: evidence/inventory; non-authorizing`; its DATA-era owner-return wording is retained as provenance rather than rewritten as a current contract.

These exclusions cannot authorize current DATA routing. Current organizational routing resolves exclusively from current main and the canonical project/PVC surfaces above.

## Workflow / merge gate readback

Active main rulesets observed during this execution:

- `main-owner-gate-and-deletion-2026-09-20`: `required_approving_review_count=0`, `require_code_owner_review=false`;
- `main-production-protection`: `required_approving_review_count=0`, `require_code_owner_review=false`;
- required status checks: `GitGuardian Security Checks`, `Hardened image / HIGH+CRITICAL CVE gate`, `PR Governance (Kosten / Workflow / Vorlage)`, `build-and-test`.

Therefore a separate CODEOWNER approval is not a live required gate at this readback. The final merge remains Human Owner-controlled under `/AGENTS.md@CURRENT_MAIN`.

## Final-correlation rule

Pull Request readiness requires a fresh pre-PR readback of current `main`, branch head, merge base, open writers, changed-file overlap and required-check/ruleset state. Any later head movement invalidates the corresponding readiness evidence and requires re-correlation before merge.
