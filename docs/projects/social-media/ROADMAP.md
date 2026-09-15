# CAPITAL-AI-SOCIAL — Canonical Roadmap

**Project:** `CAPITAL-AI-SOCIAL`  
**Folder:** `docs/projects/social-media/`  
**Role:** cross-cutting Social Media distribution planning and channel coordination  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 work packages normalized and Social domain roadmap correlated to current main  
**Baseline:** `main@963628af2804d47b1e9a55072a3d6dc5ef98f239`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Archive/superseded copies remain historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only. PR #902 closed with zero effective diff and contributes no executable Social Media work package.

Detailed Social execution remains canonical in `docs/social-media/CAPITAL-AI-SOCIAL/ROADMAP.md`; this owner-side projection must stay consistent with that domain roadmap and current repository evidence.

## PR #900 / #901 normalized work packages

Timeline semantics: `NOW` = executable on current evidence, `NEXT` = after the named gate, `FOLLOW-ON` = downstream package, `CONDITIONAL` = explicit provider/owner authorization required, `CONTINUOUS` = maintained obligation, `DONE` = terminal ledger.

### SOCIAL-CARRY-01 — Existing non-terminal Social backlog
**Goal:** Preserve all non-terminal channel, content, TTS, media, analytics, integration and evidence work.  
**Scope:** Social Media distribution planning/coordination; no productive PVC or implicit publication authority.  
**Owner/PVC:** `CAPITAL-AI-SOCIAL / N/A — cross-cutting Social Media`.  
**Dependencies:** OPS protected runtime/provider actions, SEC/COMP assurance, SEO content/measurement, QM evidence and FE public surfaces.  
**Timeline:** `CONTINUOUS`.  
**Gate:** child packages retain explicit provider/action and owner boundaries.  
**Exit criterion:** no non-terminal Social work is lost and no provider/publication authority is inferred from roadmap state.  
**State:** `ACTIVE CARRY-FORWARD`.

### SOCIAL-PR900-01 — Version-1 direction
**Goal:** Preserve Version 1 as the currently chosen product direction without resurrecting discarded direct-upload automation scope.  
**Scope:** roadmap/product direction only; not proof that all Version-1 runtime work is complete.  
**Owner/PVC:** `CAPITAL-AI-SOCIAL / N/A`.  
**Dependencies:** the existing Human/Owner direction; a new Owner decision is required to broaden scope.  
**Timeline:** `CONTINUOUS CURRENT DIRECTION`.  
**Gate:** any proposal to reintroduce discarded automation requires a new explicit Owner decision.  
**Exit criterion:** Version 1 remains the execution direction and broader discarded automation is not implicitly revived.  
**State:** `CURRENT DIRECTION / NO NEW IMPLEMENTATION AUTHORITY`.

### SOCIAL-PR900-02 — TTS/media runtime completion
**Goal:** Complete production-safe content export/media generation/runtime evidence on top of the merged provider-neutral TTS contract.  
**Scope:** Social-owned content/TTS/media coordination and owner-correct runtime evidence; foreign runtime/provider work remains routed.  
**Owner/PVC:** `CAPITAL-AI-SOCIAL / N/A`.  
**Dependencies:** merged `SOCIAL-P1` request/result code and tests; authorized OPS model/provider runtime evidence; FE render surfaces and SEC/COMP assurance where applicable.  
**Timeline:** `NEXT` after a valid owner-routed `SOCIAL-P1` acoustic/runtime result.  
**Gate:** a real `TtsSynthesisResult` with immutable audio hash, exact artifact/license evidence and attributable runtime evidence exists before Social consumes audio in the deterministic renderer.  
**Exit criterion:** content export/media generation has attributable production-safe evidence through the correct owners, preserves `publishReady=false` before approval, and performs no implicit provider action.  
**State:** `DEPENDENCY-BOUND / RUNTIME EVIDENCE OPEN`.

### SOCIAL-PR900-03 — Provider action boundary
**Goal:** Keep every direct social-provider upload/post/permission/credential action explicitly authorized and least-privileged.  
**Scope:** external social-provider actions only; preparation/export does not imply publication.  
**Owner/PVC:** `CAPITAL-AI-SOCIAL / N/A` for channel coordination; OPS/protected-action authority remains separate.  
**Dependencies:** explicit integration, provider identity/permission evidence and protected-mutation authorization.  
**Timeline:** `CONDITIONAL`.  
**Gate:** the exact provider action, account, permission and authorization are explicit before execution.  
**Exit criterion:** provider actions are attributable, least-privileged and separately authorized; no action is inferred from roadmap status.  
**State:** `PROTECTED-ACTION GATED`.

### SOCIAL-PR900-04 — Analytics feedback
**Goal:** Build an evidence-backed analytics feedback loop without bypassing privacy/security boundaries.  
**Scope:** Social analytics evidence and feedback into content/channel decisions; no synthetic analytics state.  
**Owner/PVC:** `CAPITAL-AI-SOCIAL / N/A`.  
**Dependencies:** SEO measurement context, SEC assurance, COMP/privacy and real analytics evidence sources.  
**Timeline:** `NOW` for Social-owned publication/evidence correlation; analytics ingestion remains evidence-dependent on a valid real source.  
**Gate:** publication identity/content/package/approval correlation is complete; for analytics, the real data source, metric definition, measurement window, purpose and privacy/compliance boundary are resolved.  
**Exit criterion:** publication/feedback evidence is reproducible and analytics uses real evidence while respecting SEC/COMP/privacy/data-minimization constraints.  
**State:** `ACTIVE / ANALYTICS SOURCE DEPENDENCY REMAINS`.

## Current-main execution status

| Queue item | Current-main status | Timeline | Evidence / dependency |
|---|---|---|---|
| `SOCIAL-P0` Canonical content-package completion | `MAIN_IMPLEMENTED — EXIT GATE SATISFIED` | `DONE` | deterministic package mapping, `/generate` integration, provenance/disclosure fail-closed tests and approval metadata/hash binding are present on current `main` |
| `SOCIAL-P1` TTS / multilingual voice contract and benchmark | `PARTIAL — CONTRACT/CODE/TESTS/ADAPTER DECISION COMPLETE; ACOUSTIC RUNTIME NOT RUN` | `NEXT` dependency lane | `server/socialMedia/voiceContract.ts`, `tests/unit/socialVoiceContract.test.ts`, TTS contract, sample manifest and benchmark are merged; real audio/listening/latency/output hashes are absent and protected-runtime owner-routed |
| `SOCIAL-P2` Short-video + voice-over integration | `BLOCKED` | `NEXT` after P1 runtime evidence | requires validated real `SOCIAL-P1` runtime result |
| `SOCIAL-P3` Publication/analytics evidence completion | `PARTIAL / UNBLOCKED` | `NOW` | publication logging exists; canonical content/package/approval/provider-post and analytics source/window correlation remains incomplete |

## Carried-forward baseline (pre-2026-09-13)

Detailed Social execution remains canonical in `docs/social-media/CAPITAL-AI-SOCIAL/**`. This project file does not create `PVC-19` or publication/platform authority.

| Control | Target |
|---|---|
| SOCIAL-PROJ-01 | Canonical project navigation |
| SOCIAL-PROJ-02 | No productive PVC ownership |
| SOCIAL-PROJ-03 | No duplicate Social truth |
| SOCIAL-PROJ-04 | Publication/platform authority remains separated |
| SOCIAL-PROJ-05 | Foreign work remains owner-routed |

## Dependencies

- `CAPITAL-AI-OPS`: protected model/provider runtime provisioning and provider actions;
- `CAPITAL-AI-SEC` / `CAPITAL-AI-COMP`: independent assurance and applicable disclosure/privacy boundaries;
- `CAPITAL-AI-SEO`: content/measurement context;
- `CAPITAL-AI-QM`: independent evidence/quality assessment where applicable;
- `CAPITAL-AI-FE`: public/product render surfaces;
- `CAPITAL-AI-DOC / PVC-03`: canonical document/PDF implementation and upstream source/provenance where applicable.

## Project exit gate

One active SOCIAL roadmap; canonical content-package mapping is evidence-backed; TTS/media runtime integration consumes only validated owner-routed runtime evidence; provider actions remain explicit, least-privileged and separately authorized; publication/analytics evidence is reproducible and non-fabricated.
