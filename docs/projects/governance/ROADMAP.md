# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`  
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

The owner-directed Governance chat backlog was re-correlated against `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`, the current Trust Root, the Project/PVC mapping and the current open-PR set.

- `GOV-CHAT-071 / separate Owner-response retirement` is **DONE_MAIN / TERMINAL** through Human-merged PR #845. Current `/AGENTS.md` already requires the canonical bounded `NÄCHSTE SCHRITTE` handoff while explicitly retiring a second generic copyable Owner-response block. The stale prior Roadmap state `OPEN_GOV / BRANCH_LOCAL` is therefore closed.
- `M10` remains **RETIRED / OFF** and is not a current implementation gap. `NIST` publications/frameworks remain withdrawn from the current repository Governance baseline and do not create a current GOV remediation backlog. Historical NIST/M10 evidence stays non-authorizing.
- Open PR #864 (`[CAPITAL-AI-GOV] [ChatGPT] Bounded Security-Remediation-Authority verankern`) is the only current open normative Governance writer. Its scope changes Development-Chain, Authority Registry, Control Catalog, Project/PVC projections and Security contracts. It does not directly change this Roadmap or `TASK_REGISTER.md`, but it is a semantic upstream dependency for any later PR-approval-policy or Development-Chain policy write.
- Open PR #865 is `CAPITAL-AI-OPS` dependency-floor work (`package.json` / `package-lock.json`) and open PR #866 is `CAPITAL-AI-DOC` Documentary work. Neither is a current changed-file writer for the two GOV planning files in this slice and neither transfers ownership to Governance.
- The branch `agent/governance-pr-approval-consolidation-20260910` is **WAITING_DOWNSTREAM / NON-AUTHORIZING**. Its current head intentionally sequences after the Security-remediation branch and preserves the earlier Approval-Envelope payload only in Git history. It MUST NOT be treated as PR-ready or current authority before the upstream Security slice is terminal on `main` and the approval payload is selectively re-correlated/re-applied against then-current Governance authority.
- The proposed Approval-Envelope payload is preserved at historical branch state `bcbc73672d8f1bf3d2d7120ba0cad6aaaf0b212e`, including `HUMAN_OWNER_PR_APPROVAL_POLICY` v3.4.0, a deterministic effective-change identity, the states `APPROVAL_STILL_VALID` / `REAPPROVAL_REQUIRED` / `BLOCKED`, and a single embedded `Owner-Freigabe` surface. This is **not current authority**. Current `main` still governs PR creation through its currently effective exact-main/exact-branch-head approval contract until a later Human/CODEOWNER merge activates replacement semantics.
- The owner-directed Development-Chain/chat plugin rule remains **OPEN_GOV**. Current `/AGENTS.md` already requires reuse screening in the order repository/native capability → connected plugin/platform capability → specialized plugin → suitable open source → custom implementation, but it does not yet materialize the broader requested chat-execution rule that installed/connected plugins be used application-appropriately when relevant. No current branch or PR implementing that bounded policy was found. This must be reconciled with least privilege and the rule that plugins are used when relevant rather than indiscriminately.

## Completed / terminal Governance work

- `GOV-01` Project Value Chain architecture — `DONE / MAINTAINED`.
- `GOV-02` Human-readable DevelopmentChain simplification — `DONE / MAINTAINED`.
- `GOV-03 / DR-02B` ADR-0060 authority reconciliation — `DONE_MAIN / TERMINAL` via PR #743.
- `GOV-04` Deep Research Governance boundary — `DR-01 + DR-02A + DR-02B DONE AT GOV BOUNDARY`; productive provider continuation remains foreign-owner scope.
- `GOV-05` financial technical `VC-*` namespace decision — `DONE_MAIN / TERMINAL` via PR #767; organizational `PVC-*` and technical `VC-*` remain separate.
- `GOV-06 / COMP-GAP-002 — ADR-0007` — `DONE_MAIN / TERMINAL` via PR #755/#758.
- `GOV-06 / COMP-GAP-003 — ESS-0006` — prior reconciliation `DONE_MAIN`; the bounded Security-remediation extension is separately tracked below through PR #864.
- `POST-GOV-05 OWNER / EVIDENCE RECORRELATION` — `DONE_MAIN / TERMINAL` via PR #769.
- `COPYABLE CHAT NEXT-STEP HANDOFF` — `DONE_MAIN / MAINTAINED`; bounded fenced `NÄCHSTE SCHRITTE` remains current.
- `OWNER APPROVAL PRESENTATION` — `DONE_MAIN / MAINTAINED` via PR #803; pure approvals/confirmations remain neutral authority presentation rather than manual-execution steps.
- `GOV-CHAT-071 / separate Owner-response retirement` — `DONE_MAIN / TERMINAL` via PR #845.
- `COMP-GAP-008 — Governance Document Registry treatment` — `DONE_MAIN / TERMINAL` via PR #775.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — `DONE_MAIN / MAINTAINED` via PR #790.
- `NIST current-state authority retirement / M10 current-state normalization` — `DONE_MAIN / MAINTAINED`; neither is an active Governance implementation workstream.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

## Current open Governance state

### GOV-CHAT-072 — Development-Chain / chat plugin execution policy

**State:** `OPEN_GOV / SEQUENCED`

**Reason:** The existing Trust Root contains a plugin/platform/open-source reuse pre-check, but the owner-directed rule for application-appropriate use of installed and connected plugins in Development-Chain chats is not yet fully projected into current Governance. The rule must not become an instruction to call every plugin unconditionally; relevance, least privilege, tool availability, authority and protected-mutation gates remain controlling.

**Sequencing:** Do not create a parallel normative writer while PR #864 or the Approval-Envelope rollout is modifying the same Development-Chain/Authority surfaces. Materialize this policy after those higher-priority Governance writes are terminal and re-correlated.

**Exit gate:** then-current `/AGENTS.md`, Development-Chain policy, Control Catalog/Authority projection and regression coverage define one bounded plugin-use rule: use connected/installed capabilities application-appropriately when relevant; preserve least privilege, fail-closed protected mutations and existing project/PVC ownership; no duplicate orchestration or plugin authority.

### GOV-CHAT-073 — NIST/M10 current-state cleanup from Roadmap-framework work

**State:** `DONE_MAIN / TERMINAL`

**Reason for terminalization:** Current `main` already states that NIST material is withdrawn/non-authorizing and M10 is retired/off/non-discoverable as an implementation gap. The prior Roadmap-framework chat therefore contributes no new active GOV implementation item. Historical branches/reports remain search/evidence hints only.

**Exit gate:** satisfied on current main; reopen only after a new explicit Human/Owner decision changes the authority state.

### GOV-CHAT-074 — PR Approval Envelope / new PR-CREATION-APPROVAL template rollout

**State:** `WAITING_DOWNSTREAM / NON-AUTHORIZING`

**Current branch:** `agent/governance-pr-approval-consolidation-20260910`  
**Preserved proposed payload:** `bcbc73672d8f1bf3d2d7120ba0cad6aaaf0b212e`  
**Current sequenced head:** `0e78e7c866786de4d94027a230f35aa32fce83d4`

**Reason:** The proposed v3.4 Approval Envelope materially improves decision support and distinguishes harmless Git/SHA movement from material payload drift, but it changes a repository-wide PR-creation authority surface. Candidate branch semantics cannot authorize their own activation. The current branch is intentionally waiting behind PR #864 because both work items touch Development-Chain/Authority/Control surfaces. Current `main` remains authoritative until Human/CODEOWNER merge of a newly re-correlated approval rollout.

**Required continuation after PR #864 reaches a terminal main state:** re-read current `/AGENTS.md`, Project/PVC mapping, Governance Roadmap/Register, Approval Policy, current open PRs/writers and all overlapping governance surfaces; selectively re-apply only the still-valid Approval-Envelope payload; update evaluator/tests/projections consistently; prove no stale NIST/M10 or superseded approval semantics are reintroduced.

**Exit gate:** current-main-based branch with materially bounded Approval-Envelope payload, policy/evaluator/tests/registries/project projections consistent, required low-cost validations PASS or truthfully NOT RUN, branch 0 behind, correlation PASS and PR-create approval requested under the authority that is actually current at that moment. New Approval-Envelope semantics become current only after Human/CODEOWNER merge.

### GOV-CHAT-075 — Bounded Security-remediation authority

**State:** `OPEN_GOV / PR_OPEN #864`

**Reason:** Security currently needs a narrowly bounded capability to implement the smallest sufficient Security-primary repository remediation without acquiring productive PVC/domain ownership. PR #864 carries that Governance contract and is also upstream of the Approval-Envelope and plugin-policy writes because the files overlap semantically.

**Exit gate:** PR #864 reaches a terminal main state through Human/CODEOWNER decision; then-current Trust Root/Development-Chain/Registry/ESS/Security projections are consistent, required hosted evidence is evaluated on the terminal PR head, and downstream GOV writers are re-correlated before reuse.

### GOV-CHAT-076 — Cross-chat current-main consolidation and GOV planning sync

**State:** `OPEN_GOV / BRANCH_LOCAL`

**Branch:** `agent/governance-chat-consolidation-20260910`

**Reason:** Before this pass, the canonical GOV Roadmap and Task Register still projected `main@29b46dc9131168036a0c067d8e9a14461b411bfe` from 2026-09-08, incorrectly left GOV-CHAT-071 open, and omitted the Security-remediation, Approval-Envelope and plugin-policy work introduced in later chats. A current-main traceability correction is required so future work resolves from repository truth rather than stale chat baselines.

**Exit gate:** Roadmap and Task Register project the same current-main/open-PR/ownership state, foreign work is not absorbed into PVC-05, new open tasks include reasons and sequencing, and the branch is synchronized/correlated before any PR-create approval request.

### GOV-07 — User-Lifecycle governance closeout

**State:** `PARTIAL / OWNER RETURNS PENDING`

The Evolution Policy is complete, but the broader User-Lifecycle closeout remains dependency-held. Governance MUST NOT convert missing foreign-owner/provider/Legal evidence into PASS.

| Owner | Current return state | Governance interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides the Newsfeed Entitlement Return | current evidence; no ownership transfer |
| `CAPITAL-AI-OPS` | Human-merged PR #794 provides refreshed owner evidence; provider E2E and independent Security verification remain unresolved in the last canonical GOV projection | `FOREIGN_PARTIAL` until newer owner evidence is correlated |
| `CAPITAL-AI-FE` | broader lifecycle/pricing/entitlement UX closeout is not established in current GOV evidence | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | prior PR #787 was closed/not merged; independent verification remains a dependency unless superseded by newer exact evidence | `DEPENDENCY` |
| `CAPITAL-AI-COMP` / Human-Legal | bounded assessment evidence exists; Legal/Owner gates remain external | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned | no foreign implementation absorbed by GOV |

### GOV-08 — Admin Panel process/dependency graph

**State:** `REFERRED / FOREIGN OPEN`

Productive implementation remains split across `CAPITAL-AI-CLIENT`, `CAPITAL-AI-FE` and `CAPITAL-AI-OPS`. Governance may constrain or consume resulting evidence but does not take over foreign runtime/UI ownership.

## Cross-chat work explicitly not absorbed into the GOV implementation backlog

Recent chats also contain active or recently completed OPS, CLIENT, DOC, Security-quality, dependency, GitGuardian, Snyk, repository-relocation, Supabase/Render/Stripe, branch-cleaner, MCP/gateway, telemetry and self-healing work. Those items MUST be resolved against their own Project/PVC Roadmaps and Primary Owners. Governance records only a dependency when a result changes a GOV authority, contract or closeout gate. This prevents cross-chat consolidation from becoming a foreign-project ownership transfer.

## Current priority

1. Keep the planning correction in `GOV-CHAT-076` bounded and current-main synchronized while PR #864 is the sole active normative GOV writer; do not mutate the waiting Approval-Envelope branch as if it were current authority.
2. After PR #864 is terminal on `main`, re-correlate and selectively materialize `GOV-CHAT-074` Approval Envelope before starting the overlapping `GOV-CHAT-072` plugin-policy write. GOV-07/GOV-08 remain dependency-held/foreign-owner work in parallel only where ownership and changed-file boundaries are preserved.

No new local PVC-05 runtime implementation is implied by this synchronization.

## Definition of Done for the current Governance projection

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- Roadmap and Task Register are correlated to the same current-main/open-PR state;
- `GOV-CHAT-071` is terminalized consistently with Human-merged PR #845;
- NIST remains non-authorizing and M10 remains retired/off unless a new explicit Human/Owner decision changes that state;
- the current effective PR-create authority is distinguished from the non-authorizing proposed Approval-Envelope payload;
- Approval-Envelope activation follows no-self-bootstrap, current-main correlation, Human PR-create approval and Human/CODEOWNER-only merge boundaries;
- plugin-policy work is bounded to relevant application-appropriate use and cannot weaken least privilege or protected-mutation gates;
- missing/stale evidence cannot silently become PASS;
- no second Governance, approval, routing, IAM, Security/Compliance or deployment authority is introduced.

Historical correlation SHAs, branches, PRs and terminal work remain available through Git history and merged PR evidence; they do not override this current-state projection.
