# CAPITAL-AI-GOV — Component and Architecture Matrix

**Role:** current project assessment — non-authorizing  
**Baseline:** `main@64a3415781a50177798cbe9404b1855735e5371a`

| Component / contract | Canonical anchor | GOV relationship | Architecture assessment | Action |
|---|---|---|---|---|
| Agent Trust Root | `/AGENTS.md` | consume / maintain within authority | single repository-wide trust root | KEEP SINGLE |
| Governance Control Plane | ADR-0096 + `docs/governance/**` + `src/platform/Governance` | cross-cutting owner | current controlling Governance architecture | KEEP / NO PARALLEL PLANE |
| Control Catalog | `docs/governance/control-catalog.json` | owner / validator input | stable `CTRL-*` identities | VERSION EXISTING CONTROLS ONLY |
| Authority Registry | `docs/governance/authority-registry.json` | owner / resolution | stable `AUTH-*` identities | KEEP SINGLE |
| ADR Registry | `docs/adr/registry.json` | governance registry | active reservations currently released | KEEP SINGLE |
| ESS Registry | `.ai/registry/ess-registry.json` | consume / correlate | component/domain specs; no PVC conflict | KEEP SINGLE |
| Project execution model | `docs/projects/**` | project architecture owner | missing on current main before this candidate | ADD NON-AUTHORIZING PROJECTION |
| Project Value Chain | `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational owner mapping | qualified `PVC-*` removes project/financial namespace collision | ADD |
| DevelopmentChain | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` + `docs/architecture/ROADMAP.md` | governance controls; OPS execution target | authority exists; project placement still incomplete | HANDOFF TO OPS |
| Platform Director | `PVC-05` + existing Platform Director component/ESS | primary project owner | decision orchestration must remain separate from approval authority | BOUNDARY DOCUMENTED |
| Financial technical chain | `SC-MD-SPT-0001` | governance correlation only | current technical `VC-*` collides semantically with project shorthand | P3 COORDINATED FVC ASSESSMENT |
| Quality projection | `src/platform/Quality/**` / ESS-0005 | cross-cutting dependency | no Primary PVC ownership | QM COORDINATION |
| Documentary | `src/platform/Documentary/**` / ESS-0010/0012 | foreign primary/project dependency | project navigation not yet canonical under `docs/projects/` | HANDOFF TO DOC |
| EventMesh / Traceability | existing EventMesh/Traceability authorities | foreign OPS execution | must not become approval authority | HANDOFF / KEEP BOUNDARY |
| PR template / PR transport | `.github/pull_request_template.md`, PR #628/#629 | GOV | compact template + direct connector path now merged | DONE_MAIN |
| Work claims | `.ai/work-claims/**` | coordination metadata | merged active claim can become stale unless terminalized | CLEAN LIFECYCLE IN CANDIDATE |
| Admin Panel process graph | frontend/Admin Panel consumers + future project projection | GOV defines semantics only | UI implementation is foreign CLIENT/OPS work | HANDOFF |

## Overall assessment

The highest-value consolidation is documentary/organizational rather than runtime restructuring. Existing productive architecture and stable authorities should be reused. The project model closes ownership/navigation ambiguity without relocating runtime code or creating a second Governance, Scoring, Data, Release or EventMesh plane.
