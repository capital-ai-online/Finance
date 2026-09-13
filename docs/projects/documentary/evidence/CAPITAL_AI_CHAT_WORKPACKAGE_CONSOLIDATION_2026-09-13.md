# CAPITAL-AI — Chat Work Package Consolidation & Production Readiness Master Roadmap Candidate

**Baseline:** `main@91818c23038e0f4d516b1ce1a26ae0d3962b24c7`  
**Target branch:** `agent/documentary-chat-workpackage-consolidation-20260913`  
**Owning consolidation surface:** `CAPITAL-AI-DOC / PVC-03` for documentary preservation only  
**Role:** read-only documentary correlation evidence + cross-project derived Production-Readiness orchestration; non-authorizing  
**Status:** `ACTIVE CONSOLIDATION — SOURCE-CHAT CLOSURE IN PROGRESS`  
**Canonical project status:** remains exclusively in each `docs/projects/<project>/ROADMAP.md`  
**Trust root:** `/AGENTS.md@current-main`

## 1. Vision

Create one over-arching **CAPITAL-AI Production Readiness Master Roadmap** that preserves all still-material project-chat knowledge, correlates it against current `main`, routes every item to the correct Project/PVC/Primary Owner, and sequences the remaining work toward the **next web-application milestone** and ultimately a demonstrably production-ready CAPITAL-AI web application.

The Master Roadmap is a derived orchestration view. It must not become a second authority or duplicate fast-changing project status. Canonical execution truth remains in the owning project Roadmaps, applicable ADR/ESS contracts, code, tests and evidence.

## 2. Mission

1. Preserve every material decision, task, constraint, blocker, dependency, approval boundary, branch/PR state, test/evidence result and exit gate that exists only in project chats.
2. Correlate every preserved point against current `main`, current project Roadmaps, applicable ADR/ESS, open PRs and active writers.
3. Insert every still-valid missing item into the correct Work Package in this consolidation branch, with Owner/PVC routing and evidence.
4. Produce a deterministic closure decision for every source chat: a chat may be closed only when no material unique content remains outside the branch/repository.
5. Convert the fully correlated portfolio into an Owner-correct, gate-driven Production Readiness sequence for the next web-application milestone.
6. Keep repository mutation in this branch documentation-only. No application, production, security-control, provider, credential, billing, IAM or deployment mutation is authorized by this artifact.

## 3. Non-authority and ownership boundary

This artifact is not a replacement for:

- `/AGENTS.md`;
- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- any canonical `docs/projects/<project>/ROADMAP.md`;
- accepted ADR/ESS/AUTH/CTRL contracts;
- code/tests/evidence;
- Human/CODEOWNER merge authority.

The consolidation branch may **preserve, classify, correlate and orchestrate** foreign-project material, but implementation remains with the canonical Primary Owner. A missing chat item is routed to its correct Owner rather than implemented under `CAPITAL-AI-DOC`.

## 4. Completion model

```text
SOURCE CHAT / PROJECT FOLDER
→ CURRENT-MAIN + TRUST-ROOT CORRELATION
→ OWNER/PVC RESOLUTION
→ MATERIAL CONTENT EXTRACTION
→ CONTAINMENT CHECK AGAINST CONSOLIDATION BRANCH
→ MISSING DELTA INSERTED AT CORRECT WP
→ DELTA REGISTER UPDATED
→ RE-READ + VERIFY
→ CHAT CLOSURE DECISION
→ PROJECT-FOLDER CLOSURE SUMMARY
→ MASTER ROADMAP RE-CORRELATION
→ NEXT WEB-APPLICATION MILESTONE
→ PRODUCTION READINESS
```

A source chat is not considered preserved merely because its topic appears in a WP title. The relevant semantic payload must be retained.

## 5. Temporal model

| Horizon | Meaning |
|---|---|
| `NOW` | Critical or enabling work required before the next Production Readiness gate can advance. |
| `NEXT` | Owner-ready work that follows completion of a current gate. |
| `LATER` | Valid work that is not currently on the critical Production Readiness path. |
| `DEPENDENCY` | Required work/evidence owned by another Project/PVC or external provider. |
| `CONTINUOUS` | Ongoing monitoring, learning or maintenance; not a one-off repository completion gate. |
| `DONE_MAIN` | Human-merged and re-correlated into current `main`. |
| `EXTERNAL_ONLY` | Intentionally outside repository runtime and retained only as an external automation/research surface. |

No calendar date is invented where the canonical Owner Roadmap does not provide one.

## 6. Portfolio Work-Package Matrix

| WP | Work package | Owner correlation | Priority | Horizon | Implemented | Open | Blocked | Current disposition |
|---|---|---|---:|---|---:|---:|---:|---|
| WP-01 | Governance & Control Plane | CAPITAL-AI-GOV / PVC-05 | 5/5 | NOW | yes | yes | no | Deterministic governance, PR approval, templates, routing and authority integrity remain enabling gates. |
| WP-02 | Event-Driven Development Chain | CAPITAL-AI-OPS / PVC-18,06 + GOV constraints | 5/5 | NOW | partial | yes | no | Project Listener / event-trigger / handoff chain must converge without a parallel authority plane. |
| WP-03 | OPS, Version, Release & Production | CAPITAL-AI-OPS / PVC-02,04,06,07,08,18 | 5/5 | NOW | yes | yes | yes | Version/release/runtime/provider evidence and production identity gates remain on the critical path. |
| WP-04 | CI/CD, PR Classes & Quality Management | CAPITAL-AI-QM cross-cutting with OPS/GOV boundaries | 5/5 | NOW | yes | yes | yes | PR classification, same-SHA evidence and cost-aware check orchestration remain incomplete. |
| WP-05 | Security & Compliance | CAPITAL-AI-SEC + CAPITAL-AI-COMP | 5/5 | NOW | yes | yes | yes | SEC-SOTA/lifecycle/provider returns and explicit assurance evidence remain gating. |
| WP-06 | GitHub Enterprise & Developer Platform | primarily OPS; GOV/SEC/QM constraints | 4/5 | NEXT | yes | yes | no | Complete Enterprise capability/read-write matrix and efficient repository integration remain open. |
| WP-07 | Multi-LLM Gateway, OAuth2 & MCP | OPS runtime with CLIENT/GOV/SEC dependencies | 4/5 | NEXT | yes | yes | yes | Provider-neutral gateway foundations exist; protected runtime, OAuth2/MCP and convergence work remain gated. |
| WP-08 | Frontend, Branding & Design System | CAPITAL-AI-FE | 4/5 | NEXT | yes | yes | no | Universe branding, Bond presentation removal and design-system propagation remain active. |
| WP-09 | DATA & FINTECH Product Chain | DATA PVC-09..11 + FINTECH PVC-12..17 | 5/5 | NEXT | yes | yes | yes | Data quality, lineage, canonical scoring/ranking and product-chain gaps remain production-critical. |
| WP-10 | SEO & Marketing | CAPITAL-AI-SEO with FE/OPS dependencies | 3/5 | NEXT | yes | yes | yes | Consolidated SEO baseline exists; GSC/GA4/GenAI/provider reads and technical handoffs remain gated. |
| WP-11 | Social Media, Content & TTS | CAPITAL-AI-SOCIAL with OPS protected runtime | 2/5 | LATER | yes | yes | yes | TTS contract exists; runtime/media/analytics and provider execution remain incomplete. |
| WP-12 | Observability, Analytics & Production Readiness | OPS + QM/SEC/privacy dependencies | 5/5 | NOW | yes | yes | yes | Vendor-neutral telemetry exists; measurable Production Readiness and vendor evidence remain incomplete. |
| WP-13 | Documentary Engine & Knowledge | CAPITAL-AI-DOC / PVC-03 | 3/5 | NEXT | yes | yes | no | Documentary baseline exists; chat preservation and current-roadmap re-correlation are active. |
| WP-14 | Strategy, Monetization & Product Expansion | REQUIRES_CORRELATION | 3/5 | LATER | partial | yes | yes | Cross-owner package; monetization/product expansion must be decomposed into canonical owners. |
| WP-15 | Recurring Watches & Learning | external automation/research surface | 2/5 | CONTINUOUS | yes | yes | no | Retain as external monitoring/learning portfolio, not repository runtime authority. |

## 7. Detailed Work Packages

### WP-01 — Governance & Control Plane

**Production-readiness outcome:** All repository development follows one deterministic authority and approval model without duplicate or stale governance surfaces.

**Primary Owner / PVC:** `CAPITAL-AI-GOV / PVC-05`.

**Canonical sources:** `/AGENTS.md`, `docs/projects/governance/ROADMAP.md`, Governance Control Catalog, Authority Registry, applicable accepted ADR/ESS.

**Preserved content:**
- current PR-creation approval envelope and current-main re-correlation requirements;
- versioned PR-template contract and machine-readable markers;
- deterministic versioning governance relationship;
- intelligent project prompt/routing selection under GOV;
- branch/PR naming must be resolved from current authority rather than invented;
- previous overlapping/stale version-governance work must remain evidence only where superseded;
- GOV must consume verified foreign-owner evidence without silently promoting unrelated `PARTIAL`, `FOREIGN_OPEN` or dependency states;
- previous bounded GOV-07 correlation work used an exact small scope and remained PR-creation approval gated;
- source-chat correlation distinguishes terminalized transition work (`GOV-CHAT-074` Approval Envelope v3.4 and `GOV-CHAT-072` plugin-use policy are `DONE_MAIN`) from still-stale current-state projections; merged transition states must not remain open blockers;
- the compact pre-command governance flow is staged and lazy: `current main + open PRs → /AGENTS.md → command/capability class → Project/PVC/Roadmap → applicable ADR/ESS/CTRL/AUTH → least-privileged capability/reuse/security decision → ALLOW | ROUTE | REQUIRE_GATE | BLOCK → first execution`; PR-, merge- and protected-mutation-specific artifacts are loaded only when that event class is actually reached.

**Open work:**
- correlate active Option-C Governance prototype work against current main;
- verify template/versioning authority after every current-main change;
- ensure new orchestration prompts do not recreate withdrawn post-PVC routing overlays;
- retain only current effective governance semantics in the Master Roadmap;
- refresh stale current-state projections against then-current main, especially `docs/architecture/ROADMAP.md` and any Governance Roadmap/Task-Register writer snapshot before they are presented as current;
- resolve the current ADR-0069 projection: preserve the valid anti-self-bootstrap / Human-merge invariants, but explicitly reconcile its still-`ACCEPTED` M10/WebAuthn introduction statement with the higher/current Trust Root and controls where productive M10 is `RETIRED / OFF`;
- reconcile the single stable `AUTH-GOV-CONTROL-PLANE` identity across current projections: Authority Registry currently projects version `1.1.0` at `src/platform/Governance/README.md`, that component README declares `1.2.0`, and `docs/governance/control-plane/README.md` declares `1.3.0`; determine the canonical version semantics and make every projection consistent;
- extend Governance validation so stale project/task/current-state projections and stable-authority target header/version drift can fail closed instead of only validating path existence, syntax and selected registry/ADR version relationships;
- materialize the compact staged chat-entry flow under existing GOV authority where it is only a projection/decision contract; any productive Agent Client/runtime resolver belongs to `CAPITAL-AI-CLIENT / PVC-01` or the otherwise canonically resolved runtime owner. Do not create a new ADR merely for restating current authority; use an ADR only if the implementation introduces a material architecture decision, new authority or trust boundary.

**Dependencies:** OPS version/release implementation, QM gate classification, SEC/COMP assurance returns; `CAPITAL-AI-CLIENT / PVC-01` only if the compact chat-entry contract requires productive client/runtime materialization.

**Exit gate:** No unresolved duplicate authority/namespace writer; applicable Governance Roadmap and current accepted contracts agree; all Master-Roadmap tasks have one Owner/PVC and no chat-only authority remains; repository-wide current-state projections are re-correlated; ADR-0069/M10 disposition is unambiguous under current authority; `AUTH-GOV-CONTROL-PLANE` version projections converge; validators detect the identified freshness/version-drift classes; the staged pre-command flow is represented without a parallel control plane.

---

### WP-02 — Event-Driven Development Chain

**Production-readiness outcome:** Roadmap work can flow through an event-driven agent chain with deterministic triggers, owner-correct handoffs, replay-safe evidence and explicit stop/continue gates.

**Primary Owner / PVC:** `CAPITAL-AI-OPS / PVC-18` with `PVC-06` interactions; GOV supplies constraints, not runtime ownership.

**Canonical sources:** `docs/projects/operations/ROADMAP.md`, `docs/architecture/ROADMAP.md`, applicable EventMesh/Traceability ADR/ESS.

**Preserved content:**
- project Listener / event-trigger architecture;
- roadmap creation should form a flowing PVC-aware process chain;
- chats waiting for a main event should resume from a defined trigger;
- project-listener Option-C work replaces obsolete prototype overlap;
- event history and PR-approval handoff belong to the same deterministic chain but retain authority separation.

**Open work:**
- correlate Option-C listener branch with current main and applicable ADR/ESS;
- define trigger payload, state transition, idempotency/replay and evidence requirements;
- preserve owner boundaries across project-folder handoffs;
- avoid high-frequency polling where event-native repository/provider triggers exist.

**Dependencies:** WP-01 governance, WP-03 release/version state, WP-04 gate outcomes.

**Exit gate:** One current listener/event flow is evidenced; every handoff records source event, target Owner/PVC, deterministic state, exit evidence and continuation trigger; no duplicate runtime listener remains active.

---

### WP-03 — OPS, Version, Release & Production

**Production-readiness outcome:** Deterministic platform versioning, release, deployment and post-deployment identity evidence are reliable and owner-correct.

**Primary Owner / PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18`.

**Preserved content:**
- Stage-2 revalidation for PVC-06 Version Management and PVC-07 Release Management;
- deterministic version rule contract and existing Release Version Gate must agree;
- Render native Auto Deploy remains off; verified main pipeline remains the production promotion boundary;
- provider/runtime evidence must be explicit rather than inferred;
- version semantics distinguish bugfix/patch/update/upgrade/modification/micro/minor/major only where current accepted authority defines the mapping;
- platform/application/document/component versions must not be autonomously invented.

**Open work:**
- complete Stage-2 deterministic version/release validation;
- materialize missing provider/runtime evidence;
- verify exact-SHA production promotion and post-deployment identity;
- route any rule-contract mismatch to GOV rather than implementing a parallel OPS rule.

**Dependencies:** WP-01 governance, WP-04 CI evidence, WP-05 security, WP-12 observability.

**Exit gate:** Version and release gates agree on the same exact snapshot; required checks are truthfully PASS/FAIL/NOT_AVAILABLE; exact-SHA deployment and post-deployment identity evidence exist.

---

### WP-04 — CI/CD, PR Classes & Quality Management

**Production-readiness outcome:** Every PR runs the smallest sufficient, risk-proportionate check set while preserving required evidence and preventing unnecessary deploy/build cost.

**Primary Owner:** `CAPITAL-AI-QM` cross-cutting, with OPS/GOV ownership boundaries.

**Preserved content:**
- classify PRs so documentation-only work does not trigger unnecessary Render deploy/build paths;
- investigate Enterprise capabilities, custom properties and pipeline regulation;
- QM evidence coverage and gate inventory require same-SHA evidence;
- Chapter-12 validators and applicable Quality Gates must report explicit PASS/FAIL/NOT_AVAILABLE;
- increased GitHub Actions storage/volume limits should be used efficiently with the event-driven development chain.

**Open work:**
- complete PR-class decision matrix from current authority;
- map each class to check capsules and deployment eligibility;
- complete exact-snapshot evidence coverage/gate inventory;
- assess cache/artifact retention and Enterprise controls against cost/security needs.

**Dependencies:** WP-01, WP-02, WP-03, WP-05, WP-06.

**Exit gate:** Every PR class deterministically selects only required checks; documentation-only changes avoid inappropriate runtime deployment; all required QM gates for one snapshot have non-synthetic statuses.

---

### WP-05 — Security & Compliance

**Production-readiness outcome:** Security and compliance controls are evidence-backed, fail-closed and do not rely on stale chat claims.

**Primary Owners:** `CAPITAL-AI-SEC` and `CAPITAL-AI-COMP`, cross-cutting.

**Preserved content:**
- SEC-SOTA-04 requirement verification must use current-main-correlated evidence; the requested rematerialization already exists on the Security branch as detailed in CHAT-031 / DELTA-017, so do not duplicate that payload;
- SEC-AUTH-LIFECYCLE requires MFA/AAL/provider evidence correlation and removal/handling of legacy lifecycle mismatch;
- PostHog and CodeQL integration must fit the existing security architecture;
- verified Security evidence may be consumed by GOV without upgrading unrelated states;
- protected security/data-integrity/application mutations require explicit authority and evidence boundaries.

**Open work:**
- complete current-main requirement verification with reproducible statuses;
- correlate MFA/AAL provider evidence and lifecycle semantics;
- verify CodeQL/PostHog roles, data minimization and provider permissions;
- route unresolved legal/compliance judgments to Human/COMP rather than infer PASS.

**Dependencies:** WP-01, WP-04, WP-06, WP-12.

**Exit gate:** No unresolved critical production-readiness security finding; all assessed requirements have reproducible status or explicit owner routing; provider/security evidence is current and exact-snapshot-bound where applicable.

---


### WP-05 source refinement — SEC project-roadmap consolidation (CHAT-031 / DELTA-017)

**Source:** this CAPITAL-AI-SEC conversation of 2026-09-13, beginning with “bitte konsolidieren alle Inhalte und Aufgaben … projekteigenen Roadmap mit Vision und Mission … Freigabe der Löschung aller anderen Chats”; followed by the explicit `CAPITAL-AI-SOURCE-CHAT-CONSOLIDATE-AND-CLOSE` order. No stable ChatGPT conversation URL was exposed. Generic copy-A/B/C titles in CHAT-014..016 are not sufficient to assert that those chats are this source; they remain individually pending.

**Preservation owner:** CAPITAL-AI-DOC / PVC-03, `docs/projects/documentary/`. **Subject owner:** CAPITAL-AI-SEC, `docs/projects/security/`, cross-cutting with no productive PVC. This subsection preserves the semantic delta of `CAPITAL-AI-SEC-Konsolidierte-Projektroadmap-2026-09-13.md`, the 279-line source deliverable, without creating another canonical Security roadmap.

**Owner decisions retained:** consolidate the project contents into categorized tasks, project vision/mission, linked documents and temporal planning; assess deletion only after preservation. The later source-specific order explicitly authorizes only missing valid Documentary deltas in the existing PR #900 branch, requires a readback after each write, prohibits a new branch/PR, merge, runtime/app/production mutation and agent chat deletion, and permits source-chat deletion readiness when all material content is preserved in current main or this branch. It does not require all underlying Security work to be completed before source preservation can close.

**Vision proposal, not an accepted new authority:** CAPITAL-AI soll über eine nachvollziehbare, unabhängig überprüfbare Sicherheitsbasis verfügen, die Identitäten, Finanzdaten, KI-Agenten und die gesamte Entwicklungs- und Betriebskette schützt.

**Mission proposal:** CAPITAL-AI-SEC identifiziert Bedrohungen und konkrete Sicherheitslücken, ordnet sie den bestehenden Verantwortlichen zu, führt zulässige begrenzte Security-Korrekturen aus und prüft die Ergebnisse anhand reproduzierbarer Nachweise. Implementierung, Test, Providerzustand und normative Freigabe bleiben getrennt. Fehlende oder veraltete Evidence bleibt sichtbar.

**Existing category mapping retained:** SEC-01 Threat Modeling; SEC-02 Identity & Access; SEC-03 Application/API; SEC-04 Data & Secrets; SEC-05 Infrastructure; SEC-06 Supply Chain; SEC-07 AI/Agent/MCP; SEC-08 positive/negative tests; SEC-09 finding triage/routing/residual risk; SEC-10 independent exact-identity verification. These are existing coordination labels, not new authority IDs.

#### Current-main and history classification

Correlation baseline for this source run: `main@91818c23038e0f4d516b1ce1a26ae0d3962b24c7`; AGENTS.md v2.10.0 and current canonical mapping remain controlling. The older source instruction's SvenKulessa/Finance name is a historical navigation hint; current Trust Root identifies capital-ai-online/Finance.

| Material source item | Classification before this delta | Preserved disposition / evidence |
|---|---|---|
| Project-specific vision/mission and detailed categorized plan | NOT_CONTAINED | Preserved here as proposals, not accepted architecture or execution authority |
| SEC-SOTA-04 then-current rematerialization request | PARTIALLY_CONTAINED; recreation instruction SUPERSEDED by existing branch evidence | The 17-chapter inventory is already on main. Existing `agent/security-sec-sota04-requirement-verification-20260913` is 1 ahead / 0 behind; only `docs/evidence/security/CAPITAL_AI_SEC_ASVS_5_REQUIREMENT_VERIFICATION_2026-09-13.md` added. Historical observed head `e265a804e20367309b58876e787aba4c449eafe3` is a source evidence anchor, not permanent current-head authority. Do not duplicate that payload. |
| Focused V3/V4/V6/V8/V16 verification | PARTIALLY_CONTAINED | Branch evidence reports PARTIAL / GAPS_ROUTED; requirement-level PASS_REPOSITORY is scoped contract evidence, not a new executed-test or chapter-wide PASS in this preservation run |
| PR #896 formerly open | DONE_MAIN; older “open” statement SUPERSEDED | Security Policy merged 2026-09-13 07:06:08 UTC, merge `00699bb58210e35caf083b47af10c58098abd253`; .github/SECURITY.md is on current main |
| SEC-SOTA-01 / SEC-SOTA-03, #749 / #766 | DONE_MAIN as documented roadmap state | #832/#837 preserve SOTA baseline; #870/#872/#882/#887 document bounded supply-chain closure. This run does not newly verify their production claims |
| MFA/AAL lifecycle mismatch | PARTIALLY_CONTAINED | ESS-0020 and ADR-0064 remain PROPOSED; ESS registry still projects NOT STARTED — M5A BASELINE COMPLETE. Correlate implementation and current provider evidence separately; GOV/Human retains normative decision |
| Old work-package/traceability projections | NOT_CONTAINED | Work Packages v2.3.0 still says SOTA03 READY and broadly denies foreign-located implementation; Traceability v2.1.2 still cites withdrawn CROSS_PROJECT_HANDOFF_CONTRACT and older ownership rules. Current Trust Root/SEC README permit eligible bounded Security remediation without productive ownership transfer. SEC must synchronize its projections; DOC does not change authority |
| ULS provider lineage and S1 runtime residuals | PARTIALLY_CONTAINED | Concrete owners and exit gates preserved below; historical provider measurements are not fresh live state |
| FINTECH F01 and parallel-branch snapshot | PARTIALLY_CONTAINED / REQUIRES_CORRELATION for later execution | Source inspection found F01 branch 14 ahead / 220 behind, template branch 6 ahead / 8 behind and old listener 13 ahead / 5 behind. These are historical snapshot measurements, not current completion claims |
| Earlier refusal to delete all SEC project chats | FULLY_CONTAINED principle, NOT_CONTAINED source-specific limitation | Earlier source search had excerpts rather than full project transcripts/attachments; folder-wide coverage remained unknown. This source-specific closure cannot close other chats or the whole SEC folder |
| Earlier claim of zero open PRs | SUPERSEDED | Current dedicated PR search and PR metadata identify open PR #900. The generic issue-search empty result is not reliable proof of zero PRs |
| Watches and other-project context | FULLY_CONTAINED / EXTERNAL_ONLY | Existing WP-01..15 retain those topics; no automation was created, changed, executed or newly verified in this source chat |

The initial source inventory observed twelve work branches. The present branch discovery returned nine work branches plus main, with an empty following page. The earlier empty materialization/trusted-capabilities/SEO-return branches are no longer in that live set; their historical existence is not an implementation gap. No uncommitted work in other chats is implied visible.

#### Concrete Security work-package / owner-return preservation

1. **SEC document consistency:** preserve complete source→task→document→status mapping; synchronize `docs/projects/security/ROADMAP.md`, detailed roadmap, Work Packages and Traceability only in the appropriate later Security scope. Retain historical evidence dates; do not rewrite old results as new verification. Exit: no unexplained active projection/authority contradiction and no missing source decision.

2. **SEC-SOTA-04:** continue the existing focused slice; do not recreate its already materialized file. Every reviewed V3/V4/V6/V8/V16 requirement needs reproducible disposition or concrete routing. Wider V5 file-handling and V10 OAuth/OIDC applicability remain open; V17 N/A is baseline-scoped only, not permanent authority. `ASVS5-V12-TRANSPORT-EVIDENCE` remains OPS/PVC-08 for production-identity-bound TLS/proxy/edge readback, followed by independent SEC review. No full ASVS certification/conformance is claimed; advisory mapping alone creates no required runtime change.

| Focused finding | Productive owner | Required return / exit |
|---|---|---|
| ASVS5-V34-CORS-COMPOSITION-DRIFT | OPS / PVC-02 | One canonical active CORS composition and disallowed GET/POST/OPTIONS negative evidence |
| ASVS5-V3-CSP-REPORTING | OPS / PVC-08 | Effective reporting destination/configuration and deployed response evidence |
| ASVS5-V3-COOP | OPS / PVC-08; bounded SEC fix separately assessable | Decided policy, repository regression checks and required deployed evidence |
| ASVS5-V4-METHOD-GATE | OPS / PVC-02 | Explicit unsupported-method denial on the active path |
| ASVS5-V6-APPLICATION-MFA | CLIENT / PVC-01; OPS / PVC-08 provider evidence | Disposition of every productive auth path; framework mapping does not itself impose global MFA |
| ASVS5-V8-AUTHZ-COVERAGE | Respective route/object/data owner | Complete route/object/field inventory and cross-role/cross-user negative evidence |
| ASVS5-V16-AUTH-AUDIT-COVERAGE | OPS / PVC-08 plus event-source owners | Durable centralized AuthN/AuthZ audit without credential leakage |

3. **SEC-AUTH-LIFECYCLE:** separate follow-up after the focused slice's normal lifecycle; re-correlate ESS-0020/ADR-0064/registry, native MFA, Legacy-TOTP, purpose-bound step-up and recovery against then-current implementation/provider evidence. Historical factor/session counts from 2026-08-12 are not current provider state. No unilateral lifecycle promotion/retirement, recovery-policy change, cleanup or global MFA requirement. GOV / Human Owner decides normative lifecycle; protected provider/data mutations remain separate. Exit: exact evidence/time/identity and owner for every mismatch and decision.

4. **SEC-VERIFY-ULS-001:** main evidence dated 2026-09-07 reports PARTIAL / NOT VERIFIED. It recorded two active-paid projections missing metadata.user_id; no 2026-09-13 live measurement is inferred. OPS / PVC-08 returns reproducible `Stripe metadata.user_id → auth.users.id → public.subscriptions.user_id` lineage. SEC independently verifies every relevant active-paid projection; e-mail is not entitlement authority. Cross-user/provider E2E, isolated Supabase/Mailpit, Stripe Sandbox/Test Clock, renewal/cancellation/expiry/reactivation, duplicate/redelivery and clean-baseline replay remain separate unclosed gates. Historical leaked-password-protection WARN is separate; today's configuration/plan availability was not checked.

5. **S1 / runtime residuals:**

| Residual | Owner | Exit evidence |
|---|---|---|
| S1-R2-03 Node/toolchain convergence | OPS / PVC-06 | Current approved toolchain identity; do not perpetuate an old version as today's requirement |
| S1-R2-04 fatal process | OPS / PVC-04, runtime PVC-08 | Repository contract documented verified; exact deployed supervisor/restart/readiness fault evidence remains open |
| S1-R2-05 redirect | OPS / PVC-02 | Canonical-origin/open-redirect DENY evidence |
| S1-R2-06 entitlement | OPS parent; actual DATA/FINTECH capability owners | Per-capability authorization/negative evidence without changing business entitlement semantics |
| S1-R2-07 recovery | OPS / PVC-08 | Measured restore, integrity, RPO/RTO; a runbook alone is not PASS |
| S1-R2-09 strict CSP | OPS / PVC-08 | Compatibility/violation window and protected-path evidence before promotion |
| S1-R2-10 demo billing isolation | OPS / PVC-08 | Production-identity-bound non-reachability evidence |
| S1-R2-11 evidence freshness | DATA / PVC-10 | Reproducible current/stale/wrong-identity semantics |

6. **SEC-SOTA02 returns:** F01 indirect prompt injection/history-role spoofing → FINTECH/PVC-15 plus CLIENT/PVC-01, separate data/instructions and prove negative trust tests; F02 automated Draft-PR dispatch → DOC/PVC-03, stop at approved handoff; F03 mutation audit → DOC/PVC-03, durable attributable authorization/outcome evidence; F04 effective external MCP tool grants/session/read-only boundary → OPS/PVC-02, independent live readback (executable pinning closure does not close host permissions); F05 stale provider-specific authority wording → GOV/PVC-05; F06 history/session provenance → CLIENT/PVC-01 plus FINTECH/PVC-15, explicit stateless or attested session contract and substitution tests. Old inventory findings require fresh code/owner correlation before remediation.

**Boundaries already on main and retained:** Security may implement a cleanly separable eligible Security-primary correction under CTRL-SEC-BOUNDED-REMEDIATION-001, even in a foreign-located file, without acquiring productive ownership. Business/architecture/provider/production authority remains separate. Implementation and independent verification are distinct; EVIDENCE_READY != VERIFIED; accepted residual risk remains Human/Owner. No second IAM, Policy, Audit, Security, Release or Governance plane. M10 remains RETIRED/OFF; NIST remains non-authorizing under current baseline. No reusable secrets or unnecessary personal information are copied.

#### Source temporal plan and document map

The source deliverable proposed, but did not commit or obtain Owner acceptance for, the following calendar windows. Preserve them as **historical planning proposals**, not new deadlines or automatic priority changes: 13.09 consolidation; 14.–15.09 source/document consistency; 14.–18.09 focused SOTA04 review; 18.–22.09 MFA/AAL after SOTA04; 21.–25.09 SOTA02/S1 reprioritization; provider-return review target within two working days of receipt, with no promised provider delivery time. Confirmed critical/high findings can supersede this suggested order under current authority. Canonical Roadmaps determine actual sequencing. Readiness/completion percentage was explicitly not defensibly measurable.

The source's canonical document navigation is preserved without duplicating their contents:

- `docs/projects/security/README.md` and `ROADMAP.md`;
- `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`;
- `docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md`;
- `docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md`;
- `docs/evidence/security/CAPITAL_AI_SEC_ASVS_5_VERIFICATION_MATRIX_2026-09-11.md`;
- `docs/evidence/security/CAPITAL_AI_SEC_ASVS_5_REQUIREMENT_VERIFICATION_2026-09-13.md` on the existing SEC branch;
- `.ai/registry/ess-registry.json`, ESS-0006 v1.2.0, ESS-0019 v1.2.0, ESS-0020 and ADR-0064;
- `docs/evidence/security/CAPITAL_AI_SEC_USER_LIFECYCLE_SUBSCRIPTION_IDENTITY_REVERIFICATION_2026-09-07.md`;
- `.github/SECURITY.md` / merged PR #896;
- S1 hardening roadmap, SOTA baseline/SOTA02 inventory of 2026-09-07, M5A runbook and OPS GOV-07 return as follow-up source references, not all newly re-read or executed here.

No new architecture decision/ADR/ESS allocation occurred in this source. Existing WP-01/02/03/04/06/07/08/09/10/11/12/14/15 preserve the contextual Governance, OPS, QM, FE, SEO, gateway, enterprise, social/strategy and watch topics. They are not new SEC implementation assignments. Personal account-session/support statements remain EXTERNAL_ONLY and are not evidence of a repository attack; no private contact/session identifiers are retained. The source created no new watch or schedule, and did not modify existing ones.

#### Source closure and validation boundary

Initial project-wide result was NOT_SAFE because full other-chat transcripts/attachments and the folder denominator were unavailable. That finding remains valid for the **SEC project-folder chat set**, not an automatic reason to retain this individually preserved source after the explicit later source-specific order.

For this source run: Trust Root, canonical mapping, Documentary README/Roadmap, ESS-0010, ESS-0012 and accepted ADR-0096 were read; existing consolidation and its companion CHAT-013 evidence were fully read; main and PR #900 were resolved; dedicated PR search found PR #900; live branch discovery and SEC/documentary comparisons were performed. The earlier Security source reads remain bound to the same immutable main. No new unit/integration/TypeScript/build/hosted-CI/provider/runtime validation was executed: NOT_RUN. Documentary content readback is a preservation check, not Security verification or merge-readiness certification.

Master-roadmap impact: refine existing WP-05 / PR-G2 and WP-13 / PR-G0 only; no new package, changed global gate order or foreign-owner implementation. Remaining source-independent work is SEC evidence/projection synchronization and per-chat/folder coverage, each owner-routed above.

**Closure gate for CHAT-031:** unique_content_not_yet_preserved = NONE only after exact proposed file content is returned by the branch readback. Source-local SAFE_TO_DELETE does not mean Security findings are closed, the project folder is safe, PR #900 is merged, or its post-update CI is PASS. The user explicitly allows preservation in the open PR branch as sufficient. Agent deletion remains prohibited.


### WP-06 — GitHub Enterprise & Developer Platform

**Production-readiness outcome:** GitHub Enterprise features are intentionally used for governance, security, CI efficiency and repository observability without broadening privileges.

**Primary Owner:** primarily `CAPITAL-AI-OPS`; GOV/SEC/QM constrain use.

**Preserved content:**
- complete read-capability inventory for dependencies and Enterprise settings;
- assess custom properties, pipeline controls, Action storage/volume limits and related Enterprise features;
- evaluate whether one least-privileged interface can read relevant Enterprise configuration and which settings require separate admin authority;
- plugin/open-source tooling should be classified as open source/free/freemium/paid and checked for hidden limits.

**Open work:**
- produce read/write capability matrix;
- classify settings as readable, mutable with Owner authority, unsupported or manual;
- map Enterprise features to WP-01/WP-04/WP-05/WP-12 benefits;
- avoid installing/connecting new integrations without separate explicit authorization.

**Dependencies:** WP-01, WP-04, WP-05.

**Exit gate:** Enterprise capability matrix is current and evidence-backed; repository uses the selected high-value controls without unauthorized connector/admin changes.

---

### WP-07 — Multi-LLM Gateway, OAuth2 & MCP

**Production-readiness outcome:** One provider-neutral, Docker-first LLM gateway and OAuth2/MCP integration model replaces unnecessary parallel gateways while preserving least privilege and provider isolation.

**Primary Owner:** OPS runtime, with CLIENT/GOV/SEC dependencies.

**Preserved content:**
- compare existing LLM gateways and converge where technically/contractually safe;
- own OAuth2 app + open-source MCP/LLM gateway architecture;
- provider-change watch covers ChatGPT, Claude, Gemini, DeepSeek, Ollama, Mistral and Azure OpenAI;
- architecture should explain cross-provider implications before review;
- reuse current repository/native, connected platform/plugin and maintained OSS before custom implementation.

**Open work:**
- inventory current gateways and provider adapters;
- decide canonical gateway boundaries;
- define OAuth2 scopes, token lifecycle, secret isolation, provider policy and MCP trust boundary;
- assess migration without rebuilding provider-specific functions unnecessarily.

**Dependencies:** WP-01, WP-03, WP-05, WP-06, CLIENT ownership.

**Exit gate:** One canonical gateway architecture is selected; duplicate gateways are retired or justified; protected provider operations are least-privileged and auditable; migration plan has rollback and compatibility evidence.

---

### WP-08 — Frontend, Branding & Design System

**Production-readiness outcome:** The user-facing application has one coherent design system and presentation contract with no forbidden/disabled asset surfaces leaking back into UI consumers.

**Primary Owner:** `CAPITAL-AI-FE`.

**Preserved content:**
- Branding Kit is leading for design-relevant units;
- Universe color-brand direction includes Vader Black, Capital Gold, Krypto Purple, Aktien Deadly Green, Indizes Pluto Blue, Forex Star Troops Magenta;
- pattern badges require three intensity levels for Buy/Sell signal strength;
- Bond is disabled/removed at the presentation boundary while technical identifiers remain stable where required;
- “Krypto” is the visible German spelling;
- current RankingBoard is the canonical ranking implementation; avoid parallel ranking components.

**Open work:**
- finish current-main branding consumer materialization;
- verify search/filter/tab/card/newsfeed surfaces do not make Bond user-selectable;
- propagate tokens/pattern badges through the canonical design system;
- run design/pattern regression, TypeScript, FE architecture, tests and build on the exact branch head.

**Dependencies:** WP-09 verified scoring/data, WP-04 checks.

**Exit gate:** Brand tokens are canonical and consumed consistently; disabled Bond presentation does not reappear; required FE checks pass on the final exact snapshot.

---

### WP-09 — DATA & FINTECH Product Chain

**Production-readiness outcome:** Verified data flows through Data Quality into feature engineering, canonical scoring and ranking without synthetic fallback or broken lineage.

**Primary Owners / PVC:** `CAPITAL-AI-DATA / PVC-09..11`; `CAPITAL-AI-FINTECH / PVC-12..17`.

**Preserved content:**
- PVC-11 → PVC-12 is a fail-closed DQ handoff;
- PVC-16 canonical scoring precedes PVC-17 ranking;
- provider freshness/provenance/lineage and DQ state must remain visible to consumers;
- old F01 AI-chat trust branch is stale evidence only;
- product-chain feature/ranking/lineage/security gaps remain open.

**Open work:**
- correlate DATA and FINTECH Roadmaps/task registers into Master Roadmap gates;
- close verified-data lineage and scoring/ranking evidence gaps;
- preserve exact boundaries of `SC-MD-SPT-0001`;
- avoid frontend-local scoring authority or synthetic score fills.

**Dependencies:** WP-05, WP-08, WP-12.

**Exit gate:** Real provider data has provenance/freshness/DQ evidence; canonical scoring produces deterministic verified outputs; ranking consumes only verified canonical results; no synthetic production fallback remains.

---

### WP-10 — SEO & Marketing

**Production-readiness outcome:** Technical SEO is measurable and provider-backed, with owner-correct FE/OPS handoffs and one consolidated roadmap.

**Primary Owner:** `CAPITAL-AI-SEO`, with FE/OPS dependencies.

**Preserved content:**
- one consolidated SEO/Marketing roadmap should replace overlapping legacy roadmaps;
- GSC/GA4/GenAI visibility currently depends on provider-read capability/evidence;
- Search Console / URL Inspection least-privileged read integration is an explicit goal;
- technical gates must distinguish repository work from provider/credential-dependent work;
- current SEO baseline includes robots/sitemap/canonical/404/JSON-LD/prerender/SeoEngine/dashboard evidence where current main confirms it.

**Open work:**
- verify GSC/GA4/provider reads with least privilege;
- complete FE/OPS technical-gate returns;
- consolidate remaining SEO/Marketing documents without deleting evidence prematurely;
- define measurable SEO acceptance criteria for Production Readiness.

**Dependencies:** WP-03, WP-06, WP-08, WP-12.

**Exit gate:** Provider reads are either verified with current evidence or explicitly owner-blocked; technical SEO gates are reproducible; only one canonical SEO project roadmap drives execution.

---

### WP-11 — Social Media, Content & TTS

**Production-readiness outcome:** Social/content distribution can consume stable application content and analytics without creating unsafe direct-provider mutation paths.

**Primary Owner:** `CAPITAL-AI-SOCIAL`; protected runtime stays OPS-owned.

**Preserved content:**
- Version 1 remains the chosen direction after broader direct-upload automation exploration;
- TTS contract is merged;
- runtime/media/analytics completion is still required;
- direct social-provider actions require explicit integration/authority boundaries.

**Open work:**
- correlate Social project roadmap;
- define production-safe content export/media generation and analytics evidence;
- keep provider credential/mutation work outside documentary consolidation.

**Dependencies:** WP-03, WP-05, WP-10, WP-12.

**Exit gate:** Stable content/TTS/media pipeline has evidence; provider actions are explicit and least-privileged; analytics feedback does not bypass privacy/security boundaries.

---

### WP-12 — Observability, Analytics & Production Readiness

**Production-readiness outcome:** Production Readiness is measured from reproducible technical and business evidence, not estimated from chat state.

**Primary Owner:** OPS with QM/SEC/privacy dependencies.

**Preserved content:**
- vendor-neutral telemetry exists but provider export/readiness measurement remains gated;
- PostHog integration must fit Security/privacy architecture;
- web application assessment should cover production readiness, monetization, marketing, backend/architecture, frontend, security and Enterprise Git usage;
- recurring reports may compare the application with relevant competitors and identify top quick wins;
- exact status percentages must use an explicit measurement basis; otherwise report “not defensibly measurable”.

**Open work:**
- define the Production Readiness scorecard and evidence sources;
- wire vendor telemetry/export only where authorized;
- define SLO/SLI, incident, release and post-deploy evidence;
- integrate project-roadmap gate states into the derived Master Roadmap without making them a second status source.

**Dependencies:** WP-03, WP-04, WP-05, WP-06, WP-09.

**Exit gate:** Production Readiness criteria are measurable from current evidence; critical SLO/security/release/data gates have explicit status; no invented percentage is used.

---

### WP-13 — Documentary Engine & Knowledge

**Production-readiness outcome:** Project/chat knowledge becomes durable, traceable and safely closable without turning Documentary into a foreign-project authority.

**Primary Owner / PVC:** `CAPITAL-AI-DOC / PVC-03`.

**Preserved content:**
- this chat-consolidation artifact;
- source-chat closure verification and delta preservation;
- existing Documentary Engine/model/provenance/hygiene/knowledge projection architecture;
- stale `WP-DOC-13` branch references in the canonical Documentary Roadmap must be re-correlated before being treated as current;
- Documentary preservation does not authorize foreign implementation.

**Open work:**
- run this artifact's closure prompt in every relevant project chat;
- populate the Source Chat Coverage Register;
- insert every valid missing semantic delta;
- re-correlate Documentary roadmap stale branch references against current main;
- complete final consolidation verification before allowing chat cleanup.

**Dependencies:** all WPs as evidence sources; no ownership transfer.

**Exit gate:** Every in-scope source chat has a terminal closure decision; `UNIQUE CONTENT NOT YET PRESERVED = NONE`; all incorporated deltas identify Owner/PVC and evidence.

---

### WP-14 — Strategy, Monetization & Product Expansion

**Production-readiness outcome:** Product/business expansion is decomposed into executable owner-correct work instead of a cross-owner catch-all.

**Primary Owner:** `REQUIRES_CORRELATION` per concrete slice.

**Preserved content:**
- monetization and competitive-position assessment are requested as part of readiness planning;
- a personal crypto-token concept was explored as both asset and application currency;
- product expansion must not bypass Security, Compliance, FINTECH, DATA, OPS or business-owner boundaries.

**Open work:**
- split monetization, pricing/entitlement, competitive analysis and token concept into owner-specific proposals;
- determine which items are required for the next web-app milestone versus post-readiness expansion;
- perform legal/compliance/security checks before any regulated or money-like implementation.

**Dependencies:** GOV, COMP, SEC, OPS, FINTECH and Human/Owner decisions.

**Exit gate:** No cross-owner strategy item remains unowned; next-milestone business requirements are explicitly separated from later expansion; regulated concepts have proper authority/assurance routing.

---

### WP-15 — Recurring Watches & Learning

**Production-readiness outcome:** Fast-changing external information is monitored without being mistaken for repository authority.

**Owner:** external automation/research surface.

**Preserved content:**
- twice-daily multi-LLM provider watch using official + major technical publications;
- daily Capital-AI plugin/integration watch, including Enterprise-option relevance;
- weekly Enterprise AI/FinTech briefing with deep research, application assessment and top three quick wins;
- weekly architecture-fluency training in German with English terms in parentheses and vocabulary continuation;
- security/session monitoring remains a separate personal-security workflow and is not repository runtime.

**Open work:** Keep recurring tasks aligned to current architecture and avoid automatically converting advisory findings into repository requirements.

**Dependencies:** none for repository authority; findings may create proposed work for the correct Owner.

**Exit gate:** External watch findings are clearly labeled advisory and routed into an Owner project only after current-main correlation.

## 8. Production Readiness Master Roadmap Candidate

### 8.1 Master Vision

**Master Roadmap übergeordnet:** Reach the next CAPITAL-AI web-application milestone through an Owner-correct, evidence-driven sequence and use the same gate model to drive the application to Production Readiness.

### 8.2 Milestone definition

The next web-application milestone is achieved when the following gate chain is satisfied or explicitly owner-blocked with evidence:

```text
PR-G0  Authority & ownership integrity
→ PR-G1  Deterministic development / CI / release path
→ PR-G2  Security / compliance assurance
→ PR-G3  Data / scoring / frontend product integrity
→ PR-G4  Production observability / deployment identity
→ PR-G5  Growth / SEO / operating readiness
→ WEBAPP_MILESTONE_READY
→ remaining Production Readiness residuals
→ PRODUCTION_READY_CANDIDATE
```

### 8.3 Gate sequence

| Gate | WPs | Objective | Exit evidence |
|---|---|---|---|
| `PR-G0` | WP-01, WP-13 | One current authority model; all chat knowledge owner-routed and preserved. | Trust-root correlation PASS; no duplicate authority; source-chat closure coverage complete for inputs used by the milestone; repository-wide current-state projections are fresh enough for the evaluated snapshot; stable authority/version projections are internally consistent or explicitly blocked with owner-routed evidence. |
| `PR-G1` | WP-02, WP-03, WP-04, WP-06 | Deterministic development chain, PR checks, version/release and Enterprise controls. | Event/handoff evidence; PR-class check mapping; exact-snapshot version/release evidence; capability matrix. |
| `PR-G2` | WP-05 | Security/compliance evidence is sufficient for the milestone. | No unresolved critical finding; explicit status/owner route for every required control; lifecycle/provider evidence current. |
| `PR-G3` | WP-08, WP-09 | Product data, scoring, ranking and frontend presentation are coherent and regression-tested. | Verified DQ→scoring→ranking chain; canonical branding/design; exact-head FE/data/fintech validation. |
| `PR-G4` | WP-03, WP-12 | Deployment and production identity/telemetry are measurable. | Successful required build/test, attestation, exact-SHA deploy, post-deploy identity and readiness telemetry evidence. |
| `PR-G5` | WP-10, WP-11, WP-14 | Growth/SEO/content/business readiness for the milestone is explicit. | SEO technical gate evidence; provider-read state explicit; business scope owner-routed; optional Social work not treated as core gate unless milestone scope requires it. |
| `CONTINUOUS` | WP-15 | External intelligence remains current. | Advisory findings routed to owners; no implicit authority creation. |

### 8.4 Critical-path ordering

1. `NOW`: WP-01 → WP-02/WP-03/WP-04/WP-05/WP-12.
2. `NEXT`: WP-06/WP-07/WP-08/WP-09/WP-10/WP-13 as their dependencies become ready.
3. `LATER`: WP-11/WP-14 unless the Human/Owner promotes a bounded item into the current milestone.
4. `CONTINUOUS`: WP-15.

This order is a derived orchestration proposal. After every material merge, the owning Roadmaps must be re-read and this ordering re-correlated.

### 8.5 Production Ready Candidate exit criteria

`PRODUCTION_READY_CANDIDATE` may be reported only when:

- current-main authority/ownership correlation is PASS;
- no unresolved critical Security/Compliance blocker remains;
- version/release/deployment path has reproducible exact-SHA evidence;
- required CI/QM checks for the production candidate are PASS and `NOT RUN` has not been converted to PASS;
- production identity/post-deploy verification is PASS;
- data provenance/freshness/DQ/canonical scoring/ranking requirements for user-visible production features are satisfied;
- frontend required checks are PASS and presentation does not expose intentionally disabled surfaces;
- required observability/SLO evidence exists;
- required provider-dependent evidence is either verified or explicitly excluded from the milestone by its Owner;
- canonical project Roadmaps are current for the snapshot;
- every chat-derived requirement used in the decision is preserved in repository evidence or a canonical project artifact.

## 9. Active Branch Correlation Snapshot

Baseline for this artifact: `main@91818c23038e0f4d516b1ce1a26ae0d3962b24c7`.

| Branch | Snapshot disposition |
|---|---|
| `agent/documentary-chat-workpackage-consolidation-20260913` | Target branch; sole currently discovered Documentary branch in this closure run, 0 behind current main before this delta; exact head is re-resolved per source-chat closure run. |
| `agent/frontend-universe-branding-consumers-20260913` | Relevant WP-08 source branch from prior correlation; re-check in closure run before treating state as current. |
| `agent/governance-option-c-prototype-20260913` | Relevant WP-01/WP-02 source branch; re-check before current-state claim. |
| `agent/operations-project-listener-option-c-20260913` | Relevant WP-02 source branch; re-check before current-state claim. |
| `agent/quality-management-evidence-gate-inventory-20260913` | Relevant WP-04 source branch; re-check before current-state claim. |
| `agent/security-sec-sota04-requirement-verification-20260913` | Relevant WP-05 source branch; re-check before current-state claim. |
| `agent/fintech-sec-sota02-f01-ai-chat-trust-20260910` | Historical/stale evidence only unless current correlation proves otherwise. |
| older listener/version/template branches | Must be classified from current ref/PR/main state; historical labels are not self-authorizing. |

**Rule:** Branch rows are evidence hints only. Each source-chat closure run re-resolves the exact branch/head state.

## 10. Source Chat Coverage Register

The register is cumulative. `PENDING_CLOSURE_CORRELATION` means the chat must still run the closure prompt below. Duplicate chats are still recorded because unique approvals or decisions may exist in only one copy.

| ID | Date | Source chat / topic | Primary target WP | Project/Owner route | Coverage state | Closure state |
|---|---|---|---|---|---|---|
| CHAT-001 | 2026-09-13 | Markdown Vollständigkeit prüfen | WP-13 | CAPITAL-AI-DOC | Incorporated into this revision | CURRENT_CHAT_OPEN |
| CHAT-002 | 2026-09-11 | Finance Repo Speicher / erhöhte Action-Volumen | WP-04, WP-06 | QM/OPS | Topic preserved; semantic delta review pending | PENDING_CLOSURE_CORRELATION |
| CHAT-003 | 2026-09-11 | Sicherheitsarchitektur: PostHog, CodeQL, PR-Klassen | WP-04, WP-05, WP-12 | QM/SEC/OPS | Core goals preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-004 | 2026-09-10 | Multi-LLM Gateway Watch | WP-07, WP-15 | OPS / external watch | Cadence/source policy preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-005 | 2026-09-11 | LLM Gateways prüfen / migrieren | WP-07 | OPS | Core convergence goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-006 | 2026-09-07 | Plugins und Open Source Tools Trend | WP-06, WP-07, WP-15 | OPS/GOV advisory | Cost/license classification goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-007 | 2026-09-10 | OAuth2 MCP Gateway Vorteile | WP-07 | OPS/CLIENT/SEC | Architecture goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-008 | 2026-09-11 | Roadmap Prozesskette Agents | WP-01, WP-02 | GOV/OPS | Event-driven PVC flow preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-009 | 2026-09-11 | Ereignisgesteuerte Überwachung | WP-02, WP-15 | OPS/external | Trigger continuation intent preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-010 | 2026-09-10 | Intelligente Prompt Auswahl | WP-01, WP-02 | GOV/OPS | Routing goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-011 | 2026-09-10 | GitHub Lesefähigkeiten / Dependencies / Enterprise | WP-06 | OPS | Capability matrix goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-012 | 2026-09-10 | Bewertungsmatrix Webanwendung / 18 PVCs | WP-12, WP-14 | OPS/QM + owner routes | Readiness dimensions preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-013 | 2026-09-13 | OPS Stage-2 Revalidation | WP-03 | CAPITAL-AI-OPS | Core goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-014 | 2026-09-13 | Projektkonsolidierung und Roadmap — copy A | WP-13 | DOC + all owners | Current consolidation goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-015 | 2026-09-13 | Projektroadmap konsolidieren — copy B | WP-13 | DOC + all owners | Possible duplicate; verify unique approvals | PENDING_CLOSURE_CORRELATION |
| CHAT-016 | 2026-09-13 | Projektkonsolidierung und Roadmap — copy C | WP-13 | DOC + all owners | Possible duplicate; verify unique approvals | PENDING_CLOSURE_CORRELATION |
| CHAT-017 | 2026-09-13 | SEC Pull Request / SEC-SOTA-04 / Auth lifecycle | WP-05 | CAPITAL-AI-SEC | Core next slices preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-018 | 2026-09-13 | QM evidence coverage / gate inventory | WP-04 | CAPITAL-AI-QM | Same-SHA gate requirement preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-019 | 2026-09-13 | FE Bond consumer payload / regressions | WP-08 | CAPITAL-AI-FE | Core presentation boundary preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-020 | 2026-09-13 | Search Console least-privileged read | WP-10 | CAPITAL-AI-SEO + OPS | Read-integration goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-021 | 2026-09-13 | OPS Option-C Project Listener Folgeumsetzung | WP-02, WP-03 | CAPITAL-AI-OPS | Core flow preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-022 | 2026-09-13 | Option-C PR Approval / Event Trigger / Versioning / Design Templates | WP-01, WP-02, WP-03, WP-08 | GOV/OPS/FE | Cross-project goals preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-023 | 2026-09-11 | PR-Vorlagenfehler / deterministische Versionierung | WP-01, WP-03, WP-04 | GOV/OPS/QM | Template/versioning goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-024 | 2026-09-11 | GOV deterministic versioning / Folge-Slice OPS | WP-01, WP-03 | GOV/OPS | Owner-return constraint preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-025 | 2026-09-11 | Branding Tokens / Pattern Badges / Universe palette | WP-08 | CAPITAL-AI-FE | Named branding decisions preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-026 | 2026-09-11 | SEO Technical Gate next step | WP-10 | CAPITAL-AI-SEO / FE / OPS | Provider-read + handoff goal preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-027 | 2026-09-10 | Capital AI Plugin Watch | WP-06, WP-12, WP-15 | OPS/external | Daily Enterprise/readiness extension preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-028 | 2026-09-10 | Architecture Fluency | WP-15 | external learning | German definitions + English terms + vocabulary rule preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-029 | 2026-09-10 | Wöchentliche KI Briefings | WP-12, WP-15 | external research | Monday report/readiness/deep-research/quick-win requirements preserved | PENDING_CLOSURE_CORRELATION |
| CHAT-030 | 2026-09-13 | Governance-Dokumentvergleich & kompakte Ereigniskette bis zur ersten Chatbefehls-Bearbeitung | WP-01 | CAPITAL-AI-GOV / PVC-05; productive client/runtime dependency owner-routed | Current-main correlated; DELTA-016 incorporated | SAFE_TO_CLOSE |

| CHAT-031 | 2026-09-13 | CAPITAL-AI-SEC project-roadmap consolidation source; original project-wide deletion request followed by source-specific PR #900 closure order | WP-05, WP-13 | DOC/PVC-03 preservation; SEC subject owner, no productive PVC | DELTA-017 preserves source semantic delta; readback required | SAFE_TO_DELETE only after verified readback; other SEC chats remain pending |

**Coverage rule:** The register is not complete merely because these known chats are listed. Every additional project-folder chat discovered during execution is appended before that folder can be declared closed.

## 11. Consolidation Delta Register

A delta is entered whenever a still-valid material source-chat point was not already semantically preserved in the branch.

| Delta ID | Source | Target WP | Missing semantic content | Owner/PVC | Branch action | Status | Exit gate |
|---|---|---|---|---|---|---|---|
| DELTA-001 | CHAT-002 | WP-04/WP-06 | GitHub Action storage/volume optimization in relation to event-trigger development chain | QM/OPS | Added to WP-04/WP-06 | INCORPORATED | Source chat finds no additional unique semantic constraint |
| DELTA-002 | CHAT-003 | WP-04/WP-05/WP-12 | PostHog + CodeQL security fit; PR-class check capsules; avoid unnecessary deploy/build | QM/SEC/OPS | Added | INCORPORATED | Source chat fully correlates against these sections/current main |
| DELTA-003 | CHAT-004 | WP-07/WP-15 | Multi-provider watch cadence twice daily; official + major technical publications | OPS/external | Added | INCORPORATED | No other unique provider-watch rule remains |
| DELTA-004 | CHAT-008/009/010 | WP-01/WP-02 | Roadmaps as flowing event-triggered PVC process; continuation trigger; intelligent prompt routing | GOV/OPS | Added | INCORPORATED | Chat-by-chat correlation confirms no missing payload |
| DELTA-005 | CHAT-011 | WP-06 | Enterprise read/write/capability matrix concept | OPS | Added | INCORPORATED | Capability scope and authority boundaries verified |
| DELTA-006 | CHAT-012 | WP-12/WP-14 | 18-PVC readiness dimensions including monetization/marketing/backend/frontend/security/Enterprise utilization | owner-routed | Added | INCORPORATED | Source chat has no extra scoring/measurement contract |
| DELTA-007 | CHAT-013 | WP-03 | Stage-2 deterministic version/release validation | OPS | Added | INCORPORATED | Source chat confirms exact authority/doc set or supplies further delta |
| DELTA-008 | CHAT-017 | WP-05 | SEC-SOTA-04 current-main rematerialization + SEC-AUTH-LIFECYCLE follow-up | SEC | Added | INCORPORATED | Source chat confirms no additional security decision is chat-only |
| DELTA-009 | CHAT-018 | WP-04 | Same-SHA evidence coverage and explicit PASS/FAIL/NOT_AVAILABLE | QM | Added | INCORPORATED | Full gate list correlated |
| DELTA-010 | CHAT-019/025 | WP-08 | Bond presentation disablement, Krypto naming, Universe palette, pattern intensity | FE | Added | INCORPORATED | Exact design tokens/consumers verified from source chat/current repo |
| DELTA-011 | CHAT-020/026 | WP-10 | Least-privileged Search Console read and provider-read technical gate separation | SEO/OPS/FE | Added | INCORPORATED | Provider/credential/manual boundaries verified |
| DELTA-012 | CHAT-023/024 | WP-01/WP-03/WP-04 | Versioned PR template and deterministic version semantics must follow current authority | GOV/OPS/QM | Added | INCORPORATED | Source chat supplies no newer conflicting Owner decision |
| DELTA-013 | CHAT-027 | WP-06/WP-12/WP-15 | Daily integration watch + Enterprise options + readiness/competitor/social topic outputs | OPS/external | Added | INCORPORATED | Automation definition correlated |
| DELTA-014 | CHAT-028/029 | WP-12/WP-15 | Weekly German architecture fluency + vocabulary; Monday AI/FinTech deep-research/readiness/quick-wins report | external | Added | INCORPORATED | Automation definitions correlated |
| DELTA-015 | prior GOV-07 context | WP-01 | Verified SEC input must not promote unrelated owner-return states; prior bounded scope remains approval-gated | GOV | Added | INCORPORATED | Current GOV roadmap/authority revalidates or supersedes this constraint |
| DELTA-016 | CHAT-030 | WP-01 | Preserve the compact staged/lazy pre-command resolution flow; current-main split of resolved GOV-CHAT-074/072 versus still-stale DevelopmentChain/GOV projections; ADR-0069 M10 contradiction; `AUTH-GOV-CONTROL-PLANE` 1.1/1.2/1.3 version drift; validator gaps for projection freshness and authority-target version headers | CAPITAL-AI-GOV / PVC-05; productive client/runtime work remains CLIENT/PVC-01 or canonical runtime owner | Added to WP-01 and PR-G0; source chat registered and terminally classified | INCORPORATED | GOV current-state projections/authority versions are reconciled or explicitly blocked; validator coverage includes these drift classes; compact pre-command flow is represented under existing authority without parallel control plane |

| DELTA-017 | CHAT-031 | WP-05/WP-13 | SEC-specific vision/mission proposals, category mapping, existing SOTA04 branch instead of duplicate recreation, concrete verification/provider/owner gates, document drift, historical timing proposals, source-versus-folder deletion distinction and explicit PR #900-only update constraints | DOC/PVC-03 preservation; SEC/GOV/OPS/CLIENT/DATA/FINTECH/COMP retain subject boundaries | Minimal source refinement in WP-05 plus source/delta/closure records; no foreign implementation | INCORPORATED — readback required before closure assertion | Exact branch readback preserves all source decisions/dependencies; no material unique content remains; no folder-wide closure inferred |

New deltas are appended, never silently folded away.

## 12. Source-Chat Closure Prompt — run in every chat

Copy and run the following prompt inside **each source chat**.

```text
AUFTRAG: Vollständige Source-Chat-Konsolidierung mit deterministischer Closure-Entscheidung.

Repository:
capital-ai-online/Finance

Konsolidierungs-Branch:
agent/documentary-chat-workpackage-consolidation-20260913

Konsolidierungsdatei:
docs/projects/documentary/evidence/CAPITAL_AI_CHAT_WORKPACKAGE_CONSOLIDATION_2026-09-13.md

ZIEL:
Prüfe den GESAMTEN noch material relevanten Inhalt dieses Chats gegen current main und den Konsolidierungs-Branch. Alles noch gültige Material, das im Branch nicht semantisch erhalten ist, muss Owner-korrekt dem richtigen WP-01..WP-15 zugeordnet und in die Konsolidierungsdatei an der richtigen Stelle eingearbeitet werden. Der Chat darf erst SAFE_TO_CLOSE erhalten, nachdem die Branch-Repräsentation nach dem Write erneut gelesen und verifiziert wurde.

VERPFLICHTENDER START:
1. Ermittle den dann aktuellen main SHA.
2. Lies /AGENTS.md@current-main vollständig.
3. Löse aus docs/projects/README.md + docs/projects/PROJECT_VALUE_CHAIN.md:
   - Current Project
   - Current Project Folder
   - Primary PVC
   - Primary Owner
   - Project Scope
4. Lies das README und die ROADMAP des betroffenen Projekts sowie relevante accepted ADR/active ESS.
5. Prüfe offene PRs, relevante aktive Branches/Writer, changed-file overlap, semantic overlap und Authority-/Namespace-Konflikte.
6. Lies die Konsolidierungsdatei vom Konsolidierungs-Branch vollständig.
7. Keine historische Chat-Aussage, SHA, Branch- oder PR-Angabe ungeprüft als current truth übernehmen.

EXTRAKTION:
Extrahiere aus dem gesamten Chat jeden material relevanten Punkt, insbesondere:
- Human-/Owner-Entscheidungen;
- freigegebene oder abgelehnte Optionen;
- Vision, Mission, Zielbild und Scope;
- konkrete Aufgaben / Work Packages;
- Prioritäten und zeitliche Reihenfolge;
- Branch-/PR-/SHA-Zustände;
- Security-/Data-Integrity-/Mutation-Grenzen;
- Architecture-/Design-/Branding-/Product-Entscheidungen;
- Provider-/Credential-/Manual-Gates;
- Dependencies und Owner-Handoffs;
- Tests, Checks, Evidence und NOT_RUN/NOT_AVAILABLE;
- Blocker;
- nächste Schritte;
- Exit Gates;
- wiederkehrende Watches/Automationen, sofern sie zur Projektarbeit gehören.

KORRELATION:
Für JEDEN extrahierten Punkt:
A. Prüfe current main.
B. Prüfe die kanonische Owner-Roadmap.
C. Prüfe relevante ADR/ESS/Code/Tests/Evidence.
D. Prüfe den Konsolidierungs-Branch.
E. Klassifiziere:
   FULLY_CONTAINED
   PARTIALLY_CONTAINED
   NOT_CONTAINED
   DONE_MAIN
   SUPERSEDED
   OBSOLETE
   EXTERNAL_ONLY
   REQUIRES_CORRELATION

WICHTIG:
Ein WP-Titel allein bedeutet NICHT FULLY_CONTAINED. Die materielle Semantik muss erhalten sein.

BRANCH-UPDATE:
Für jeden PARTIALLY_CONTAINED oder NOT_CONTAINED Punkt, der nach current-main-Korrelation weiterhin gültig ist:
1. Bestimme Ziel-WP WP-01..WP-15 oder NEW_WORK_PACKAGE_REQUIRED.
2. Bestimme Primary Owner/PVC.
3. Formuliere die minimale vollständige semantische Ergänzung.
4. Ergänze sie in der Konsolidierungsdatei:
   - im passenden WP unter Preserved content/Open work/Dependencies/Exit gate;
   - im Source Chat Coverage Register;
   - im Consolidation Delta Register.
5. Überschreibe keine fremde Owner-Authority und implementiere keine Runtime-/App-/Production-Änderung.
6. Wenn der aktuelle Ausführungspfad Repository-Schreibzugriff auf den bereits bestehenden Konsolidierungs-Branch besitzt, schreibe die Dokumentänderung dort hinein.
7. Wenn kein autorisierter Schreibpfad verfügbar ist, gib einen exakten kopierbaren CONSOLIDATION PATCH aus und entscheide NOT_SAFE_TO_CLOSE — BRANCH_UPDATE_REQUIRED.
8. Nach jedem Write: Konsolidierungsdatei erneut vom Branch lesen und prüfen, dass die Ergänzung wirklich enthalten ist.

MASTER-ROADMAP-SYNC:
Prüfe nach dem Delta, ob sich:
- Gate-Reihenfolge,
- Priorität,
- Owner-Routing,
- Blocker,
- nächster Webanwendungs-Meilenstein oder
- Production-Readiness Exit Criteria
ändern.
Aktualisiere nur die abgeleitete Master-Roadmap-Projektion; kanonischer Projektstatus bleibt in der Owner-Roadmap.

AUSGABE:

### CHAT-CLOSURE CORRELATION
- Source Chat:
- Current main SHA:
- Current Project:
- Project Folder:
- Primary PVC:
- Primary Owner:
- Canonical Roadmap:
- Relevante aktive Branches/PRs:
- Zugeordnete WP:
- Konsolidierungs-Branch Head vor Update:
- Konsolidierungs-Branch Head nach Update:

| Chat-Inhalt / Entscheidung | Status | Current Evidence | Branch Location | Delta ID |
|---|---|---|---|---|

### UNIQUE CONTENT NOT YET PRESERVED
- Nur Material auflisten, das nach dem Lauf noch NICHT im Branch gesichert ist.
- Wenn nichts: NONE.

### CONFLICTS / STALE STATE
- Historische/stale Chat-Aussagen aufführen und ihre aktuelle Disposition nennen.
- Wenn nichts: NONE.

### BRANCH UPDATE RESULT
- UPDATED_AND_VERIFIED
- NO_UPDATE_REQUIRED
- UPDATE_REQUIRED_BUT_NO_WRITE_CAPABILITY
- BLOCKED_BY_CORRELATION

### CLOSURE DECISION
Gib GENAU eine terminale Entscheidung:
- SAFE_TO_CLOSE
- NOT_SAFE_TO_CLOSE

SAFE_TO_CLOSE ist nur erlaubt, wenn:
1. UNIQUE CONTENT NOT YET PRESERVED = NONE;
2. alle gültigen fehlenden Inhalte nachweislich im Konsolidierungs-Branch oder bereits kanonisch auf current main erhalten sind;
3. ein erfolgter Branch-Write erneut gelesen/verifiziert wurde;
4. keine ungeklärte Human-/Owner-Entscheidung nur im Chat verbleibt.

Andernfalls zwingend:
NOT_SAFE_TO_CLOSE

Falls NOT_SAFE_TO_CLOSE:
- nenne exakt den verbleibenden Blocker;
- liefere bei fehlendem Schreibzugriff einen CONSOLIDATION PATCH mit Ziel-WP, Zielabschnitt, exaktem Inhalt, Owner/PVC, Evidence, Status, Blocker, Next Step und Exit Gate.

Keine App-/Runtime-/Production-Mutation. Kein PR. Kein Merge. Kein Deployment.
Beende mit höchstens zwei owner-korrekten nächsten Schritten.
```

## 13. Project-Folder Consolidation Prompt — run once per project folder after its chats

Run this only after all known chats in the project folder have individually executed the Source-Chat Closure Prompt.

```text
AUFTRAG: Projektfolder-Abschlusskorrelation für CAPITAL-AI Chat-Konsolidierung.

Repository:
capital-ai-online/Finance

Konsolidierungs-Branch:
agent/documentary-chat-workpackage-consolidation-20260913

Konsolidierungsdatei:
docs/projects/documentary/evidence/CAPITAL_AI_CHAT_WORKPACKAGE_CONSOLIDATION_2026-09-13.md

ZIEL:
Stelle fest, ob ALLE relevanten Chats dieses Projektfolders verlustfrei in current main oder im Konsolidierungs-Branch erhalten und Owner-korrekt geroutet sind. Prüfe anschließend die abgeleitete Production-Readiness Master Roadmap gegen die aktuelle Projekt-Roadmap.

1. Ermittle current main und lies /AGENTS.md vollständig.
2. Löse Current Project/Folder/PVC/Primary Owner aus den kanonischen Mapping-Dateien.
3. Lies Projekt-README, Projekt-ROADMAP und relevante accepted ADR/active ESS.
4. Lies den Source Chat Coverage Register.
5. Finde alle Chats dieses Projektfolders, auch Duplikate/Kopien.
6. Für jeden Chat muss ein terminales Ergebnis vorliegen.
7. SAFE_TO_CLOSE-Chats müssen UNIQUE CONTENT NOT YET PRESERVED = NONE nachweisen.
8. Prüfe, ob alle zu diesem Projekt gehörenden Delta-IDs im Branch vorhanden und korrekt Owner-geroutet sind.
9. Vergleiche Projekt-Roadmap und Master-Roadmap-Projektion:
   - fehlende Tasks,
   - stale Tasks,
   - falsche Priorität,
   - falscher Owner/PVC,
   - fehlende Dependencies,
   - fehlende Exit Gates.
10. Noch gültige fehlende Chat-Inhalte direkt in den Konsolidierungs-Branch einarbeiten, wenn autorisierter Schreibzugriff verfügbar ist; danach erneut lesen/verifizieren.
11. Keine fremde Owner-Roadmap als Teil dieses Documentary-Branches verändern.
12. Keine Runtime-/App-/Production-Mutation.

AUSGABE:

### PROJECT-FOLDER CLOSURE
- Current Project:
- Folder:
- Primary PVC:
- Primary Owner:
- Current main:
- Canonical Roadmap:
- Chats discovered:
- Chats SAFE_TO_CLOSE:
- Chats NOT_SAFE_TO_CLOSE:
- Open consolidation deltas:
- Master Roadmap impact:

### FOLDER DECISION
Gib GENAU eine Entscheidung:
- PROJECT_FOLDER_CHAT_SET_CLOSED
- PROJECT_FOLDER_CHAT_SET_NOT_CLOSED

PROJECT_FOLDER_CHAT_SET_CLOSED ist nur erlaubt, wenn:
- jeder relevante Chat terminal geprüft wurde;
- jeder Chat SAFE_TO_CLOSE ist;
- alle gültigen Deltas im Branch verifiziert sind;
- keine material relevante Owner-Entscheidung nur in Chats verbleibt;
- die Master-Roadmap-Projektion owner-korrekt ist.

Bei NOT_CLOSED: nenne jeden blockierenden Chat/Delta exakt.
```

## 14. Closure Decision Ledger

Populate only from completed source-chat runs.

| Source Chat ID | Decision | Verified Branch Head | Unique content remaining | Notes |
|---|---|---|---|---|
| CHAT-001 | OPEN — current consolidation chat | pending | this revision is being materialized | Do not close until branch write verification completes. |
| CHAT-030 | SAFE_TO_CLOSE | post-write read verified; exact branch head is reported in the source-chat closure output | NONE | DELTA-016 incorporated; terminalized GOV-CHAT-074/072 separated from still-current drift findings. |

| CHAT-031 | SAFE_TO_DELETE conditional on successful exact branch readback | Exact post-write SHA reported by source-chat closure output; immutable commit introducing DELTA-017 | NONE after readback | Source-only preservation; PR #900 remains unmerged; full SEC folder and substantive Security gates remain open. |

## 15. Project-Folder Closure Ledger

| Project | Folder | Chats discovered | SAFE | NOT SAFE | Folder decision | Last correlated main |
|---|---|---:|---:|---:|---|---|
| CAPITAL-AI-CLIENT | `docs/projects/agent-client/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-OPS | `docs/projects/operations/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-DOC | `docs/projects/documentary/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-GOV | `docs/projects/governance/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-DATA | `docs/projects/data/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-FINTECH | `docs/projects/fintech/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-QM | `docs/projects/quality-management/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-SEC | `docs/projects/security/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-COMP | `docs/projects/compliance/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-FE | `docs/projects/frontend/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-SEO | `docs/projects/seo/` | pending | pending | pending | NOT_YET_RUN | pending |
| CAPITAL-AI-SOCIAL | `docs/projects/social-media/` | pending | pending | pending | NOT_YET_RUN | pending |

## 16. Final Master-Roadmap Promotion Gate

This consolidation becomes ready for a final Master-Roadmap handoff only when:

1. every relevant source chat is registered;
2. every registered source chat has `SAFE_TO_CLOSE`;
3. every project folder has `PROJECT_FOLDER_CHAT_SET_CLOSED`;
4. `UNIQUE CONTENT NOT YET PRESERVED = NONE` globally;
5. all Deltas are `INCORPORATED`, `DONE_MAIN`, `SUPERSEDED`, `OBSOLETE` or `EXTERNAL_ONLY`;
6. every non-external item has one Primary Owner/PVC or an explicit `REQUIRES_CORRELATION` blocker;
7. all canonical project Roadmaps have been re-read against then-current main;
8. Master gate ordering has been recalculated from those current Roadmaps;
9. no Master-Roadmap statement contradicts accepted ADR/ESS/AUTH/CTRL;
10. Production Readiness criteria are evidence-backed and contain no synthetic PASS/percentage.

At that point the derived master view may be handed to the appropriate current Owner/Governance process for canonical portfolio treatment. This Documentary artifact alone does not elevate itself into repository Authority.

## 17. Consolidation Rule

This artifact preserves chat knowledge and provides a derived Production-Readiness orchestration. It does not create a second status truth. Project Roadmaps retain execution status and priority inside their ownership boundary; `/AGENTS.md` and accepted authorities retain repository authority.

Historical chat content is evidence, never current truth, until correlated against current main.

## 18. Current next steps

1. Execute the Source-Chat Closure Prompt in every registered source chat and append newly discovered chats/deltas.
   **Exit Gate:** every in-scope chat has a verified terminal `SAFE_TO_CLOSE` or remains explicitly `NOT_SAFE_TO_CLOSE` with a concrete blocker.

2. After all chats of each project folder are safe, execute the Project-Folder Consolidation Prompt and then re-correlate the Production Readiness Master Roadmap candidate.
   **Exit Gate:** all project-folder ledgers are closed and the final Master-Roadmap promotion gate is satisfied.