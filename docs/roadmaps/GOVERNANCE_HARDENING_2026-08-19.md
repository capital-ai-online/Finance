# Governance Hardening Roadmap — 2026-08-19

**Document ID:** GOV-HARDENING-ROADMAP-2026-08-19  
**Status:** PROPOSED — branch implementation, Human Merge required  
**Owner:** CAPITAL-AI Owner  
**Baseline:** `main@345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Branch:** `agent/governance-authority-regulatory-hardening`

## Purpose

Close the governance gaps identified in the 2026-08-19 repository review without weakening existing Human/Owner authority, fail-closed controls, or accepted decisions.

## Work packages

| WP | Scope | Target state | Status |
|---|---|---|---|
| GH-1 | Authority / supersession | deterministic authority hierarchy; no stale checkbox/emoji gate presented as current | IMPLEMENTING |
| GH-2 | Regulatory crosswalk | explicit EU AI Act / DORA applicability and control mapping; ISO/IEC 42001 + NIST AI RMF benchmark | IMPLEMENTING |
| GH-3 | AI evaluation evidence | append-only durable persistence path; in-memory cache no longer presented as durable evidence | IMPLEMENTING |
| GH-4 | M10 boundary | preserve Human-only enrollment/cutover boundary; no agent claim of completion | DOCUMENTED / HUMAN ACTION OUTSTANDING |

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

## Exit gate

Before PR creation:

- compare this branch against current `main` again;
- re-check open PR changed-file overlap;
- update correlated files if `main` moved;
- record validation status and unresolved Human-only actions;
- create a compact before/after matrix in the PR body.
