# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@7c607de0dfa12e37b1a4070a2cb65e4d484cc6eb`  
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

Current `main@7c607de0dfa12e37b1a4070a2cb65e4d484cc6eb` includes the Human-merged Governance sequence:

- PR #751 completed the post-GOV-03 Roadmap/Task-Register/Component-Matrix correlation;
- PR #755 registered ADR-0007 under stable Authority ID `AUTH-ADR-COMPLIANCE-VALUE-CHAIN-0007` as `historical` / non-authorizing;
- PR #757 revalidated the same ESS-0006 identity to v1.1.0 as a bounded specification for the existing `src/platform/Security` and `src/platform/Compliance` components;
- PR #758 aligned the visible ADR-0007 document lifecycle with its canonical historical/non-authorizing registry state.

There are no open PRs against `main` at the start of this post-ESS-0006 correlation. PR #756 remains closed/unmerged and non-authorizing. The current Security and Compliance roadmaps remain independent foreign-owner assurance inputs; they do not transfer productive PVC ownership to Governance.

### Completed / terminal

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via Human-merged PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive continuation remains OPS-owned.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via Human-merged PR #755. ADR-0007 is canonical historical/non-authorizing registry state; stale legal/certification/parallel-value-chain semantics are not current Authority.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — `DONE_MAIN / TERMINAL` via Human-merged PR #757. ESS-0006 v1.1.0 preserves the existing component boundaries and removes stale second-registry/audit/risk/event/orchestration implications.
- `GOV-06 / ADR-0007 visible semantic closeout` — `DONE_MAIN / TERMINAL` via Human-merged PR #758.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

### Active Governance finding

#### POST-ESS-0006 RECORRELATION

**State:** `IN EXECUTION — DOCUMENTATION/GOVERNANCE CORRELATION`

This bounded work package updates the three Governance project projections to the Human-merged state above. It creates no new ADR, ESS, Authority, Control, runtime component, requirement registry or foreign-owner work item.

The correlation finds no immediately executable successor inside `PVC-05`:

- `GOV-05` remains an explicit multi-owner/Human decision;
- `GOV-07` remains blocked on OPS/FE/SEC/COMP/Legal returns;
- `GOV-08` remains referred to CLIENT/FE/OPS and cannot be implemented by Governance.

**Exit Gate:** Roadmap, Task Register and Component Architecture Matrix consistently record PRs #751/#755/#757/#758 as current-main evidence; no stale queue item is promoted; all deferred, dependent and foreign-owner boundaries remain explicit; exact-head Documentation/Governance checks and Human/CODEOWNER merge remain required.

### Other states

- `GOV-05` financial technical `VC-*` namespace — `OWNER DECISION REQUIRED / DEFERRED`.
- `GOV-07` User-Lifecycle governance closeout — `PARTIAL / OWNER RETURNS PENDING`; independent SEC/COMP/Legal evidence remains separate.
- `GOV-08` Admin Panel process/dependency graph — `REFERRED / FOREIGN OPEN`.

## Current priority

1. **POST-ESS-0006 RECORRELATION** — synchronize the three Governance project projections with `main@7c607de0dfa12e37b1a4070a2cb65e4d484cc6eb`; no stale queue promotion.
2. **WAIT FOR AN AUTHORIZED EXECUTABLE INPUT** — next GOV implementation requires either a resolved `GOV-05` Owner/multi-owner decision or material return evidence for `GOV-07`. `GOV-08` remains foreign-owned.

## Definition of Done for current Governance cycle

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- ADR-0007 remains historical/non-authorizing and cannot regain authority by reference from ESS-0006;
- ESS-0006 is a bounded component specification for existing Security and Compliance components;
- Security requirements/testing/verification remain with CAPITAL-AI-SEC;
- Compliance applicability/requirements/assessment remain with CAPITAL-AI-COMP;
- no second Requirement Registry, Security/Compliance runtime, IAM/Audit/Risk/EventMesh authority or orchestration plane is introduced;
- legal applicability, regulatory status, certification and accepted-risk claims remain outside ESS-0006 authority;
- missing/stale evidence cannot silently become PASS;
- Human PR-create and Human-only merge boundaries remain intact.
