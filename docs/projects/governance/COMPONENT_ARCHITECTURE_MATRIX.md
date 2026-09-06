# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@1b9def6d414ee8838e5403bfc9f705bbbe438d2a`  
**Correlation date:** `2026-09-06`

| Component / contract | Canonical anchor | GOV relationship | Current architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root; Control Plane v2.7.1 | KEEP SINGLE |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | stable `CTRL-*` identities canonical | VERSION EXISTING CONTROLS ONLY |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | stable `AUTH-*` identities canonical | KEEP SINGLE |
| ADR Registry | `docs/adr/registry.json` | governance registry | ADR-0007 remains historical/non-authorizing | DONE_MAIN / DO NOT REAUTHORIZE |
| ESS Registry | `.ai/registry/ess-registry.json` | owner / correlate | ESS-0006 v1.1.0 bounded semantics | DONE_MAIN / MAINTAIN |
| Document Registry | `docs/governance/document-registry.json` + ADR-0096 | canonical Governance registry | current contract is canonical but selective; no generic exhaustive `DOC-*` registration rule exists; eight COMP candidates do not require insertion under present policy/validator contract | `COMP-GAP-008 GOV DECISION: NO REGISTRY CHANGE` |
| Document Registry validator | `scripts/governance/controlPlaneRegistryRules.mjs` | GOV policy-as-code evidence | validates IDs/roles/authority relations of registered entries and explicit mandatory cases; no generic all-`DOC-*` completeness rule | KEEP / DO NOT INVENT COMPLETENESS GATE |
| Documentation Governance | ESS-0012 + `src/platform/Documentary/Governance` | foreign Documentary validation input | documentation-only/read-only; cannot become a second Governance registry writer | PRESERVE READ-ONLY BOUNDARY |
| Documentary Engine | `CAPITAL-AI-DOC / PVC-03` + ESS-0010 | foreign project owner / evidence input | Documentary lifecycle treatment for COMP-GAP-008 remains separate PVC-03 work; no Governance execution of that surface | DO NOT ABSORB / CONSUME RETURN ONLY |
| Compliance V2.1 DOC candidates | `docs/compliance/CAPITAL-AI-COMP/**` + `REGISTRY_IMPACT_REPORT.md` | foreign assessment input | stable `DOC-COMP-*` identities, canonical placement and non-authorizing source roles already exist; source documents remain foreign-owned | NO SOURCE MUTATION / NO FORCED REGISTRATION |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | `PVC-01..PVC-18` remains distinct from technical financial `VC-*` | MAINTAIN |
| Platform Director | `PVC-05` + Platform Director ESS/component | primary GOV owner | may decide shared Governance-registry treatment but does not absorb Documentary lifecycle, Security verification, Compliance assessment or foreign runtime | KEEP BOUNDARY |
| ADR-0007 Compliance Value Chain | ADR registry + visible ADR | GOV lifecycle/architecture owner | historical/non-authorizing after PR #755/#758 | DONE_MAIN / TERMINAL |
| ESS-0006 Security & Compliance | `.ai/skills/ESS-0006-Security-Compliance.md` | GOV ESS lifecycle / component boundary | bounded component specification after PR #757 | DONE_MAIN / TERMINAL |
| Security project | `docs/projects/security/README.md` + `src/platform/Security/README.md` | foreign independent verifier | PR #766 aligns assessment authority; ULS re-verification/provider-E2E residuals remain separate | PRESERVE INDEPENDENCE |
| Compliance project | `docs/projects/compliance/README.md` + `docs/compliance/CAPITAL-AI-COMP/**` | foreign independent assessor | PR #761/#768 provide current assessment/closeout evidence while external Owner/Legal/Evidence gates remain explicit | PRESERVE INDEPENDENCE / NO BLANKET CLOSURE |
| Operations current-main return | PR #771 + `docs/projects/operations/**` | foreign project evidence | PR #771 is Human-merged and changes only OPS project documentation; no file/semantic/namespace/authority/owner conflict with COMP-GAP-008 PVC-05 decision | CONSUME AS DISJOINT CURRENT-MAIN EVIDENCE |
| User Lifecycle | GOV decisions + OPS/FE/SEC/COMP returns | GOV orchestration only | adjacent owner returns materially improve evidence; remaining foreign verification/provider/UX/Legal gates still prevent GOV-07 closeout | DEPENDENCY / NO SCOPE ABSORPTION |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | GOV-05 no-migration decision is Human-merged through PR #767 | DONE_MAIN / TERMINAL — NO MIGRATION |
| Admin Panel process/dependency graph | GOV-08 + CLIENT/FE/OPS project ownership | referral only | no Governance-owned productive implementation authority | REFERRED / FOREIGN OPEN |
| PR template / transport | `.github/pull_request_template.md` + Trust Root gate | GOV | exact-snapshot Human PR-create approval and Human-only merge remain mandatory | MAINTAIN |

## Current work package — 2026-09-06

### COMP-GAP-008 — GOVERNANCE DOCUMENT REGISTRY TREATMENT DECISION

**Branch:** `agent/governance-comp-gap-008-decision-v2-20260906`  
**State:** `IMPLEMENTED_BRANCH / PR + HUMAN MERGE PENDING`

Current main includes Human-merged PR #769 and PR #771. PR #771 changes only `docs/projects/operations/**`; it is disjoint from this Governance slice and does not alter the COMP-GAP-008 ownership/contract conclusion.

Architecture conclusion:

1. `CAPITAL-AI-GOV / PVC-05` owns the shared Governance Document Registry decision for `COMP-GAP-008`.
2. `CAPITAL-AI-DOC / PVC-03` retains the separate Documentary lifecycle return. Governance does not execute that foreign scope.
3. The eight Compliance V2.1 candidates already expose stable `DOC-COMP-*` identities, canonical `docs/compliance/**` placement and non-authorizing source roles.
4. ADR-0096 identifies `docs/governance/document-registry.json` as canonical document identity/role/projection metadata, but does not require exhaustive registration of every `DOC-*` artifact.
5. `DOCUMENT_LIFECYCLE_POLICY.md` requires stable metadata for applicable new/materially migrated governance/decision documents and registry updates on path moves; it does not impose blanket registration of non-normative Compliance material.
6. `controlPlaneRegistryRules.mjs` contains no generic `DOC-*` completeness rule. Mandatory registration is encoded only for explicit contract cases such as the Frontend family.
7. Existing Compliance registry entries are selective, confirming that current registry semantics are not an exhaustive repository document index.
8. Therefore the bounded Governance decision is **NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT**. `docs/governance/document-registry.json` remains unchanged.
9. No second registry, new role vocabulary, ADR/ESS/AUTH/CTRL identity, Compliance/Documentary source mutation or runtime change is introduced.
10. PR #771 does not change this conclusion because its scope is foreign OPS documentation with no overlapping files or authority surface.

The Registry can be revisited only if a later explicit policy/validator contract requires exhaustive or class-specific registration, or a concrete identity/path/role integrity problem creates a bounded need. `DOC-*` existence alone is not such a requirement.

**Exit gate:** Roadmap, Task Register and this Matrix record the same PVC-05 decision; Registry/source/runtime remain unchanged; applicable exact-head checks and Human/CODEOWNER merge complete the Governance decision. After merge, the Governance portion of `COMP-GAP-008` is complete, while Documentary/PVC-03 evidence and subsequent Compliance reassessment remain separate.

## Current priority assessment

1. Complete this bounded `COMP-GAP-008` Governance decision through exact-head validation and Human/CODEOWNER merge.
2. After merge, fresh current-main/open-PR correlation; consume Documentary/PVC-03 return if available, otherwise reprioritize the highest current Governance dependency without implementing foreign work.

## Overall assessment

The architecture remains convergent around one Governance Control Plane and one canonical Document Registry. The present evaluation resolves the ambiguity without registry churn: canonical does not mean exhaustive under the current contract. The PVC-05 decision preserves stable identities and one-registry architecture while leaving Documentary lifecycle and Compliance reassessment with their proper owners.
