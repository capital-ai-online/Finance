# ADR-0096 — Governance Control Plane, Stable Authority and Supersession

**Authority ID:** `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Version:** `1.0.0`  
**Status:** PROPOSED — Owner-directed implementation; effective after Human Merge  
**Date:** `2026-08-19`  
**Decision Owner:** CAPITAL-AI Owner  
**Scope:** repository governance authority, agent trust root, stable identities, ADR/ESS lifecycle, documentation governance boundaries and pre-PR evidence

**Legacy alias:** `ADR-0086` — the earlier governance-supersession draft used a display number already occupied by Accepted Vendor Privacy Evidence Governance. The temporary branch-local `ADR-0095` allocation was not merged and was moved to `ADR-0096` after open PR #446 was identified as the active writer for ADR-0094, which required the privacy namespace repair to use ADR-0095.

## Context

The repository accumulated strong individual controls but exposed them through multiple partially overlapping governance architectures: root agent directives, provider-specific instructions, governance policies, Documentary Governance, ADR/ESS registries, workflow prose and historical reports. The result was ambiguous authority resolution and several concrete namespace collisions.

Known collisions at this decision point include:

- two active documents using display number `ADR-0085` for unrelated Accepted decisions;
- two documents using display number `ADR-0086`, one Accepted vendor-privacy decision and one governance-supersession draft;
- open PR #446 independently allocating `ADR-0094`, requiring this governance branch to avoid that namespace while it remains an active parallel writer;
- two active `.ai/skills` documents declaring `ESS-0012`, while the ESS registry assigns `ESS-0012` to Documentation Governance and Vocabulary Governance is already represented by `ESS-0017`;
- `CLAUDE.md` carrying independent global policy content in parallel with `AGENTS.md`;
- global repository governance logic conceptually overlapping `src/platform/Documentary/Governance`.

The Owner directed that these governance defects be resolved before further feature work becomes merge-ready, that `AGENTS.md` become the single point of trust for all models/agents, that ADRs be centrally versioned and dated, and that the governance structure align to ISO/IEC 42001 and NIST SSDF practices without making false certification claims.

## Decision

### 1. Single agent trust root

`/AGENTS.md` becomes the single repository-wide trust root for every AI model, coding agent, MCP host and automation client.

Provider/tool files such as `CLAUDE.md` and `.github/copilot-instructions.md` become thin non-authoritative adapters. They may contain host-specific execution notes but may not independently define global security, data-integrity, branch, PR, CI, merge or production-mutation rules.

### 2. Stable machine-readable identities

Governance identity is decoupled from file path and human display number.

- `AUTH-*` identifies an authority/decision immutably.
- `CTRL-*` identifies an enforceable governance control immutably.
- `DOC-*` remains documentary identity.
- ADR and ESS numbers remain human/traceability display aliases.

Renumbering or moving an artifact does not change its stable authority identity.

### 3. Canonical registries

The control plane uses:

- `docs/governance/authority-registry.json` for stable authority identities and current locations;
- `docs/governance/control-catalog.json` for operative controls;
- `docs/adr/registry.json` for new/migrated ADR versions, dates, lifecycle and supersession;
- `.ai/registry/ess-registry.json` for ESS allocation;
- `docs/governance/document-registry.json` for documentary inventory.

Document inventory does not outrank authority registries or Accepted decisions.

### 4. ADR location, versioning and recency

Formal ADRs live only under `docs/adr/` and its lifecycle subdirectories. Every new or migrated ADR has a stable `authorityId`, unique active display number, semantic version, decision date and lifecycle.

For two artifacts representing the **same `authorityId`**, the newer effective semantic version takes precedence. If semantic versions are equal, the later effective date takes precedence.

For different `authorityId` values, recency alone is non-authorizing. Supersession requires an explicit relationship, equal-or-higher authority for the same scope, Owner-visible semantic diff/impact evidence and no conflicting higher authority or binding obligation.

### 5. Namespace repair

- Existing `ADR-0085 — ESS Namespace Cleanup and Registry Backfill` retains `ADR-0085`.
- Existing Vendor Privacy Evidence Governance retains `ADR-0086`.
- Open PR #446 retains its own branch-local `ADR-0094` allocation while it remains the active writer for that display ID.
- Privacy Governance Single Source of Truth is renumbered to `ADR-0095` while retaining immutable stable Authority ID `AUTH-ADR-PRIVACY-SINGLE-SOURCE-2026-08-19` and historical `ADR-0085` alias.
- This governance decision uses `ADR-0096`, retaining its immutable stable Authority ID and the former governance-draft `ADR-0086` only as a historical alias.
- Registered Documentation Governance retains `ESS-0012`.
- The unregistered proposed `ESS-0012` vocabulary draft is removed from the active `.ai/skills` namespace, retained as historical evidence and superseded by the existing `ESS-0017 Vocabulary Governance` specification.

### 6. Global governance component boundary

Cross-cutting repository governance belongs to `src/platform/Governance`.

`src/platform/Documentary/Governance` remains scoped to documentation-domain governance and may provide documentary validation services, but it is not a repository-wide authorization control plane.

### 7. Policy-as-code and structural validation

Governance validation resolves stable structured identities rather than arbitrary prose substrings. The repository adds `scripts/governance/validateGovernanceControlPlane.mjs` to fail closed on structural defects including duplicate stable IDs, duplicate active ADR/ESS IDs, missing registry targets, invalid legacy redirects, stale current-state M10 claims and competing provider-adapter authority.

Existing specialized validators remain reusable where their domain is narrower and non-duplicative.

### 8. Pre-PR technical evidence

A standard `developer-preflight` evidence schema binds pre-PR build/test evidence to exact `baseMainSha` and `candidateHeadSha` values. Such evidence may be produced by a local runner, an approved sandbox or ChatGPT only when the exact repository snapshot is actually available to that execution environment.

Pre-PR evidence is never merge or production authority. The independent GitHub hosted `build-and-test` remains required on the final PR head.

### 9. Current M10 and deployment state

M10 Passkey PR-CI authorization remains suspended/off according to the Owner-directed recovery state established before this decision. This ADR does not reactivate it.

Render native auto-deploy remains off. Production promotion authority remains verified `main` CI -> supply-chain attestation -> exact-SHA Render deploy hook -> post-deployment identity verification.

### 10. Standards posture

The control-plane management model uses ISO/IEC 42001:2023 as the primary AIMS/continual-improvement design benchmark and NIST SP 800-218 SSDF v1.1 plus SP 800-218A as secure-development baselines.

This architectural alignment does not assert certification, regulated-entity status, high-risk AI classification or full legal compliance.

## Consequences

### Positive

- every model resolves global governance through one trust root;
- ADR/ESS display-number collisions stop being identity collisions;
- concurrent PR namespace writers are treated as first-class governance correlations;
- current authority is machine-resolvable and path-independent;
- historical decisions remain traceable without remaining active policy mirrors;
- documentation governance and global governance have explicit boundaries;
- future tests can validate structured identities rather than brittle comment/prose substrings;
- governance changes become easier to audit and supersede predictably.

### Trade-offs

- existing legacy ADRs remain on a compatibility index until touched/migrated;
- parked PRs #439 and #442 require post-merge reconciliation against the new authority/control model;
- PR #446 must be re-correlated immediately before the governance PR because it is an active ADR namespace writer;
- additional registry metadata must be maintained for new governance changes;
- a full ChatGPT pre-PR build cannot be claimed until the execution environment has the complete exact candidate repository snapshot.

## Security and integrity impact

This decision does not delegate Human Merge, Owner IAM, secret access, production mutation or billing authority. It removes ambiguous policy mirrors and therefore reduces accidental authorization drift.

No production data, provider configuration or external control plane is mutated by this repository refactor.

## Verification / Definition of Done

1. `AGENTS.md` is the single global agent trust root and adapters are thin.
2. stable authority/control registries exist and validate uniquely.
3. ADR-0085/0086 collisions are repaired with historical aliases and active parallel ADR allocations are conflict-checked.
4. active ESS-0012 duplicate is removed from `.ai/skills` and archived as superseded by ESS-0017.
5. global governance component exists under `src/platform/Governance`.
6. structural governance validator passes on the final candidate.
7. ISO/IEC 42001 / NIST SSDF crosswalk exists with no false certification claim.
8. pre-PR evidence schema exists and is explicitly non-authorizing.
9. branch is re-synchronized with then-current `main` and all open PR namespace/file correlations immediately before PR creation.
10. final hosted GitHub checks pass and Human Merge remains separate.

## Rollback

Use a new rollback branch from then-current `main` and revert the consolidated governance PR as a reviewed unit. Restore aliases/paths only if necessary for compatibility; do not resurrect duplicate active authority identities. External production rollback is not applicable because this ADR itself changes repository governance only.
