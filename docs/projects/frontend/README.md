# CAPITAL-AI Frontend

**Project ID:** `CAPITAL-AI-FE`  
**Canonical project folder:** `docs/projects/frontend/`  
**Branch project-folder slug:** `frontend`  
**Role:** cross-cutting presentation consumer, Frontend architecture and UX execution project  
**Primary Productive PVC ownership:** `[]`  
**Coverage:** presentation/interaction overlay across applicable `PVC-01..PVC-18` outputs  
**Trust root:** `/AGENTS.md`  
**Status:** ACTIVE PROJECT EXECUTION PROJECTION — NON-AUTHORIZING

## Scope

CAPITAL-AI-FE coordinates Frontend architecture migration, application composition, interaction design, accessibility, visual consistency, performance and presentation-layer quality.

It owns **no productive `PVC-*` stage** solely by rendering or presenting another project's output. Business logic, scoring, data/evidence semantics, entitlements, IAM, Governance and Release/Operations authority remain with their canonical owners.

This project folder is organizational navigation only. It does not replace `docs/frontend/FRONTEND_ARCH.md`, the canonical Frontend roadmap/inventory, feature/domain contracts or runtime source-tree boundaries.

## Canonical Frontend sources

The project surface references the existing Frontend sources instead of duplicating them:

- [Frontend Architecture](../../frontend/FRONTEND_ARCH.md) — normative Frontend structure and architecture boundary.
- [Frontend Roadmap](../../frontend/FRONTEND_ROADMAP.md) — canonical Frontend migration/UX roadmap.
- [Component Inventory](../../frontend/COMPONENT_INVENTORY.md) — current component/location inventory.
- `../../frontend/design-tokens.json` — machine-readable design/branding source where applicable.
- `../../frontend/PHASE0_ACCESSIBILITY_AUDIT.md` — accessibility baseline.
- `../../frontend/PHASE0_PERFORMANCE_BASELINE.md` — performance baseline.
- [Project Value Chain](../PROJECT_VALUE_CHAIN.md) — canonical `PVC-01..PVC-18` Primary Owners.
- [Cross-Project Handoff Contract](../CROSS_PROJECT_HANDOFF_CONTRACT.md) — repository handoff and `PVC-*` routing contract.

## Ownership boundary

Frontend owns:

- Frontend architecture and application composition within delegated Frontend scope;
- presentation-layer component migration and shared UI primitives;
- interaction design and information architecture;
- accessibility implementation/verification in the presentation layer;
- design-system/token consumption and visual consistency;
- loading/empty/error state presentation;
- Frontend performance and responsive behavior;
- presentation-layer observability and UX quality evidence.

Frontend does not own:

- scoring/ranking/model decisions;
- market/data/evidence semantics or freshness authority;
- business entitlement or billing policy;
- IAM/AuthZ/Governance authority;
- release/deployment/production authority;
- a second feature-domain architecture merely because UI consumes it.

## Cross-project execution model

Frontend consumes contracts from productive Primary Owners and renders them without redefining their semantics. When a presentation change requires a domain contract change, that change is routed to the relevant owner rather than implemented as hidden Frontend business logic.

In particular, `CAPITAL-AI-FINTECH` retains productive `PVC-12..17` business/scoring ownership; `CAPITAL-AI-DATA` retains `PVC-09..11` data/evidence ownership; Governance and Operations retain their respective control and runtime responsibilities.

## Project navigation

- `ROADMAP.md` — thin owner-side execution projection for this project folder.
- `../../frontend/FRONTEND_ARCH.md` — Frontend architecture authority.
- `../../frontend/FRONTEND_ROADMAP.md` — detailed Frontend roadmap.
- `../../frontend/COMPONENT_INVENTORY.md` — component inventory.
- `../../frontend/` — detailed UX/accessibility/performance evidence and migration notes.

## Validation / Definition of Done

The Frontend project surface remains valid when:

1. `docs/projects/frontend/` remains a non-authorizing navigation layer;
2. CAPITAL-AI-FE owns no productive `PVC-*` stage;
3. `docs/frontend/FRONTEND_ARCH.md` remains the Frontend architecture authority;
4. product/domain semantics are consumed rather than silently reimplemented in UI;
5. scoring/data/Governance/IAM/Release authority boundaries remain unchanged;
6. accessibility, performance and presentation evidence remain traceable to canonical Frontend sources;
7. merged/closed Frontend work claims are terminalized and cannot remain active parallel writers.

## Non-goals

No duplicate Frontend architecture, no second scoring/data contract, no project-folder-driven source relocation, no productive PVC allocation, no implicit `PVC-19`, no hidden entitlement/business logic in presentation code and no Frontend self-authorization for deployment or Governance decisions.
