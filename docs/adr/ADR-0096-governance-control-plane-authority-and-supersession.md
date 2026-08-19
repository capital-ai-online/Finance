# ADR-0096 — Governance Control Plane, Stable Authority and Supersession

**Authority ID:** `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Version:** `1.1.0`  
**Status:** PROPOSED — Owner-directed implementation; effective after Human Merge  
**Date:** `2026-08-19`  
**Decision Owner:** CAPITAL-AI Owner  
**Scope:** repository governance authority, agent trust root, stable identities, ADR/ESS lifecycle, Documentation-only governance boundaries, platform-version authority, projections and M10 prerequisite remediation

**Legacy alias:** `ADR-0086` — historical governance-supersession draft number; `ADR-0086` is already occupied by Vendor Privacy Evidence Governance.

## Context

The repository accumulated strong individual controls but exposed them through overlapping governance architectures: root agent directives, Documentary Governance, ADR/ESS registries, legacy version-management runtime behavior, release projections, workflow prose and historical reports. The result was ambiguous authority resolution and concrete namespace/versioning conflicts.

PR #447 established the first Governance Control Plane baseline. The subsequent M10 prerequisite gate and parked PR #439 exposed remaining correlations:

- `package.json#version` was already the practical release source while legacy VersionManager state persisted a second version;
- `AGENTS.md` had been removed from current version-consistency tests but remained in the Release Version Gate mirror list;
- README carried manually duplicated platform/runtime version declarations;
- `/api/admin/version/bump` and `uploads/version_manager.json` remained mutable legacy paths;
- legacy VersionManager execution automatically generated ADR/compliance/document content as a side effect of version changes;
- the production runtime guard answered `GET /api/admin/version` before Express authorization middleware;
- ADR-0014 / ESS-0012 define useful Documentation Governance but must not become a repository-wide authority plane;
- ADR-0004 and ESS-0004 contain obsolete hard-coded/current-version semantics;
- after PR #446 merged, ADR-0094 remained incorrectly represented as an open parallel namespace reservation.

The Owner directed that these defects be resolved in one Governance work package, with no new feature or M10-reactivation PR interposed.

## Decision

### 1. Single agent trust root

`/AGENTS.md` is the single repository-wide trust root and instruction surface for every AI model, coding agent, MCP host and automation client. Provider-specific repository instruction mirrors remain absent/non-authoritative.

### 2. Stable machine-readable identities

- `AUTH-*` identifies an authority/decision immutably.
- `CTRL-*` identifies an enforceable governance control immutably.
- `DOC-*` identifies documentary artifacts.
- ADR and ESS numbers remain human/traceability display aliases.

Paths and display numbers may move under controlled migration without changing stable identity.

### 3. Canonical registries

The control plane uses:

- `docs/governance/authority-registry.json` for stable authority identities and current locations;
- `docs/governance/control-catalog.json` for operative controls;
- `docs/adr/registry.json` for ADR identity/version/date/lifecycle/supersession;
- `.ai/registry/ess-registry.json` for ESS allocation/lifecycle;
- `docs/governance/document-registry.json` for documentary inventory.

Document inventory and evidence do not outrank an effective authority/control.

### 4. ADR lifecycle, recency and suspension

Formal ADRs live under `docs/adr/` and lifecycle subdirectories. New or materially migrated ADRs have stable `authorityId`, unique active display ID, semantic version, date and lifecycle.

For the same `authorityId`, newer effective semantic version/date can supersede an older version. Across different authorities, recency alone is non-authorizing; explicit scope/supersession and Owner-visible impact analysis are required.

`suspended` is an explicit non-authorizing lifecycle. Suspended ADR/ESS artifacts remain traceable but cannot authorize implementation, version mutation, merge, production behavior or M10 reactivation.

### 5. Namespace state

- ADR-0085 remains ESS Namespace Cleanup.
- ADR-0086 remains Vendor Privacy Evidence Governance.
- ADR-0094 is now a normal Accepted record because PR #446 merged into `main`; its former open-PR reservation is removed.
- ADR-0095 remains Privacy Governance Single Source of Truth.
- this decision remains ADR-0096.
- Documentation Governance retains ESS-0012; the historical duplicate vocabulary ESS remains superseded by ESS-0017.

### 6. Global Governance versus Documentary Governance

Cross-cutting repository governance belongs to `src/platform/Governance`.

ADR-0014 and ESS-0012 remain active **only in Documentation-only scope**. They may define documentary validation, metadata, lifecycle findings and read-only hygiene services. They do not define repository-wide authorization, merge authority, production mutation authority, platform-version authority or agent trust-root precedence.

Any historical ADR-0014 / ESS-0012 language that assigns global authority or a mutating Version Manager role is scope-superseded by this section. The useful Documentation Hygiene implementation from parked PR #439 is reused under `src/platform/Documentary/Governance/Services/DocumentationHygieneValidator.ts` rather than recreated as a competing control plane.

### 7. Single platform-version authority

`package.json#version` is the **only current platform-version authority**.

The architecture is:

```text
package.json#version
   |
   +--> Release Version Gate        explicit controlled mutation
   +--> README Projection           deterministic derived documentation
   +--> Platform Version Projection read-only runtime/admin view

AGENTS.md Control Plane Version     independent governance metadata
```

Consequences:

- `AGENTS.md` is removed from all product-version mirror/update contracts;
- README is a deterministic projection generated by `readmeVersionProjection.ts` / `readme:sync` and cannot become a second authority;
- `src/platform/Release/Services/platformVersionControlPlane.ts` provides the single read-only runtime/API projection service;
- `src/platform/VersionManager/platformVersionAuthority.ts` is only a compatibility re-export;
- `src/platform/VersionManager/versionManager.ts` is only an authenticated read-only compatibility router;
- `uploads/version_manager.json`, autonomous bump logic and VersionManager document generation are retired/non-authorizing;
- version changes occur only through the controlled Release Version Gate under ADR-0030.

### 8. Suspension of obsolete version authorities

`ADR-0004 — Branding, Header und Panel-Entfernung` is moved to `docs/adr/suspended/` because it embeds an obsolete current product-version projection (`0.5.4`) in a broader UI/branding decision.

`ESS-0004 — Enterprise Version Manager` is removed from active `.ai/skills` and moved to `docs/archive/governance/suspended/` because its statement that the Version Manager determines the version and its legacy component model conflict with the single-authority Release architecture.

References in other active documents to ESS-0004 or “Version Manager” as the current platform-version authority are non-authorizing compatibility/history references. For current execution they resolve to `package.json#version` plus the Release Control Plane unless a newer explicit decision states otherwise. Those documents are not globally suspended when their remaining domain scope is valid.

### 9. Runtime authorization boundary

The production runtime artifact guard may deny retired write endpoints before Express, but it must **not** serve `GET /api/admin/version` itself. The GET projection must reach the normal Express route and `checkAdminAccess` authorization middleware. A runtime shortcut cannot bypass AuthN/AuthZ merely to expose immutable release metadata.

### 10. Policy-as-code and structural validation

`scripts/governance/validateGovernanceControlPlane.mjs` remains the canonical repository structural validator and is extended to fail closed on:

- stable Authority/Control/ADR identity collisions;
- stale ADR namespace reservations;
- suspended ADR/ESS path/lifecycle inconsistencies;
- competing agent instruction surfaces;
- platform-version authority ambiguity;
- AGENTS product-version mirroring;
- README projection drift contract;
- mutable/duplicated VersionManager router behavior;
- retired VersionManager JSON state or ADR/document generators;
- runtime version-GET AuthZ bypass patterns;
- Documentation Hygiene service/boundary absence;
- incomplete M10 prerequisite state.

Specialized validators remain reusable only where their domain is narrower and non-duplicative.

### 11. Current M10 state

M10 Passkey PR-CI authorization remains `SUSPENDED / OFF`. This ADR and work package do **not** reactivate it.

Reactivation eligibility requires, in order:

1. ADR / Authority cleanup;
2. Documentary separation;
3. README projection;
4. Documentation Hygiene;
5. router cleanup;
6. one platform-version authority;
7. structural validation;
8. independent hosted CI on the exact candidate head;
9. a new explicit Human/Owner decision.

Historical M10 evidence cannot satisfy step 9.

### 12. Deployment and standards posture

Render native auto-deploy remains off. Production promotion authority remains verified `main` CI -> supply-chain attestation -> exact-SHA Render deploy hook -> post-deployment identity verification.

The control-plane management model uses ISO/IEC 42001:2023 as an AIMS/continual-improvement benchmark and final NIST SSDF v1.1 / SP 800-218A as secure-development baselines. This does not assert certification or complete legal compliance.

## Consequences

### Positive

- one resolvable platform-version authority;
- no version mutation hidden behind an admin UI or local JSON state;
- no automatic ADR/compliance-document generation as a version side effect;
- README/runtime/API views become projections rather than authorities;
- Governance Control Plane version and product version cannot overwrite each other;
- Documentary Governance is useful but structurally bounded;
- production version GET retains intended admin authorization;
- suspended historical decisions remain traceable without remaining operative;
- structural validation covers the M10 prerequisite chain.

### Trade-offs

- historical documents still contain compatibility references that must be interpreted through this scope resolution;
- `src/platform/VersionManager` remains temporarily as a compatibility namespace until callers are migrated;
- full ESS-0012 semantic validation remains incremental beyond the integrated hygiene service;
- hosted CI and a separate Owner decision remain outstanding after code completion.

## Security and integrity impact

The change removes a production authorization bypass opportunity, removes mutable duplicate version state, removes automatic repository-document generation from a runtime version endpoint and keeps all production/IAM/billing/provider mutation authority unchanged.

No Supabase, Stripe, Render, secret, production data or external control-plane mutation is performed by this work package.

## Verification / Definition of Done

1. `AGENTS.md` remains the sole global agent trust root and contains no product-version mirror contract.
2. `package.json#version` is structurally enforced as the sole platform-version authority.
3. README projection is deterministic and drift-checked.
4. Documentation Hygiene executes through the reusable service/CLI; the legacy standalone hygiene test is absent.
5. VersionManager HTTP/UI are read-only and no legacy bump/state/document-generator behavior remains active.
6. production runtime guard does not intercept admin version GET before authorization.
7. ADR-0004 and ESS-0004 are registered/placed as suspended.
8. ADR-0014 / ESS-0012 are bounded to Documentation-only scope.
9. ADR-0094 is migrated from stale PR reservation to normal registered Accepted record.
10. structural Governance validation passes on the final candidate.
11. branch is synchronized with then-current `main` and correlated open writers immediately before final PR readiness.
12. hosted GitHub checks pass on the exact final head.
13. Human Merge and any M10 reactivation remain separate explicit Owner decisions.

## Rollback

Use a new rollback branch from then-current `main` and revert the Governance remediation PR as a reviewed unit. Do not resurrect mutable VersionManager state or an AuthZ-bypassing runtime GET shortcut merely to restore historical behavior. External production rollback is not applicable to the repository-governance decision itself.
