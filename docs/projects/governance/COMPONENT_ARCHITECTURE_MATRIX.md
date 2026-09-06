# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@169cf96ac4d90ffaacab22d88541b837fd66fe8d`  
**Correlation date:** `2026-09-06`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; Control Plane v2.8.0 is Human-merged via PR #772 | KEEP SINGLE |
| DevelopmentChain execution policy | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | governance policy | v2.5.0 preserves exact-snapshot PR gate and requires copyable chat-run/post-PR handoffs | KEEP CURRENT |
| Chat handoff control | `CTRL-SDLC-CHAT-HANDOFF-001` | existing lifecycle control | `CHAT_RUN_HANDOFF` + `POST_PR_HANDOFF` are current-main semantics after PR #772; no new control identity | DONE_MAIN / MAINTAIN |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | current merged control semantics include copyable chat handoffs | KEEP SINGLE |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | current merged authority/version projection after PR #772 | KEEP SINGLE |
| Governance authority consistency test | `tests/unit/governanceAuthorityConsistency.test.ts` | evidence / regression guard | PR #772 merged the consistency coverage for both handoff triggers/copyable surfaces | DONE_MAIN / MAINTAIN |
| ADR Registry | `docs/adr/registry.json` | governance registry | ADR-0007 remains historical/non-authorizing; no new ADR required for COMP-GAP-008 | NO CHANGE |
| ESS Registry | `.ai/registry/ess-registry.json` | owner / correlate | no component/capability contract change required | NO CHANGE |
| Document Registry | `docs/governance/document-registry.json` + ADR-0096 | canonical Governance registry | current contract is canonical but selective; no generic exhaustive `DOC-*` registration rule exists; eight COMP candidates do not require insertion under present policy/validator contract | `COMP-GAP-008 GOV DECISION: NO REGISTRY CHANGE` |
| Document Lifecycle Policy | `docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md` | governance lifecycle authority | requires stable metadata and registry updates for path moves as applicable; does not establish blanket registration for all non-authorizing `DOC-*` artifacts | KEEP CURRENT CONTRACT |
| Document Registry validator | `scripts/governance/controlPlaneRegistryRules.mjs` | GOV policy-as-code evidence | current contract validates canonical registry integrity and explicit mandatory cases; no generic all-`DOC-*` completeness requirement is part of the current decision baseline | KEEP / DO NOT INVENT COMPLETENESS GATE |
| Documentation Governance | ESS-0012 + `src/platform/Documentary/Governance` | foreign Documentary validation input | documentation-only/read-only; cannot modify Registry or documentation and cannot become a second Governance registry writer | PRESERVE READ-ONLY BOUNDARY |
| Documentary Engine | `CAPITAL-AI-DOC / PVC-03` + ESS-0010 | foreign project owner / evidence input | Documentary lifecycle treatment for COMP-GAP-008 remains separate PVC-03 work; no Governance execution of that surface | DO NOT ABSORB / CONSUME RETURN ONLY |
| Compliance V2.1 DOC candidates | `docs/compliance/CAPITAL-AI-COMP/**` + `REGISTRY_IMPACT_REPORT.md` | foreign assessment input | stable `DOC-COMP-*` identities, canonical placement and non-authorizing source roles already exist; source documents remain foreign-owned | NO SOURCE MUTATION / NO FORCED REGISTRATION |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` remains distinct from technical financial `VC-*` | MAINTAIN |
| Platform Director | `PVC-05` + Platform Director ESS/component | primary GOV owner | may decide shared Governance-registry treatment but does not absorb Documentary lifecycle, Security verification, Compliance assessment or foreign runtime | KEEP BOUNDARY |
| ADR-0007 Compliance Value Chain | ADR registry + visible ADR | GOV lifecycle/architecture owner | historical/non-authorizing after PR #755/#758 | DONE_MAIN / TERMINAL |
| ESS-0006 Security & Compliance | `.ai/skills/ESS-0006-Security-Compliance.md` | GOV ESS lifecycle / component boundary | bounded component specification after PR #757 | DONE_MAIN / TERMINAL |
| Security project | `docs/projects/security/README.md` + `src/platform/Security/README.md` | foreign independent verifier | PR #766 aligns assessment authority; ULS re-verification/provider-E2E residuals remain separate | PRESERVE INDEPENDENCE |
| Compliance project | `docs/projects/compliance/README.md` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor | PR #761/#768 provide current assessment/closeout evidence while external Owner/Legal/Evidence gates remain explicit | PRESERVE INDEPENDENCE / NO BLANKET CLOSURE |
| Operations current-main return | PR #771 + PR #774 + OPS-owned paths | foreign project evidence | PR #771 changes only OPS project documentation; PR #774 changes only DNS desired-state/runbook/systemadmin test; neither conflicts with COMP-GAP-008 PVC-05 decision | CONSUME AS DISJOINT CURRENT-MAIN EVIDENCE |
| PR #772 Governance return | PR #772 + current `/AGENTS.md` | same-owner current-main evidence | merged copyable chat-handoff/control-plane semantics overlap the three project projections and are preserved as the base before COMP-GAP-008 replay | PRESERVE / NO ROLLBACK |
| PR #773 stale attempt | closed PR #773 | historical/non-authorizing evidence | created after a concurrent `main` advance; closed without merge; not an active writer or valid baseline | IGNORE FOR AUTHORITY / TRACE ONLY |
| User Lifecycle | GOV decisions + OPS/FE/SEC/COMP returns | GOV orchestration only | adjacent owner returns materially improve evidence; remaining foreign verification/provider/UX/Legal gates still prevent GOV-07 closeout | DEPENDENCY / NO SCOPE ABSORPTION |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | GOV-05 no-migration decision is Human-merged through PR #767 | DONE_MAIN / TERMINAL — NO MIGRATION |
| Admin Panel process/dependency graph | GOV-08 + CLIENT/FE/OPS project ownership | referral only | no Governance-owned productive implementation authority | REFERRED / FOREIGN OPEN |
| PR template / transport | `.github/pull_request_template.md` + Trust Root gate | GOV | exact-snapshot Human PR-create approval, copyable exact response and Human-only merge remain mandatory | MAINTAIN |

## Current work package — 2026-09-06

### COMP-GAP-008 — GOVERNANCE DOCUMENT REGISTRY TREATMENT DECISION

**Branch:** `agent/governance-comp-gap-008-decision-v4-20260906`  
**State:** `IMPLEMENTED_BRANCH / PR-CREATION GATE PENDING`

Current main includes Human-merged PR #772 and disjoint PR #774. The fresh branch starts from that exact merge result, preserves the new copyable chat-handoff semantics and OPS/DNS state, and replays only the bounded `COMP-GAP-008` PVC-05 decision. PR #773 is closed and contributes no merge or authority state.

Architecture conclusion:

1. `CAPITAL-AI-GOV / PVC-05` owns the shared Governance Document Registry decision for `COMP-GAP-008`.
2. `CAPITAL-AI-DOC / PVC-03` retains the separate Documentary lifecycle return. Governance does not execute that foreign scope.
3. The eight Compliance V2.1 candidates already expose stable `DOC-COMP-*` identities, canonical `docs/compliance/**` placement and non-authorizing source roles.
4. ADR-0096 identifies `docs/governance/document-registry.json` as canonical document identity/role/projection metadata, but does not require exhaustive registration of every `DOC-*` artifact.
5. `DOCUMENT_LIFECYCLE_POLICY.md` requires stable metadata for applicable new/materially migrated governance/decision documents and registry updates on path moves; it does not impose blanket registration of non-normative Compliance material.
6. The current Governance validator contract contains no generic all-`DOC-*` completeness requirement for this surface.
7. Existing Compliance registry entries are selective, confirming that current registry semantics are not an exhaustive repository document index.
8. Therefore the bounded Governance decision is **NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT**. `docs/governance/document-registry.json` remains unchanged.
9. No second registry, new role vocabulary, ADR/ESS/AUTH/CTRL identity, Compliance/Documentary source mutation or runtime change is introduced.
10. PR #772 is semantically preserved rather than overwritten; PR #773 is closed/non-authorizing and is not reused; PR #774 is disjoint OPS/DNS work and does not alter this decision.

The Registry can be revisited only if a later explicit policy/validator contract requires exhaustive or class-specific registration, or a concrete identity/path/role integrity problem creates a bounded need. `DOC-*` existence alone is not such a requirement.

**Exit gate:** Roadmap, Task Register and this Matrix record the same PVC-05 decision on top of current PR-#772/PR-#774 semantics; Registry/source/runtime remain unchanged; final current-main/open-PR correlation is clean; exact-head Human PR-create approval is obtained; hosted checks and Human/CODEOWNER merge complete the Governance decision. After merge, the Governance portion of `COMP-GAP-008` is complete, while Documentary/PVC-03 evidence and subsequent Compliance reassessment remain separate.

## Current priority assessment

1. Complete this bounded `COMP-GAP-008` Governance decision through final correlation, exact-head PR-create approval, PR creation, hosted checks and Human/CODEOWNER merge.
2. After merge, fresh current-main/open-PR correlation; consume Documentary/PVC-03 return if available, otherwise reprioritize the highest current Governance dependency without implementing foreign work.

## Overall assessment

The architecture remains convergent around one Governance Control Plane, one merged copyable chat-handoff control and one canonical Document Registry. The present evaluation resolves the registry ambiguity without registry churn: canonical does not mean exhaustive under the current contract. The PVC-05 decision preserves stable identities, current PR-#772/PR-#774 state and one-registry architecture while leaving Documentary lifecycle and Compliance reassessment with their proper owners.
