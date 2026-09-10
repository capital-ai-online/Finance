# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@d8d91cc5b04f107be28cbbfb13aaab8175305444`  
**Correlation date:** `2026-09-10`  
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

`AUTH-*`, `CTRL-*`, registries, branches, Pull Requests and chat history support integrity/audit/traceability only. They do not replace this Human-readable sequence and historical branch content never overrides current `main` authority.

## Current-state synchronization — 2026-09-10

The Governance backlog was re-correlated after Human Merge of PR #874 against `main@d8d91cc5b04f107be28cbbfb13aaab8175305444`, `/AGENTS.md` Control Plane v2.9.0, the canonical Project/PVC mapping, current Approval Policy v3.4.0 and the current PR set.

- PR #868 (`GOV-CHAT-076`) is **DONE_MAIN / TERMINAL**, merge SHA `6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`; its Hosted Governance, CI and Container-Security workflows completed successfully on exact PR head `89f1a333a9f735ecad455b1ee6ae7e31f20e9305`.
- `GOV-CHAT-074 / Approval Envelope v3.4` is **DONE_MAIN / TERMINAL** through Human-merged PR #874, merge SHA `d8d91cc5b04f107be28cbbfb13aaab8175305444`. Current `/AGENTS.md` and `HUMAN_OWNER_PR_APPROVAL_POLICY.md` now make the bounded Approval Envelope authoritative for future PR-create flows.
- PR #874 Hosted Governance, CI and Container-Security workflows completed successfully on exact PR head `7b8c682fbc1962b2b4af844e87b7a967e9e07162` before Human Merge.
- Current open Pull Requests at this post-merge correlation point: **none**. No current changed-file, semantic, namespace or authority writer blocks the Governance planning closeout.
- `GOV-CHAT-075 / bounded Security-remediation authority` remains **DONE_MAIN / TERMINAL** through Human-merged PR #864; its Security/PVC/Primary-Owner boundaries are preserved by Approval Envelope v3.4.
- `M10` remains **RETIRED / OFF** and is not a current implementation gap. `NIST` publications/frameworks remain withdrawn from the repository Governance baseline and do not create a GOV remediation backlog.
- Historical branches `agent/governance-pr-approval-consolidation-20260910` and `agent/governance-pr-approval-envelope-20260910` are non-authorizing traceability only after Human Merge.
- `GOV-CHAT-072 / Development-Chain chat plugin execution policy` is now the highest-priority open local Governance item and is no longer sequenced behind GOV-CHAT-074.

## Completed / terminal Governance work

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive provider continuation remains foreign-owner scope.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via PR #767; organizational `PVC-*` and technical `VC-*` remain separate.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via PR #755/#758.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — prior reconciliation `DONE_MAIN`; bounded Security-remediation authority terminal through PR #864.
- `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` — `DONE_MAIN / TERMINAL` via PR #769.
- `COPYABLE CHAT NEXT-STEP HANDOFF` — `DONE_MAIN / MAINTAINED`; bounded continuation remains current and PR-create handoff is consolidated into the v3.4 Approval Envelope.
- `OWNER APPROVAL PRESENTATION` — `DONE_MAIN / MAINTAINED` via PR #803; pure approvals/confirmations remain neutral authority presentation.
- `GOV-CHAT-071 / separate Owner-response retirement` — `DONE_MAIN / TERMINAL` via PR #845.
- `GOV-CHAT-073 / NIST-M10 current-state cleanup` — `DONE_MAIN / TERMINAL`.
- `GOV-CHAT-074 / Approval Envelope v3.4` — `DONE_MAIN / TERMINAL` via PR #874.
- `GOV-CHAT-075 / bounded Security-remediation authority` — `DONE_MAIN / TERMINAL` via PR #864.
- `GOV-CHAT-076 / cross-chat current-main consolidation` — `DONE_MAIN / TERMINAL` via PR #868.
- `COMP-GAP-008 — Governance Document Registry treatment` — `DONE_MAIN / TERMINAL` via PR #775.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — `DONE_MAIN / MAINTAINED` via PR #790.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

## Current open Governance state

### GOV-CHAT-072 — Development-Chain / chat plugin execution policy

**State:** `OPEN_GOV / READY_FOR_RECORRELATION`

**Reason:** Current `/AGENTS.md` already requires reuse screening in the order repository/native capability → connected plugin/platform capability → specialized plugin → suitable open source → custom implementation. The broader Owner-directed rule for application-appropriate use of installed/connected plugins in Development-Chain chats is not yet fully projected into current Governance.

**Current sequencing:** GOV-CHAT-074 is terminal on main, so this item may now be freshly correlated and implemented as its own bounded Governance slice. It must not become an instruction to invoke every plugin indiscriminately; relevance, least privilege, tool availability, ownership and protected-mutation controls remain controlling.

**Exit gate:** then-current `/AGENTS.md`, Development-Chain policy, Control Catalog/Authority projection and regression coverage define one bounded plugin-use rule: use connected/installed capabilities application-appropriately when relevant; preserve least privilege, fail-closed protected mutations and existing project/PVC ownership; no unconditional plugin invocation, duplicate orchestration or plugin authority.

### GOV-07 — User-Lifecycle governance closeout

**State:** `PARTIAL / OWNER RETURNS PENDING`

The Evolution Policy is complete, but the broader User-Lifecycle closeout remains dependency-held. Governance MUST NOT convert missing foreign-owner/provider/Legal evidence into PASS.

| Owner | Current return state | Governance interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides the Newsfeed Entitlement Return | current evidence; no ownership transfer |
| `CAPITAL-AI-OPS` | Human-merged PR #794 provides refreshed owner evidence; provider E2E and independent Security verification remain unresolved in the last canonical GOV projection | `FOREIGN_PARTIAL` until newer owner evidence is correlated |
| `CAPITAL-AI-FE` | broader lifecycle/pricing/entitlement UX closeout is not established in current GOV evidence | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | bounded remediation authority is terminal; independent ULS verification remains a separate dependency unless superseded by newer exact evidence | `DEPENDENCY` |
| `CAPITAL-AI-COMP` / Human-Legal | bounded assessment evidence exists; Legal/Owner gates remain external | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned | no foreign implementation absorbed by GOV |

### GOV-08 — Admin Panel process/dependency graph

**State:** `REFERRED / FOREIGN OPEN`

Productive implementation remains split across `CAPITAL-AI-CLIENT`, `CAPITAL-AI-FE` and `CAPITAL-AI-OPS`. Governance may constrain or consume resulting evidence but does not take over foreign runtime/UI ownership.

## Cross-chat work explicitly not absorbed into GOV

OPS, CLIENT, DOC, Security-quality, dependency, GitGuardian, repository-host, Supabase/Render/Stripe, MCP/gateway, telemetry and self-healing work remain in their owning Project/PVC Roadmaps unless they create a concrete Governance contract/authority/closeout dependency. Cross-chat consolidation never transfers foreign ownership into PVC-05.

## Current priority

1. Freshly correlate and implement `GOV-CHAT-072` as the bounded Development-Chain/chat plugin execution policy under current Approval Envelope v3.4 and the current Security/ownership boundaries.
2. Re-correlate the dependency-held `GOV-07` owner-return matrix against then-current DATA/OPS/FE/SEC/COMP evidence before any final Governance closeout assertion.

No new local PVC-05 runtime implementation is implied by this synchronization.

## Definition of Done for the current Governance projection

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- GOV-CHAT-076 remains terminalized consistently with PR #868/current main;
- GOV-CHAT-074 is terminalized consistently with Human-merged PR #874/current main;
- Human Owner PR Approval v3.4, Development Chain v2.8, Control Catalog v1.23 and Authority Registry v1.59 project one effective PR-create authority rather than a second approval plane;
- deterministic effective-change identity remains evidence, not semantic safety proof;
- synchronization-only SHA movement may preserve approval only with proven material equivalence and full current correlation;
- Security remediation delegation and ownership/protected-mutation boundaries from PR #864 remain intact;
- NIST remains non-authorizing and M10 remains retired/off unless a new explicit Human/Owner decision changes that state;
- missing/stale validation or evidence cannot silently become PASS;
- Human/CODEOWNER-only merge remains mandatory;
- GOV-CHAT-072 is the next bounded local Governance implementation item.
