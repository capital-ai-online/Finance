# CAPITAL-AI Governance Control Plane Consolidation Roadmap

**Roadmap ID:** `GOV-CP-2026-08-19`  
**Authority ID:** `AUTH-GOV-CONTROL-PLANE-ROADMAP`  
**Version:** `1.4.0`  
**Date:** `2026-08-19`  
**Owner:** CAPITAL-AI Owner  
**Original baseline:** `main@59a2755de53297a934b062b380a313d68cd47492`  
**Governance merge:** PR #447 → `0b904c10e46723cb80a7ba12781c3847005c4715`  
**Post-merge reconciliation baseline:** `main@71bce3d07133e2a7d408af179c2325e6d5114d5a`  
**Original implementation branch:** `governance/control-plane-foundation-iso42001-ssdf`  
**Status:** MERGED VIA PR #447 / HISTORICAL CONTEXT — NON-AUTHORIZING FOR CURRENT STANDARDS OR M10 STATE

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

## 3. Standards baseline — current-state notice 2026-09-10

The original 2026-08-19 consolidation work used ISO/IEC 42001 plus NIST SSDF mappings as external benchmark context. That historical fact remains traceable in the associated evidence and review packages.

For **current repository Governance**, `/AGENTS.md` and `docs/governance/control-plane/STANDARDS_CROSSWALK.md` control: **ISO/IEC 42001:2023 is the adopted external Governance benchmark; NIST publications, frameworks, profiles and mappings are withdrawn from the current Governance baseline.** Historical or foreign-project NIST references are non-authorizing and cannot by themselves create a repository requirement, CI gate, compliance finding, implementation backlog or mandatory remediation. Any future NIST adoption requires a new explicit Human/Owner decision identifying source, version and scope.

This roadmap therefore does not establish a current NIST baseline.

## 4. Work packages

| WP | Scope | Deliverable | State |
|---|---|---|---|
| G0 | Agent Trust Root | `AGENTS.md` sole repository instruction/trust surface | **MERGED** |
| G1 | Stable identity | `AUTH-*`, `CTRL-*`, ADR registry, aliases/supersession | **MERGED** |
| G2 | Namespace remediation | ADR-0085/0086 + ESS-0012 cleanup + parallel ADR reservations | **MERGED; POST-MERGE REGISTRY RECONCILIATION IN THIS FOLLOW-UP** |
| G3 | Governance Core | `src/platform/Governance` + deterministic validator | **MERGED** |
| G4 | Documentation hygiene | canonical lifecycle/folders; integrate #439 after reconciliation | **FOUNDATION MERGED / #439 RECONCILIATION PENDING** |
| G5 | Pre-PR evidence | exact-SHA non-authorizing developer-preflight contract | **MERGED** |
| G6 | CI/Deployment | hosted final-head CI and verified deployment authority; historical M10 gate removed from current runtime | **MERGED / ALIGNED** |
| G7 | Historical cleanup | fully replaced governance/roadmap material archived | **MERGED** |
| G8 | Parallel PR coordination | #439/#442 correlation and #446 ADR reservation/stable identity | **#446 MERGED; #439/#442 FOLLOW-UP CORRELATION PENDING** |
| G9 | Historical M10 control | original suspension control retained as historical implementation context; current productive M10 is RETIRED / OFF | **HISTORICAL CONTEXT / CURRENT RETIREMENT CONTROLLED BY TRUST ROOT** |

## 5. Completed quick wins

1. `AGENTS.md` is the sole repository-wide instruction/trust root; Claude/Copilot repository instruction files removed.
2. Stable Authority/Control registries and a migrated ADR registry exist.
3. ADR-0085/0086 collisions are repaired; Privacy uses ADR-0095 and Governance uses ADR-0096 with stable Authority IDs.
4. PR #446 Human-merged ADR-0094 with `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19`; the former parallel reservation is converted to a normal ADR/Authority registry record in the post-merge reconciliation.
5. The duplicate active ESS-0012 vocabulary draft is removed and archived; ESS-0017 remains Vocabulary Governance.
6. ESS-0019 is retained as the subordinate capability/risk/audit/execution plane, not a trust root.
7. `src/platform/Governance` is the cross-cutting component; Documentary Governance is documentation-scoped.
8. Structural validation covers stable IDs, active ADR/ESS collisions, legacy redirects, current M10 retirement state, parallel ADR reservations and absence of provider instruction mirrors.
9. The standards crosswalk is explicitly non-authorizing; under current authority NIST bindings are withdrawn from the active Governance baseline while historical mappings remain traceable.
10. Fully replaced Governance Hardening and prior narrow Supersession/Impact documents moved to `docs/archive/governance/superseded/`.
11. Current DevelopmentChain state treats productive M10 as `RETIRED / OFF`; historical suspension/verification material remains evidence only and cannot create a current implementation gap.
12. Any future PR-CI/passkey authorization mechanism requires a new separately scoped architecture and Human/Owner authority decision; it is not a reactivation of retired M10.

## 6. PR / CI cost strategy

The consolidated Governance implementation was reviewed in PR #447 and Human-merged only after independent hosted Governance, CI and Google-Marketing checks completed successfully on its final head. Post-merge reconciliation continues on a fresh branch from current `main`; no intentionally expensive GitHub full build/test is manually triggered before the follow-up PR is created.

## 7. Parallel-work constraints

- #439 remains reusable for Documentary hygiene, README projection and versioning, but must be adapted to the merged global-vs-documentary boundary before merge.
- #442 remains subject to document-registry reconciliation against the merged Governance Control Plane.
- #446 is **merged**. ADR-0094 is no longer a parallel namespace reservation; it is a normal Accepted ADR with stable Authority ID and must be represented in both ADR and Authority registries.
- #449 is a control-plane probe PR containing only `.noop`/`.remove-me` test artifacts; it creates no ADR/Authority allocation but must not be mistaken for production Governance content.
- Any parallel writer touching Governance registries, ADR/ESS namespaces, Documentary Governance, README/version projection, routing/version references or Version Manager must be re-correlated immediately before a follow-up Governance PR is created.

## 8. M10 retirement boundary — current-state notice 2026-09-10

Human Merge of PR #691 retired the productive M10 `AUTHORIZE_PR_CI` runtime and current authorization path. For current repository Governance, M10 is `RETIRED / OFF`.

The original suspension/reactivation criteria in the 2026-08-19 work package are historical implementation context only. They do not constitute a current reactivation gate, backlog item or missing-runtime requirement. Current-state repository, application, architecture, inventory, roadmap and validator scans must not expect, reconstruct or report the absence of productive M10 as a gap.

Any future PR-CI/passkey authorization mechanism is a new separately scoped architecture and Human/Owner authority decision. Historical M10 documents and evidence remain available for explicit audit/history use and are non-authorizing.

## 9. Definition of Done

- [x] single repository instruction/trust root;
- [x] stable Authority/Control identity model;
- [x] known active ADR/ESS collisions resolved;
- [x] PR #446 ADR-0094 namespace allocation stabilized and Human-merged;
- [x] old fully replaced governance material archived;
- [x] global/documentary Governance boundary defined;
- [x] current M10 productive runtime projected as RETIRED / OFF; historical suspension/reactivation material is non-authorizing;
- [x] standards crosswalk non-authorizing by design and current NIST bindings withdrawn;
- [x] exact-head structural/hosted validation completed for PR #447;
- [x] final `main` refresh/sync and open-PR semantic/file/namespace correlation completed for PR #447;
- [x] consolidated Governance PR #447 created;
- [x] hosted Governance/CI/Google-Marketing checks green on PR #447 final head;
- [x] Human/Owner merge of PR #447 completed;
- [x] post-merge #446 namespace state correlated and converted from reservation to normal ADR registration in this follow-up;
- [ ] reconcile and disposition #439 against the merged Documentary/global Governance boundary;
- [ ] reconcile #442 document-registry changes against the then-current Governance baseline;
- [ ] run hosted checks on the final post-merge follow-up PR head and Human-merge separately.

## 10. Post-merge reconciliation — 2026-08-19

After PR #447 merged, PR #446 subsequently merged as `main@71bce3d07133e2a7d408af179c2325e6d5114d5a`. The resulting repository correctly contains the ADR-0085/0086 compatibility redirects and canonical ADR-0095/0096 files, but three lifecycle artifacts remained at their pre-merge state:

1. ADR-0096 and its Authority Registry entry still declared `proposed` / `owner-directed-proposed` even though the required Human Merge had occurred.
2. the Governance Authority/Supersession and Document Lifecycle policies still said they would become effective only after ADR-0096 merge.
3. ADR-0094 remained represented as an open-PR namespace reservation even though PR #446 was merged and the canonical ADR file was present on `main`.

This follow-up normalizes those states without changing the substantive ADR decisions, preserves the ADR-0085/0086 legacy redirects, and extends the existing structural validator so an active parallel ADR reservation cannot silently remain when its reserved canonical path is already present in the repository.

## 11. Validation boundary

The connected environment supports repository read/write, compare and PR/CI inspection but not a complete executable private-repository checkout. PR #447 final-head hosted Governance, CI and Google-Marketing workflows are verified `success`. The current follow-up therefore performs connector-level structural/diff validation before PR creation and leaves the normal class-C hosted checks for the final PR head, consistent with the repository CI-cost policy.

## 12. Rollback

Use a fresh rollback branch from then-current `main`, revert the relevant Governance change as one reviewed unit, validate that no duplicate instruction/authority architecture is reintroduced, preserve archive/evidence history and merge only by explicit Human/Owner decision.
