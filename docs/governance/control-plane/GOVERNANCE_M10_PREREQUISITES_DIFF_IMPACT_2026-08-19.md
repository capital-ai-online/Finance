# Governance M10 Prerequisites — Diff & Impact Analysis

**Document ID:** `DOC-GOV-M10-PREREQ-IMPACT-2026-08-19`  
**Authority:** `ADR-0096 / WP-GOV-M10-PREREQ-2026-08-19`  
**Version:** `1.0.0`  
**Date:** `2026-08-19`  
**Lifecycle:** `reviewed`  
**Owner:** CAPITAL-AI Owner  
**Target:** PR #449  
**M10 state:** `SUSPENDED / OFF` — this document is non-reactivating evidence

## Owner-requested change set

The Owner requested one homogeneous Governance remediation package with no intervening feature or M10-reactivation PR. The package absorbs the compatible parked solutions from PR #439, removes competing version authorities and resolves contradictory current Governance/Documentary contracts.

## Semantic diff

| Area | Before | After | Impact |
|---|---|---|---|
| Platform version | package/release path plus mutable VersionManager JSON/default state | `package.json#version` only | eliminates duplicate current authority |
| AGENTS | separate Control Plane version but still referenced by Release product-version mirror code | completely outside product-version mutation/projection | prevents Governance/product version cross-coupling |
| README | manually repeated version/dependency declarations | deterministic read-only projection | drift becomes machine-detectable |
| VersionManager API | GET + runtime bump/Step-Up mutation | authenticated GET-only compatibility adapter | removes hidden runtime version mutation |
| VersionManager state | `uploads/version_manager.json` current state | retired write-protected legacy path | no local mutable authority |
| VersionManager side effects | event chain and automatic ADR/compliance/document generation | removed | versioning cannot silently mutate governance documents |
| Runtime guard | could answer admin version GET before Express authorization | denies writes only; GET flows to Express AuthZ | closes authorization-boundary bypass |
| Documentation Hygiene | repository test plus parked service implementation | reusable Documentary service + CLI gate | policy logic reusable outside test runner |
| Documentary Governance | active scope could be interpreted globally | ADR-0014/ESS-0012 explicitly Documentation-only under ADR-0096 | no second repository authority plane |
| ADR-0004 | Accepted record with obsolete `0.5.4` current-version projection | `SUSPENDED` under `docs/adr/suspended/` | history retained, version claim non-authorizing |
| ESS-0004 | active VersionManager specification | `SUSPENDED` under governance archive | legacy component authority retired |
| ADR namespace | ADR-0094 still reserved for open PR #446 | ADR-0094 registered Accepted; reservation removed | final-main correlation reflects merged #446 |
| M10 | historical evidence existed while prerequisites failed | remains SUSPENDED/OFF with explicit prerequisite chain | technical cleanup cannot reactivate M10 |

## PR #439 reuse assessment

### Adopted

- `DocumentationHygieneValidator` concept and useful read-only validation logic;
- deterministic README version-projection implementation pattern;
- drift-checking CLI pattern.

### Adapted

- root allowlist changed to `README.md` + `AGENTS.md` only;
- `suspended` added as an explicit lifecycle;
- README projection declares `package.json#version` as sole authority;
- hygiene logic lives inside Documentary Governance and consumes, rather than replaces, global Governance.

### Rejected / not carried forward

- `CLAUDE.md` as an allowed root instruction/document mirror;
- standalone repository hygiene unit test as the canonical enforcement mechanism;
- any model in which README, AGENTS or local JSON state can become current platform-version authority.

## ADR / ESS impact

### Suspended

- `ADR-0004 — Branding, Header und Panel-Entfernung`: suspended because its product-version projection is obsolete. Branding/panel history remains evidence.
- `ESS-0004 — Enterprise Version Manager`: suspended because its own-version/registry model conflicts with the Release Control Plane.

### Active but scope-resolved

- `ADR-0014 — Documentation Governance Validator`: remains active for documentation-domain validation only.
- `ESS-0012 — Documentation Governance`: remains active for Documentation-only rules and incremental validation services.
- `ESS-0007 — Release Center`: remains active; historical references to ESS-0004 resolve to the ADR-0096 package/Release authority model for current platform versioning.

No unrelated valid ADR/ESS is globally suspended merely because it cites historical VersionManager terminology.

## Security impact

**Improvement:** the production Runtime Artifact Guard no longer responds to `/api/admin/version` before Express middleware. The authenticated compatibility route now owns the read projection and uses the existing admin/supervisor authorization check.

**Improvement:** removal of runtime version bump and automatic repository-document mutation reduces privilege surface and prevents a web-runtime operation from changing version/governance artifacts.

**Unchanged protected boundaries:** Human Merge, Owner IAM, secrets, Supabase, Stripe, Render, billing and production mutation permissions are not delegated or modified.

## Data integrity impact

- one platform-version authority replaces competing mutable state;
- package-lock/direct mirrors are controlled by the Release gate;
- README is rebuilt deterministically and included in rollback backup;
- `AGENTS.md` is not altered by product-version changes;
- suspended ADR/ESS identities remain registered and traceable;
- historical Git blobs are referenced rather than rewriting history.

## Standards / architecture posture

The design applies single-source-of-truth, deterministic projection/read-model, fail-closed validation, least-privilege and explicit lifecycle/authority resolution patterns consistent with the repository's ISO/IEC 42001 and NIST SSDF crosswalk. No certification or complete regulatory-compliance claim is created.

## Main correlation already incorporated

The merged PR #446 introduced accepted ADR-0094 while the earlier Governance baseline still held a parallel-open-PR reservation. This work package registers ADR-0094 as Accepted and removes the stale reservation. A second final main synchronization is still mandatory immediately before PR #449 is declared ready.

## M10 eligibility boundary

This work package may satisfy technical prerequisites only after structural validation and hosted CI pass on the exact final head. Even then:

> **M10 remains SUSPENDED / OFF until a new explicit Human/Owner decision authorizes a separate reactivation.**

This impact analysis cannot act as that decision.
