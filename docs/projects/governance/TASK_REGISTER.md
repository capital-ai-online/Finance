# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-15, correlated to repository-visible current-main/PR/branch evidence  
**Current correlation baseline:** `main@698e0bc26e28899ddf2429fb298f74d54e35b3b0`  
**Role:** chat/backlog traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director` for local rows only  
**Canonical planning surface:** `docs/projects/governance/ROADMAP.md`

## Status vocabulary

- `DONE_MAIN` — merged/current-main evidence supports completion.
- `OPEN_GOV` — bounded CAPITAL-AI-GOV work remains.
- `IMPLEMENTED_ON_BRANCH` — bounded implementation exists on a correlated scoped branch but is not current-main authority.
- `READY_FOR_RECORRELATION` — a prior sequencing dependency is terminal and work may be freshly correlated under current authority.
- `FOREIGN_PARTIAL` — foreign owner implemented part; evidence/verification remains.
- `FOREIGN_OPEN` — foreign Primary Owner still owns execution.
- `DEPENDENCY` — GOV closeout waits on another owner/verifier/Legal or terminal upstream state.
- `CONTINUOUS` — maintenance/assessment obligation.
- `HISTORICAL` — terminal coordination state retained only for traceability.

## Canonical task register

| ID | Task | Owner | Status | Current-main treatment / exit gate |
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
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | Approval Envelope v3.4 remains current-main bootstrap authority until GOV-CHAT-077 is Human-merged; Human/CODEOWNER merge remains separate |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | current v3.4 requires effective-change identity plus immediate pre-create current-main/open-writer/semantic/namespace/authority/security correlation; GOV-CHAT-077 evolves later current-main behavior to correlation-gated create |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability maintained against current main |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | bounded Roadmap/workaround handoff retained; after GOV-CHAT-077 activation successful create-correlation produces Draft PR before POST_PR_HANDOFF |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | current OPS return `EVIDENCE_READY` in `docs/projects/operations/evidence/GOV_07_USER_LIFECYCLE_EVIDENCE_RETURN_2026-09-06.md`; isolated Supabase Local/Mailpit, Stripe Sandbox/Test Clock/provider lifecycle E2E and independent Security closure remain open/NOT_AVAILABLE |
| `GOV-CHAT-041` | Lifecycle/pricing/entitlement UX | FE | `FOREIGN_PARTIAL` | Human-merged PR #809 (`51bf529f003dfa47462c16ecbe10ae3b095547a4`) supplies `FE_OWNER_RETURN_READY`; repository validation completed, while browser/WCAG/mobile and Stripe/Supabase provider E2E plus independent SEC/COMP assurance remain external |
| `GOV-CHAT-042` | Independent User-Lifecycle Security verification | SEC | `DEPENDENCY` | `SEC-VERIFY-ULS-001 = PARTIAL / NOT VERIFIED`; deployed contract/RLS bounded checks pass, but live active-paid identity lineage remains partial and requires OPS/PVC-08 evidence/remediation followed by independent Security re-verification |
| `GOV-CHAT-043` | Purchase/cancellation consumer-compliance | COMP / Human-Legal | `DEPENDENCY` | Human-merged PR #895/current main completes the latest local COMP reassessment; external Legal applicability/accepted-risk and remaining Owner/provider/Security evidence gates remain held; GOV makes no BGB §312j/§312k applicability inference |
| `GOV-CHAT-044` | Final User-Lifecycle governance correlation | GOV | `OPEN_GOV` | final closure remains dependency-held on OPS/provider evidence, independent Security re-verification and competent Human-Legal/Compliance decisions where applicable |
| `GOV-CHAT-047` | BGB §312j/§312k applicability | COMP / Human-Legal | `DEPENDENCY` | no GOV legal inference; competent Human/Legal scope decision remains required where applicable |
| `GOV-CHAT-053` | Deep Research Evidence Contract | GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | ADR-0060 authority/lifecycle reconciliation | GOV | `DONE_MAIN` | GOV-03/DR-02B terminal via PR #743 |
| `GOV-CHAT-061` | Recorrelate after GOV-03 | GOV | `DONE_MAIN` | PR #751 |
| `GOV-CHAT-062` | COMP-GAP-002 / ADR-0007 | GOV | `DONE_MAIN` | PR #755/#758 |
| `GOV-CHAT-063` | COMP-GAP-003 / ESS-0006 | GOV | `DONE_MAIN` | prior reconciliation via PR #757; bounded Security-remediation extension terminal through PR #864 |
| `GOV-CHAT-064` | Post-ESS-0006 project correlation | GOV | `DONE_MAIN` | PR #762 |
| `GOV-CHAT-065` | GOV-05 no-migration decision closeout | GOV | `DONE_MAIN` | PR #767 |
| `GOV-CHAT-066` | Post-GOV-05 owner/evidence re-correlation | GOV/PVC-05 | `DONE_MAIN` | PR #769 |
| `GOV-CHAT-067` | COMP-GAP-008 Document Registry treatment | GOV/PVC-05 with DOC/PVC-03 input | `DONE_MAIN` | PR #775; latest COMP reassessment through Human-merged PR #895 records bounded finding `RESOLVED_ON_MAIN` while broader external recordkeeping scope remains separate |
| `GOV-CHAT-068` | Copyable bounded next-step handoff | GOV lifecycle | `DONE_MAIN` | PR #772 remains historical implementation evidence; separate generic Owner-response formatting retired |
| `GOV-CHAT-069` | Post-COMP-GAP-008 owner/dependency re-correlation | GOV/PVC-05 | `DONE_MAIN` | PR #780 |
| `GOV-CHAT-070` | GOV-07 validated-baseline evolution policy | GOV/PVC-05 policy | `DONE_MAIN` | Human-merged PR #790; broader GOV-07 closeout remains dependency-held |
| `GOV-CHAT-071` | Retire separate copyable Owner-response rule; preserve neutral approval presentation | GOV/PVC-05 | `DONE_MAIN` | TERMINAL via Human-merged PR #845 |
| `GOV-CHAT-072` | Development-Chain/chat plugin execution policy | GOV/PVC-05 | `DONE_MAIN` | Human-merged PR #886 and projection closeout PR #889; exactly one `CTRL-SDLC-PLUGIN-USE-001`, relevant least-privilege use only |
| `GOV-CHAT-073` | Roadmap-framework NIST/M10 current-state correction | GOV/PVC-05 | `DONE_MAIN` | NIST withdrawn/non-authorizing; M10 retired/off |
| `GOV-CHAT-074` | New PR-CREATION-APPROVAL / Approval Envelope v3.4 rollout | GOV/PVC-05 | `DONE_MAIN` | Human-merged PR #874; v3.4 remains the current-main bootstrap gate for the GOV-CHAT-077 introducing PR only until that later change is merged |
| `GOV-CHAT-075` | Bounded Security-remediation authority | GOV/PVC-05 policy with SEC assurance boundary | `DONE_MAIN` | Human-merged PR #864; Security ownership/verification separation remains preserved |
| `GOV-CHAT-076` | Cross-chat current-main consolidation / GOV Roadmap and register sync | GOV/PVC-05 | `DONE_MAIN` | Human-merged PR #868 |
| `GOV-CHAT-077` | Correlation-gated automated Draft-PR creation + ordered Roadmap PR lane | GOV/PVC-05 | `IMPLEMENTED_ON_BRANCH` | branch `agent/governance-autonomous-pr-chain-20260915`; exit requires current-main v3.4 bootstrap approval for the introducing PR, hosted validation, final Human/CODEOWNER merge, then v2.11/v4.0/v3.0 become current authority |

## GOV-CHAT-072 — terminal current-main state

Human-merged PR #886 materialized the bounded Development-Chain plugin/connector usage rule and PR #889 terminalized the stale project projection. Both are ancestors of current main.

Current main `/AGENTS.md` v2.10.0, `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` v2.9.0, Authority Registry v1.61.0 and Control Catalog v1.25.0 project exactly one `CTRL-SDLC-PLUGIN-USE-001` under existing authorities. No plugin-specific `AUTH-*` identity exists.

The rule requires an already installed/connected plugin, app, MCP tool, connector or equivalent capability to be directly relevant to the current bounded task and the least-privileged sufficient available capability before invocation. Availability never grants authority. Unconditional/all-plugin invocation, invocation solely because an integration is connected, automatic install/connect/enable/permission/OAuth/MCP-host mutation, PVC/Primary-Owner transfer, protected-mutation bypass and trust elevation from retrieved tool content remain prohibited.

ESS-0019 and the Human-merged CLIENT-08 contract remain provider-neutral capability and discovery/invocation-request contracts. `.mcp.json`, MCP executable identity, credentials, external host permissions/tool grants and session isolation remain outside GOV-CHAT-072 authority.

## GOV-CHAT-074 — terminal current-main state

Human-merged PR #874 activates `AUTH-GOV-HUMAN-OWNER-PR-APPROVAL` / `CTRL-SDLC-PR-CREATE-001` Approval Envelope v3.4 on current main. The current-main contract binds Project / Project Folder / Primary PVC / Primary Owner, branch and Roadmap or explicit Owner scope, materially relevant changed-file set, intended exact PR title, approval-base Git identities and deterministic effective-change identity. Immediately before PR creation, current main/head/merge-base, open writers, changed-file/semantic/namespace/authority/security overlap and stale validation are re-evaluated fail-closed as exactly `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED` or `BLOCKED`.

The canonical affirmative response remains exactly `PR Erstellung : Freigegeben` for any PR still governed by current-main v3.4. Human/CODEOWNER merge remains separate and Human-only.

## GOV-CHAT-077 — branch state / activation boundary

Owner direction on 2026-09-15 removes the separate pre-create Owner prompt for future ordinary bounded agent-managed Pull Requests and moves Human/Owner review to the created PR while preserving Human/CODEOWNER-only merge.

The implementation branch evolves the existing stable authorities rather than creating a parallel plane: `/AGENTS.md` v2.11.0, Human/Owner PR Policy v4.0.0, Development Chain v3.0.0, Control Catalog v1.26.0 and Authority Registry v1.62.0. The trusted Draft-PR workflow removes active Approval-Envelope inputs/verifier calls and re-runs fail-closed current-main/open-writer correlation immediately before create.

The ordered automated Roadmap lane permits at most one not-yet-integrated automated PR. A successor waits for predecessor terminal outcome; Human Merge causes a fresh successor branch from the resulting then-current main, while close-without-merge causes queue recomputation without assuming predecessor payload. Stacked unmerged dependency branches are not a bypass.

**No self-bootstrap:** this introducing PR must still use the current-main v3.4 Approval Envelope and exact Owner approval. Candidate v4 semantics become authoritative only after Human/CODEOWNER Merge.

## Current writer / correlation state

At `main@698e0bc26e28899ddf2429fb298f74d54e35b3b0`:

- the GitHub open-PR query returned no open Pull Requests at the latest correlation;
- parallel branch `agent/governance-pr900-04-freshness-version-validators-20260915` changes exactly four validator/test files: `scripts/governance/controlPlaneFreshnessRules.mjs`, `scripts/governance/controlPlaneStructuralValidatorCore.mjs`, `scripts/governance/validateGovernanceControlPlane.mjs`, and `tests/unit/governanceControlPlaneFreshness.test.ts`; none overlaps the GOV-CHAT-077 changed-file set at this correlation;
- historical branch `agent/governance-gov07-recorrelation-20260911` no longer exists and therefore does not constitute a current writer;
- branch `agent/governance-autonomous-pr-chain-20260915` is the bounded current writer for GOV-CHAT-077;
- no foreign Project/PVC ownership, Security/Compliance assurance authority, provider mutation, merge authority or production mutation is transferred by this work package.

## Current foreign-owner dependencies

| Owner | Current return state | GOV interpretation / exact evidence |
|---|---|---|
| `CAPITAL-AI-DATA` | `PARTIAL — PRODUCT ACCESS GAP CLOSED ON MAIN / AUTHORITY-UNAVAILABLE DISTINCTION OPEN` | `FOREIGN_PARTIAL`; `docs/projects/data/ROADMAP.md`. Productive route bypass is closed; unavailable-state distinction and independent Security verification remain open. |
| `CAPITAL-AI-OPS` | `EVIDENCE_READY` | `FOREIGN_PARTIAL`; `docs/projects/operations/evidence/GOV_07_USER_LIFECYCLE_EVIDENCE_RETURN_2026-09-06.md`. Stable-ID/readback return exists; isolated Supabase/Stripe provider lifecycle E2E and Security closure remain open/NOT_AVAILABLE. |
| `CAPITAL-AI-FE` | `FE_OWNER_RETURN_READY` through Human-merged PR #809 | `FOREIGN_PARTIAL / REPOSITORY_IMPLEMENTED`; repository validation completed; browser/provider E2E and independent SEC/COMP assurance remain external. |
| `CAPITAL-AI-SEC` | `PARTIAL / NOT VERIFIED` | `DEPENDENCY / NOT_VERIFIED`; live active-paid identity lineage is incomplete and routes productive evidence/remediation to OPS/PVC-08 before Security re-verification. |
| `CAPITAL-AI-COMP` / Human-Legal | `LOCAL_COMP_REASSESSED / EXTERNAL_GATES_HELD` through Human-merged PR #895 | `DEPENDENCY`; local Compliance processing is current while legal applicability/accepted-risk and external Owner/provider/Security evidence remain held. |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned | no foreign implementation absorbed by GOV |
| `CAPITAL-AI-CLIENT` / FE / OPS | Admin Panel/process/dependency work remains split | `FOREIGN_OPEN` |

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
