# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
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

The Governance backlog was re-correlated against `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`, `/AGENTS.md` Control Plane v2.9.0, the canonical Project/PVC mapping and the current PR set before opening the fresh GOV-CHAT-074 slice.

- PR #868 (`GOV-CHAT-076`) is **DONE_MAIN / TERMINAL**, merge SHA `6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`; the former Roadmap/Register synchronization gate is no longer open work.
- `GOV-CHAT-071` remains **DONE_MAIN / TERMINAL** through Human-merged PR #845.
- `GOV-CHAT-075 / bounded Security-remediation authority` remains **DONE_MAIN / TERMINAL** through Human-merged PR #864, merge SHA `c20bce01f398f58240c69676ede367787bb7251a`.
- PR #865 (`CAPITAL-AI-OPS` dependency-floor hardening) and PR #866 (`CAPITAL-AI-DOC` WP-DOC-11 closeout / GOV-DOC-005 validator) remain terminal foreign-owner evidence.
- Current open Pull Requests at GOV-CHAT-074 branch creation: **none**. No changed-file, semantic, namespace or authority writer blocked the bounded Approval-Envelope slice.
- `M10` remains **RETIRED / OFF** and is not a current implementation gap. `NIST` publications/frameworks remain withdrawn from the repository Governance baseline and do not create a GOV remediation backlog.
- Historical branch `agent/governance-pr-approval-consolidation-20260910` remains **NON-AUTHORIZING** and is not reused. Its preserved v3.4 payload at `bcbc73672d8f1bf3d2d7120ba0cad6aaaf0b212e` is evidence only.
- Fresh branch `agent/governance-pr-approval-envelope-20260910` starts from exact current main and selectively rematerializes only still-valid Approval-Envelope semantics while retaining the current Security-remediation authority and ownership boundaries.
- `GOV-CHAT-072 / Development-Chain chat plugin execution policy` remains **OPEN_GOV / SEQUENCED** after Human/CODEOWNER-terminal GOV-CHAT-074.

## Completed / terminal Governance work

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive provider continuation remains foreign-owner scope.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via PR #767; organizational `PVC-*` and technical `VC-*` remain separate.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via PR #755/#758.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — prior reconciliation `DONE_MAIN`; bounded Security-remediation authority terminal through PR #864.
- `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` — `DONE_MAIN / TERMINAL` via PR #769.
- `COPYABLE CHAT NEXT-STEP HANDOFF` — `DONE_MAIN / MAINTAINED`; bounded continuation remains current, with candidate v3.4 proposing one consolidated PR-create approval surface after Human Merge.
- `OWNER APPROVAL PRESENTATION` — `DONE_MAIN / MAINTAINED` via PR #803; pure approvals/confirmations remain neutral authority presentation.
- `GOV-CHAT-071 / separate Owner-response retirement` — `DONE_MAIN / TERMINAL` via PR #845.
- `GOV-CHAT-073 / NIST-M10 current-state cleanup` — `DONE_MAIN / TERMINAL`.
- `GOV-CHAT-075 / bounded Security-remediation authority` — `DONE_MAIN / TERMINAL` via PR #864.
- `GOV-CHAT-076 / cross-chat current-main consolidation` — `DONE_MAIN / TERMINAL` via PR #868.
- `COMP-GAP-008 — Governance Document Registry treatment` — `DONE_MAIN / TERMINAL` via PR #775.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — `DONE_MAIN / MAINTAINED` via PR #790.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

## Current open Governance state

### GOV-CHAT-074 — PR Approval Envelope / new PR-CREATION-APPROVAL rollout

**State:** `OPEN_GOV / BRANCH_LOCAL / PR_GATE_NEXT / NON-AUTHORIZING`

**Fresh branch:** `agent/governance-pr-approval-envelope-20260910`  
**Branch baseline:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Historical evidence only:** `bcbc73672d8f1bf3d2d7120ba0cad6aaaf0b212e`

**Reason:** The historical v3.4 design improves decision support by binding PR-create approval to a bounded effective change rather than treating incidental Git SHA identity as the sole invariant. The fresh slice selectively rematerializes that design against current authority. It preserves exact Git identities as mandatory evidence, requires deterministic effective-change identity plus material-equivalence review, and evaluates immediate pre-create state as exactly `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED` or `BLOCKED`.

**Current branch implementation:** candidate `HUMAN_OWNER_PR_APPROVAL_POLICY` v3.4.0, Trust-Root Approval-Envelope semantics, Development Chain v2.8.0, Control Catalog v1.23.0, Authority Registry v1.59.0, repository-local `scripts/pr/approvalEnvelope.mjs` evaluator and regression tests/projections. The current `CTRL-SEC-BOUNDED-REMEDIATION-001` contract remains intact. M10 stays retired/off; NIST bindings remain non-authorizing.

**No-self-bootstrap:** candidate v3.4.0 policy on this branch **does not authorize its own PR creation**. Until Human Merge, then-current `main` approval authority controls creation of this PR. Human/CODEOWNER merge remains a separate Human decision.

**Exit gate:** bounded current-main branch; Approval Policy/evaluator/tests/Authority Registry/Control Catalog/Development Chain/project projections consistent; Security delegation and ownership boundaries retained; no NIST/M10/retired Owner-response regression; necessary low-cost validation PASS or truthfully NOT RUN; branch 0 behind; final open-writer/semantic/namespace/authority correlation PASS; PR-create approval requested under the authority actually current at that moment.

### GOV-CHAT-072 — Development-Chain / chat plugin execution policy

**State:** `OPEN_GOV / SEQUENCED`

**Reason:** Current `/AGENTS.md` already requires reuse screening in the order repository/native capability → connected plugin/platform capability → specialized plugin → suitable open source → custom implementation. The broader Owner-directed rule for application-appropriate use of installed/connected plugins in Development-Chain chats is not yet fully projected into current Governance.

**Sequencing:** Materialize only after GOV-CHAT-074 becomes terminal on `main`, avoiding overlapping normative writers.

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

1. Complete `GOV-CHAT-074` on `agent/governance-pr-approval-envelope-20260910`, validate and correlate it against then-current main, then pass the **currently effective** Human/Owner PR-create gate. Candidate v3.4 semantics remain non-authorizing until Human/CODEOWNER merge.
2. After `GOV-CHAT-074` is terminal on main, freshly correlate and implement `GOV-CHAT-072` as the bounded Development-Chain/plugin execution policy.

No new local PVC-05 runtime implementation is implied by this synchronization.

## Definition of Done for the current Governance projection

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- GOV-CHAT-076 is terminalized consistently with PR #868/current main;
- GOV-CHAT-074 is a fresh current-main candidate with no self-bootstrap;
- Human Owner PR Approval v3.4, Development Chain v2.8, Control Catalog v1.23 and Authority Registry v1.59 project one stable PR-create authority rather than a second approval plane;
- deterministic effective-change identity is evidence, not semantic safety proof;
- synchronization-only SHA movement can preserve approval only with proven material equivalence and full current correlation after v3.4 becomes effective;
- Security remediation delegation and ownership/protected-mutation boundaries from PR #864 remain intact;
- NIST remains non-authorizing and M10 remains retired/off unless a new explicit Human/Owner decision changes that state;
- missing/stale validation or evidence cannot silently become PASS;
- Human/CODEOWNER-only merge remains mandatory;
- GOV-CHAT-072 remains sequenced after terminal GOV-CHAT-074.
