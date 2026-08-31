# Admin Panel — Process and Dependency Graph Handoff

**Source project:** `CAPITAL-AI-GOV`  
**Implementation owners:** `CAPITAL-AI-CLIENT` + `CAPITAL-AI-OPS`  
**Status:** `REFERRED_NOT_EXECUTED`  
**GOV responsibility:** semantic model, authority boundaries and dependency meaning only

## Objective

Represent the complete CAPITAL-AI project/delivery process chain and its dependencies graphically in the Admin Panel without creating a second runtime orchestrator or client-side Governance authority.

## Semantic inputs

The visualization should consume/reference:

- `docs/projects/PROJECT_VALUE_CHAIN.md` for project ownership/routing;
- `docs/projects/PROJECT_EXECUTION_MODEL.md` for DevelopmentChain lifecycle;
- current Authority/Control/ADR/ESS references where a node displays a decision/gate;
- approved read-only operational/traceability state for live status;
- cross-project handoff state where dependencies cross ownership boundaries.

## Required visual model

At minimum, distinguish:

- project/PVC stage;
- DevelopmentChain lifecycle stage;
- Primary Owner;
- dependency edges;
- evidence/validation gates;
- Human/Owner decision gates;
- current state / blocked state / waiting-for-evidence state;
- cross-project handoff edges;
- historical/non-authorizing evidence from active control/decision authority.

## Tooling evaluation before custom build

CLIENT should evaluate maintained graph/flow tooling before custom rendering. Selection criteria:

1. React compatibility and active maintenance;
2. DAG/process-flow and dependency-edge support;
3. keyboard/accessibility support;
4. virtualization/performance for larger graphs;
5. controlled layout support (e.g. ELK/Dagre compatible where useful);
6. permissive/licence-compatible use;
7. no requirement to move Governance decision logic into the browser.

The chosen tool is an implementation detail of the CLIENT project and does not become Governance authority.

## Security and architecture invariants

- Admin Panel visualization is read-only with respect to approval/merge/deploy authority unless a separately authorized mutation control exists.
- EventMesh/Traceability state is evidence, not authorization.
- Missing/unknown protected status is displayed fail-closed; the UI must not infer approval.
- No synthetic process completion, fake evidence or demo state may be presented as real operational evidence.
- Frontend architecture remains subordinate to `docs/frontend/FRONTEND_ARCH.md`.

## Handoffs

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]` — implement accessible graph/UI and interaction.

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]` — provide/define approved read-only operational/traceability state mapping where live state is required.

## Exit gate

CLIENT and OPS return a fresh-main implementation/evidence package showing:

- selected graph tooling and evaluation;
- data/state contract;
- no duplicated approval authority;
- frontend architecture compliance;
- relevant tests/accessibility checks;
- Governance semantic review against PVC/DevelopmentChain/current controls.
