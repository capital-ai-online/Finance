# GOV-08 Admin Process Graph Evidence

**Handoff:** `GOV08-CLIENT-ADMIN-GRAPH-001`  
**Project:** `CAPITAL-AI-CLIENT`  
**Primary PVC:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Implementation baseline:** `main@eee9a8af3f3d2532a213154dd61f678454a2200b`  
**Branch:** `agent/agent-client-gov08-admin-graph-20260907`

## Scope and authority boundary

The slice adds a read-only Admin Portal process/dependency projection. It does not create an orchestrator, Governance registry, policy engine, approval action, merge action, deploy action or browser-side decision authority.

Canonical project/PVC ownership is consumed at build time from `docs/projects/PROJECT_VALUE_CHAIN.md` and `docs/projects/README.md`. The DevelopmentChain lifecycle is consumed from `/AGENTS.md`. The UI does not maintain a second copy of these mappings.

`PVC-18 — EventMesh / Traceability` remains owned by `CAPITAL-AI-OPS`. No OPS runtime/state contract is implemented in this CLIENT slice. Until an approved read-only operational-state projection is available, protected operational state is rendered as `Unknown — fail closed` and completion/evidence is not synthesized.

## Tooling evaluation

| Option | Fit | Accessibility | Layout/performance | License / change cost | Decision |
|---|---|---|---|---|---|
| Existing React/Tailwind semantic rendering | High for bounded read-only chain | Native headings, articles, status text, keyboard-scrollable regions and textual edge alternative | Deterministic ordered chains; sufficient for current bounded PVC/lifecycle size | No new package or lockfile change | **Selected** |
| React Flow (`@xyflow/react`) | Very high for interactive node/edge canvases | Built-in keyboard and screen-reader support, focusable nodes/edges and ARIA configuration | Supports viewport-only rendering; documented Dagre/ELK integrations | MIT; adds package/CSS/runtime surface | Evaluated, not required for this bounded slice |
| Dagre | Good directed-graph layout helper | Renderer-dependent | Fast/simple directed tree layout | Additional dependency | Defer unless graph topology requires automatic layout |
| ELK / elkjs | Strong for complex constrained graphs | Renderer-dependent | Highly configurable layouts and edge routing | Additional dependency and higher integration complexity | Defer until graph complexity justifies it |
| Raw D3 | Existing repository dependency, flexible | Accessibility must be built manually | Suitable for custom layouts but increases renderer code | Already present, but custom rendering cost is higher | Not used in initial slice |

No package installation, lockfile mutation or external execution-host mutation was performed.

## Implemented semantic contract

- PVC nodes carry project/PVC stage, Primary Owner and canonical project-folder projection.
- DevelopmentChain nodes are derived from the current Trust Root lifecycle text.
- Edge semantics are explicit: `handoff`, `dependency`, `validation/evidence`.
- Evidence and Human/Owner authority are separate nodes.
- The view-model carries `decisionAuthority: false` as an invariant.
- Evidence is explicitly non-authorizing; the Human/Owner gate is represented but exposes no approval control.
- Missing operational state remains `unknown`; historical/non-authorizing is a distinct supported presentation state.

## Frontend architecture evidence

New implementation lives under `src/features/governance/ui/process-graph/`. The existing legacy `src/components/AdminPortal.tsx` only composes the new feature view as a strangler integration point. No new domain implementation was added under `src/components/`.

The graph is read-only and does not import or mutate platform Governance decision services. Existing Admin Portal mutation-capable views remain unchanged.

## Accessibility evidence

- Semantic `header`, `section`, `article`, headings and list structures are used.
- State is expressed by text plus icon; color is not the sole state signal.
- The unavailable operational-state condition is exposed with `role="status"`.
- Horizontally scrollable chains are keyboard focusable and labeled.
- Every graphical edge also appears in an accessible textual relationship list.
- Node cards include concise ARIA labels covering label, state and authority classification.

## Tests and validation status

Added `processGraphModel.test.ts` covering canonical PVC parsing, project-folder mapping, DevelopmentChain parsing, unknown/fail-closed behavior, `decisionAuthority: false`, and evidence-vs-Human-authority separation.

Automated `vitest`, `npm run lint`, `npm run frontend:architecture:check`, build and browser/axe validation are **NOT RUN** in this chat because no authorized local repository execution surface is available. `NOT RUN` is not a PASS.

## Correlation note

A concurrent same-branch commit introduced `src/features/governance/ui/processGraph/processGraphModel.ts` with overlapping GOV-08 semantics. It was unreferenced and created a duplicate namespace/model. Its useful `decisionAuthority: false` invariant was incorporated into the canonical `process-graph/` model and the duplicate file was removed, preserving one graph semantic surface.
