# CAPITAL-AI-GOV — Project Roadmap

**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain stage:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Current correlation baseline:** `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9`  
**Correlation date:** `2026-09-11`  
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

## Current-state synchronization — 2026-09-11

The Governance backlog was freshly correlated for `GOV-CHAT-072` against `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9`, `/AGENTS.md` Control Plane v2.9.0, the canonical Project/PVC mapping, Approval Policy v3.4.0, Accepted ADR-0096, ESS-0019, the merged CLIENT-08 contract and the current PR/writer set.

- PR #868 (`GOV-CHAT-076`) is **DONE_MAIN / TERMINAL**, merge SHA `6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`.
- `GOV-CHAT-074 / Approval Envelope v3.4` is **DONE_MAIN / TERMINAL** through Human-merged PR #874, merge SHA `d8d91cc5b04f107be28cbbfb13aaab8175305444`.
- PR #877 is **DONE_MAIN / TERMINAL**, merge SHA `7e5f783caa6cb33bca8346582b31ddda33258ed9`; it removed the remaining project-projection gate in front of `GOV-CHAT-072`.
- `main` is 36 commits ahead of the PR #877 merge and retains it as an ancestor. The intervening MCP executable-identity hardening remains a Security/OPS boundary and does not authorize connector installation, host permission changes or plugin execution.
- Current open Pull Requests at GOV-CHAT-072 branch creation: **none**. No active changed-file, namespace or authority writer blocks the bounded Governance slice.
- CLIENT-08 is reused as the provider-neutral discovery/invocation-request contract. It does not become Governance authority and does not activate remote skills or external integrations.
- `GOV-CHAT-075 / bounded Security-remediation authority` remains **DONE_MAIN / TERMINAL** through Human-merged PR #864; its Security/PVC/Primary-Owner boundaries are preserved.
- `M10` remains **RETIRED / OFF** and is not a current implementation gap. `NIST` publications/frameworks remain withdrawn from the repository Governance baseline and do not create a GOV remediation backlog.

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
- `GOV-CHAT-074 / Approval Envelope v3.4` — `DONE_MAIN / TERMINAL` via PR #874; post-merge projection closeout terminal via PR #877.
- `GOV-CHAT-075 / bounded Security-remediation authority` — `DONE_MAIN / TERMINAL` via PR #864.
- `GOV-CHAT-076 / cross-chat current-main consolidation` — `DONE_MAIN / TERMINAL` via PR #868.
- `COMP-GAP-008 — Governance Document Registry treatment` — `DONE_MAIN / TERMINAL` via PR #775.
- `GOV-CHAT-070 / GOV-07 Evolution Policy` — `DONE_MAIN / MAINTAINED` via PR #790.
- `GOV-09` Version authority boundary — resolved; productive Version Management remains OPS/PVC-06.
- `GOV-10` AI development terminology — done/maintained.
- `GOV-11` stale coordination metadata — maintenance only.

## Current open Governance state

### GOV-CHAT-072 — Development-Chain / chat plugin execution policy

**State:** `IMPLEMENTED_ON_BRANCH / PR_GATE_NEXT`

**Branch:** `agent/governance-gov-chat-072-plugin-use-20260911`

**Implementation:** The branch evolves the existing trust-root and Development-Chain authorities without creating a plugin-specific `AUTH-*` identity. `CTRL-SDLC-PLUGIN-USE-001` is the single bounded usage control for already installed/connected plugins, apps, MCP tools and connectors: select/invoke only when the capability directly advances the current bounded task and is the least-privileged sufficient available capability. Availability is not authorization; unconditional/all-plugin invocation, invocation merely because a capability is connected, automatic install/connect/enable/permission/OAuth/MCP-host mutation, ownership transfer and protected-gate bypass are prohibited.

**Reuse:** Accepted ESS-0019 remains the provider-neutral capability/security contract and CLIENT-08 remains the discovery/invocation-request contract. Neither becomes a second trust root, plugin authority, execution host or permission plane.

**Security boundary:** `.mcp.json`, MCP executable identity, external host credentials/tool grants and session isolation remain outside this GOV slice. Existing `CTRL-SEC-LEASTPRIV-001`, PR-create, Human/CODEOWNER merge and protected external-mutation controls remain unchanged in force.

**Exit gate:** branch diff and regression coverage prove exactly one `CTRL-SDLC-PLUGIN-USE-001` control under existing authorities; `/AGENTS.md`, Development-Chain policy, Control Catalog and Authority Registry project the same relevance/least-privilege/no-unconditional-invocation semantics; no new plugin `AUTH-*`, no automatic integration mutation and no weakened protected mutation/ownership/security boundary. Human Merge is required before this branch-local rule becomes current-main authority.

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

1. Carry the bounded `GOV-CHAT-072` branch through exact current-main correlation, Approval Envelope, hosted validation and Human/CODEOWNER merge without expanding its already defined scope.
2. After GOV-CHAT-072 is terminal on main, re-correlate the dependency-held `GOV-07` owner-return matrix against then-current DATA/OPS/FE/SEC/COMP evidence before any final Governance closeout assertion.

No new local PVC-05 runtime implementation is implied by this synchronization.

## Definition of Done for the current Governance projection

- `PVC-05` ownership remains explicit and does not absorb SEC/COMP assurance or foreign productive execution;
- GOV-CHAT-076 remains terminalized consistently with PR #868/current main;
- GOV-CHAT-074 remains terminalized consistently with Human-merged PR #874 and post-merge PR #877;
- Human Owner PR Approval v3.4 remains unchanged; branch-local Development Chain v2.9, Control Catalog v1.24 and Authority Registry v1.60 evolve their existing stable authorities only;
- exactly one `CTRL-SDLC-PLUGIN-USE-001` defines relevant least-privilege installed/connected capability use without unconditional invocation or automatic integration mutation;
- ESS-0019 and CLIENT-08 are reused without creating a second trust root, plugin registry, authorization plane or execution host;
- deterministic effective-change identity remains evidence, not semantic safety proof;
- Security remediation delegation and ownership/protected-mutation boundaries from PR #864 remain intact;
- NIST remains non-authorizing and M10 remains retired/off unless a new explicit Human/Owner decision changes that state;
- missing/stale validation or evidence cannot silently become PASS;
- Human/CODEOWNER-only merge remains mandatory;
- GOV-CHAT-072 becomes `DONE_MAIN / TERMINAL` only after Human Merge and exact current-main post-merge correlation.
