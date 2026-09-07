# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@8ab11ae749639a67c28b3d685f4943df19b9e72c`  
**Correlation date:** `2026-09-07`  
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

## Current-state synchronization — 2026-09-07

Current `main@8ab11ae749639a67c28b3d685f4943df19b9e72c` contains the terminal Governance work and the Owner-approval presentation baseline established through Human-merged PR #803:

- `GOV-03 / DR-02B` — **DONE_MAIN / TERMINAL** through Human-merged PR #743. ADR-0060 v1.1.0 is accepted and its stable Authority/registry projection is current. Productive provider-adapter continuation is not Governance-owned.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — **DONE_MAIN / MAINTAINED** through Human-merged PR #790. `CTRL-AIMS-PDCA-001` expresses the accepted baseline-not-ceiling rule.
- PR #803 is **DONE_MAIN** and establishes neutral presentation for pure Human/Owner approvals, confirmations and exact response prompts: they are authority gates, not `⚙️🤓 MANUELL` execution steps.
- PR #772 remains historical implementation evidence for the bounded copyable `NÄCHSTE SCHRITTE` handoff. Its separate copyable Owner-response formatting requirement is being retired by the bounded `GOV-CHAT-071` maintenance item below; until Human Merge of that maintenance change, current `main` remains controlling.
- Open PRs #838 (`CAPITAL-AI-DOC`) and #839 (`CAPITAL-AI-OPS`) have no changed-file overlap with `GOV-CHAT-071`. #838 touches Documentary hygiene/registry surfaces but not the Agent Trust Root, Development-Chain policy, Authority Registry, Control Catalog or Governance project projections changed here; #839 is workflow/zizmor hardening. No Primary-Owner, namespace or governing-authority conflict was identified.

## Completed / terminal Governance work

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive continuation remains OPS-owned.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via PR #767; organizational `PVC-*` and technical `VC-*` under `SC-MD-SPT-0001` remain separate.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via PR #755/#758.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — `DONE_MAIN / TERMINAL` via PR #757.
- `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` — `DONE_MAIN / TERMINAL` via PR #769.
- `COPYABLE CHAT NEXT-STEP HANDOFF` — `DONE_MAIN / MAINTAINED` from PR #772 for bounded copyable `NÄCHSTE SCHRITTE` only; the separate Owner-response formatting subrule is not retained as the target policy.
- `OWNER APPROVAL PRESENTATION` — `DONE_MAIN / MAINTAINED` via PR #803: pure approvals/confirmations are neutral and excluded from the manual-execution marker.
- `COMP-GAP-008 — GOVERNANCE DOCUMENT REGISTRY TREATMENT DECISION` — `DONE_MAIN / TERMINAL` via PR #775; no forced Document Registry mutation under the current contract.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — `DONE_MAIN / MAINTAINED` via PR #790.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

## Current open Governance state

### GOV-CHAT-071 — Owner-response handoff consolidation

**State:** `OPEN_GOV / BRANCH_LOCAL`

**Branch:** `agent/governance-owner-response-retirement-20260907`

Bounded objective:

- preserve `CHAT_RUN_HANDOFF` and `POST_PR_HANDOFF` plus the fenced, maximum-two-step `NÄCHSTE SCHRITTE` queue;
- retire the generic requirement from PR #772 that every exact Human/Owner response be emitted in a separate copyable block;
- make the PR #803 neutral approval-presentation semantics the single current presentation rule for pure approvals/confirmations;
- keep the exact-snapshot Human/Owner PR-create gate and Human-only merge boundary unchanged;
- add regression coverage so the retired separate-response rule cannot silently return.

**Exit gate:** Trust Root, Development-Chain policy, Control Catalog, Authority Registry, project projections and governance regression test are semantically consistent on one exact branch state; required PR-create correlation/approval remains separate and hosted validation remains truthful.

### GOV-07 — User-Lifecycle governance closeout

**State:** `PARTIAL / OWNER RETURNS PENDING`

The Evolution Policy is complete, but the broader GOV-07 User-Lifecycle closeout is not. Governance must not convert missing foreign-owner evidence into PASS.

| Owner | Current return state | Governance interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides the Newsfeed Entitlement Return | current evidence; no ownership transfer |
| `CAPITAL-AI-OPS` | Human-merged PR #794 provides the refreshed User-Lifecycle owner return as `EVIDENCE_READY`; provider E2E and independent Security verification remain open | `FOREIGN_PARTIAL` |
| `CAPITAL-AI-FE` | auth/router progress exists; broader lifecycle/pricing/entitlement UX closeout is not established here | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | PR #787 is closed/not merged | independent verification remains a dependency |
| `CAPITAL-AI-COMP` / Human-Legal | bounded assessment evidence exists; Legal/Owner gates remain external | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned | no foreign lifecycle implementation is absorbed by GOV |

### GOV-08 — Admin Panel process/dependency graph

**State:** `REFERRED / FOREIGN OPEN`

Productive implementation remains split across `CAPITAL-AI-CLIENT`, `CAPITAL-AI-FE` and `CAPITAL-AI-OPS`. Governance may constrain/consume the resulting projection but does not implement foreign runtime/UI ownership.

## Current priority

1. Complete `GOV-CHAT-071` as a bounded Governance consistency correction without changing the Human PR-create or Human-only merge gates.
2. Maintain GOV-07 dependency-held and GOV-08 foreign-owner boundaries after that local consistency correction.

No new local PVC-05 runtime implementation is implied by this synchronization.

## Definition of Done for the current Governance projection

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- copyable bounded `NÄCHSTE SCHRITTE` handoff remains active;
- the PR #772 separate copyable Owner-response formatting requirement is retired after Human Merge of `GOV-CHAT-071` and is not reconstructed from historical evidence;
- pure Human/Owner approvals, confirmations and exact authority prompts follow PR #803 neutral presentation and do not carry `⚙️🤓 MANUELL` unless a distinct actual manual execution step exists;
- canonical PR-creation approval remains bound to exact current `main` SHA and branch-head SHA;
- Human-only merge remains intact;
- missing/stale evidence cannot silently become PASS;
- no second Governance, approval, routing, IAM, Security/Compliance or deployment authority is introduced.

Historical correlation SHAs, branches, PRs and terminal work remain available through Git history and merged PR evidence; they do not override this current-state projection.
