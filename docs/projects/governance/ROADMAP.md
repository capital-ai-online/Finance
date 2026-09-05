# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@255a89c532f3589e6d157d4f629a47251bd52670`  
**Correlation date:** `2026-09-05`  
**Trust root:** `/AGENTS.md`  
**Role:** Human-readable project roadmap / non-authorizing execution projection  
**Status:** ACTIVE

## Navigation

```text
PVC-05 / Platform Director
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ code / tests / evidence
```

`AUTH-*`, `CTRL-*`, registries and work claims support integrity/audit only and do not replace this Human-readable sequence.

## Current-main reconciliation — 2026-09-05

Current `main@255a89c532f3589e6d157d4f629a47251bd52670` contains the requested `main@e96c8d13…` GOV-03 merge baseline plus later Human merges of Frontend PR #745, Compliance PR #746 and OPS PR #747. None of those later merges changes the three Governance project files in this work item.

PR #746 updates the Compliance requirements inventory and is current-main read-only input for later GOV findings; it does not itself resolve ADR-0007 or ESS-0006. PR #747 re-correlates the OPS roadmap/work-package projection and materializes DR-03 under OPS ownership after terminal GOV-03; DR-03 remains behind the higher-priority OPS security/data-integrity gate and does not reopen GOV-03/DR-02B or transfer runtime ownership to Governance.

### Completed / terminal

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- **`GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via Human-merged PR #743.** ADR-0060 v1.1.0 is `ACCEPTED / ACTIVE`, has stable Authority ID `AUTH-ADR-SOFTWARE-SUPPLY-CHAIN-PROVENANCE-0060`, agrees with ADR/Authority registries, and no longer carries the obsolete current NIST-SSDF binding.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive provider/runtime continuation remains OPS-owned. Human-merged OPS PR #747 now carries the OPS-side DR-03 planning projection without changing the Governance boundary.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — previous consolidation writer is released/archived after Human-merged PR #741; maintenance only.

### Active Governance findings

#### GOV-06 / COMP-GAP-002 — ADR-0007

**State:** `NEXT BOUNDED GOV ARCHITECTURE WORK AFTER THIS RECORRELATION IS TERMINAL`

Current facts requiring fresh correlation:

- `docs/adr/ADR-0007-compliance-value-chain.md` declares `ACCEPTED`;
- current `docs/adr/registry.json` does not contain a migrated ADR-0007 record;
- the ADR mixes legacy Compliance, Data, FinTech, audit/export and legal-claim semantics across current PVC ownership boundaries;
- Compliance continues to route lifecycle/semantic resolution to `CAPITAL-AI-GOV / PVC-05`;
- current Compliance requirements evidence, including Human-merged PR #746, is input only and cannot itself decide ADR lifecycle or architecture authority.

Required decision on a **fresh then-current-main Governance branch**: `clarify / migrate / supersede / archive`. No foreign runtime implementation and no parallel Compliance/Governance authority plane.

#### GOV-06 / COMP-GAP-003 — ESS-0006

**State:** `OPEN AFTER ADR-0007 DECISION`

ESS-0006 v1.0.0 contains stale Security/Compliance component and collaboration assumptions. Reconcile only after ADR-0007 establishes the correct semantic/authority boundary. Preserve independent Security verification and Compliance assessment; do not create a second Requirement Registry or Security/Compliance runtime architecture.

### Other states

- `GOV-05` financial technical `VC-*` namespace — `OWNER DECISION REQUIRED / DEFERRED`.
- `GOV-07` User-Lifecycle governance closeout — `PARTIAL / OWNER RETURNS PENDING`; OPS/provider, SEC, FE and COMP/Human-Legal returns remain foreign/dependent.
- `GOV-08` Admin Panel process/dependency graph — `REFERRED / FOREIGN OPEN`; no current-main React Flow / `ProcessGraphProjection` implementation evidence.

## Current priority

1. **GOV-ROADMAP-RECORRELATE** — synchronize `ROADMAP.md`, `TASK_REGISTER.md` and `COMPONENT_ARCHITECTURE_MATRIX.md` with current main; terminalize GOV-03/DR-02B and stale writer/priority wording. Exit gate: branch synchronized with current main, bounded diff verified, explicit Human PR-create approval for exact SHAs, hosted checks after PR creation, Human/CODEOWNER merge.
2. **COMP-GAP-002 / ADR-0007** — only after step 1 reaches terminal state, open a fresh then-current-main Governance branch and fully correlate Authority, ADR registry, PVC, Compliance and runtime facts before deciding lifecycle/semantics.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit;
- Roadmap, Task Register and Component/Architecture Matrix agree with current-main evidence;
- GOV-03/DR-02B cannot be reopened by stale pre-#743 wording;
- ADR-0007 is identified as the next bounded finding without pre-deciding its outcome;
- OPS DR-03 planning remains foreign and does not become a Governance runtime work item;
- foreign productive work remains with its Primary Owner;
- withdrawn post-PVC overlays and NIST-derived Governance bindings are not restored;
- no parallel Governance/control-plane/runtime/version architecture is introduced;
- Human PR-create and Human-only merge boundaries remain intact.
