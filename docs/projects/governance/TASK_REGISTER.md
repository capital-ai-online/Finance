# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-10, correlated to repository-visible current-main/PR/branch evidence  
**Current correlation baseline:** `main@5664332aac99befa819abbbc2cf23c30a8982147`  
**Role:** chat/backlog traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director` for local rows only  
**Canonical planning surface:** `docs/projects/governance/ROADMAP.md`

## Status vocabulary

- `DONE_MAIN` — merged/current-main evidence supports completion.
- `OPEN_GOV` — bounded CAPITAL-AI-GOV work remains.
- `BRANCH_LOCAL` — implementation exists only on a scoped branch and is non-authorizing until Human Merge.
- `READY_FOR_RECORRELATION` — prior sequencing dependency is terminal; work may be freshly correlated but no historical payload is current authority.
- `PR_GATE_NEXT` — bounded implementation is branch-local and the next protected step is the currently effective Human/Owner PR-create gate.
- `FOREIGN_PARTIAL` — foreign owner implemented part; evidence/verification remains.
- `FOREIGN_OPEN` — foreign Primary Owner still owns execution.
- `DEPENDENCY` — GOV closeout waits on another owner/verifier/Legal or terminal upstream state.
- `CONTINUOUS` — maintenance/assessment obligation.
- `HISTORICAL` — terminal coordination state retained only for traceability.

## Canonical task register

| ID | Task | Owner | Status | Current-main / branch treatment |
|---|---|---|---|---|
| `GOV-CHAT-001` | Canonical `docs/projects/` surface | GOV | `DONE_MAIN` | project model present |
| `GOV-CHAT-002` | `PVC-01..PVC-18` ownership namespace | GOV | `DONE_MAIN` | canonical Project Value Chain present |
| `GOV-CHAT-003` | Platform Director `PVC-05` / Governance scope | GOV | `DONE_MAIN` | boundary preserved |
| `GOV-CHAT-004` | DevelopmentChain integration | OPS + GOV policy | `DONE_MAIN` | PVC → Roadmap → ADR → ESS model active |
| `GOV-CHAT-005` | M0-M10 historical treatment | OPS / GOV | `DONE_MAIN` | M10 retired/off; no current implementation gap |
| `GOV-CHAT-006` | Financial technical `VC-*` migration assessment | GOV + affected owners | `DONE_MAIN` | Owner confirmed no migration; PR #767 terminalized GOV-05 |
| `GOV-CHAT-007` | Preserve `SC-MD-SPT-0001` during any future migration | affected owners | `CONTINUOUS` | existing technical identities retained |
| `GOV-CHAT-008` | CLIENT organizational `PVC-01` migration | CLIENT | `FOREIGN_OPEN` | CLIENT-owned; do not absorb into GOV |
| `GOV-CHAT-011` | Admin Panel process/dependency graph | CLIENT / FE / OPS | `FOREIGN_OPEN` | GOV-08 remains referred |
| `GOV-CHAT-012` | Governance/component architecture assessment | GOV | `CONTINUOUS` | maintain current-state projection |
| `GOV-CHAT-013` | Compact PR body template | GOV | `DONE_MAIN` | `.github/pull_request_template.md` v1.5.0 remains current PR-body contract |
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | current-main exact-snapshot approval gate controls this candidate PR until a later Human-merged authority replaces it |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | mandatory current control; candidate v3.4 strengthens semantic-equivalence evaluation after activation |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability synchronized to current slice |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | current main retains bounded handoff; candidate v3.4 consolidates PR-create handoff after activation |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | last canonical GOV evidence: PR #794 merged; provider E2E and independent Security verification still need newer exact evidence before closure |
| `GOV-CHAT-041` | Lifecycle/pricing/entitlement UX | FE | `FOREIGN_OPEN` | broader closeout not established in current GOV evidence |
| `GOV-CHAT-042` | Independent User-Lifecycle Security verification | SEC | `DEPENDENCY` | independent ULS re-verification/provider-E2E residuals remain unless superseded by newer exact evidence |
| `GOV-CHAT-043` | Purchase/cancellation consumer-compliance | COMP / Human-Legal | `DEPENDENCY` | external Owner/Legal/Evidence gates remain |
| `GOV-CHAT-044` | Final User-Lifecycle governance correlation | GOV | `OPEN_GOV` | dependency-held on FE/SEC/COMP/Legal and provider-assurance evidence |
| `GOV-CHAT-047` | BGB §312j/§312k applicability | COMP / Human-Legal | `DEPENDENCY` | no GOV legal inference |
| `GOV-CHAT-053` | Deep Research Evidence Contract | GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | ADR-0060 authority/lifecycle reconciliation | GOV | `DONE_MAIN` | GOV-03/DR-02B terminal via PR #743 |
| `GOV-CHAT-061` | Recorrelate after GOV-03 | GOV | `DONE_MAIN` | PR #751 |
| `GOV-CHAT-062` | COMP-GAP-002 / ADR-0007 | GOV | `DONE_MAIN` | PR #755/#758 |
| `GOV-CHAT-063` | COMP-GAP-003 / ESS-0006 | GOV | `DONE_MAIN` | prior reconciliation via PR #757; bounded Security-remediation extension terminal through PR #864 |
| `GOV-CHAT-064` | Post-ESS-0006 project correlation | GOV | `DONE_MAIN` | PR #762 |
| `GOV-CHAT-065` | GOV-05 no-migration decision closeout | GOV | `DONE_MAIN` | PR #767 |
| `GOV-CHAT-066` | Post-GOV-05 owner/evidence re-correlation | GOV/PVC-05 | `DONE_MAIN` | PR #769 |
| `GOV-CHAT-067` | COMP-GAP-008 Document Registry treatment | GOV/PVC-05 with DOC/PVC-03 input | `DONE_MAIN` | PR #775 |
| `GOV-CHAT-068` | Copyable bounded next-step handoff | GOV lifecycle | `DONE_MAIN` | PR #772 remains historical implementation evidence; separate generic Owner-response formatting retired |
| `GOV-CHAT-069` | Post-COMP-GAP-008 owner/dependency re-correlation | GOV/PVC-05 | `DONE_MAIN` | PR #780 |
| `GOV-CHAT-070` | GOV-07 validated-baseline evolution policy | GOV/PVC-05 policy | `DONE_MAIN` | Human-merged PR #790; broader GOV-07 closeout remains dependency-held |
| `GOV-CHAT-071` | Retire separate copyable Owner-response rule; preserve neutral approval presentation | GOV/PVC-05 | `DONE_MAIN` | TERMINAL via Human-merged PR #845 |
| `GOV-CHAT-072` | Development-Chain/chat plugin execution policy | GOV/PVC-05 | `OPEN_GOV / SEQUENCED` | start only after Human/CODEOWNER-terminal GOV-CHAT-074; preserve relevance, least privilege and protected-mutation gates |
| `GOV-CHAT-073` | Roadmap-framework NIST/M10 current-state correction | GOV/PVC-05 | `DONE_MAIN` | NIST withdrawn/non-authorizing; M10 retired/off |
| `GOV-CHAT-074` | New PR-CREATION-APPROVAL / Approval Envelope v3.4 rollout | GOV/PVC-05 | `OPEN_GOV / BRANCH_LOCAL / PR_GATE_NEXT` | branch `agent/governance-pr-approval-envelope-20260910`; created from `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`, synchronized through `main@5664332aac99befa819abbbc2cf23c30a8982147`; historical `bcbc736...` semantics selectively rematerialized; current `main` v3.3 remains controlling for this candidate PR until Human Merge |
| `GOV-CHAT-075` | Bounded Security-remediation authority | GOV/PVC-05 policy with SEC assurance boundary | `DONE_MAIN` | Human-merged PR #864, merge SHA `c20bce01f398f58240c69676ede367787bb7251a`; preserved unchanged by GOV-CHAT-074 |
| `GOV-CHAT-076` | Cross-chat current-main consolidation / GOV Roadmap and register sync | GOV/PVC-05 | `DONE_MAIN` | Human-merged PR #868, merge SHA `6d2b78b7914f9771c5fa8a88c6e6bcd40019114a` |

## GOV-CHAT-074 — current-main re-correlation

### Authority effective for creation of this candidate PR

Current `main@5664332aac99befa819abbbc2cf23c30a8982147` controls creation of the GOV-CHAT-074 PR. Its `/AGENTS.md` exact-snapshot gate requires final main synchronization/correlation, exact `main SHA`, exact `branch head SHA`, bounded scope, truthful validation evidence and intended exact PR title before explicit Human/Owner approval. Any current-main or branch-head change before create invalidates that **current v3.3 approval**.

The branch-local candidate `HUMAN_OWNER_PR_APPROVAL_POLICY` v3.4.0 cannot authorize its own Pull Request. Candidate branch semantics become current only through Human/CODEOWNER merge.

### Candidate v3.4 semantics

The bounded Approval Envelope evolves the existing stable `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` / `CTRL-SDLC-PR-CREATE-001` authority rather than creating a second approval plane. It binds:

- Project / Project Folder / Primary PVC / Primary Owner;
- branch plus Roadmap item or explicit Owner scope;
- intended PR title and materially relevant changed-file set;
- deterministic effective-change identity over normalized change evidence and scope/title binding;
- approval-base main/head Git identity as mandatory evidence;
- immediate current-main/open-writer/semantic/namespace/authority/security correlation and truthful validation state.

Evaluation states are exactly `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED`, `BLOCKED`. SHA equality is not semantic safety proof, and SHA inequality alone is not a material scope change. Synchronization-only movement may preserve approval only when payload equivalence is independently proven and full current correlation remains PASS.

### Selective-rematerialization safeguards

- Historical branch `agent/governance-pr-approval-consolidation-20260910` is not reused and reserves no authority.
- `CTRL-SEC-BOUNDED-REMEDIATION-001` remains present with its minimal-change, no-ownership-transfer, no-protected-mutation and separated-verification invariants.
- M10 remains `RETIRED / OFF`; no historical M10 implementation gap or reactivation requirement is introduced.
- NIST standards bindings remain withdrawn/non-authorizing; `src/platform/Governance/manifest.json` contains only the ISO/IEC 42001 benchmark.
- GOV-CHAT-071 remains terminal; candidate PR-create presentation has one embedded Owner-Freigabe surface rather than reconstructing a generic duplicate response block.
- Human/CODEOWNER merge remains a separate Human action and candidate semantics never self-bootstrap.

## Current writer / correlation state

At the final pre-approval correlation against `main@5664332aac99befa819abbbc2cf23c30a8982147`:

- current open Pull Requests: **none**;
- PR #869 and PR #870 are terminal and their main changes are disjoint from the GOV-CHAT-074 changed-file set;
- `agent/governance-pr-approval-consolidation-20260910` is historical/non-authorizing and was not continued;
- `agent/governance-pr-approval-envelope-20260910` is the sole fresh bounded writer for GOV-CHAT-074;
- PR #864/#865/#866/#868/#869/#870 are terminal;
- synchronization commit `c3d34418e537d59db18f2f98f16071140f417aa0` incorporates current-main-only Documentary/dependency-security changes without importing stale Approval/NIST/M10/Owner-response semantics;
- final changed-file/open-writer/semantic/namespace/authority correlation is PASS, subject to the mandatory SHA readback immediately before PR creation.

## Current foreign-owner dependencies

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides GOV-07 Newsfeed Entitlement Return | evidence may be consumed; no ownership transfer |
| `CAPITAL-AI-OPS` | last canonical GOV User-Lifecycle return is EVIDENCE_READY | `FOREIGN_PARTIAL` until exact closeout evidence is correlated |
| `CAPITAL-AI-FE` | lifecycle/pricing/entitlement UX closeout not established | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | bounded remediation authority terminal through PR #864; independent ULS verification remains separate | no productive PVC transfer |
| `CAPITAL-AI-COMP` / Human-Legal | bounded assessment evidence exists; Legal/Owner gates remain | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned | no foreign implementation absorbed by GOV |
| `CAPITAL-AI-CLIENT` / FE / OPS | Admin Panel/process/dependency work remains split | `FOREIGN_OPEN` |

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.