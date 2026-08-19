# CAPITAL-AI Governance Control Plane Consolidation Roadmap

**Roadmap ID:** `GOV-CP-2026-08-19`  
**Authority ID:** `AUTH-GOV-CONTROL-PLANE-ROADMAP`  
**Version:** `1.0.0`  
**Date:** `2026-08-19`  
**Owner:** CAPITAL-AI Owner  
**Baseline:** `main@59a2755de53297a934b062b380a313d68cd47492`  
**Implementation branch:** `governance/control-plane-foundation-iso42001-ssdf`  
**Status:** OWNER-DIRECTED / IMPLEMENTATION IN PROGRESS

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
- NIST SP 800-218A as AI-specific SSDF augmentation/profile guidance;
- existing Accepted CAPITAL-AI decisions where they impose stricter controls.

No repository statement may imply ISO certification or regulatory applicability without independent evidence.

## 4. Work packages

| WP | Scope | Deliverable | Gate |
|---|---|---|---|
| G0 | Agent Trust Root | `AGENTS.md` is single repository-wide agent authority; provider adapters are thin | no competing global agent policy |
| G1 | Stable identity | `AUTH-*`, `CTRL-*`, ADR registry and explicit aliases/supersession edges | duplicate active identity fails closed |
| G2 | Namespace remediation | resolve known ADR-0085/ADR-0086 and ESS-0012 collisions without losing historical evidence | active namespace unique |
| G3 | Governance Core | central `src/platform/Governance` boundary plus standalone deterministic validator | no global governance implementation under Documentary |
| G4 | Documentation hygiene | canonical folder/lifecycle rules; reuse #439 logic after governance merge | one hygiene implementation, no mirror |
| G5 | Pre-PR evidence | schema for sandbox/local preflight bound to exact candidate SHA | evidence is non-authorizing |
| G6 | CI/Deployment alignment | hosted `build-and-test` remains independent; exact-SHA main deploy remains production authority | Human Merge + attestation boundaries unchanged |
| G7 | Parked PR reconciliation | rebase/adapt #439 and #442 after governance merge | no registry/control-plane conflicts |

## 5. Quick wins implemented in this branch

1. Replace provider-specific global instructions with one `AGENTS.md` trust root and thin adapters.
2. Add stable authority and control registries.
3. Add an authoritative ADR registry for new/migrated decisions.
4. Resolve known duplicate active ADR/ESS identities with explicit historical aliases.
5. Add a deterministic governance control-plane validator independent of free-text substring checks.
6. Establish `src/platform/Governance` as the global governance component; Documentary Governance remains documentation-only.
7. Add ISO/IEC 42001 + NIST SSDF crosswalk and evidence-classification rules.
8. Add an exact-SHA pre-PR evidence schema for future ChatGPT/sandbox execution.

## 6. Pull-request / CI cost strategy

- No governance PR is opened until the bundled branch scope is complete and re-synchronized with current `main`.
- No intentionally expensive GitHub full-build/test run is manually triggered before PR creation.
- One consolidated governance PR is preferred over multiple small PRs unless a security-critical blocker requires isolation.
- After PR creation, use the repository's normal independent hosted `build-and-test`; avoid redundant reruns and bundle fixes before another run.
- Full required checks must be green on the final PR head before Human Merge.

## 7. Parallel-work constraints

Until this roadmap is merged:

- PR #439 remains Draft; its documentation-hygiene implementation is treated as reusable input but not as the global governance authority.
- PR #442 remains Draft; its ranking implementation may remain parked, but registry/authority references must be reconciled against the new governance baseline before merge-readiness.
- Parallel work should avoid `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `docs/governance/**`, `docs/adr/**`, `.ai/registry/**`, `.ai/skills/ESS-*Governance*`, `scripts/governance/**` and `src/platform/Governance/**`.

## 8. Definition of Done

- [ ] `AGENTS.md` is the only repository-wide AI-agent trust root.
- [ ] Provider/model adapters contain no independent global governance policy.
- [ ] Stable `AUTH-*` and `CTRL-*` identities are machine-readable and collision-checked.
- [ ] Known duplicate active ADR identifiers are resolved and historical aliases retained.
- [ ] Known duplicate active ESS-0012 identity is resolved in favor of registered Documentation Governance; Vocabulary Governance resolves to ESS-0017.
- [ ] Central ADR registry defines version/date/lifecycle/supersession rules.
- [ ] Global governance code resides under `src/platform/Governance` rather than Documentary.
- [ ] Governance validation fails closed for duplicate active IDs, broken registry targets and competing adapter authority.
- [ ] ISO/IEC 42001 / NIST SSDF crosswalk exists without false certification claims.
- [ ] Pre-PR evidence contract binds technical evidence to exact base/head SHAs.
- [ ] Final branch is re-synchronized with then-current `main` and open PR correlations are re-evaluated.
- [ ] One consolidated PR is created only after the final sync.
- [ ] Independent hosted CI passes on final head.
- [ ] Human/Owner merge remains separate and explicit.

## 9. Rollback

Rollback is repository-only: create a fresh rollback branch from then-current `main`, revert the governance PR as one reviewed unit, validate restored authority resolution and merge only by explicit Human/Owner decision. Historical ADR/ESS/evidence records remain retained.