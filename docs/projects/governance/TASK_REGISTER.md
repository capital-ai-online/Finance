# CAPITAL-AI-GOV — Canonical Chat Task Register

**Source:** Owner-directed CAPITAL-AI-GOV project conversations through 2026-09-10, correlated to repository-visible current-main/PR/branch evidence  
**Current correlation baseline:** `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`  
**Role:** chat/backlog traceability projection — non-authorizing  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director` for local rows only  
**Canonical planning surface:** `docs/projects/governance/ROADMAP.md`

## Status vocabulary

- `DONE_MAIN` — merged/current-main evidence supports completion.
- `OPEN_GOV` — bounded CAPITAL-AI-GOV work remains.
- `PR_OPEN` — bounded GOV work has a current open Pull Request; merge/terminal decision remains Human/CODEOWNER-only.
- `WAITING_DOWNSTREAM` — work is sequenced behind a current upstream writer and is not PR-ready/current authority.
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
| `GOV-CHAT-013` | Compact PR body template | GOV | `DONE_MAIN` | `.github/pull_request_template.md` v1.5.0 remains the current PR-body contract |
| `GOV-CHAT-014` | Direct PR creation under Human gate | GOV | `DONE_MAIN` | current-main exact-snapshot Human approval gate remains active until replaced by later effective authority |
| `GOV-CHAT-020` | Pre-PR sync/correlation | GOV lifecycle | `DONE_MAIN` | mandatory current control |
| `GOV-CHAT-025` | One canonical current GOV roadmap/task surface | GOV | `CONTINUOUS` | Roadmap planning + register traceability; this pass repairs stale 2026-09-08 projection |
| `GOV-CHAT-026` | Post-PR handoff max two steps | GOV lifecycle | `DONE_MAIN` | `CTRL-SDLC-CHAT-HANDOFF-001` retains bounded copyable `NÄCHSTE SCHRITTE` |
| `GOV-CHAT-037` | User-Lifecycle governance bootstrap | GOV | `DONE_MAIN` | decisions/orchestration merged |
| `GOV-CHAT-040` | User-Lifecycle harness/provider tests | OPS | `FOREIGN_PARTIAL` | last canonical GOV evidence: PR #794 merged; provider E2E and independent Security verification still require newer exact evidence before closure |
| `GOV-CHAT-041` | Lifecycle/pricing/entitlement UX | FE | `FOREIGN_OPEN` | broader lifecycle/pricing/entitlement UX closeout not established in current GOV evidence |
| `GOV-CHAT-042` | Independent User-Lifecycle Security verification | SEC | `DEPENDENCY` | independent ULS re-verification/provider-E2E residuals remain unless superseded by newer exact evidence |
| `GOV-CHAT-043` | Purchase/cancellation consumer-compliance | COMP / Human-Legal | `DEPENDENCY` | external Owner/Legal/Evidence gates remain |
| `GOV-CHAT-044` | Final User-Lifecycle governance correlation | GOV | `OPEN_GOV` | final closeout remains dependency-held on FE/SEC/COMP/Legal and provider-assurance evidence |
| `GOV-CHAT-047` | BGB §312j/§312k applicability | COMP / Human-Legal | `DEPENDENCY` | no GOV legal inference |
| `GOV-CHAT-053` | Deep Research Evidence Contract | GOV | `DONE_MAIN` | ESS-0019 v1.2.0 accepted |
| `GOV-CHAT-054` | ADR-0060 authority/lifecycle reconciliation | GOV | `DONE_MAIN` | GOV-03/DR-02B terminal via PR #743 |
| `GOV-CHAT-061` | Recorrelate after GOV-03 | GOV | `DONE_MAIN` | PR #751 |
| `GOV-CHAT-062` | COMP-GAP-002 / ADR-0007 | GOV | `DONE_MAIN` | PR #755/#758 |
| `GOV-CHAT-063` | COMP-GAP-003 / ESS-0006 | GOV | `DONE_MAIN` | prior ESS-0006 reconciliation via PR #757; current Security-remediation extension tracked separately as GOV-CHAT-075 |
| `GOV-CHAT-064` | Post-ESS-0006 project correlation | GOV | `DONE_MAIN` | PR #762 |
| `GOV-CHAT-065` | GOV-05 no-migration decision closeout | GOV | `DONE_MAIN` | PR #767 |
| `GOV-CHAT-066` | Post-GOV-05 owner/evidence re-correlation | GOV | `DONE_MAIN` | PR #769 |
| `GOV-CHAT-067` | COMP-GAP-008 Document Registry treatment decision | GOV/PVC-05 with DOC/PVC-03 lifecycle input | `DONE_MAIN` | PR #775: no registry change required under current contract |
| `GOV-CHAT-068` | Copyable bounded next-step handoff | GOV lifecycle | `DONE_MAIN` | PR #772 remains evidence for fenced `NÄCHSTE SCHRITTE`; separate generic Owner-response formatting is retired |
| `GOV-CHAT-069` | Post-COMP-GAP-008 owner/dependency re-correlation | GOV/PVC-05 | `DONE_MAIN` | PR #780 synchronized post-#775 projections |
| `GOV-CHAT-070` | GOV-07 validated-baseline evolution policy | GOV/PVC-05 policy; productive variants stay with resolved Primary Owner | `DONE_MAIN` | Human-merged PR #790; broader GOV-07 closeout remains dependency-held |
| `GOV-CHAT-071` | Retire separate copyable Owner-response rule; preserve neutral approval presentation | GOV/PVC-05 | `DONE_MAIN` | Human-merged PR #845; current Trust Root contains retirement semantics and Human PR-create/merge gates remain intact |
| `GOV-CHAT-072` | Development-Chain/chat plugin execution policy | GOV/PVC-05 | `OPEN_GOV` | current Trust Root has reuse screening but not the complete requested chat-execution policy; sequence after overlapping normative GOV writers; preserve relevance, least privilege and protected-mutation gates |
| `GOV-CHAT-073` | Roadmap-framework NIST/M10 current-state correction | GOV/PVC-05 | `DONE_MAIN` | current Trust Root already projects NIST withdrawn/non-authorizing and M10 retired/off; no active implementation backlog |
| `GOV-CHAT-074` | New PR-CREATION-APPROVAL / Approval Envelope v3.4 rollout | GOV/PVC-05 | `WAITING_DOWNSTREAM` | proposed payload preserved at `bcbc73672d8f1bf3d2d7120ba0cad6aaaf0b212e`; current branch `agent/governance-pr-approval-consolidation-20260910` intentionally waits behind PR #864 and is non-authorizing; selectively re-apply only after upstream terminal main and re-correlation |
| `GOV-CHAT-075` | Bounded Security-remediation authority | GOV/PVC-05 policy with SEC assurance boundary | `PR_OPEN` | PR #864 is current upstream GOV writer; exit requires terminal Human/CODEOWNER result and then-current authority/evidence re-correlation |
| `GOV-CHAT-076` | Cross-chat current-main consolidation / GOV Roadmap and register sync | GOV/PVC-05 | `OPEN_GOV` | branch `agent/governance-chat-consolidation-20260910`; repair stale 2026-09-08 baseline, terminalize #071, add #072-#075 with reasons/sequencing, preserve foreign-owner boundaries |

## PR-approval presentation and rollout correlation

### Current authority on `main`

Current `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46` still uses the effective exact-snapshot PR-create approval contract from `/AGENTS.md`: current Project/Folder/PVC/Owner, branch, exact `main SHA`, exact `branch head SHA`, bounded scope, correlation result, truthful validation evidence and intended exact PR title are reported before explicit Human/Owner approval. Any materially stale authority/evidence state fails closed under current main.

Human-merged PR #845 has already retired the separate generic copyable Owner-response requirement. Pure approval/confirmation prompts remain neutral authority presentation; the current PR-create gate itself remains intact.

### Proposed Approval Envelope — not yet current authority

The earlier approval-consolidation payload preserved at `bcbc73672d8f1bf3d2d7120ba0cad6aaaf0b212e` contains `HUMAN_OWNER_PR_APPROVAL_POLICY` v3.4.0 and a richer bounded Approval Envelope. It introduces deterministic effective-change identity plus the explicit states `APPROVAL_STILL_VALID`, `REAPPROVAL_REQUIRED` and `BLOCKED`; it also proposes one embedded `Owner-Freigabe` response surface and permits approval preservation across synchronization-only SHA movement only when material payload equivalence and full current correlation are proven.

That payload is historical/non-authorizing until Human/CODEOWNER merge under then-current authority. Its present sequencing evidence explicitly marks `agent/governance-pr-approval-consolidation-20260910` as `WAITING_DOWNSTREAM / NON-AUTHORIZING` behind the Security-remediation authority slice. The branch must not be treated as an active second writer while PR #864 is open.

## Development-Chain/plugin-policy correlation

Current `/AGENTS.md` already requires pre-implementation evaluation of existing repository/native capability, suitable connected plugin/platform capability, specialized plugin, maintained/security-suitable open source and only then custom implementation. The owner-directed chat rule is broader: installed/connected plugins should be used application-appropriately in Development-Chain chats where they materially fit the task.

No current branch/PR implementing that complete policy was found in this correlation. `GOV-CHAT-072` therefore remains open, but its target semantics must be bounded: relevant capability use, not unconditional invocation of every plugin; no permission expansion; no mutation bypass; no second orchestration/control plane.

## Current writer / correlation state

At `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`:

- open PR #864 is the only current normative GOV writer and changes Development-Chain/Authority/Control/Project/Security surfaces;
- open PR #865 is OPS dependency-floor scope only (`package.json`, `package-lock.json`);
- open PR #866 is Documentary/PVC-03 scope and does not write the GOV Roadmap/Register;
- `agent/governance-pr-approval-consolidation-20260910` is explicitly sequenced/non-authorizing until PR #864 is terminal;
- `agent/governance-chat-consolidation-20260910` is the bounded writer for only this current chat/Roadmap/Register synchronization;
- no current open PR directly changes `docs/projects/governance/ROADMAP.md` or `docs/projects/governance/TASK_REGISTER.md` at the start of this pass;
- historical/released branch content is non-authorizing and reserves no current writer authority by itself.

## Current foreign-owner return / dependency state

| Owner | Current return state | GOV interpretation |
|---|---|---|
| `CAPITAL-AI-DATA` | Human-merged PR #786 provides GOV-07 Newsfeed Entitlement Return | evidence may be consumed; no ownership transfer |
| `CAPITAL-AI-OPS` | last canonical GOV User-Lifecycle return is EVIDENCE_READY; newer OPS work remains independently owned | `FOREIGN_PARTIAL` for GOV-07 until exact closeout evidence is correlated |
| `CAPITAL-AI-FE` | broader lifecycle/pricing/entitlement UX closeout not established in current GOV evidence | `FOREIGN_OPEN` |
| `CAPITAL-AI-SEC` | independent ULS verification remains a GOV-07 dependency; separate Security-remediation authority is tracked as GOV-CHAT-075 | no productive PVC transfer |
| `CAPITAL-AI-COMP` / Human-Legal | prior bounded assessment evidence exists; Legal/Owner gates remain | `DEPENDENCY` |
| `CAPITAL-AI-DOC` | Documentary/PVC-03 remains separately owned; PR #866 is current foreign work | no foreign implementation absorbed by GOV |
| `CAPITAL-AI-CLIENT` / FE / OPS | Admin Panel/process/dependency work remains split across mapped owners | `FOREIGN_OPEN`; GOV-08 only consumes/constrains resulting evidence |

## Cross-chat consolidation treatment

Recent conversations also contain work on OPS dependency/security floors, GitGuardian, Snyk retirement, zizmor/toolchain updates, telemetry, self-healing readiness, repository-host migration checks, Supabase/Render/Stripe state, CLIENT Roadmap tasks, Documentary validators, MCP/multi-LLM gateway design, branch cleanup and plugin/open-source discovery. These are not automatically GOV implementation tasks.

They remain in the owning project/PVC Roadmaps unless they create a concrete Governance contract/authority/closeout dependency. This register records only the GOV-relevant projections above and deliberately avoids converting chat aggregation into cross-project ownership transfer.

## GOV-07 Evolution Policy current-main correlation

Human-merged PR #790 establishes that validated baselines are not ceilings for demonstrably superior evidence-backed variants, while Security, Compliance, Governance, contract compatibility, required functionality, ownership and protected-action gates remain non-regression boundaries.

`GOV-CHAT-070` is terminal on main. This does **not** close `GOV-CHAT-044` or the broader GOV-07 User-Lifecycle cycle.

## Deep Research current-main correlation

`GOV-CHAT-054 / DR-02B` is terminal through Human-merged PR #743. ADR-0060 v1.1.0 is accepted and registered. Productive DR-03/provider-adapter work remains foreign-owner scope and is not a Governance implementation backlog item.

## Consolidation rule

This register is the current chat/backlog inventory for CAPITAL-AI-GOV traceability. `docs/projects/governance/ROADMAP.md` remains the Human-readable planning/status surface. Neither supersedes `/AGENTS.md`, accepted ADR/ESS authorities, canonical registries, project/PVC ownership or foreign project Roadmaps.
