# Governance Control Plane — Supersession Diff & Impact

**Document ID:** `DOC-GOV-CONTROL-PLANE-IMPACT-2026-08-19`  
**Version:** `1.2.0`  
**Date:** `2026-08-19`  
**Status:** OWNER REVIEW / IMPLEMENTATION EVIDENCE  
**Decision authority:** `ADR-0096` / `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Branch:** `governance/control-plane-foundation-iso42001-ssdf`

## 1. Owner-directed scope

The Owner directed that repository governance duplication and contradictory policy architecture be resolved before new features become merge-ready, including:

- `AGENTS.md` as single point of trust for all agents/models;
- centralized, versioned and dated ADR governance;
- stable authority/control identities;
- documentation/folder hygiene;
- ISO/IEC 42001 and NIST SSDF-oriented governance design;
- cleanup of duplicate architectures and conflicting rules before feature continuation.

## 2. Supersession / namespace matrix

| Source / previous state | Replacement / target | Stable identity treatment | Semantic impact |
|---|---|---|---|
| `AGENTS.md` plus independent global rules in `CLAUDE.md` | `AGENTS.md` Trust Root + thin adapters | `AUTH-GOV-AGENT-TRUST-ROOT` | removes policy mirror; protected boundaries preserved |
| provider/model instructions could repeat global security/CI rules | adapters may only contain host-specific non-authoritative execution notes | adapter IDs only | prevents provider-specific policy drift |
| ESS-0019 named a universal AI agent control plane | retained as subordinate capability/risk/audit/execution plane under `/AGENTS.md` | `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` | no capability removal; makes explicit that ESS-0019 is not a second trust root |
| `SKILL-GOV-0001` carried retired provider assignments and generic value-chain handoff obligations | documentation-only operational skill under ESS-0012 + global Governance boundary | stable skill ID retained | removes stale provider/global process mirror without weakening documentary validation |
| two active ADRs displayed as `ADR-0085` | ESS namespace ADR remains `ADR-0085`; privacy decision becomes `ADR-0095` | privacy keeps `AUTH-ADR-PRIVACY-SINGLE-SOURCE-2026-08-19`; old 0085 retained as legacy redirect/alias | namespace repair only; privacy decision substance unchanged |
| vendor privacy ADR and governance draft both displayed as `ADR-0086` | vendor privacy remains `ADR-0086`; governance decision becomes `ADR-0096` | governance keeps `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`; old 0086 retained as legacy redirect/alias | removes ambiguous display identity and expands governance decision to current Owner scope |
| open PR #446 independently writes `ADR-0094` | Governance branch does not allocate ADR-0094; privacy/governance use 0095/0096 | stable `AUTH-*` identities unchanged | avoids cross-PR namespace race discovered during final correlation |
| two active `.ai/skills` files declared `ESS-0012` | Documentation Governance retains ESS-0012; vocabulary draft removed from active skills and archived; ESS-0017 remains Vocabulary Governance | `AUTH-ESS-DOCUMENTATION-GOVERNANCE` and `AUTH-ESS-VOCABULARY-GOVERNANCE` | removes active duplicate; historical proposal retained |
| Documentary Governance was a plausible global governance implementation location | new cross-cutting `src/platform/Governance` component | `AUTH-GOV-CONTROL-PLANE` | explicit component boundary; Documentary remains documentation-only |
| authority inferred from path/display number/prose | stable `AUTH-*` + `CTRL-*` registries | path-independent IDs | deterministic identity and reduced text/regex brittleness |
| old recency language could be interpreted at document level | same-authority version/date ordering; cross-authority replacement requires explicit supersession | stable `authorityId` | newer document alone cannot manufacture authority |
| old ADR links would break after namespace repair | controlled `Legacy ADR Redirect — NON-AUTHORIZING` stubs | canonical authority remains only in registry | preserves traceability without recreating active duplicate ADRs |
| previous Governance Hardening roadmap could be read as current M10/authority status | retained with explicit historical/superseded annotation | documentary identity retained | preserves evidence while preventing current-state confusion |
| DevelopmentChain current-state index still called M10 current/enforced VERIFIED PASS | current index now separates historical M10 verification from current `SUSPENDED/OFF` enforcement | `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` | removes current-state contradiction after PR #445 |
| M10 historical docs could imply future automatic reactivation | M10 explicitly `SUSPENDED/OFF` in current trust root/policy | current Owner state | no passkey gate until new explicit decision |

## 3. Operational impact

### Agent behavior

Before: an agent could encounter materially overlapping repository-wide rules in `AGENTS.md`, `CLAUDE.md`, operational skills, governance policies and domain documents.

After: every agent starts at `/AGENTS.md`, resolves stable registries, then follows only effective subordinate domain authorities for the requested scope. ESS-0019 remains the provider-neutral capability/execution contract and does not become a second trust root.

### Pull Requests / CI

- no new pre-PR authorization gate is introduced;
- M10 remains suspended/off;
- pre-PR sandbox/local evidence is technical evidence only;
- hosted GitHub `build-and-test` remains independent on the final PR head;
- Human Merge remains mandatory;
- open PR namespace allocations are treated as semantic writer conflicts even when file paths do not overlap.

### Deployment

No production mutation is performed by this governance branch. Existing production authority remains verified `main` CI -> supply-chain attestation -> exact-SHA Render deploy hook -> post-deployment identity verification, with Render native Auto Deploy off.

## 4. Security impact

**Improvement:** removes competing agent policy mirrors, makes protected authority machine-resolvable, prevents duplicate active governance identities and requires fail-closed handling of unresolved structural conflicts.

**No privilege expansion:** the branch does not delegate merge, Owner IAM, secret access, destructive data operations, billing mutation, provider control-plane mutation or deployment authority. ESS-0019 capability ceilings and risk classes remain intact but explicitly subordinate to the repository trust root.

**Residual risk:** legacy historical/current documents may still contain old naked display-number references. The compatibility registry and non-authoritative redirects preserve aliases; every touched/new ADR must use stable identity metadata after cutover. Bulk historical rewrite is intentionally avoided to preserve evidence and limit unrelated churn.

## 5. Regulatory / standards impact

The control-plane structure is aligned to ISO/IEC 42001:2023 management-system concepts and NIST SP 800-218 SSDF v1.1 / SP 800-218A secure-development practices. This improves governance traceability but does not assert certification, regulated-entity status, high-risk AI classification or legal completeness.

## 6. Evidence impact

- historical ADR/ESS/evidence content is retained or represented by explicit historical aliases/archive records;
- applied database migration files are not rewritten solely to change historical ADR comments;
- former display IDs remain traceable but are non-canonical when marked legacy;
- current/migrated decisions use stable `authorityId` values;
- operational skills are treated as execution guidance, not independent authority;
- branch-local temporary ADR numbers that never reached `main` are not retained as fake historical authorities.

## 7. Open-PR impact

### PR #439

The Draft PR contains useful documentation-hygiene implementation. It is parked because it would otherwise establish a global validator under `src/platform/Documentary/Governance` before the global governance component boundary is settled. After this governance merge, its logic should be adapted into the canonical Governance/Documentation boundary rather than duplicated.

### PR #442

The Draft ranking PR is functionally independent but writes `docs/governance/document-registry.json`. It remains parked and must be synchronized with the new governance baseline before merge-readiness.

### PR #446

PR #446 was discovered during the final branch-integrity check and is an active Draft writer for `docs/adr/ADR-0094-open-source-pdf-companion-and-short-media-rendering.md`. There is no direct file overlap with this Governance branch, but ADR display IDs are a shared namespace. The Governance branch therefore released ADR-0094 and uses ADR-0095 for the existing privacy decision and ADR-0096 for the new Governance decision.

Immediately before Governance PR creation, #446 must be checked again. If it has merged, current `main` must be synchronized and its ADR registered/correlated. If it remains open or has changed its ADR allocation, the reservation must be re-evaluated before PR creation.

At this check there was no direct changed-file overlap between the Governance branch and #439, #442 or #446; the remaining correlations are architectural/registry/namespace-related and are explicitly sequenced.

## 8. Rollback

1. create a fresh rollback branch from then-current `main`;
2. revert the consolidated governance PR as a reviewed unit;
3. validate that restored adapters/registries do not recreate unresolved active duplicate IDs;
4. preserve ADR/ESS historical aliases and evidence;
5. Human/Owner decides and performs the rollback merge.

No external production rollback is required for the governance refactor itself.

## 9. Owner decision record

The Owner explicitly instructed implementation of this governance cleanup in the project conversation on 2026-08-19. Effectiveness on the repository remains contingent on Human Merge of the resulting consolidated Pull Request.