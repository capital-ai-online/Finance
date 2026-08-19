# CAPITAL-AI Governance Control Plane Consolidation Roadmap

**Roadmap ID:** `GOV-CP-2026-08-19`  
**Authority ID:** `AUTH-GOV-CONTROL-PLANE-ROADMAP`  
**Version:** `1.3.0`  
**Date:** `2026-08-19`  
**Owner:** CAPITAL-AI Owner  
**Baseline:** `main@59a2755de53297a934b062b380a313d68cd47492`  
**Implementation branch:** `governance/control-plane-foundation-iso42001-ssdf`  
**Status:** FOUNDATION IMPLEMENTED ON BRANCH / FINAL PRE-PR VALIDATION AND MAIN SYNC OUTSTANDING

## 1. Objective

Eliminate duplicated governance architectures and contradictory policy mirrors before further feature work becomes merge-ready. The target state is one repository Governance Control Plane with one instruction/trust root, stable machine-readable identities, deterministic ADR/ESS lifecycle resolution, documentary hygiene, independent technical validation and explicit current-state ownership.

## 2. Target architecture

```text
Applicable law / binding obligations
              ↓
Human / Owner decisions + effective Accepted ADRs
              ↓
          /AGENTS.md
 single trust root + instruction surface
              ↓
Authority Registry + Control Catalog + ADR/ESS Registries
              ↓
     Policy-as-Code Validators
              ↓
      Domain ADR/ESS/Contracts
              ↓
       Technical Evidence
              ↓
GitHub hosted checks → Human Merge → verified main deployment
```

Repository-level `CLAUDE.md` and `.github/copilot-instructions.md` are intentionally absent. Provider tooling does not get a parallel repository instruction surface.

## 3. Standards baseline

The crosswalk maps internal controls to ISO/IEC 42001:2023, final NIST SP 800-218 SSDF v1.1 and final SP 800-218A. NIST SP 800-218 Rev. 1 / SSDF v1.2 is currently draft and is monitored as state-of-the-art input only. External standards remain benchmark mappings, not a second CAPITAL-AI authority hierarchy.

## 4. Work packages

| WP | Scope | Deliverable | State |
|---|---|---|---|
| G0 | Agent Trust Root | `AGENTS.md` sole repository instruction/trust surface | **IMPLEMENTED** |
| G1 | Stable identity | `AUTH-*`, `CTRL-*`, ADR registry, aliases/supersession | **IMPLEMENTED** |
| G2 | Namespace remediation | ADR-0085/0086 + ESS-0012 cleanup + parallel ADR reservations | **IMPLEMENTED** |
| G3 | Governance Core | `src/platform/Governance` + deterministic validator | **IMPLEMENTED** |
| G4 | Documentation hygiene | canonical lifecycle/folders; integrate #439 after reconciliation | **FOUNDATION IMPLEMENTED** |
| G5 | Pre-PR evidence | exact-SHA non-authorizing developer-preflight contract | **IMPLEMENTED** |
| G6 | CI/Deployment | hosted final-head CI, verified deployment authority, M10 suspended | **ALIGNED** |
| G7 | Historical cleanup | fully replaced governance/roadmap material archived | **IMPLEMENTED** |
| G8 | Parallel PR coordination | #439/#442 correlation and #446 ADR reservation/stable identity | **IMPLEMENTED; FINAL RECHECK REQUIRED** |
| G9 | M10 reactivation gate | reactivation blocked until architecture/documentary/version/router cleanup is complete | **IMPLEMENTED AS SUSPENSION CONTROL** |

## 5. Completed quick wins

1. `AGENTS.md` is the sole repository-wide instruction/trust root; Claude/Copilot repository instruction files removed.
2. Stable Authority/Control registries and a migrated ADR registry exist.
3. ADR-0085/0086 collisions are repaired; Privacy uses ADR-0095 and Governance uses ADR-0096 with stable Authority IDs.
4. PR #446 retains ADR-0094 and now declares `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19`; its reservation is recorded in the Governance ADR registry.
5. The duplicate active ESS-0012 vocabulary draft is removed and archived; ESS-0017 remains Vocabulary Governance.
6. ESS-0019 is retained as the subordinate capability/risk/audit/execution plane, not a trust root.
7. `src/platform/Governance` is the cross-cutting component; Documentary Governance is documentation-scoped.
8. Structural validation covers stable IDs, active ADR/ESS collisions, legacy redirects, current M10 state, parallel ADR reservations and absence of provider instruction mirrors.
9. ISO/IEC 42001 + NIST SSDF crosswalk is explicitly a non-authorizing benchmark/mapping layer.
10. Fully replaced Governance Hardening and prior narrow Supersession/Impact documents moved to `docs/archive/governance/superseded/`.
11. Current DevelopmentChain state separates historical M10 verification from current M10 `SUSPENDED/OFF` enforcement.
12. M10 reactivation is prohibited until duplicate references, Documentary boundary, README/version projection, router-related references and Version Manager/Release contracts are reconciled and independently validated.

## 6. PR / CI cost strategy

No Governance PR is opened until scope completion and final current-`main` synchronization. No intentionally expensive GitHub full build/test is manually triggered before PR creation. After PR creation, use normal independent hosted checks and avoid redundant reruns.

## 7. Parallel-work constraints

- #439 remains reusable for Documentary hygiene, README projection and versioning, but must be adapted to the new global-vs-documentary boundary.
- #442 remains subject to document-registry reconciliation.
- #446 is now a stable ADR-0094 namespace writer; after its latest metadata commit the old CI evidence is not final-head evidence and the new exact head must pass before Human Merge.
- Any parallel writer touching Governance registries, ADR/ESS namespaces, Documentary Governance, README/version projection, routing/version references or Version Manager must be re-correlated immediately before Governance PR creation.

## 8. M10 temporary suspension exit criteria

M10 remains OFF until all are true on then-current `main`:

- no duplicate/ambiguous Authority, ADR or ESS references in the correlated architecture;
- global Governance vs Documentary Governance responsibility boundary is validated;
- README projection/document hygiene and version source-of-truth are reconciled;
- router-related governance/version references are reconciled;
- Version Manager/Release contracts have one consistent current version source;
- structural Governance validation and hosted final-head CI are green;
- a new explicit Human/Owner reactivation decision exists.

## 9. Definition of Done

- [x] single repository instruction/trust root;
- [x] stable Authority/Control identity model;
- [x] known active ADR/ESS collisions resolved;
- [x] PR #446 ADR-0094 reservation stabilized;
- [x] old fully replaced governance material archived;
- [x] global/documentary Governance boundary defined;
- [x] M10 suspension and reactivation criteria explicit;
- [x] standards crosswalk non-authorizing by design;
- [ ] execute available exact-snapshot low-cost structural validation;
- [ ] final `main` refresh/sync and all open-PR semantic/file/namespace correlations;
- [ ] create one consolidated Governance PR only after final sync and explicit PR authorization;
- [ ] hosted CI green on final PR head;
- [ ] Human/Owner merge remains separate;
- [ ] after Governance merge, reconcile #439/#442 and then-current #446 state.

## 10. Validation boundary

The connected environment supports repository read/write, compare and PR/CI inspection but not a complete executable private-repository checkout. No full local npm/TypeScript/Vitest/build PASS is claimed. The Governance validator is wired into the normal Vitest suite for the later hosted PR check.

## 11. Rollback

Use a fresh rollback branch from then-current `main`, revert the consolidated Governance PR as one reviewed unit, validate that no duplicate instruction/authority architecture is reintroduced, preserve archive/evidence history and merge only by explicit Human/Owner decision.
