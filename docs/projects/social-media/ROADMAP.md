# CAPITAL-AI-SOCIAL — Canonical Roadmap

**Project:** `CAPITAL-AI-SOCIAL`  
**Folder:** `docs/projects/social-media/`  
**Role:** cross-cutting Social Media distribution planning and channel coordination  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-16 — Social chat backlog and detailed domain queue re-correlated into the ordered automated Roadmap lane after terminal close-without-merge of PR #969, including merged SOCIAL-P3 contract evidence  
**Baseline:** `main@b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Archive/superseded copies remain historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only. PR #902 closed with zero effective diff and contributes no executable Social Media work package.

Detailed Social execution remains canonical in `docs/social-media/CAPITAL-AI-SOCIAL/ROADMAP.md`; this owner-side projection must stay consistent with that domain roadmap and current repository evidence. `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` remains derived navigation only and MUST NOT receive a duplicate Social execution backlog.

PR #969 was closed without merge. Its Security payload is therefore not assumed by this Social lane; the queue was recomputed from current `main` as required by the ordered automated Roadmap contract.

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
**Dependencies:** merged Social-owned Publication/Analytics Evidence contract via PR #930; real provider publication evidence; real analytics evidence source; DATA/PVC-10 durable evidence ownership where persistence is required; OPS protected runtime/provider execution; SEC/COMP/privacy boundaries.  
**Timeline:** `DEPENDENCY-HANDOFF` after the Social-owned contract/validator/test slice reached `DONE_MAIN`.  
**Gate:** real provider publication identity/content/package/approval correlation exists; the real analytics source, metric definition, measurement window, purpose and privacy/compliance boundary are resolved; durable persistence is owner-routed rather than recreated under Social.  
**Exit criterion:** publication/feedback evidence is reproducible and analytics uses real evidence while respecting SEC/COMP/privacy/data-minimization constraints.  
**State:** `PARTIAL — SOCIAL CONTRACT SLICE DONE_MAIN; REAL PROVIDER/ANALYTICS/PERSISTENCE EVIDENCE OPEN`.

### SOCIAL-AUTO-01 — Ordered Master-Roadmap automation enrollment
**Goal:** Make the still-valid Social-chat backlog deterministically consumable by the repository-wide ordered automated Roadmap lane without introducing a second master backlog or transferring project authority.  
**Scope:** execution classification and owner-correct routing of `SOC-CHAT-01..09` / `SOCIAL-P0..P3` from the canonical Social project/domain roadmaps. The derived portfolio index remains navigation-only.  
**Owner/PVC:** `CAPITAL-AI-SOCIAL / N/A — cross-cutting Social Media`; foreign-owner work retains its canonical project/PVC owner.  
**Automation contract:** `/AGENTS.md` ordered automated Roadmap PR lane applies. At most one not-yet-integrated automated PR is active in the lane; every successor starts from then-current `main` after the predecessor reaches a terminal outcome and repeats full Project/PVC/Owner/Roadmap/ADR/ESS/correlation checks.  
**Gate:** automation may select only non-terminal work whose current owner, dependencies and protected-action boundaries are resolved. `DONE`/terminal chat requests are maintenance evidence and MUST NOT be reopened. Provider publication, credential/IAM changes, protected runtime execution and other external mutations remain separately gated.  
**Exit criterion:** every non-terminal Social-chat request is either (a) directly eligible for owner-correct automated repository execution, (b) dependency-held with an objective trigger, or (c) routed to its canonical foreign owner; no duplicate Master-Roadmap truth exists.  
**State:** `ACTIVE — ENROLLED IN ORDERED AUTOMATED ROADMAP LANE`.

#### Social automation disposition

| Source work | Automated-lane disposition | Trigger / owner boundary |
|---|---|---|
| `SOC-CHAT-01` emoji semantics | `TERMINAL / MAINTAIN` | already `MAIN_IMPLEMENTED`; only drift maintenance under `SOCIAL-06` |
| `SOC-CHAT-02` platform character limits | `TERMINAL / MAINTAIN` | already `MAIN_IMPLEMENTED`; only provider-drift verification under `SOCIAL-06` |
| `SOC-CHAT-03` platform-ready package / referral-disclosure applicability | `PARTIAL / ROUTED` | structural package runtime is complete; concrete legal/referral applicability remains `CAPITAL-AI-COMP`-dependent and Social consumes the authoritative result |
| `SOC-CHAT-04` ~20s short video + voice-over | `BLOCKED / FOLLOW-ON` | maps to `SOCIAL-P2`; starts only after validated real `SOCIAL-P1` runtime evidence and validated source/brand assets |
| `SOC-CHAT-05` TTS comparison + real listening evidence | `DEPENDENCY-LANE / OWNER-ROUTED` | remaining acoustic/runtime evidence is operationally routed, commonly to `CAPITAL-AI-OPS`; Social retains acceptance semantics |
| `SOC-CHAT-06` multilingual multi-speaker podcast | `DEPENDENCY-LANE / OWNER-ROUTED` | contract support exists; real synthesis depends on validated `SOCIAL-P1` runtime evidence |
| `SOC-CHAT-07` stable voice personas / samples | `DEPENDENCY-LANE / OWNER-ROUTED` | profile semantics exist; acoustic binding, samples and artifact/license evidence depend on protected runtime provisioning |
| `SOC-CHAT-08` Social Media Kit UI/mockups | `FOREIGN-OWNER ROUTE` | `CAPITAL-AI-FE` owns productive UI implementation; Social supplies approved media/copy requirements |
| `SOC-CHAT-09` LinkedIn/social PDF/report presentation | `FOREIGN-OWNER ROUTE` | `CAPITAL-AI-DOC / PVC-03` owns canonical document/PDF implementation; Social retains channel adaptation requirements |
| `SOCIAL-P3` publication/analytics evidence completion | `DEPENDENCY-HANDOFF` | Social-owned contract/validator/test slice is `DONE_MAIN` via PR #930; full closure now requires real provider publication + real analytics evidence and owner-correct DATA/PVC-10 persistence / OPS runtime where applicable |
| `SOCIAL-P1` acoustic benchmark remainder | `OWNER-ROUTED DEPENDENCY` | must be re-correlated from then-current `main`; no active Social/OPS P1 writer was found during the 2026-09-16 final branch correlation, so historical branch payload is not assumed |
| `SOCIAL-P2` short-video + voice-over integration | `BLOCKED` | eligible only after `SOCIAL-P1` exit evidence is valid |
| `SOCIAL-06` drift/optimization | `CONTINUOUS` | may yield future bounded Social remediation after evidence-backed drift detection; does not bypass ordered PR sequencing |

**Relative Social ordering for the global planner:** there is no remaining unblocked Social-owned implementation slice that should be duplicated on current evidence. Route/re-evaluate `SOCIAL-P1` runtime evidence through the canonical operational owner first; only after a valid P1 exit may `SOCIAL-P2` become executable. `SOCIAL-P3` full closure remains a real-evidence/persistence handoff after its Social-owned contract slice was merged in PR #930. Cross-owner `SOC-CHAT-08/09` and Compliance-bound `SOC-CHAT-03` remain routed into their owning project roadmaps. Repository-wide priority against other projects remains a Governance/planner correlation decision and is not duplicated here.

## Current-main execution status

| Queue item | Current-main status | Timeline | Evidence / dependency |
|---|---|---|---|
| `SOCIAL-P0` Canonical content-package completion | `MAIN_IMPLEMENTED — EXIT GATE SATISFIED` | `DONE` | deterministic package mapping, `/generate` integration, provenance/disclosure fail-closed tests and approval metadata/hash binding are present on current `main` |
| `SOCIAL-P1` TTS / multilingual voice contract and benchmark | `PARTIAL — CONTRACT/CODE/TESTS/ADAPTER DECISION COMPLETE; ACOUSTIC RUNTIME NOT RUN` | `NEXT` dependency lane | `server/socialMedia/voiceContract.ts`, `tests/unit/socialVoiceContract.test.ts`, TTS contract, sample manifest and benchmark are merged; real audio/listening/latency/output hashes are absent and protected-runtime owner-routed |
| `SOCIAL-P2` Short-video + voice-over integration | `BLOCKED` | `NEXT` after P1 runtime evidence | requires validated real `SOCIAL-P1` runtime result |
| `SOCIAL-P3` Publication/analytics evidence completion | `PARTIAL — SOCIAL CONTRACT/VALIDATOR/TEST SLICE DONE_MAIN` | `DEPENDENCY-HANDOFF` | PR #930 merged the deterministic Publication/Analytics Evidence contract, validator and negative tests; full P3 closure still requires real provider publication evidence, real analytics source evidence and owner-correct durable DATA/PVC-10 / OPS handling |

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
- `CAPITAL-AI-DATA / PVC-10`: durable evidence management/persistence where required by the P3 closure path;
- `CAPITAL-AI-SEC` / `CAPITAL-AI-COMP`: independent assurance and applicable disclosure/privacy boundaries;
- `CAPITAL-AI-SEO`: content/measurement context;
- `CAPITAL-AI-QM`: independent evidence/quality assessment where applicable;
- `CAPITAL-AI-FE`: public/product render surfaces;
- `CAPITAL-AI-DOC / PVC-03`: canonical document/PDF implementation and upstream source/provenance where applicable.

## Project exit gate

One active SOCIAL roadmap; canonical content-package mapping is evidence-backed; the still-valid Social chat backlog is fully classified for ordered automated execution or owner-correct routing; TTS/media runtime integration consumes only validated owner-routed runtime evidence; provider actions remain explicit, least-privileged and separately authorized; publication/analytics evidence is reproducible and non-fabricated, with durable persistence retained under the canonical productive owner.
