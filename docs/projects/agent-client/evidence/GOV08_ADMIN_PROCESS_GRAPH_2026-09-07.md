# GOV-08 Admin Process Graph Evidence

**Handoff:** `GOV08-CLIENT-ADMIN-GRAPH-001`  
**Project:** `CAPITAL-AI-CLIENT`  
**Executing Project:** `CAPITAL-AI-GOV` under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION` for the bounded remediation pass  
**Primary PVC:** `PVC-01 — Agent Client`  
**Primary Owner:** `CAPITAL-AI-CLIENT`  
**Current correlation baseline:** `main@51bf529f003dfa47462c16ecbe10ae3b095547a4`  
**Branch:** `agent/agent-client-gov08-admin-graph-20260907`

## Scope and authority boundary

The slice adds a read-only Admin Portal process/dependency projection. It does not create an orchestrator, Governance registry, policy engine, approval action, merge action, deploy action or browser-side decision authority.

Canonical project/PVC ownership is consumed at build time from `docs/projects/PROJECT_VALUE_CHAIN.md` and `docs/projects/README.md`. The graph's delivery lifecycle now uses the explicit `DC-00` through `DC-11` DevelopmentChain projection from `docs/projects/operations/DEVELOPMENT_CHAIN.md`; the repository Trust Root remains the higher lifecycle/authority boundary. The UI does not maintain a second ownership mapping.

`PVC-18 — EventMesh / Traceability` remains owned by `CAPITAL-AI-OPS`. No OPS runtime/state contract is implemented in this CLIENT slice. Until an approved read-only operational-state projection is available, protected operational state is rendered as `Unknown — fail closed` and completion/evidence is not synthesized.

## Tooling evaluation

| Option | Fit | Accessibility | Layout/performance | License / change cost | Decision |
|---|---|---|---|---|---|
| Existing React/Tailwind semantic rendering | High for bounded read-only chain | Native headings, articles, status text, keyboard-scrollable regions and textual edge alternative | Deterministic ordered chains; sufficient for current bounded PVC/lifecycle size | No new package or lockfile change | **Selected** |
| React Flow (`@xyflow/react`) | Very high for interactive node/edge canvases | Built-in keyboard and screen-reader support, focusable nodes/edges and ARIA configuration | Supports viewport-only rendering; documented Dagre/ELK integrations | MIT; adds package/CSS/runtime surface | Evaluated, not required for this bounded slice |
| Dagre | Good directed-graph layout helper | Renderer-dependent | Fast/simple directed tree layout | Additional dependency | Defer unless graph topology requires automatic layout |
| ELK / elkjs | Strong for complex constrained graphs | Renderer-dependent | Highly configurable layouts and edge routing | Additional dependency and higher integration complexity | Defer until graph complexity justifies it |
| Raw D3 | Existing repository dependency, flexible | Accessibility must be built manually | Suitable for custom layouts but increases renderer code | Already present, but custom rendering cost is higher | Not used in initial slice |

No package installation, lockfile mutation or protected external execution-host mutation was performed.

## Implemented semantic contract

- PVC nodes carry project/PVC stage, Primary Owner and canonical project-folder projection.
- DevelopmentChain nodes are derived from the canonical `DC-00` through `DC-11` lifecycle projection.
- Edge semantics are explicit: `handoff`, `dependency`, `validation/evidence`.
- Evidence and Human/Owner authority are separate nodes.
- The view-model carries `decisionAuthority: false` as an invariant.
- Evidence is explicitly non-authorizing; the Human/Owner gate is represented but exposes no approval control.
- Missing operational state remains `unknown`; historical/non-authorizing is a distinct supported presentation state.

## Frontend architecture evidence

The retained implementation lives only under `src/features/governance/ui/process-graph/`. The existing `src/components/AdminPortal.tsx` composes that feature as the strangler integration point. The competing `src/features/governance/ui/processGraph/` renderer/projection and its extra feature-level `AdminPortal` wrapper were removed in the bounded remediation pass.

The graph is read-only and does not import or mutate platform Governance decision services. Existing Admin Portal mutation-capable views remain unchanged.

## Accessibility evidence

- Semantic `header`, `section`, `article`, headings and list structures are used.
- State is expressed by text plus icon; color is not the sole state signal.
- The unavailable operational-state condition is exposed with `role="status"`.
- Horizontally scrollable chains are keyboard focusable and labeled.
- Every graphical edge also appears in an accessible textual relationship list.
- Node cards include concise ARIA labels covering label, state and authority classification.

## Tests and validation status

`processGraphModel.test.ts` covers canonical PVC parsing, project-folder mapping, DevelopmentChain parsing, unknown/fail-closed behavior, `decisionAuthority: false`, and evidence-vs-Human-authority separation. The duplicate path-coupled `tests/unit/gov08ProcessGraphProjection.test.ts` was removed together with the duplicate implementation it tested.

Hosted GitHub validation is independent evidence. No local execution host was available in this chat, therefore local `vitest`, lint, architecture check, build and browser/axe execution remain **NOT RUN** here; `NOT RUN` is not a PASS.

## Correlation result

The branch was synchronized with `main@51bf529f003dfa47462c16ecbe10ae3b095547a4` after PR #809 merged. The previous evidence claim that the duplicate graph namespace had already been removed was false for the then-current PR head: `src/features/governance/ui/processGraph/CapitalAiProcessGraph.tsx` and `capitalAiProcessGraphProjection.ts` were still present. This remediation pass actually removed those files, the duplicate feature-level AdminPortal wrapper, and its duplicate unit test. One canonical graph implementation remains under `process-graph/`.
