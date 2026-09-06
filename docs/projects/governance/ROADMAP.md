# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@12b5ec1886984fb6815ba111108f7f353496de7d`  
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

Current `main@12b5ec1886984fb6815ba111108f7f353496de7d` contains the terminal Governance work that earlier snapshots still described as branch-local:

- `GOV-03 / DR-02B` — **DONE_MAIN / TERMINAL** through Human-merged PR #743. ADR-0060 v1.1.0 is accepted and its stable Authority/registry projection is current. Productive provider-adapter continuation is not Governance-owned.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — **DONE_MAIN / MAINTAINED** through Human-merged PR #790. `CTRL-AIMS-PDCA-001` now expresses the accepted baseline-not-ceiling rule: demonstrably superior in-scope variants continue and must be revalidated; equivalent variants prefer lower risk/complexity; inferior or unproven variants retain the validated baseline.
- PR #793 synchronized the Control Catalog v1.20.0 projection into the Authority Registry.
- PR #791 and PR #792 are Human-merged and are current-main foreign-owner returns for Frontend Branding v6.2 and Documentary D8 respectively. Their merge does not transfer those owners' productive scope to Governance.
- Current open-PR correlation at this synchronization: **zero open Pull Requests against `main`**.
- No current active Governance writer was identified for this Roadmap/Task-Register/DevelopmentChain current-state correction. Historical/released claims remain non-authorizing evidence only.

The former branch `agent/governance-gov07-evolution-policy-20260906` is terminal historical coordination metadata. It is not a current writer or merge gate.

## Completed / terminal Governance work

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive continuation remains OPS-owned.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via PR #767; organizational `PVC-*` and technical `VC-*` under `SC-MD-SPT-0001` remain separate.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via PR #755/#758.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — `DONE_MAIN / TERMINAL` via PR #757.
- `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` — `DONE_MAIN / TERMINAL` via PR #769.
- `COPYABLE CHAT HANDOFF / OWNER RESPONSES` — `DONE_MAIN / MAINTAINED` via PR #772.
- `COMP-GAP-008 — GOVERNANCE DOCUMENT REGISTRY TREATMENT DECISION` — `DONE_MAIN / TERMINAL` via PR #775; no forced Document Registry mutation under the current contract.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — `DONE_MAIN / MAINTAINED` via PR #790.
- Governance Control Catalog / Authority Registry projection sync — `DONE_MAIN` via PR #793.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

## Current open Governance state

### GOV-07 — User-Lifecycle governance closeout

**State:** `PARTIAL / OWNER RETURNS PENDING`

The Evolution Policy is complete, but the broader GOV-07 User-Lifecycle closeout is not. Governance must not convert missing foreign-owner evidence into PASS.

| Owner | Current return state | Governance interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides the Newsfeed Entitlement Return | current evidence; no ownership transfer |
| `CAPITAL-AI-OPS` | previously merged User-Lifecycle/operations returns remain partial for broader closeout | `FOREIGN_PARTIAL` |
| `CAPITAL-AI-FE` | auth/router progress exists; broader lifecycle/pricing/entitlement UX closeout is not established here | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | PR #787 is closed/not merged | independent verification remains a dependency |
| `CAPITAL-AI-COMP` / Human-Legal | bounded assessment evidence exists; Legal/Owner gates remain external | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned | no foreign lifecycle implementation is absorbed by GOV |

Governance resumes final GOV-07 correlation only when materially new owner/assurance evidence exists.

### GOV-08 — Admin Panel process/dependency graph

**State:** `REFERRED / FOREIGN OPEN`

Productive implementation remains split across `CAPITAL-AI-CLIENT`, `CAPITAL-AI-FE` and `CAPITAL-AI-OPS`. Governance may constrain/consume the resulting projection but does not implement foreign runtime/UI ownership.

## Current priority

1. Maintain GOV-07 as dependency-held until new OPS/FE/SEC/COMP/Legal returns justify a fresh Governance correlation; do not reopen the already-merged Evolution Policy.
2. Preserve GOV-08 as foreign-owner work and consume owner-returned evidence only after the relevant CLIENT/FE/OPS roadmaps progress.

No new local PVC-05 runtime implementation is implied by this synchronization.

## Definition of Done for the current Governance projection

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- `GOV-CHAT-070` is represented as `DONE_MAIN` consistently with PR #790 and `CTRL-AIMS-PDCA-001`;
- `DR-02B` is represented as terminal consistently with PR #743 and accepted ADR-0060;
- better variants require evidence and revalidation before promotion; equivalent variants prefer lower risk/complexity; inferior/unproven variants retain the validated baseline;
- Security, Compliance, Governance, contract or required-function regressions cannot be traded away for improvement elsewhere;
- GOV-07 broader closeout remains dependency-held while evidence is missing;
- GOV-08 remains within CLIENT/FE/OPS productive ownership;
- M10 remains historical/retired and is not reconstructed as a current gap;
- no second Requirement Registry, Document Registry, Security/Compliance runtime, IAM/Audit/Risk/EventMesh authority or orchestration plane is introduced;
- missing/stale evidence cannot silently become PASS;
- Human PR-create and Human-only merge boundaries remain intact.

Historical correlation SHAs, branches and terminal work remain available through Git history and merged PR evidence; they do not override this current-state projection.
