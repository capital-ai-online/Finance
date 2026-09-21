# CAPITAL-AI Frontend

**Project ID:** `CAPITAL-AI-FE`  
**Canonical project folder:** `docs/projects/frontend/`  
**Branch project-folder slug:** `frontend`  
**Role:** cross-cutting presentation consumer, Frontend architecture and UX execution project  
**Primary Productive PVC ownership:** `[]`  
**Coverage:** presentation/interaction overlay across applicable `PVC-01..PVC-18` outputs  
**PVC relationship:** `cross_cutting` presentation adaptation across rendered `PVC-01..PVC-18` outputs; no productive PVC ownership  
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
- [Project folder mapping](../README.md) — canonical folder-to-PVC connection.

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

## PVC presentation-adaptation scope

The existing **Coverage** of applicable `PVC-01..PVC-18` outputs may be used by CAPITAL-AI-FE as presentation/review scope when a Frontend surface renders or interacts with that output. This does **not** add a Primary PVC, change `docs/projects/PROJECT_VALUE_CHAIN.md`, or create a new relationship/authority class.

For an FE-owned presentation adjustment, the work item records the affected PVC (when known), its current Primary Owner, the consumed owner-correct contract/evidence, the Frontend surface being changed, the device/accessibility behavior being adapted and the exact verification evidence. FE may then change its own layout, responsive CSS, interaction, accessibility and presentation adapter. If the required change alters data, scoring, evidence, entitlement, IAM, Governance, release or production semantics, FE hands that portion back to the current Primary Owner.

For synchronized graphical repositories, device-preview chrome is reference input rather than production viewport authority. The current landing keeps mobile/tablet behavior unchanged and applies the Finance-owned website adapter only at desktop width; later syncs must preserve that device policy unless fresh Human/Owner direction changes it.

## Cross-project execution model

Frontend consumes contracts from productive Primary Owners and renders them without redefining their semantics. When a presentation change requires a domain contract change, that change is routed to the relevant owner rather than implemented as hidden Frontend business logic.

In particular, `CAPITAL-AI-FINTECH` retains productive `PVC-09..17` ownership, including data ingestion/evidence/Data Quality and downstream business/scoring stages; `CAPITAL-AI-DATA` is superseded as an independent productive PVC owner and remains a historical/compatibility surface only; Governance and Operations retain their respective control and runtime responsibilities.

### PVC presentation adaptation contract

For any rendered `PVC-01..PVC-18` output, CAPITAL-AI-FE may implement or repair the **Frontend-owned presentation projection** when the change is limited to layout, responsive/device behavior, visual composition, accessibility, interaction and presentation quality. The underlying PVC remains owned by its listed Primary Project Owner.

For `SvenKulessa/FRONTEND`, the current sub-desktop presentation remains unchanged. Desktop website adaptation starts at `1024px` and must remain effective after every upstream sync/promotion. If a sync invalidates the adapter, FE repairs the adapter before productive promotion rather than changing the source PVC's semantics.

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
