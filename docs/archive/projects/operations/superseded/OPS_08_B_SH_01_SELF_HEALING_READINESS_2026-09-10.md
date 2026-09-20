# ARCHIVED — OPS-08-B-SH-01 Self-Healing Readiness Foundation

**Lifecycle:** HISTORICAL / NON-ACTIVE / NON-AUTHORIZING / SUPERSEDED_BY_SH_02  
**Historical branch:** `agent/operations-self-healing-readiness-20260910`  
**Historical project:** `CAPITAL-AI-OPS / PVC-08`  
**Archive date:** 2026-09-20  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Current replacement:** `CAPITAL-AI-ASH-01` + `self-healing-contract/1.0.0` + `OPS-08-B-SH-02`

## Preserved legacy semantics

The predecessor material projected, among other things, that:

- productive autonomous recovery was not generally authorized;
- the legacy `SH-R2` class required separate Human/Owner approval per action/run;
- provider/production mutation was treated as requiring a separate authorization by default;
- generic Supervisor retry/recovery behavior could be described as Self-Healing without the deterministic finding/action/verification contract now required.

These statements are retained only to explain historical decisions and branch state. They have **zero current execution authority** after Human/CODEOWNER merge of the SH-02.3 contract change.

## Current resolution

Current Self-Healing semantics resolve in this order:

1. `/AGENTS.md@CURRENT_MAIN` — repository-wide development/workflow authority;
2. current accepted Security, Compliance, QM and domain contracts for their subject-matter boundaries;
3. `docs/architecture/AUTONOMOUS_SELF_HEALING_PLATFORM.md` — current Self-Healing architecture contract;
4. `src/platform/Supervisor/selfHealingContract.ts` — executable finding/action/eligibility/convergence contract;
5. current `OPS-08-B-SH-02` work-package state — execution/status projection only.

Legacy `SH-R*` labels are retired and MUST NOT be mapped to current permissions. Current tiers are `SH-0..SH-3` as defined by the current contract.

## Evidence / provenance

- PR #1122 merged SH-02.0..02.2 and established the current architecture foundation.
- PR #1125 is the current SH-02.3 contract writer.
- Historical integrity evidence remains in `docs/projects/operations/evidence/OPS_IMPLEMENTED_WORK_INTEGRITY_RECORRELATION_2026-09-10.md`.
- The predecessor narrow supersession projection is archived at `docs/archive/governance/superseded/AUTONOMOUS_SELF_HEALING_RUNTIME_SUPERSESSION_2026-09-20.md`.

No historical status, branch, report, roadmap or archived document can reactivate SH-01.
