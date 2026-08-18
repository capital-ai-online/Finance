# Governance Hardening Roadmap — 2026-08-19

**Document ID:** GOV-HARDENING-ROADMAP-2026-08-19  
**Status:** IMPLEMENTED ON BRANCH — CI + Human Merge outstanding  
**Owner:** CAPITAL-AI Owner  
**Baseline:** `main@345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Branch:** `agent/governance-authority-regulatory-hardening`

## Purpose

Close the governance gaps identified in the 2026-08-19 repository review without weakening existing Human/Owner authority, fail-closed controls, or accepted decisions.

## Work packages

| WP | Scope | Target state | Status |
|---|---|---|---|
| GH-1 | Authority / supersession | deterministic authority hierarchy; no stale checkbox/emoji gate presented as current | **IMPLEMENTED ON BRANCH** |
| GH-2 | Regulatory crosswalk | explicit EU AI Act / DORA applicability and control mapping; ISO/IEC 42001 + NIST AI RMF benchmark | **IMPLEMENTED ON BRANCH** |
| GH-3 | AI evaluation evidence | append-only durable persistence path; in-memory cache no longer presented as durable evidence | **IMPLEMENTED ON BRANCH — production migration NOT executed** |
| GH-4 | M10 boundary | preserve Human-only enrollment/cutover boundary; no agent claim of completion | **DOCUMENTED / HUMAN ACTION OUTSTANDING** |

## Non-negotiable constraints

1. Regulation and applicable law outrank repository policy.
2. Accepted Owner decisions and Accepted ADRs are not superseded by mere document recency.
3. Proposed/Draft ADRs may inform implementation but do not silently become normative authority.
4. Semantic supersession or archival requires an Owner-visible diff and impact analysis before Human Merge.
5. Historical evidence remains immutable as historical evidence; current policies may annotate it as historical/non-normative.
6. AI agents may prepare this branch and PR but may not merge it.
7. M10 real Owner passkey enrollment and controlled cutover remain Human/Owner operations.

## Open-PR correlation

At branch creation, PR #414 (`agent/dsgvo-remediation-controller-rights`) was open against the same baseline. Its changed files were inspected. This work intentionally avoids its privacy/legal implementation files.

A separate namespace risk was identified: PR #414 proposes `ADR-0085-privacy-governance-single-source-of-truth.md`, while current `main` already contains an ADR-0085 namespace-cleanup decision. This branch therefore uses **ADR-0086** and does not modify PR #414.

## Final main / overlap recheck before PR

Rechecked after implementation:

- current `main`: `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d` — unchanged from branch baseline;
- branch comparison: `ahead_by=15`, `behind_by=0` before this roadmap-closing commit;
- only open PR: #414;
- changed-file overlap with PR #414: **none**;
- semantic correlation: both branches add Supabase migrations, but to separate tables and separate files; external application remains independently gated;
- ADR namespace correlation: #414's proposed ADR-0085 conflicts with an existing main ADR number and should be corrected in that PR before merge.

No rebase or correlated file adaptation was required because `main` did not move.

## Validation boundary

The connected GitHub environment supports branch/file/PR operations but the local `gh` CLI is unavailable, so branch-local execution of the repository test suite was not possible here. The branch adds targeted Vitest regression tests; full TypeScript/unit/build/security validation is delegated to the repository's required PR CI and must PASS before Human Merge.

The new Supabase migration is **repository implementation only**. Applying it to production is an external class-M mutation and was not performed.

## Exit gate

- [x] implementation complete on fresh branch;
- [x] current `main` rechecked;
- [x] open PR file overlap rechecked;
- [x] diff/impact package created before semantic supersession becomes effective;
- [x] rollback documented;
- [x] M10 Human-only boundary preserved;
- [ ] PR CI PASS;
- [ ] Human/Owner review and merge;
- [ ] production application of AI-evaluation migration under separate class-M approval, if approved;
- [ ] M10 Owner enrollment / controlled cutover under its existing runbook.
