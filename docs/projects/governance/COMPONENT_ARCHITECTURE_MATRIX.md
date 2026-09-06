# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@80c30ad2aa469f4552c84f3cc40e997e4ef13ee0`  
**Correlation date:** `2026-09-06`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; branch updates Control Plane v2.8.0 with copyable `CHAT_RUN_HANDOFF` + preserved `POST_PR_HANDOFF` | VERSION EXISTING TRUST ROOT / NO MIRROR |
| DevelopmentChain execution policy | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | governance policy | branch v2.5.0 makes every chat-governed execution-pass handoff copyable while preserving exact-snapshot PR gate and Human-only merge | VERSION EXISTING POLICY |
| Chat handoff control | `CTRL-SDLC-CHAT-HANDOFF-001` | existing lifecycle control | two triggers: `CHAT_RUN_HANDOFF` and `POST_PR_HANDOFF`; at most two next steps with exit gates in fenced `text`; exact Owner response separately copyable | EXTEND EXISTING CONTROL / NO NEW CTRL |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | branch v1.19.0 versions the existing handoff control semantics | VERSION EXISTING CONTROL ONLY |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | branch v1.55.0 correlates Trust Root, Control Catalog and DevelopmentChain policy versions | KEEP SINGLE |
| Governance authority consistency test | `tests/unit/governanceAuthorityConsistency.test.ts` | evidence / regression guard | branch asserts both handoff triggers and copyable `NÄCHSTE SCHRITTE` / `Freigabe-Antwort` surfaces | VALIDATE EXACT BRANCH HEAD |
| ADR Registry | `docs/adr/registry.json` | governance registry | no new material architecture decision required; ADR-0096 already authorizes the single control-plane model | NO CHANGE |
| ESS Registry | `.ai/registry/ess-registry.json` | owner / correlate | no component/capability contract change required | NO CHANGE |
| Document Registry | `docs/governance/document-registry.json` + ADR-0096 | canonical Governance registry | PR #768 routes shared Governance-registry treatment for COMP-GAP-008 to CAPITAL-AI-GOV/PVC-05; current chat-handoff work does not change it | `COMP-GAP-008` NEXT GOV CORRELATION CANDIDATE |
| Documentation Governance | ESS-0012 + `src/platform/Documentary/Governance` | foreign Documentary validation input | documentation-only/read-only; cannot become a second Governance registry writer | PRESERVE READ-ONLY BOUNDARY |
| Documentary Engine | `CAPITAL-AI-DOC / PVC-03` + ESS-0010 | foreign project owner / evidence input | PR #768 routes Documentary lifecycle treatment to DOC/PVC-03, distinct from shared Governance-registry treatment | DO NOT ABSORB / CONSUME EVIDENCE ONLY |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` remains distinct from technical financial `VC-*` | MAINTAIN |
| Platform Director | `PVC-05` + Platform Director ESS/component | primary GOV owner | lifecycle/architecture coordination only; does not absorb Security verification, Compliance assessment or foreign runtime | KEEP BOUNDARY |
| ADR-0007 Compliance Value Chain | ADR registry + visible ADR | GOV lifecycle/architecture owner | historical/non-authorizing after PR #755/#758 | DONE_MAIN / TERMINAL |
| ESS-0006 Security & Compliance | `.ai/skills/ESS-0006-Security-Compliance.md` | GOV ESS lifecycle / component boundary | bounded component specification after PR #757 | DONE_MAIN / TERMINAL |
| Security project | `docs/projects/security/README.md` + `src/platform/Security/README.md` | foreign independent verifier | PR #766 aligns assessment authority; ULS re-verification/provider-E2E residuals remain separate | PRESERVE INDEPENDENCE |
| Compliance project | `docs/projects/compliance/README.md` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor | PR #761/#768 provide current assessment/closeout evidence while external Owner/Legal/Evidence gates remain explicit | PRESERVE INDEPENDENCE / NO BLANKET CLOSURE |
| User Lifecycle | GOV decisions + OPS/FE/SEC/COMP returns | GOV orchestration only | remaining foreign verification/provider/UX/Legal gates still prevent GOV-07 closeout | DEPENDENCY / NO SCOPE ABSORPTION |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | GOV-05 no-migration decision is Human-merged through PR #767 | DONE_MAIN / TERMINAL — NO MIGRATION |
| Admin Panel process/dependency graph | GOV-08 + CLIENT/FE/OPS project ownership | referral only | no Governance-owned productive implementation authority | REFERRED / FOREIGN OPEN |
| PR template / transport | `.github/pull_request_template.md` + Trust Root gate | GOV | exact-snapshot Human PR-create approval and Human-only merge remain mandatory; exact approval response stays copyable | MAINTAIN |

## Current work package — 2026-09-06

### COPYABLE CHAT HANDOFF / OWNER RESPONSES

**Branch:** `agent/governance-copyable-chat-handoff-20260906`  
**State:** `IMPLEMENTED_BRANCH / VALIDATION + PR-CREATION GATE PENDING`

Architecture conclusion:

1. The Owner request fits the existing `CTRL-SDLC-CHAT-HANDOFF-001`; a new control, ADR, ESS or routing architecture is unnecessary.
2. `CHAT_RUN_HANDOFF` generalizes the existing post-PR coordination rule to every chat-governed repository execution pass without granting new authority.
3. Fenced `text` blocks make both `NÄCHSTE SCHRITTE` and exact Human/Owner response strings directly copyable; the underlying approval semantics remain unchanged.
4. Trust Root, DevelopmentChain policy, Control Catalog and Authority Registry are version-correlated, and the existing governance consistency test is extended to cover the new invariant.
5. PR #769 has already terminalized the prior post-GOV-05 correlation package on main; `COMP-GAP-008` remains the next bounded Governance candidate after this control change reaches main.

**Exit gate:** the changed Governance surfaces are internally consistent, JSON remains structurally valid, the relevant unit/validator checks are executed when an exact branch checkout/CI becomes available, final current-main/open-PR correlation is clean, exact-head Human PR-create approval is obtained, and hosted checks plus Human/CODEOWNER merge remain separate gates.

## Current priority assessment

1. Complete the copyable chat-handoff control change through final correlation, PR-create approval, PR creation and Human/CODEOWNER merge.
2. After a fresh current-main/open-PR correlation, evaluate `COMP-GAP-008` as the next bounded Governance registry-decision slice. GOV-07 remains dependency-held and GOV-08 remains foreign-owned.

## Overall assessment

The architecture remains convergent around one Governance Control Plane, one existing chat-handoff control and one set of canonical registries. The requested usability improvement is implemented as a presentation/coordination invariant on the existing lifecycle control rather than a new authority surface. No productive runtime, provider capability, parallel registry or ownership transfer is required.
