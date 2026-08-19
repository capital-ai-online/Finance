# Governance Hardening Roadmap — 2026-08-19

> **CURRENT-AUTHORITY ANNOTATION — 2026-08-19**  
> **Lifecycle:** `HISTORICAL / SUPERSEDED FOR CURRENT GOVERNANCE EXECUTION`  
> **Current roadmap:** `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` / `AUTH-GOV-CONTROL-PLANE-ROADMAP`  
> This file is retained as implementation/history evidence for its original work packages. It MUST NOT be used to infer the current M10 state, current ADR namespace or current repository-wide governance authority. In particular, M10 `AUTHORIZE_PR_CI` is currently suspended/off and the canonical agent trust root is `/AGENTS.md`.

**Document ID:** GOV-HARDENING-ROADMAP-2026-08-19  
**Historical status at snapshot time:** IMPLEMENTED ON BRANCH — CI + Human Merge outstanding  
**Owner:** CAPITAL-AI Owner  
**Baseline:** `main@345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Historical branch:** `agent/governance-authority-regulatory-hardening`

## Purpose

Close the governance gaps identified in the 2026-08-19 repository review without weakening existing Human/Owner authority, fail-closed controls, or accepted decisions.

The remainder of this file is retained as a historical snapshot of that workstream. Current authority is resolved through `/AGENTS.md`, the stable registries and the current Governance Control Plane roadmap.

## Work packages — historical snapshot

| WP | Scope | Target state | Historical status |
|---|---|---|---|
| GH-1 | Authority / supersession | deterministic authority hierarchy; no stale checkbox/emoji gate presented as current | **IMPLEMENTED ON HISTORICAL BRANCH** |
| GH-2 | Regulatory crosswalk | explicit EU AI Act / DORA applicability and control mapping; ISO/IEC 42001 + NIST AI RMF benchmark | **IMPLEMENTED ON HISTORICAL BRANCH** |
| GH-3 | AI evaluation evidence | append-only durable persistence path; in-memory cache no longer presented as durable evidence | **IMPLEMENTED ON HISTORICAL BRANCH — production migration NOT executed at snapshot time** |
| GH-4 | M10 boundary | preserve Human-only enrollment/cutover boundary; no agent claim of completion | **HISTORICAL STATE — superseded by current M10 suspension decision** |

## Non-negotiable constraints retained as historical design intent

1. Regulation and applicable law outrank repository policy.
2. Accepted Owner decisions and Accepted ADRs are not superseded by mere document recency.
3. Proposed/Draft ADRs may inform implementation but do not silently become normative authority.
4. Semantic supersession or archival requires an Owner-visible diff and impact analysis before Human Merge.
5. Historical evidence remains historical evidence; current policies may annotate it as historical/non-normative.
6. AI agents may prepare a branch and PR but may not merge it.
7. Historical M10 passkey material does not itself create current authorization state.

## Historical open-PR correlation

At branch creation, PR #414 (`agent/dsgvo-remediation-controller-rights`) was open against the historical baseline. Its changed files were inspected. That work intentionally avoided its privacy/legal implementation files.

A namespace risk was identified at that time: PR #414 proposed `ADR-0085-privacy-governance-single-source-of-truth.md`, while the then-current repository already contained an ADR-0085 namespace-cleanup decision. The current Governance Control Plane remediation resolves that collision through stable authority identities and canonical ADR display numbers; this paragraph remains historical evidence of how the collision was detected.

## Historical final main / overlap recheck

At the time of that workstream:

- `main` was `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`;
- the historical branch comparison was `ahead_by=15`, `behind_by=0` before its roadmap-closing commit;
- the only open PR was #414;
- direct changed-file overlap with #414 was none.

These values are a snapshot and MUST NOT be interpreted as current repository state.

## Historical validation boundary

At that time, the connected GitHub environment supported branch/file/PR operations but did not provide a complete local repository execution environment. Full TypeScript/unit/build/security validation therefore depended on the repository's required PR CI.

Any new pre-PR build/test evidence must follow the current SHA-bound evidence contract and may only claim checks actually executed against the exact candidate snapshot.

## Historical exit gate

- [x] implementation completed on the historical branch;
- [x] then-current `main` rechecked;
- [x] then-open PR file overlap rechecked;
- [x] diff/impact package created before semantic supersession;
- [x] rollback documented;
- [ ] historical PR CI / merge state is not a current governance gate;
- [ ] historical M10 enrollment/cutover state is not a current governance gate.

For current work, use `GOV-CP-2026-08-19` and the stable Governance Control Plane.