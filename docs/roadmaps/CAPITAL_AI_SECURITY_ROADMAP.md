# CAPITAL-AI Security Roadmap

**Document ID:** `DOC-ROADMAP-CAPITAL-AI-SEC-2026-08-31`  
**Project ID:** `CAPITAL-AI-SEC`  
**Version:** `2.4.0`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY / NON-AUTHORIZING`  
**Date:** `2026-09-07`  
**Repository baseline:** `main@96119f958cacbf35614747380a066b87fdb1ee40`  
**Role:** `CROSS_CUTTING_SECURITY`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01` through `PVC-18` as Security overlay  
**Owner:** `CAPITAL-AI-SEC` for Security requirements/findings/testing/verification only  
**Security component:** `src/platform/Security`  
**Component specification:** ESS-0006 v1.1.0 — Security & Compliance  
**Existing hardening program:** `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`  
**SOTA baseline:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`  
**SEC-SOTA-02 evidence:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`  
**Trust root:** `/AGENTS.md`

> CAPITAL-AI-SEC owns Security requirements, threat analysis, Security testing, finding lifecycle and independent verification. It owns no productive `PVC-*` stage and does not convert a Security requirement into implementation ownership of another project.

## 1. Current authority and routing model

Current work resolves from `/AGENTS.md` on current `main`, canonical project/PVC mapping, this roadmap, applicable accepted ADR/ESS contracts, then code/tests/evidence. Withdrawn post-PVC overlays are historical/non-authorizing. `ESS-0006` preserves the bounded Security component model and `ESS-0019` is the current provider-neutral AI Agent Control Plane. Productive remediation remains with the affected Primary Owner unless implementation is inherently reusable Security infrastructure in `src/platform/Security`.

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

## 3. State-of-the-art overlay — 2026-09-07

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
| `SEC-SOTA02-F04` | live external MCP/connector host AuthN/AuthZ/tool-grant/session isolation is not independently proven from repository state; `.mcp.json` executable identity also overlaps supply-chain assurance | `CAPITAL-AI-OPS / PVC-02` | `EVIDENCE_GAP / OWNER_ROUTED` |
| `SEC-SOTA02-F05` | current ESS-0018/ADR-0051 retain stale `CLAUDE.md` authority wording despite `/AGENTS.md` being sole Trust Root | `CAPITAL-AI-GOV / PVC-05` | `CONFIRMED / OWNER_ROUTED` |
| `SEC-SOTA02-F06` | AI Chat history/session continuity is caller-supplied and not independently attested; no cross-user memory leak is claimed | `CAPITAL-AI-CLIENT / PVC-01`; FINTECH/PVC-15 dependency | `EVIDENCE_GAP / OWNER_ROUTED` |

Security does not implement those foreign productive changes in this branch. `VERIFIED/CLOSED` requires owner remediation plus exact return evidence.

Explicit non-findings:

- absence of an in-app MCP protocol server is not a gap under current ESS-0018/ADR-0041 state;
- retired M10 / `AUTHORIZE_PR_CI` is not a current gap;
- no productive direct bypass caller was found for the two Supabase Admin write tools;
- no direct agent-to-agent capability/authority delegation was found in the inspected FinTech parallel orchestrators;
- current Systemadmin replay integration remains closed by the real-caller wiring recorded in existing M9 evidence.

### P0.4 `SEC-SOTA-03` — supply-chain assurance inventory

**State:** `READY`.

Inventory lockfiles, action trust/pinning, source/build identity, artifact/container provenance, attestations/SBOM and release exact-SHA evidence. `SEC-SOTA02-F04` contributes only its executable-identity/tool-chain portion; do not duplicate the external host authorization finding.

### P1 `SEC-SOTA-04` — application/API ASVS 5.0 verification matrix

Map repository-relevant ASVS objectives to existing tests/evidence. Framework mapping alone is never PASS. Productive gaps route to actual Primary Owners.

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
| `SEC-SOTA02-F04` | OPS / PVC-02 | evidence gap / routed | external host permission/session/read-only evidence; supply-chain identity in SOTA-03 |
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

This `SEC-SOTA-02` slice is based on `main@96119f958cacbf35614747380a066b87fdb1ee40`, current `/AGENTS.md`, ESS-0006 v1.1.0, ESS-0019 v1.2.0, ADR-0058/0059 and actual current code/tests/evidence.

- PR #837 is merged and its final hosted Class-D checks passed before merge.
- Current branch: `agent/security-sota02-agent-mcp-inventory-20260907`, freshly created from the exact baseline.
- Open PR at branch creation: #839 (`CAPITAL-AI-OPS`) workflow/zizmor hardening; no changed-file overlap with this inventory slice.
- No foreign productive code, provider/MCP host permission, connector, credential, runtime or deployment mutation is included.

## 10. Definition of Done

`SEC-SOTA-02` reaches Security inventory completion when the current matrix is on main, every confirmed/evidence gap has a Primary Owner/PVC and verification gate, explicit non-gaps prevent parallel architecture, and no foreign productive remediation is hidden in the Security slice. Finding closure remains separate and requires returned owner evidence plus independent Security verification.

## 11. PR / merge / production boundary

PR creation requires separate explicit Human/Owner approval for the exact current-main, branch-head, changed-file scope, correlation result and resolved title after final re-correlation. Hosted checks run after PR according to current repository controls. Merge remains Human/CODEOWNER-only. CI, roadmap status or Security evidence does not authorize Release, Production or protected provider mutation.