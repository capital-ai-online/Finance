# CLIENT Landing-First Correlation — 2026-09-21

**Project:** `CAPITAL-AI-CLIENT`  
**Project folder:** `docs/projects/agent-client/`  
**Primary Owner / PVC:** `CAPITAL-AI-CLIENT / PVC-01`  
**Authority:** `/AGENTS.md@CURRENT_MAIN` Control Plane v4.8.0  
**CURRENT_MAIN:** `bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`  
**Correlation result:** `DEPENDENCY_HELD / LF-01_NOT_EVIDENCED / NO_PHYSICAL_RUNTIME_TRIGGER`

## Owner direction correlated

The 2026-09-21 Human/Owner interaction supplied the non-authorizing `CAPITAL-AI-LANDING-FIRST-INTEGRATION-01..03` projection. Execution semantics resolve back to `/AGENTS.md@CURRENT_MAIN`.

For CLIENT, the direction is bounded to preserving client/request boundaries and introducing a canonical CLIENT capability only when a later landing phase actually requires it. No scoring, billing, entitlement, data/provider, FE presentation, OPS runtime, Security assurance, Compliance or QM authority is transferred to PVC-01.

## Current-main observations

- GitHub default branch is `main`; exact correlation SHA is `bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`.
- `docs/projects/PROJECT_VALUE_CHAIN.md` resolves `PVC-01` to `CAPITAL-AI-CLIENT`.
- Current CLIENT Roadmap and Runtime Mapping retain `NO_PHYSICAL_RUNTIME_TRIGGER`.
- Repository search on current main returned no `LF-01_STATIC_VISUAL_LANDING_PASS`.
- Repository search on current main returned no `STATIC_VISUAL_BASELINE`.
- No open Pull Request is a CLIENT-owned writer.

## Open writer correlation

| PR | Owner | Exact observed head | CLIENT relationship |
|---|---|---|---|
| #1195 | `CAPITAL-AI-FE` | `9901590b3544d08df55f3771bdb35c60d5fb7d53` | foreign landing presentation writer / dependency |
| #1199 | `CAPITAL-AI-GOV` | `11bf02ce17fe912cd28f6c1b3a2252c5ee2e10ee` | governance writer; no changed-file overlap with CLIENT docs |
| #1200 | `CAPITAL-AI-OPS` | `c2ad8b4ef56c26e267724dcf4248c649f599c480` | routing/lifecycle correlation dependency; no changed-file overlap with CLIENT docs |

The existing historical CLIENT claim `CAPITAL-AI-CLIENT-CONTRACT-BASELINE-R2-2026-09-01` is `released` and is not an active writer.

## PR #1195 semantic correlation

Observed PR #1195 changed files include `LandingPricingPanel.tsx`, `PublicAnalysisWorkbench.tsx`, `AppRoutes.tsx`, `Checkout.tsx` and `LandingPage.tsx`.

Its current diff contains, among other things:

- `userSession` projection into the public analysis workbench;
- subscription-tier projection and paid/unpaid scorer selection behavior;
- `fetch('/api/entitlements/plans'...)` through the landing pricing panel;
- checkout success/cancel return routing;
- the existing realtime news surface on root.

Those are broader productive integration couplings than a strict LF-01 static visual baseline. They remain FE/other-owner re-scope and handover evidence. They do not create a CLIENT runtime trigger and do not authorize a duplicate PVC-01 writer.

## CLIENT decision

`CLIENT-LF-01` is created as a dependency-held contract/evidence work package.

Before independent LF-01 PASS evidence, CLIENT may:
- maintain request/client boundary contracts;
- maintain correlation/evidence;
- receive owner-correct handoffs.

Before independent LF-01 PASS evidence, CLIENT must not:
- create a new landing runtime adapter;
- initialize providers for root render;
- create browser-local business, entitlement, billing, scoring or ranking authority;
- duplicate FE session/profile presentation;
- absorb OPS lifecycle/runtime correlation;
- treat placeholder or visual completion as productive evidence.

## Continuation condition

CLIENT implementation becomes eligible only after:

1. `LF-01_STATIC_VISUAL_LANDING_PASS` is independently evidenced on then-current main;
2. the dependency-ready later landing phase actually requires a canonical PVC-01 capability;
3. `CLIENT-RUNTIME-01` records a concrete current-main physical trigger;
4. changed-file, semantic, authority, Security/Compliance and open-writer correlation passes on the exact branch head.

Until then the truthful state is `DEPENDENCY_HELD / NO_PHYSICAL_RUNTIME_TRIGGER`.
