# ADR-0096 — Governance Control Plane, Stable Authority and Supersession

**Authority ID:** `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Version:** `1.2.0`  
**Status:** PROPOSED — Owner-directed implementation; effective after Human Merge  
**Date:** `2026-08-20`  
**Decision Owner:** CAPITAL-AI Owner  
**Scope:** repository governance authority, agent trust root, stable identities, ADR/ESS lifecycle, Documentation-only governance boundaries, document roles/projections, ADR namespace reservations, parallel-writer correlation, platform-version authority and M10 prerequisite remediation

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

The 2026-08-20 correlation revalidation additionally found:

- `FRONTEND_ARCH.md`, `COMPONENT_INVENTORY.md` and `FRONTEND_ROADMAP.md` already converged semantically after PR #459, but their distinct authority/projection/inventory/roadmap roles were not yet machine-readable in the Document Registry;
- historical Frontend ADR-0005 still carried an `ACCEPTED` label although Module Federation, iframe/PostMessage, URL-token propagation, shared-auth LocalStorage and the proposed `aif-` namespace are not the current code architecture;
- Verified Asset Display from PR #458 is a read-only Presentation/Research projection whose parent authorities remain ADR-0032, ADR-0034, ADR-0041/ESS-0016, SC-MD-SPT-0001 and ADR-0087;
- a previously merged work package (PR #460) left its exclusive Work Claim on `main` in `active` state even though its own release condition was already satisfied;
- the existing ADR registry contained `parallelNamespaceReservations` but did not yet define enough deterministic reservation metadata/lifecycle to prevent future parallel display-ID collisions without live GitHub access.

The Owner directed that these defects be resolved inside the existing Governance Control Plane, without creating a second Frontend, Documentary, registry, lock or governance architecture.

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
- `docs/adr/registry.json` for ADR identity/version/date/lifecycle/supersession and namespace reservation state;
- `.ai/registry/ess-registry.json` for ESS allocation/lifecycle;
- `docs/governance/document-registry.json` for documentary identity, role, scope and projection metadata.

No parallel registry is introduced. Document inventory and evidence do not outrank an effective authority/control.

### 4. ADR lifecycle, recency and suspension

Formal ADRs live under `docs/adr/` and lifecycle subdirectories. New or materially migrated ADRs have stable `authorityId`, unique active display ID, semantic version, date and lifecycle.

For the same `authorityId`, newer effective semantic version/date can supersede an older version. Across different authorities, recency alone is non-authorizing; explicit scope/supersession and Owner-visible impact analysis are required.

`suspended` and `historical` are non-authorizing lifecycles. Such ADR/ESS artifacts remain traceable but cannot authorize implementation, version mutation, merge, production behavior or M10 reactivation.

### 5. Namespace state

- ADR-0085 remains ESS Namespace Cleanup.
- ADR-0086 remains Vendor Privacy Evidence Governance.
- ADR-0094 is a normal Accepted record because PR #446 merged into `main`; its former open-PR reservation is removed.
- ADR-0095 remains Privacy Governance Single Source of Truth.
- this decision remains ADR-0096.
- ADR-0097 is allocated to Documentary Maintenance Control Loop after PR #460; a future writer may not reuse the display ID merely because another historical branch once attempted to reserve it.
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

- duplicate stable Authority/Control/active ADR identities;
- duplicate active ADR reservations;
- active ADR plus active reservation of the same display ID;
- malformed or explicitly stale ADR reservations;
- missing Authority targets;
- unknown projection parents and non-authorizing parents used by active projections;
- competing exclusive normative scopes;
- invalid Frontend document roles and Financial Runtime scope leakage into Frontend Architecture/Roadmap;
- ADR-0005 lifecycle/role inconsistency;
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

The deterministic rule core lives in `scripts/governance/controlPlaneRegistryRules.mjs` and is invoked by the canonical validator. It is a pure testable rule library, not a second validator/authority.

`validateFrontendArchitecture.ts` remains responsible only for source-tree, dependency direction, feature/shared boundaries, legacy compatibility and parallel Frontend roots. Governance role/authority semantics are not duplicated into it.

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

### 13. Document roles and Projection, not Redefinition

The existing Document Registry may declare:

- `documentRole`: `authority`, `projection`, `inventory`, `roadmap`, `evidence` or `specification`;
- `normative`: boolean;
- `normativeScope`: explicit bounded scopes;
- `authorityRefs`: referenced Authority IDs;
- `projectionOf`: parent Authority IDs.

Declared projections, inventories and roadmaps are non-authorizing. They may summarize or project results but must not copy another domain's normative rule chain in a way that creates an implicit second authority.

For the Frontend family:

- `FRONTEND_ARCH.md` is the normative authority only for `frontend-source-tree`, `frontend-dependencies` and `presentation-architecture`;
- `COMPONENT_INVENTORY.md` is a non-normative inventory projected from the Frontend Architecture;
- `FRONTEND_ROADMAP.md` is a non-normative roadmap that references the Frontend Architecture;
- Financial Runtime, Market Data, Scoring, Ranking, Financial Eligibility, Runtime Evidence and IAM remain outside Frontend authority.

Verified Asset Display remains a read-only Presentation/Research projection. Its financial parent authorities are referenced, not copied into `FRONTEND_ARCH.md`.

### 14. Parallel writers, Work Claims and ADR reservations

Existing `.ai/work-claims` remain the single coordination mechanism for path writers. No second lock architecture is introduced.

The existing live preflight `scripts/pr/validateWorkClaim.mjs` correlates current/open PR writers and now also reports stale active/exclusive claims on `main`. Such live GitHub correlation is advisory evidence and may not become deterministic CI authority.

ADR display-ID allocation uses the already existing `docs/adr/registry.json#parallelNamespaceReservations`. Before creating a new ADR, a reservation contains at least:

- `displayId`,
- `branch`,
- `source` (PR/work item),
- `path`,
- `observedHead`,
- `state`,
- `reservedAt`.

A second active reservation for the same display ID is denied. An active ADR plus active reservation for the same display ID is denied. A reservation marked stale is denied until released/refreshed. Merge, close, supersession or abandonment transitions the reservation away from active.

The deterministic CI validator evaluates repository reservation state only. The live preflight may compare reservation branches/PRs and `observedHead` against GitHub, but that external observation is not required by the deterministic merge-gating rule.

### 15. ADR-0005 disposition

Code revalidation found no current implementation authority for the historical Module Federation, iframe/PostMessage, URL-token propagation, shared-auth LocalStorage or proposed `aif-` namespace mechanisms described by ADR-0005. Current Frontend, IAM, CSP/CORS, AuthN/AuthZ and token-handling authorities supersede those historical assumptions by scope.

ADR-0005 is therefore classified **HISTORICAL — NON-AUTHORIZING**. Its old `ACCEPTED` label may not reactivate URL-token, iframe, cross-origin messaging or shared-auth storage behavior.

## Consequences

### Positive

- one resolvable platform-version authority;
- no version mutation hidden behind an admin UI or local JSON state;
- no automatic ADR/compliance-document generation as a version side effect;
- README/runtime/API views become projections rather than authorities;
- Governance Control Plane version and product version cannot overwrite each other;
- Documentary Governance is useful but structurally bounded;
- production version GET retains intended admin authorization;
- suspended/historical decisions remain traceable without remaining operative;
- Frontend Architecture, Inventory and Roadmap are machine-resolvable by role and scope;
- Financial Runtime authorities remain outside the Presentation authority;
- ADR namespace collisions are prevented without making deterministic CI dependent on live GitHub;
- stale Work Claims can be surfaced by the existing live preflight;
- structural validation covers the M10 prerequisite chain.

### Trade-offs

- historical documents still contain compatibility references that must be interpreted through this scope resolution;
- `src/platform/VersionManager` remains temporarily as a compatibility namespace until callers are migrated;
- older Document Registry entries are not mass-rewritten merely to attach new role metadata; role fields are applied where authority resolution requires them and can be backfilled incrementally;
- live PR/work-claim correlation remains advisory by design; deterministic CI evaluates repository state rather than remote availability;
- hosted CI and a separate Owner decision remain outstanding after code completion.

## Security and integrity impact

The change removes a production authorization bypass opportunity, removes mutable duplicate version state, removes automatic repository-document generation from a runtime version endpoint, explicitly prevents historical ADR-0005 token/iframe semantics from regaining authority, and keeps all production/IAM/billing/provider mutation authority unchanged.

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
10. ADR-0005 is registered historical/non-authorizing consistently across ADR, Authority and Document registries.
11. Frontend Architecture/Inventory/Roadmap roles and scopes are registered and validated.
12. duplicate/stale ADR reservations and non-authorizing projection parents fail closed.
13. stale active/exclusive Work Claims are correlated in the existing live PR preflight.
14. structural Governance validation passes on the final candidate.
15. branch is synchronized with then-current `main` and correlated open writers immediately before final PR readiness.
16. hosted GitHub checks pass on the exact final head.
17. Human Merge and any M10 reactivation remain separate explicit Owner decisions.

## Rollback

Use a new rollback branch from then-current `main` and revert the Governance remediation PR as a reviewed unit. Do not resurrect mutable VersionManager state, historical ADR-0005 token/iframe semantics or an AuthZ-bypassing runtime GET shortcut merely to restore historical behavior. External production rollback is not applicable to the repository-governance decision itself.
