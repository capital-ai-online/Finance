# GOV/OPS Foreign Project Execution Policy — RETIRED COMPATIBILITY TOMBSTONE

**Authority ID:** `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`  
**Control ID:** `CTRL-GOV-OPS-FOREIGN-EXEC-001`  
**Lifecycle:** `RETIRED / HISTORICAL / NON_AUTHORIZING`  
**Retired by Owner decision:** 2026-09-16  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

The former bounded GOV/OPS foreign-project implementation delegation is retired as a development-execution rule.

Current cross-project behavior resolves exclusively through `GOV-DYNAMIC-SCOPE-RESOLUTION-02`, `GOV-AUTONOMOUS-WORK-GRAPH-03` and `GOV-EVIDENCE-EVENTMESH-HANDOVER-07`: work whose Authority or implementation belongs to another project is not silently taken over; it produces an owner-correct, correlation-ID-based handover.

This file remains only as a historical identity target. It creates no fallback or parallel execution lane and transfers no Project/PVC/domain/Security/Compliance authority.
