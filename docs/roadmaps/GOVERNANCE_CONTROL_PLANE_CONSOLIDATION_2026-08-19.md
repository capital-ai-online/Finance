# CAPITAL-AI Governance Control Plane Consolidation Roadmap

**Roadmap ID:** `GOV-CP-2026-08-19`  
**Authority ID:** `AUTH-GOV-CONTROL-PLANE-ROADMAP`  
**Version:** `1.1.0`  
**Date:** `2026-08-19`  
**Owner:** CAPITAL-AI Owner  
**Baseline:** `main@59a2755de53297a934b062b380a313d68cd47492`  
**Implementation branch:** `governance/control-plane-foundation-iso42001-ssdf`  
**Status:** FOUNDATION IMPLEMENTED ON BRANCH / FINAL PRE-PR VALIDATION AND MAIN SYNC OUTSTANDING

## 1. Objective

Eliminate duplicated governance architectures and contradictory policy mirrors before further feature work becomes merge-ready. The target state is one repository governance control plane with one agent trust root, stable machine-readable identities, deterministic ADR/ESS lifecycle resolution, document hygiene and independent technical validation.

This roadmap intentionally batches the work into one substantial governance Pull Request to minimize duplicated GitHub build/test runtime and repeated governance review cost.

## 2. Non-negotiable target architecture

```text
Applicable law / binding obligations
              |
              v
Human / Owner decisions + effective Accepted ADRs
              |
              v
          /AGENTS.md
      Agent Trust Root
              |
              v
Authority Registry + Control Catalog + ADR Registry
              |
       +------+------+
       |             |
       v             v
Policy-as-Code   Domain ADR/ESS
Validators       / Contracts
       |             |
       +------+------+
              v
      Technical Evidence
              |
              v
GitHub hosted checks -> Human Merge -> verified main deployment
```

Provider/model files such as `CLAUDE.md` and `.github/copilot-instructions.md` are adapters only. They may not become independent policy authorities.

## 3. Standards baseline

The governance management structure is aligned to:

- ISO/IEC 42001:2023 as the AI management system / continual-improvement baseline;
- NIST SP 800-218 SSDF v1.1 for secure software development;
- NIST SP 800-218A as AI-specific secure-development augmentation/profile guidance;
- existing Accepted CAPITAL-AI decisions where they impose stricter controls.

No repository statement may imply ISO certification or regulatory applicability without independent evidence.

## 4. Work packages

| WP | Scope | Deliverable | Current branch state |
|---|---|---|---|
| G0 | Agent Trust Root | `AGENTS.md` single repository-wide agent authority; provider adapters thin | **IMPLEMENTED** |
| G1 | Stable identity | `AUTH-*`, `CTRL-*`, ADR registry and explicit aliases/supersession rules | **IMPLEMENTED** |
| G2 | Namespace remediation | resolve ADR-0085/ADR-0086 and ESS-0012 collisions without losing historical evidence | **IMPLEMENTED** |
| G3 | Governance Core | central `src/platform/Governance` boundary plus deterministic validator | **IMPLEMENTED** |
| G4 | Documentation hygiene | canonical folder/lifecycle rules; reuse #439 after governance merge | **FOUNDATION IMPLEMENTED; #439 REUSE DEFERRED** |
| G5 | Pre-PR evidence | schema for sandbox/local preflight bound to exact candidate SHA | **IMPLEMENTED** |
| G6 | CI/Deployment alignment | hosted `build-and-test` independent; exact-SHA main deploy authority; M10 suspended | **POLICY/CONTROL MODEL ALIGNED** |
| G7 | Parked PR reconciliation | rebase/adapt #439 and #442 after governance merge | **POST-MERGE OUTSTANDING** |

## 5. Quick wins implemented in this branch

1. Replaced provider-specific global instructions with one `AGENTS.md` trust root and thin Claude/Copilot adapters.
2. Added stable authority and control registries.
3. Added a canonical ADR registry for new/migrated decisions with semantic version, date and lifecycle.
4. Resolved duplicate active ADR display identities with stable historical aliases.
5. Resolved duplicate active ESS-0012 identity: Documentation Governance retains ESS-0012; the obsolete vocabulary draft is archived and ESS-0017 remains canonical Vocabulary Governance.
6. Added a deterministic governance control-plane validator and a Vitest entry that executes it under the normal test suite.
7. Established `src/platform/Governance` as the global cross-cutting governance component; Documentary Governance is narrowed to documentation-only concerns.
8. Added ISO/IEC 42001 + NIST SSDF crosswalk with explicit non-certification language.
9. Added canonical document lifecycle/folder hygiene policy.
10. Added exact-SHA `developer-preflight` evidence schema for future local/approved-sandbox/ChatGPT execution when the complete candidate snapshot is available.
11. Updated current Human PR and Development Chain policies to the actual M10-suspended / exact-SHA deployment architecture.
12. Reclassified the earlier Governance Hardening roadmap as historical so it cannot be mistaken for current M10/authority state.
13. Added Owner-visible Governance Control Plane supersession diff/impact evidence.

## 6. Pull-request / CI cost strategy

- No governance PR is opened until the bundled branch scope is complete and re-synchronized with current `main`.
- No intentionally expensive GitHub full-build/test run is manually triggered before PR creation.
- One consolidated governance PR is preferred over multiple small PRs unless a security-critical blocker requires isolation.
- After PR creation, use the repository's normal independent hosted `build-and-test`; avoid redundant reruns and bundle fixes before another run.
- Full required checks must be green on the final PR head before Human Merge.

## 7. Parallel-work constraints

Until this roadmap is merged:

- PR #439 remains Draft; its documentation-hygiene implementation is reusable input but not global governance authority.
- PR #442 remains Draft; its ranking implementation may remain parked, but registry/authority references must be reconciled against the new governance baseline before merge-readiness.
- Parallel work should avoid `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/governance/**`, `docs/adr/**`, `.ai/registry/**`, `.ai/skills/ESS-*Governance*`, `scripts/governance/**` and `src/platform/Governance/**`.

## 8. Definition of Done

- [x] `AGENTS.md` is defined as the only repository-wide AI-agent trust root.
- [x] Provider/model adapters contain no independent global governance policy.
- [x] Stable `AUTH-*` and `CTRL-*` identities are machine-readable and collision-checkable.
- [x] Known duplicate active ADR identifiers are resolved and historical aliases retained.
- [x] Known duplicate active ESS-0012 identity is resolved in favor of registered Documentation Governance; Vocabulary Governance resolves to ESS-0017.
- [x] Central ADR registry defines version/date/lifecycle/supersession rules.
- [x] Global governance code resides under `src/platform/Governance`; Documentary Governance is explicitly documentation-scoped.
- [x] Structural validator implementation fails closed by design for duplicate active IDs, broken registry targets and competing adapter authority; it is wired into Vitest.
- [x] ISO/IEC 42001 / NIST SSDF crosswalk exists without a certification claim.
- [x] Pre-PR evidence contract binds technical evidence to exact base/head SHAs and marks it non-authorizing.
- [x] Owner-visible supersession diff/impact package exists.
- [ ] Execute available low-cost/pre-PR structural validation against the exact final candidate snapshot.
- [ ] Final branch is re-synchronized with then-current `main` and open PR correlations are re-evaluated immediately before PR creation.
- [ ] One consolidated PR is created only after the final sync and explicit PR authorization.
- [ ] Independent hosted CI passes on the final PR head.
- [ ] Human/Owner merge remains separate and explicit.
- [ ] After Governance merge, reconcile parked #439 and #442 against the new baseline.

## 9. Validation boundary

The current connected GitHub environment permits repository read/write, compare and PR/CI inspection but does not provide a complete private-repository checkout inside the ChatGPT execution sandbox. Therefore no full `npm ci` / TypeScript / Vitest / production-build PASS is claimed before the PR unless an exact candidate snapshot becomes executable in the sandbox.

The branch nevertheless wires the structural Governance Control Plane validator into the normal Vitest suite so the later single consolidated PR exercises it through the independent hosted `build-and-test` path.

## 10. Rollback

Rollback is repository-only: create a fresh rollback branch from then-current `main`, revert the governance PR as one reviewed unit, validate restored authority resolution and merge only by explicit Human/Owner decision. Historical ADR/ESS/evidence records remain retained.