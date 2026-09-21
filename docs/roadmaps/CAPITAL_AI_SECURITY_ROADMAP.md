# CAPITAL-AI Security Roadmap

**Document ID:** `DOC-ROADMAP-CAPITAL-AI-SEC-2026-08-31`  
**Project ID:** `CAPITAL-AI-SEC`  
**Version:** `2.5.0`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY / NON-AUTHORIZING`  
**Date:** `2026-09-21`  
**Repository baseline:** `main@ad47710808b179afb7b969f1c12825b4064be866`  
**Role:** `CROSS_CUTTING_SECURITY`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01` through `PVC-18` as Security overlay  
**Owner:** `CAPITAL-AI-SEC` for Security requirements/findings/testing/verification only  
**Security component:** `src/platform/Security`  
**Component specification:** ESS-0006 v1.2.0 — Security & Compliance  
**Existing hardening program:** `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`  
**SOTA baseline:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`  
**SEC-SOTA-02 evidence:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`  
**SEC-SOTA-04 matrix:** `docs/evidence/security/CAPITAL_AI_SEC_ASVS_5_VERIFICATION_MATRIX_2026-09-11.md`  
**Trust root:** `/AGENTS.md`

> CAPITAL-AI-SEC owns Security requirements, threat analysis, Security testing, finding lifecycle and independent verification. It owns no productive `PVC-*` stage and does not convert a Security requirement into implementation ownership of another project.

## 1. Current authority and routing model

Current work resolves from `/AGENTS.md` on current `main`, canonical project/PVC mapping, this roadmap, applicable accepted ADR/ESS contracts, then code/tests/evidence. Withdrawn post-PVC overlays are historical/non-authorizing. `ESS-0006` preserves the bounded Security component model and `ESS-0019` is the current provider-neutral AI Agent Control Plane. Productive remediation remains with the affected Primary Owner except for a cleanly separable bounded Security-primary remediation allowed by `CTRL-SEC-BOUNDED-REMEDIATION-001`; that delegation never transfers long-term file, Domain or PVC ownership.

External standards and guidance are `ADVISORY_NON_AUTHORIZING`. Current `/AGENTS.md` excludes NIST publications/frameworks from the CURRENT repository governance baseline.

## 2. Security workstreams

| ID | Workstream | Security responsibility |
|---|---|---|
| `SEC-01` | Threat Modeling | threats, attack surfaces, trust boundaries, owner/PVC correlation |
| `SEC-02` | Identity & Access | AuthN/AuthZ/MFA/AAL/session/least-privilege requirements and verification |
| `SEC-03` | Application/API Security | API/browser/capability/input/output/redirect requirements and verification |
| `SEC-04` | Data & Secrets | confidentiality, integrity, RLS/grants, provenance, credentials |
| `SEC-05` | Infrastructure | runtime/container/network/process/recovery assurance |
| `SEC-06` | Supply Chain | dependency/source/build/artifact/provenance/release-integrity assurance |
| `SEC-07` | AI / Agent Security | prompt/tool/agent/MCP authority and untrusted-content boundaries |
| `SEC-08` | Security Testing | positive/negative/regression/configuration Security tests |
| `SEC-09` | Findings | triage, owner routing, remediation requirement, residual-risk record |
| `SEC-10` | Verification | independent exact-identity/runtime/provider verification and closure |

## 3. State-of-the-art overlay — 2026-09-11

The SOTA layer is integrated into the existing workstreams, not a parallel governance system. OWASP Top 10:2025, ASVS 5.0.0, GenAI/Agentic/Agent Control Standard/Secure MCP guidance, SLSA v1.2 and CISA Secure by Design remain advisory inputs. CRA readiness remains a Compliance applicability dependency owned by `CAPITAL-AI-COMP`.

## 4. Current-main consolidation

| Work item | Current result |
|---|---|
| Security project/PVC consolidation | `DONE_MAIN`; PR #749 merged |
| Security Assessment capability + raw-test binding | `DONE_MAIN` |
| `SEC-ASSESS-ALIGN` | `DONE_MAIN`; PR #766 merged |
| `SEC-SOTA-01` | `DONE_MAIN`; PR #832 merged and PR #837 synchronized active status projections |
| PR #837 Hosted validation | final PR head `d5e77d5fded414931896f4e6781e3dcfffcaed19`: Governance, Container Security and Class-D `build-and-test` `success`; Human merge `8ab11ae749639a67c28b3d685f4943df19b9e72c` |
| `SEC-SOTA-02` | `INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / PR GATE OPEN` |
| `SEC-SOTA-03` | `VERIFIED_MAIN / CLOSED`; PR #870 Vite floor, PR #872 artifact digest binding, PR #882 MCP executable identity, PR #887 closeout projection |
| `SEC-SOTA03-MCP-EXECUTABLE-IDENTITY` | PR #882 final PR head `1969555c885ea0e5fb5cc1ee30648b1d5950b773`; Human merge `d67de465c89013f5626a7de8d16569b0017c5ada`; final Hosted CI, Container Security and Governance revalidation `success` |
| `SEC-SOTA-04` | `MATRIX_INVENTORIED / VERIFICATION_OPEN`; 17-chapter ASVS 5.0 matrix created on fresh branch from `main@a7ed0e9139ce9e2899afd863baf2e50f8eed75fb` |
| `SEC-VERIFY-R2-04` | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` |
| Owner Device Authorization Stage-C | `COMPLETE / HISTORICAL` |
| User Lifecycle Security integration | `IMPLEMENTED_MAIN / RESIDUALS OPEN` |
| User Lifecycle subscription identity | `PARTIAL / NOT VERIFIED` |

## 5. Security-owned execution roadmap

### P0.1 `SEC-SOTA-01` — SOTA baseline and roadmap convergence

**State:** `DONE_MAIN`.

PR #832 created the SOTA baseline and synchronized Security workstreams; PR #837 subsequently normalized the active lifecycle projections. Historical evidence keeps its execution-time baseline where appropriate.

### P0.2 `SEC-VERIFY-R2-04` — fatal-process current-main re-verification

**State:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`.

Repository inspection confirms fatal latch, unhealthy readiness, one bounded shutdown initiation and non-zero fatal exit intent. Generic successful deployment/identity evidence does not prove the destructive supervisor/restart/readiness behavior. Exact runtime evidence remains `CAPITAL-AI-OPS / PVC-08`.

### P0.3 `SEC-SOTA-02` — AI/Agent/MCP control inventory

**State:** `INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / PR GATE OPEN`.

Evidence: `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`.

Inspected current surfaces include:

- `/AGENTS.md`, ESS-0019, ADR-0058 and ADR-0059;
- `src/platform/Security/agentIam.ts` and `providerProfile.ts`;
- generic and Systemadmin audited execution paths;
- Documentary AI maintenance authorization and real Git execution host;
- productive FinTech LLM agents and parallel orchestrators;
- shared Anthropic/OpenAI model routing;
- AI Chat RAG retrieval/prompt assembly and caller-provided history;
- Score Explainability and Admin Diagnostics Supabase agent tools;
- current `.mcp.json` developer-tooling boundary.

The inventory confirms substantial existing controls: deny-by-default non-inheriting Agent IAM, provider-profile ceilings, self-authority denial, replay wiring on the audited Systemadmin path, durable audit patterns, read-only score evidence, single-use/fingerprint-gated Admin side effects, research-only/non-canonical multi-agent aggregation and no productive in-app MCP protocol server requirement.

Confirmed/evidence gaps are owner-routed as follows:

| ID | Finding | Primary productive owner / PVC | State |
|---|---|---|---|
| `SEC-SOTA02-F01` | AI Chat puts retrieved repository text into the trusted system-instruction channel and accepts caller-supplied assistant history | `CAPITAL-AI-FINTECH / PVC-15`; CLIENT/PVC-01 dependency | `CONFIRMED / OWNER_ROUTED` |
| `SEC-SOTA02-F02` | Documentary control loop can automatically dispatch Draft-PR creation without the current exact Human PR-creation approval precondition | `CAPITAL-AI-DOC / PVC-03` | `CONFIRMED / OWNER_ROUTED` |
| `SEC-SOTA02-F03` | Documentary real Git mutation path uses synchronous Agent policy checks without durable ADR-0059-grade authorization/outcome evidence at the real host | `CAPITAL-AI-DOC / PVC-03` | `CONFIRMED / OWNER_ROUTED` |
| `SEC-SOTA02-F04` | live external MCP/connector host AuthN/AuthZ/tool-grant/session isolation is not independently proven from repository state; repository `.mcp.json` executable identity is separately closed under `SEC-SOTA-03` | `CAPITAL-AI-OPS / PVC-02` | `EVIDENCE_GAP / OWNER_ROUTED` |
| `SEC-SOTA02-F05` | current ESS-0018/ADR-0051 retain stale `CLAUDE.md` authority wording despite `/AGENTS.md` being sole Trust Root | `CAPITAL-AI-GOV / PVC-05` | `CONFIRMED / OWNER_ROUTED` |
| `SEC-SOTA02-F06` | AI Chat history/session continuity is caller-supplied and not independently attested; no cross-user memory leak is claimed | `CAPITAL-AI-CLIENT / PVC-01`; FINTECH/PVC-15 dependency | `EVIDENCE_GAP / OWNER_ROUTED` |

Security does not absorb foreign productive implementation. `VERIFIED/CLOSED` requires owner remediation plus exact return evidence unless the smallest pure Security-primary fix independently qualifies under current bounded Security-remediation authority.

Explicit non-findings:

- absence of an in-app MCP protocol server is not a gap under current ESS-0018/ADR-0041 state;
- retired M10 / `AUTHORIZE_PR_CI` is not a current gap;
- no productive direct bypass caller was found for the two Supabase Admin write tools;
- no direct agent-to-agent capability/authority delegation was found in the inspected FinTech parallel orchestrators;
- current Systemadmin replay integration remains closed by the real-caller wiring recorded in existing M9 evidence.

### P0.4 `SEC-SOTA-03` — supply-chain assurance inventory

**State:** `VERIFIED_MAIN / CLOSED`.

The repository-owned bounded SOTA-03 inventory is closed. PR #870 established the Vite dependency floor. PR #872 closed actual-runtime artifact digest/provenance/signature/deployment binding. PR #882 closed the final confirmed MCP executable-identity gap. PR #887 then Human-merged the independent closeout projection as `269ef527a1dbc1a9373deec3c87e86e910d47b34`. Current `main@a7ed0e9139ce9e2899afd863baf2e50f8eed75fb` is 16 commits ahead of that merge with merge base exactly at the #887 merge; intervening work does not modify the three SOTA03 closeout projection files.

External MCP/connector host AuthN/AuthZ, tool grants, session isolation and read-only ceiling remain the separate `CAPITAL-AI-OPS / PVC-02` evidence-return scope from `SEC-SOTA02-F04`. Repository executable identity closure does not claim or require closure of that external host-assurance finding.

### P1 `SEC-SOTA-04` — application/API ASVS 5.0 verification matrix

**State:** `MATRIX_INVENTORIED / VERIFICATION_OPEN`.

Evidence: `docs/evidence/security/CAPITAL_AI_SEC_ASVS_5_VERIFICATION_MATRIX_2026-09-11.md`.

The branch-level matrix covers all 17 stable ASVS 5.0.0 chapters at repository applicability/evidence level and maps them to current implementation, tests/evidence and productive ownership without treating framework mapping as PASS. Current strong-evidence areas are Authentication/MFA (V6), Authorization (V8), browser/API response security (V3/V4) and Security logging/error behavior (V16), but they remain `NOT_VERIFIED` until focused independent verification is executed. V5 file handling and V10 OAuth/OIDC are `APPLICABILITY_OPEN`; V17 WebRTC is narrowly `NOT_APPLICABLE_CURRENT_REPO` at this inspected baseline. The concrete runtime dependency `ASVS5-V12-TRANSPORT-EVIDENCE` is `EVIDENCE_GAP / OWNER_ROUTED` to `CAPITAL-AI-OPS / PVC-08`.

This matrix is a coverage/gap-analysis surface only. It is not certification, full ASVS conformance or a second Security standard/control plane.

### P1 `SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle clarity

ESS-0020 remains proposed. Implementation evidence and normative lifecycle remain separate. Security does not self-promote, retire or accept risk for lifecycle authority.

### Dependency `SEC-COMP-CRA-01`

`CAPITAL-AI-COMP` determines CRA applicability and obligation scope. Security may verify technical vulnerability/incident evidence readiness after that decision; this roadmap does not make a legal determination.

## 6. Foreign-owner Security return queue

| Finding / residual | Productive owner | Current Security state | Security gate |
|---|---|---|---|
| `SEC-SOTA02-F01` | FINTECH / PVC-15; CLIENT/PVC-01 dependency | confirmed / routed | indirect-injection + role-provenance negative tests; no tool/authority escalation |
| `SEC-SOTA02-F02` | DOC / PVC-03 | confirmed / routed | exact Human approval before PR workflow dispatch |
| `SEC-SOTA02-F03` | DOC / PVC-03 | confirmed / routed | durable attributable authorization/outcome evidence for real Git mutations |
| `SEC-SOTA02-F04` | OPS / PVC-02 | evidence gap / routed | external host permission/session/read-only evidence; repository executable identity is already `VERIFIED_MAIN / CLOSED` in SOTA-03 |
| `ASVS5-V12-TRANSPORT-EVIDENCE` | OPS / PVC-08 | `EVIDENCE_GAP / OWNER_ROUTED` | exact deployed TLS/proxy/edge configuration evidence bound to current production identity, then independent SEC verification |
| `SEC-SOTA02-F05` | GOV / PVC-05 | confirmed / routed | provider-specific authority wording removed under current Trust Root |
| `SEC-SOTA02-F06` | CLIENT / PVC-01; FINTECH/PVC-15 dependency | evidence gap / routed | stateless/session-bound history contract + negative context-substitution tests |
| `S1-R2-03` | OPS / PVC-06 | owner-routed | exact toolchain/control-plane identity after OPS remediation |
| `S1-R2-04` | OPS / PVC-04 + PVC-08 evidence | repository contract verified; runtime evidence open | exact deployed supervisor/restart/readiness evidence |
| `S1-R2-05` | OPS / PVC-02 | open owner-routed | canonical-origin/open-redirect DENY evidence |
| `S1-R2-06` | OPS parent; FINTECH/DATA children | parent evidence available; children mixed/open | per-capability DENY evidence |
| `S1-R2-07` | OPS / PVC-08 | `OPEN / UNVERIFIED` | measured restore, integrity, actual RPO/RTO |
| `S1-R2-09` | OPS / PVC-08 | evidence-dependent | compatibility/violation window + protected-path verification |
| `S1-R2-10` | OPS / PVC-08 | evidence-dependent | production reachability proof bound to deployed identity |
| `S1-R2-11` | DATA / PVC-10 | open | current/stale/wrong-identity semantics |
| User Lifecycle subscription identity | OPS / PVC-08 | `PARTIAL / NOT VERIFIED` | provider identity remediation/evidence then independent re-test |

Security verifies returned evidence; it does not absorb productive implementation.

## 7. AI/Agent Security invariants

- retrieved, model-generated, tool-returned and inter-agent content is untrusted;
- prompt content cannot override repository Authority;
- model/provider identity grants no Human/Owner or repository authority;
- agents cannot self-expand capability or self-authorize protected mutation;
- tool scopes remain least privileged and side effects remain explicitly authorized;
- identity/authentication and authorization remain separate controls;
- evidence must not leak reusable credentials, secrets or unnecessary PII;
- model recommendations are not Human/Owner approval;
- no missing in-app MCP runtime is inferred where current accepted contracts deliberately keep it unimplemented.

## 8. Finding and verification lifecycle

`DISCOVERED → TRIAGED → CONFIRMED → OWNER/PVC IDENTIFIED → REMEDIATING → IMPLEMENTED → EVIDENCE_READY → independent Security VERIFIED → CLOSED`

`EVIDENCE_READY != VERIFIED`; missing/stale/wrong-identity/`NOT_TESTED`/`NOT_AVAILABLE` evidence is not PASS; Security cannot self-accept risk. Evidence precedence remains runtime/provider observation → provider/security configuration → negative tests → hosted CI exact-head → implementation/code → scan → policy/control → roadmap.

## 9. Correlation boundary

The current SEC-SOTA04 matrix slice is correlated against `main@a7ed0e9139ce9e2899afd863baf2e50f8eed75fb`, `/AGENTS.md` Control Plane v2.10.0, the canonical project/PVC mapping, ESS-0006 v1.2.0, current application/security code/tests/evidence and stable OWASP ASVS 5.0.0 as advisory input.

- PR #887 SOTA03 closeout is Human-merged as `269ef527a1dbc1a9373deec3c87e86e910d47b34`; current main descends from it.
- Current main is 16 commits ahead of the #887 merge with merge base exactly at `269ef527a1dbc1a9373deec3c87e86e910d47b34`; no intervening change modifies the three closeout projection files.
- Fresh branch: `agent/security-asvs-verification-matrix-20260911`, created from exact current main.
- Open Pull Requests at branch creation: `0`.
- The ASVS matrix changes documentation/evidence only and does not modify runtime, provider permissions, credentials or Production configuration.
- No ASVS chapter or requirement is represented as `VERIFIED` solely from the matrix. Runtime/provider-dependent evidence remains explicitly open/routed.

## 10. Definition of Done

`SEC-SOTA-03` is `VERIFIED_MAIN / CLOSED` and remains terminal unless new evidence establishes a regression.

For this bounded `SEC-SOTA-04` matrix slice, completion means all 17 stable ASVS 5.0.0 chapters have an explicit current repository applicability/evidence disposition; applicable areas are mapped to current implementation/tests/evidence or a concrete verification gap; framework mapping alone is never PASS; productive gaps preserve actual Primary Owner/PVC; and no parallel Security control plane is created. That bounded inventory condition is satisfied on the current branch. Full ASVS verification remains open and requires focused independent requirement-level verification plus returned runtime/provider evidence where applicable.

The next Security sequence after this matrix slice completes its normal PR lifecycle is current OPS/provider evidence re-correlation for `SEC-VERIFY-ULS-001`, unless current main/roadmap reprioritizes it.

## 11. PR / merge / production boundary

PR creation requires separate explicit Human/Owner approval for the exact current-main, branch-head, changed-file scope, correlation result and resolved title after final re-correlation. Hosted checks run after PR according to current repository controls. Merge remains Human/CODEOWNER-only. CI, roadmap status or Security evidence does not authorize Release, Production or protected provider mutation.

## 5A. Active website security roadmap — SEC-WEB-HARDENING-01

**State:** `ACTIVE / ROADMAP_PROMOTED / IMPLEMENTATION_OPEN`  
**Owner direction:** 2026-09-20; roadmap promotion reaffirmed 2026-09-21  
**Original materialization:** Human-merged PR #1165  
**Current roadmap baseline:** `main@ad47710808b179afb7b969f1c12825b4064be866`  
**Canonical package:** `docs/projects/security/work-packages/SEC_WEB_HARDENING_01_PUBLIC_WEBSITE_SECURE_DEPLOYMENT.md`

SEC-WEB-HARDENING-01 is the active website/deployment Security roadmap. It reuses SEC-01..SEC-10 and all existing Release/Production/IAM/Governance controls. The roadmap is orchestration/status only and does not become a second instruction, task, finding, evidence or deployment authority.

### 5A.1 Dependency graph

| Order | Roadmap slice | Priority | Security objective | Primary implementation return | State |
|---:|---|---|---|---|---|
| 1 | `SEC-WEB-00` | P0 | exact attack-surface and control baseline | SEC correlation + owner readbacks | `READY` |
| 2 | `SEC-WEB-10` | P0 | signed single-artifact supply-chain convergence | OPS / PVC-07 + PVC-08 | `READY` |
| 3 | `SEC-WEB-20` | P1 | route-minimal browser isolation and strict CSP | FE + OPS | `READY_AFTER_P0` |
| 4 | `SEC-WEB-30` | P1 | public API/Auth/input/abuse hardening | OPS + CLIENT/FE + affected owner | `READY_AFTER_P0` |
| 5 | `SEC-WEB-40` | P1 | exact production/readiness/rollback resilience | OPS / PVC-04/07/08 | `READY_AFTER_P0` |
| 6 | `SEC-WEB-50` | P1 | independent hosted/runtime/DAST/transport assurance | SEC + QM; OPS target | `DEPENDS_ON_IMPLEMENTATION_RETURN` |

### 5A.2 P0 implementation queue

The current P0 queue is:

1. `SEC-WEB-00` — re-read current public/API/browser/deployment attack surface.
2. `SEC-WEB-F01/F16` — converge local/registry digest semantics and select one canonical registry artifact identity.
3. `SEC-WEB-F15` — build once and deploy the exact already-scanned/signed/attested artifact.
4. `SEC-WEB-F23` — enforce client/build/container secret-exposure gates and public-env allowlisting.
5. `SEC-WEB-F10` — complete current OAuth/session negative-security coverage.
6. Re-correlate Production ↔ CURRENT_MAIN, open writers and dependent PR assumptions.
7. Promote eligible P1 slices only after P0 evidence is current.

No queue item may lower an existing Required Check or reinterpret missing/stale evidence as PASS.

### 5A.3 Finding-to-workstream map

| Finding set | SEC streams | Implementation return |
|---|---|---|
| F01, F13-F17, F23 | SEC-04, SEC-06, SEC-08, SEC-10 | OPS / PVC-02/07/08; COMP overlay |
| F02-F04, F06, F09, F11-F12, F26 | SEC-03, SEC-08, SEC-10 | FE + OPS runtime |
| F05, F07-F08, F21-F25 | SEC-03, SEC-04, SEC-08, SEC-09, SEC-10 | OPS + affected domain owner |
| F10 | SEC-02, SEC-03, SEC-08, SEC-10 | CLIENT + FE/OPS affected surfaces |
| F18-F20, F27-F28 | SEC-05, SEC-08, SEC-10 | OPS / PVC-04/07/08 |
| F29-F30 | SEC-08, SEC-10 plus Governance/QM dependencies | GOV for F29; owner implementations + SEC/QM verification for F30 |

### 5A.4 Milestones

**M0 — Baseline locked:** exact current-main inventory and P0 finding identities are fresh.

**M1 — Artifact trust:** registry digest, signature, SBOM and provenance identify one artifact; deployment consumes that exact artifact.

**M2 — Browser boundary:** landing CSP/header/origin policy is minimal and production verified.

**M3 — Public capability boundary:** public API/auth/input/rate/cost behavior has negative-test evidence.

**M4 — Resilient production:** liveness/readiness/deployment identity and rollback are independently proven.

**M5 — Continuous assurance:** runtime/DAST/transport evidence is current; SEC verification and QM assurance close applicable findings.

### 5A.5 Completion criteria

The roadmap reaches `CONVERGED` only when:

- all P0/P1 findings have owner-correct terminal dispositions;
- no known unresolved CRITICAL/HIGH finding remains in the deployed artifact;
- production source SHA and deployed registry digest are exact/current;
- signature, SBOM and provenance are bound to the deployed digest;
- browser/CSP/API/Auth/abuse controls have current independent evidence;
- liveness/readiness/rollback/deployment identity evidence is current;
- runtime/DAST/transport evidence is exact-identity bound;
- CAPITAL-AI-SEC has independently verified applicable gates;
- CAPITAL-AI-QM assurance is complete where required.

The complete threat model, trust boundaries, per-finding owners and exact verification gates remain in the canonical package; this Roadmap intentionally does not duplicate them.
