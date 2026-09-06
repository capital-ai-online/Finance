# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@e61cb294e368135861c95911b8edfeee8b0de471`  
**Correlation date:** `2026-09-06`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; Control Plane v2.7.1 | KEEP SINGLE |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | stable `CTRL-*` identities canonical | VERSION EXISTING CONTROLS ONLY |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | stable `AUTH-*` identities canonical | KEEP SINGLE |
| ADR Registry | `docs/adr/registry.json` | governance registry | ADR-0007 remains historical/non-authorizing | DONE_MAIN / DO NOT REAUTHORIZE |
| ESS Registry | `.ai/registry/ess-registry.json` | owner / correlate | ESS-0006 v1.1.0 bounded semantics | DONE_MAIN / MAINTAIN |
| Document Registry | `docs/governance/document-registry.json` + ADR-0096 | canonical Governance registry | PR #768 explicitly routes shared Governance-registry treatment for COMP-GAP-008 to CAPITAL-AI-GOV/PVC-05; Compliance must not mutate it in a foreign-owner branch | `COMP-GAP-008` NEXT GOV CORRELATION CANDIDATE |
| Documentation Governance | ESS-0012 + `src/platform/Documentary/Governance` | foreign Documentary validation input | documentation-only/read-only; cannot become a second Governance registry writer | PRESERVE READ-ONLY BOUNDARY |
| Documentary Engine | `CAPITAL-AI-DOC / PVC-03` + ESS-0010 | foreign project owner / evidence input | PR #768 routes Documentary lifecycle treatment to DOC/PVC-03, distinct from shared Governance-registry treatment | DO NOT ABSORB / CONSUME EVIDENCE ONLY |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` remains distinct from technical financial `VC-*` | MAINTAIN |
| Platform Director | `PVC-05` + Platform Director ESS/component | primary GOV owner | lifecycle/architecture coordination only; does not absorb Security verification, Compliance assessment or foreign runtime | KEEP BOUNDARY |
| ADR-0007 Compliance Value Chain | ADR registry + visible ADR | GOV lifecycle/architecture owner | historical/non-authorizing after PR #755/#758 | DONE_MAIN / TERMINAL |
| ESS-0006 Security & Compliance | `.ai/skills/ESS-0006-Security-Compliance.md` | GOV ESS lifecycle / component boundary | bounded component specification after PR #757 | DONE_MAIN / TERMINAL |
| Security project | `docs/projects/security/README.md` + `src/platform/Security/README.md` | foreign independent verifier | PR #766 aligns assessment authority; ULS re-verification/provider-E2E residuals remain separate | PRESERVE INDEPENDENCE |
| Compliance project | `docs/projects/compliance/README.md` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor | PR #761/#768 provide current assessment/closeout evidence while external Owner/Legal/Evidence gates remain explicit | PRESERVE INDEPENDENCE / NO BLANKET CLOSURE |
| User Lifecycle | GOV decisions + OPS/FE/SEC/COMP returns | GOV orchestration only | PR #763/#766/#761/#768 materially improve adjacent evidence; remaining foreign verification/provider/UX/Legal gates still prevent GOV-07 closeout | DEPENDENCY / NO SCOPE ABSORPTION |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | GOV-05 no-migration decision is Human-merged through PR #767 | DONE_MAIN / TERMINAL — NO MIGRATION |
| Admin Panel process/dependency graph | GOV-08 + CLIENT/FE/OPS project ownership | referral only | no Governance-owned productive implementation authority | REFERRED / FOREIGN OPEN |
| PR template / transport | `.github/pull_request_template.md` + Trust Root gate | GOV | exact-snapshot Human PR-create approval and Human-only merge remain mandatory | MAINTAIN |

## Current work package — 2026-09-06

### POST-GOV-05 OWNER / EVIDENCE RECORRELATION

**Branch:** `agent/governance-post-gov05-recorrelate-v2-20260906`  
**State:** `IMPLEMENTED_BRANCH / PR + HUMAN MERGE PENDING`

The three Governance project projections are refreshed against `main@e61cb294e368135861c95911b8edfeee8b0de471` after Human-merged PR #767 and #768 and material owner returns in PR #761, #763 and #766.

Architecture conclusion:

1. GOV-05 is terminal on current main.
2. GOV-07 remains dependency-held; merged adjacent owner returns are not sufficient to claim independent Security verification, complete provider/E2E evidence, broader lifecycle/pricing/entitlement UX or Legal closure.
3. GOV-08 remains CLIENT/FE/OPS-owned.
4. `COMP-GAP-008` is a bounded next Governance candidate. PR #768 explicitly confirms the split: `CAPITAL-AI-GOV/PVC-05` owns shared Governance-registry treatment; `CAPITAL-AI-DOC/PVC-03` owns Documentary lifecycle treatment.
5. Any later `COMP-GAP-008` implementation must decide only necessary canonical registry treatment for existing non-normative Compliance documents. It must not create a second Registry, reclassify them as normative Authority, mutate foreign Compliance/Documentary source documents, or introduce new ADR/ESS/AUTH/CTRL identities without separate justification.

**Exit gate:** these three Governance project files consistently project current main, no owner-return is overstated, no foreign implementation or new authority plane is introduced, and applicable exact-head checks plus Human/CODEOWNER merge complete the documentation correlation.

## Current priority assessment

1. Complete the post-GOV-05 project-state correlation through applicable exact-head validation and Human/CODEOWNER merge.
2. After a fresh current-main/open-PR correlation, evaluate `COMP-GAP-008` as the next bounded Governance registry-decision slice. GOV-07 remains dependency-held and GOV-08 remains foreign-owned.

## Overall assessment

The architecture remains convergent around one Governance Control Plane and one set of canonical registries. PR #767 closes GOV-05 without technical namespace migration. PR #768 strengthens the COMP-GAP-008 ownership boundary rather than creating a conflicting implementation path. The next Governance-owned candidate is therefore the narrowly scoped Document Registry decision after this project-state refresh reaches main. No new runtime, parallel registry or ownership transfer is required by the present work package.
