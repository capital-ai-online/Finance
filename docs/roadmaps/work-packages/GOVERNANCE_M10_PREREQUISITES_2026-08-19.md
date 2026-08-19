# GOVERNANCE M10 Prerequisite Remediation — 2026-08-19

**Work Package ID:** `WP-GOV-M10-PREREQ-2026-08-19`  
**Status:** IMPLEMENTATION IN PR #449 / M10 REMAINS SUSPENDED  
**Authority:** ADR-0096 / Owner chat priority 2026-08-19  
**Target PR:** `#449`  
**Source baseline:** merged PR #447 Governance Control Plane  
**Reusable parked source:** PR #439  
**Explicit non-scope:** M10 reactivation, new product features, external production mutation

## Trigger / traceability

This work package directly implements the Owner-provided M10 prerequisite gate:

| Gate | Initial state | Work-package target |
|---|---|---|
| ADR / Authority cleanup | ❌ | suspend obsolete ADR/ESS version authorities and reconcile registries |
| Documentary separation | ⚠️ | keep ADR-0014 / ESS-0012 active only as Documentation-only governance |
| README projection | ❌ | deterministic read-only projection from repository authorities |
| Documentation Hygiene | ❌ | reusable service + CLI; remove standalone hygiene test |
| Router cleanup | ❌ | legacy VersionManager becomes authenticated GET-only compatibility adapter |
| Version single authority | ❌ | `package.json#version` only; AGENTS excluded from product versioning |
| Structural validation | ⏳ | extend Governance validator with the above invariants |
| Hosted CI | ❌ | exact-head GitHub CI after final branch synchronization |
| Owner Decision | NOT ELIGIBLE | remains separate after all technical prerequisites pass |

## Required implementation sequence

1. Reuse compatible PR #439 README and hygiene logic, adapted to ADR-0096.
2. Establish `package.json#version` as sole platform-version authority.
3. Remove `AGENTS.md` from product-version mirror/mutation contracts.
4. Make README a deterministic projection.
5. Retire `uploads/version_manager.json`, runtime bump and automatic version document generation.
6. Keep `/api/admin/version` only as an authenticated read-only projection.
7. Remove production runtime GET interception that bypasses Express admin authorization.
8. Suspend ADR-0004 and ESS-0004 as historical/non-authorizing records.
9. Scope-resolve ADR-0014 / ESS-0012 to Documentation-only under ADR-0096.
10. Reconcile the merged PR #446 / ADR-0094 namespace state.
11. Extend structural Governance validation.
12. Final `main` synchronization, exact-head validation and hosted CI.

## Reuse decisions

### Reused from PR #439

- deterministic README version projection concept and implementation pattern;
- reusable `DocumentationHygieneValidator` service logic.

### Explicitly not reused unchanged

- `CLAUDE.md` root allowlisting, because PR #447 established `AGENTS.md` as the sole repository instruction surface;
- the standalone `tests/unit/documentationHygiene.test.ts`, because the Owner requested a reusable service/gate instead;
- any old product-version coupling that would make README, AGENTS or a local JSON file an authority.

## Architecture decision

```text
package.json#version
   |
   +--> Release Version Gate            [only controlled mutation]
   +--> README deterministic projection [documentation read model]
   +--> Runtime/Admin projection         [authenticated read model]

AGENTS.md Control Plane Version          [independent governance metadata]
```

The old VersionManager becomes only a compatibility namespace. Documentary Governance validates documentation but cannot define repository-wide authority or version mutation.

## Security / integrity

This work package closes an authorization-boundary defect where the production runtime guard could answer `GET /api/admin/version` before Express authorization middleware. The guard may continue to reject retired writes but authenticated GETs must pass through the normal admin route.

No database, Supabase, Stripe, Render, secret, IAM grant, billing or production provider configuration is changed.

## Definition of Done

- [x] #449 reset to current main baseline; probe files removed from working diff.
- [x] PR #439 reusable logic adapted.
- [x] platform-version Control Plane implemented read-only.
- [x] README deterministic projection implemented.
- [x] standalone hygiene unit test removed; reusable service/CLI implemented.
- [x] VersionManager runtime/router/UI mutation behavior removed.
- [x] runtime version GET AuthZ bypass removed.
- [x] ADR-0004 and ESS-0004 moved to suspended lifecycle.
- [x] ADR-0014 / ESS-0012 Documentation-only boundary encoded in ADR-0096/registries.
- [x] merged ADR-0094 reservation state reconciled.
- [ ] structural Governance validator passes on exact final branch state.
- [ ] final main synchronization confirms no unresolved correlation.
- [ ] hosted CI passes on exact final head.
- [ ] new explicit Owner decision, if M10 reactivation is later requested.

Passing all technical checks makes a future Owner decision **eligible to be considered**; it does not itself reactivate M10.
