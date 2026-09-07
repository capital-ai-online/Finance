# CAPITAL-AI Security Roadmap

**Document ID:** `DOC-ROADMAP-CAPITAL-AI-SEC-2026-08-31`  
**Project ID:** `CAPITAL-AI-SEC`  
**Version:** `2.3.1`  
**Status:** `ACTIVE — CROSS-CUTTING SECURITY / NON-AUTHORIZING`  
**Date:** `2026-09-07`  
**Repository baseline:** `main@fe27d901a7a505b1e0b87f8970e3f4a33991d968`  
**Role:** `CROSS_CUTTING_SECURITY`  
**Primary Project Value Chain ownership:** `[]`  
**Project coverage:** `PVC-01` through `PVC-18` as Security overlay  
**Owner:** `CAPITAL-AI-SEC` for Security requirements/findings/testing/verification only  
**Security component:** `src/platform/Security`  
**Component specification:** ESS-0006 v1.1.0 — Security & Compliance  
**Existing hardening program:** `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`  
**SOTA baseline:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`  
**Trust root:** `/AGENTS.md`

> CAPITAL-AI-SEC owns Security requirements, threat analysis, Security testing, finding lifecycle and independent verification. It owns no productive `PVC-*` stage and does not convert a Security requirement into implementation ownership of another project.

## 1. Current authority and routing model

Current work resolves from `/AGENTS.md` on current `main`, canonical project/PVC mapping, this roadmap, applicable accepted ADR/ESS contracts, then code/tests/evidence. Withdrawn post-PVC overlays are historical/non-authorizing. The former Cross-Project Handoff Contract is not a current routing authority.

`ESS-0006` v1.1.0 preserves the bounded model: Security requirements/testing/independent verification remain with `CAPITAL-AI-SEC`; productive remediation remains with the affected Primary Owner unless the implementation is inherently reusable Security infrastructure in `src/platform/Security`.

External standards and guidance are `ADVISORY_NON_AUTHORIZING`. They can inform threat models, verification objectives and findings but cannot create repository Authority, mandatory backlog, risk acceptance or productive ownership. Current `/AGENTS.md` excludes NIST publications/frameworks from the CURRENT repository governance baseline; this roadmap therefore does not use them normatively.

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

The SOTA layer is integrated into the existing workstreams, not a parallel governance system:

| Advisory reference/theme | Existing SEC workstreams | Repository use |
|---|---|---|
| OWASP Top 10:2025 | `SEC-03`, `05`, `06`, `08` | application risk, supply-chain failure, logging/alerting and exceptional-condition verification |
| OWASP ASVS 5.0.0 | `SEC-03`, `08`, `10` | repository-relevant verification objectives and negative-test mapping |
| OWASP LLM Top 10 2026 | `SEC-07`, `08` | GenAI prompt/input/output/tool risk coverage |
| OWASP Agentic Top 10 2026 | `SEC-02`, `07`, `08` | agent authority, tool abuse, memory/delegation and autonomy risks |
| OWASP Agent Control Standard | `SEC-07`, `10` | inspectability, traceability, instrumentation and runtime control objectives |
| OWASP Secure MCP guidance | `SEC-02`, `03`, `07` | AuthN/AuthZ, validation, session isolation and delegated permission boundaries |
| SLSA v1.2 | `SEC-06`, `08`, `10` | source/build provenance and attestation assurance using existing repository controls |
| CISA Secure by Design | applicable design reviews | secure outcomes/defaults/accountability lens only |
| EU CRA reporting guidance | dependency on `CAPITAL-AI-COMP` | Compliance owner determines applicability; SEC supplies technical evidence only |

## 4. Current-main consolidation

| Work item | Current result |
|---|---|
| Security project/PVC consolidation | `DONE_MAIN`; PR #749 merged |
| Security Assessment capability + raw-test binding | `DONE_MAIN` |
| `SEC-ASSESS-ALIGN` | `DONE_MAIN`; PR #766 merged |
| `SEC-SOTA-01` | `DONE_MAIN`; PR #832 merged at `75c926f12ae514036aa508ea8faf1a82b1a91059`; hosted PR checks and merge-main production identity/deployment verification completed successfully |
| `SEC-VERIFY-R2-04` | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` |
| Owner Device Authorization Stage-C | `COMPLETE / HISTORICAL` |
| User Lifecycle Security integration | `IMPLEMENTED_MAIN / RESIDUALS OPEN` |
| User Lifecycle subscription identity | `PARTIAL / NOT VERIFIED` |
| Entitlement authority S1-R2-06 | parent evidence exists; child remediation + independent verification remain |

## 5. Security-owned execution roadmap

### P0.1 `SEC-SOTA-01` — SOTA baseline and roadmap convergence

**State:** `DONE_MAIN`.

Merged by PR #832 at merge SHA `75c926f12ae514036aa508ea8faf1a82b1a91059`.

Completed:

- current-main SOTA baseline with explicit `ADVISORY_NON_AUTHORIZING` treatment;
- SOTA references mapped onto existing `SEC-01..SEC-10` workstreams;
- NIST excluded as a current normative repository baseline;
- stale `SEC-ASSESS-ALIGN` state corrected to `DONE_MAIN` after merged PR #766;
- project, detailed and work-package roadmaps synchronized;
- CRA represented only as Compliance applicability dependency;
- PR-head Governance, Container Security and CI hosted checks completed successfully;
- merge-main build/test, supply-chain attestation, exact-SHA Render deployment and post-deployment commit-identity verification completed successfully.

The original SOTA evidence remains an execution-time record and may retain its original baseline/status metadata. Current lifecycle state is projected by the active roadmaps/work packages instead of rewriting historical evidence.

### P0.2 `SEC-VERIFY-R2-04` — fatal-process current-main re-verification

**State:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`.

Repository inspection confirms the contract for fatal latch on `uncaughtException`/`unhandledRejection`, unhealthy readiness after fatal state, one bounded shutdown initiation and non-zero fatal exit intent. Evidence: `docs/evidence/security/S1_R2_04_FATAL_PROCESS_CURRENT_MAIN_REVERIFICATION_2026-09-07.md`.

This is not full runtime closure. A successful generic deployment/identity pipeline after PR #832 does not prove the specific destructive fatal-process supervisor/restart/readiness behavior. Exact deployed supervisor/restart/readiness evidence remains `CAPITAL-AI-OPS / PVC-08`.

### P0.3 `SEC-SOTA-02` — AI/Agent/MCP control inventory

**State:** `READY`.

Inventory current agent/model/tool/retrieval/inter-agent/MCP surfaces; map trust boundaries and authorization paths; test prompt-injection/authority-expansion risks; verify delegated permissions/session isolation/tool side effects; require inspectable evidence for actor/model/tool/authorization/runtime identity where applicable; route productive gaps to actual owners.

### P0.4 `SEC-SOTA-03` — supply-chain assurance inventory

**State:** `READY`.

Inventory dependency lockfiles, action trust/pinning, source identity, build identity, artifact/container provenance, attestations/SBOM where present and release exact-SHA evidence. Reuse current Development Chain/Release controls. Assess actual gaps using repository authority plus advisory SLSA v1.2 and OWASP supply-chain themes.

### P1 `SEC-SOTA-04` — application/API ASVS 5.0 verification matrix

Map repository-relevant ASVS objectives to existing tests/evidence. Framework mapping alone is never PASS. Productive gaps route to actual Primary Owners.

### P1 `SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle clarity

ESS-0020 remains proposed. Implementation evidence and normative lifecycle remain separate. Security does not self-promote, retire or accept risk for lifecycle authority.

### Dependency `SEC-COMP-CRA-01`

External CRA reporting obligations begin `2026-09-11` for in-scope products with digital elements. `CAPITAL-AI-COMP` must determine applicability and obligation scope. Security may then verify technical vulnerability/incident evidence readiness; this roadmap does not make a legal determination.

## 6. Foreign-owner Security return queue

| Finding / residual | Productive owner | Current Security state | Security gate |
|---|---|---|---|
| `S1-R2-03` Node convergence | OPS / PVC-06 | owner-routed | exact toolchain/control-plane identity after OPS remediation |
| `S1-R2-04` fatal process | OPS / PVC-04 + PVC-08 evidence | repository contract verified; runtime evidence open | exact deployed supervisor/restart/readiness evidence |
| `S1-R2-05` Stripe redirect | OPS / PVC-02 | open owner-routed | canonical-origin/open-redirect DENY evidence |
| `S1-R2-06` entitlement authority | OPS parent; FINTECH/DATA children | parent evidence available; children mixed/open | per-capability DENY evidence |
| `S1-R2-07` recovery/RPO/RTO | OPS / PVC-08 | `OPEN / UNVERIFIED` | measured restore, integrity, actual RPO/RTO |
| `S1-R2-09` strict CSP | OPS / PVC-08 | evidence-dependent | compatibility/violation window + protected-path verification |
| `S1-R2-10` demo billing isolation | OPS / PVC-08 | evidence-dependent | production reachability proof bound to deployed identity |
| `S1-R2-11` evidence identity/freshness | DATA / PVC-10 | open | current/stale/wrong-identity semantics |
| User Lifecycle subscription identity | OPS / PVC-08 | `PARTIAL / NOT VERIFIED` | provider identity remediation/evidence then independent re-test |
| User Lifecycle provider E2E | OPS / PVC-08 + applicable provider owner | incomplete | reproducible provider evidence |
| leaked-password protection | OPS / PVC-08 | defense-in-depth residual | separately authorized config change/readback |

Security verifies returned evidence; it does not absorb productive implementation.

## 7. AI/Agent Security invariants

- retrieved, model-generated, tool-returned and inter-agent content is untrusted;
- prompt content cannot override repository Authority;
- model/provider identity grants no Human/Owner or repository authority;
- agents cannot self-expand capability or self-authorize protected mutation;
- tool scopes remain least privileged and side effects remain explicitly authorized;
- identity/authentication and authorization remain separate controls;
- evidence must not leak reusable credentials, secrets or unnecessary PII;
- model recommendations are not Human/Owner approval.

## 8. Finding and verification lifecycle

`DISCOVERED → TRIAGED → CONFIRMED → OWNER/PVC IDENTIFIED → REMEDIATING → IMPLEMENTED → EVIDENCE_READY → independent Security VERIFIED → CLOSED`

Rules: `EVIDENCE_READY != VERIFIED`; missing/stale/wrong-identity/`NOT_TESTED`/`NOT_AVAILABLE` evidence is not PASS; Security cannot self-accept risk; roadmap status alone is not runtime/provider evidence.

Evidence precedence: runtime/provider observation → provider/security configuration → negative tests → hosted CI exact-head → implementation/code → scan → policy/control → roadmap.

## 9. Correlation boundary

This post-merge lifecycle sync is based on `main@fe27d901a7a505b1e0b87f8970e3f4a33991d968`, current `/AGENTS.md`, `ESS-0006` v1.1.0 and `ESS-0019` v1.2.0.

- PR #832 merged at `75c926f12ae514036aa508ea8faf1a82b1a91059`; that merge is an ancestor of current main.
- PR #833 is closed without merge and is not an active writer.
- Open PRs at branch creation: none.
- Current branch: `agent/security-post832-roadmap-sync-20260907` from the exact current-main baseline.
- PR #834 subsequently advanced main after #832 in Frontend scope without changing the Security roadmap/evidence surfaces being synchronized here.
- No foreign productive runtime/provider/IAM/billing/deployment surface is changed.

## 10. Definition of Done

CAPITAL-AI-SEC is current when external SOTA sources remain advisory/non-authorizing; every active finding has current owner/PVC routing or explicit unresolved status; returned evidence is independently verified only to the scope it proves; foreign productive remediation remains with the actual owner; no stale/missing evidence becomes PASS; Security claims no productive PVC or parallel authority plane; and every `VERIFIED/CLOSED` claim records exact applicable identity/evidence.

For this post-#832 sync specifically, completion means `SEC-SOTA-01` is projected as `DONE_MAIN`, PR #832 hosted/merge/deployment identity evidence is recorded accurately, stale branch/PR-gate wording is removed from active status projections, and `SEC-VERIFY-R2-04` remains open for the runtime evidence that generic deployment success does not prove.

## 11. PR / merge / production boundary

PR creation requires separate explicit Human/Owner approval for the exact current-main, branch-head, changed-file scope, correlation result and resolved title after final re-correlation. Hosted checks run after PR according to current repository controls. Merge remains Human/CODEOWNER-only. CI, roadmap status or Security evidence does not authorize Release, Production or protected provider mutation.