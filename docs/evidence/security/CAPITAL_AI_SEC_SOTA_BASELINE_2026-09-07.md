# CAPITAL-AI-SEC — State-of-the-Art Security Baseline

**Document ID:** `CAPITAL-AI-SEC-SOTA-BASELINE-2026-09-07`  
**Project:** `CAPITAL-AI-SEC`  
**Version:** `1.0.0`  
**Status:** `IMPLEMENTED_BRANCH — ADVISORY_NON_AUTHORIZING`  
**Date:** `2026-09-07`  
**Repository baseline:** `main@09ab297c1fd954c37fa2cb8b2fba718cb58402cb`  
**Primary Productive PVC ownership:** `[]`  
**Primary Owner:** `CAPITAL-AI-SEC`  
**Trust root:** `/AGENTS.md`

## 1. Purpose and authority boundary

This document records the current external state-of-the-art Security reference set and maps it onto the existing `SEC-01..SEC-10` Security workstreams. It does **not** create repository Authority, a second Security control plane, a second IAM/release path, or productive ownership for `CAPITAL-AI-SEC`.

Repository decisions continue to resolve from current `/AGENTS.md`, canonical project/PVC mapping, applicable accepted ADR/ESS contracts, and current code/tests/evidence. External standards and guidance below are `ADVISORY_NON_AUTHORIZING`: they may motivate review, tests and findings, but cannot alone create mandatory repository requirements, CI gates, accepted risk, architecture authority or productive remediation ownership.

Current `/AGENTS.md` explicitly withdraws NIST publications/frameworks from the CURRENT repository governance baseline. This SOTA baseline therefore does not use NIST as a normative or backlog-authorizing source.

## 2. External SOTA reference set

| Reference | Current relevance | CAPITAL-AI use |
|---|---|---|
| OWASP Top 10:2025 | current web/application risk taxonomy; notably supply-chain failures, software/data integrity, logging/alerting and mishandling of exceptional conditions | advisory risk coverage for `SEC-03`, `SEC-05`, `SEC-06`, `SEC-08` |
| OWASP ASVS 5.0.0 | current application security verification standard | advisory verification matrix for `SEC-03` and `SEC-08` |
| OWASP GenAI LLM Top 10 2026 | current GenAI/LLM threat taxonomy | advisory AI risk coverage for `SEC-07` and `SEC-08` |
| OWASP Top 10 for Agentic Applications 2026 | autonomous/agentic risk taxonomy | advisory agent authority/tool/memory/control coverage for `SEC-07` |
| OWASP Agent Control Standard (ACS) | inspectability, traceability, instrumentation and runtime control concepts for agents | advisory control objectives for `SEC-07` and `SEC-10` |
| OWASP Practical Guide for Secure MCP Server Development | AuthN/AuthZ, validation, session isolation, delegated permissions and tool-chain risks for MCP | advisory MCP/tool verification for `SEC-02`, `SEC-03`, `SEC-07` |
| SLSA v1.2 | Source Track and Build Track provenance/attestation model | advisory supply-chain assurance for `SEC-06`; reuse existing release/development-chain controls |
| CISA Secure by Design | security outcomes, secure defaults and organizational accountability principles | advisory design review lens; no repository authority created |
| EU Cyber Resilience Act reporting guidance | reporting obligations begin on `2026-09-11` for in-scope products with digital elements | **Compliance dependency only**: `CAPITAL-AI-COMP` must determine applicability and required readiness; Security does not make the legal determination |

Primary external references:

- https://owasp.org/Top10/2025/
- https://owasp.org/www-project-application-security-verification-standard/
- https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/
- https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/
- https://genai.owasp.org/resource/agent-control-standard-acs/
- https://genai.owasp.org/resource/a-practical-guide-for-secure-mcp-server-development/
- https://slsa.dev/spec/v1.2/
- https://www.cisa.gov/securebydesign
- https://digital-strategy.ec.europa.eu/en/policies/cra-reporting

## 3. SOTA themes mapped onto the existing Security model

No new parallel workstream family is introduced. The SOTA themes are projected into the existing Security workstreams:

| SOTA theme | Existing workstream(s) | Required Security behavior |
|---|---|---|
| application/API verification | `SEC-03`, `SEC-08`, `SEC-10` | derive repository-relevant positive/negative verification objectives; do not infer PASS from framework coverage text |
| exceptional-condition handling and secure failure | `SEC-05`, `SEC-08`, `SEC-10` | fail closed, preserve unhealthy state, non-zero fatal exit, verify supervisor/recovery evidence separately |
| dependency/source/build integrity | `SEC-06`, `SEC-08`, `SEC-10` | review existing lockfile/build/provenance/attestation/release surfaces before proposing anything new |
| AI/agent prompt, tool and delegated-authority boundaries | `SEC-02`, `SEC-07`, `SEC-08` | untrusted content cannot expand authority; tool scope least privilege; side effects remain explicitly authorized |
| agent inspectability and traceability | `SEC-07`, `SEC-10` | evidence must identify actor/model/tool/decision/authorization/runtime identity where applicable |
| MCP/session/tool-chain isolation | `SEC-02`, `SEC-03`, `SEC-07` | explicit AuthN/AuthZ, validation, session isolation, bounded delegation and fail-closed tool invocation |
| logging/alerting and evidence freshness | `SEC-08`, `SEC-09`, `SEC-10` | missing/stale/wrong-identity evidence is non-PASS; security-relevant failures remain observable without secret leakage |
| legal/reporting readiness | dependency on `CAPITAL-AI-COMP` | Security supplies technical evidence only after COMP resolves applicability/obligation scope |

## 4. Current-main readiness snapshot

| Area | Current repository-backed disposition | Next Security gate |
|---|---|---|
| Security Assessment authority alignment | `DONE_MAIN`; PR #766 merged skill v1.0.1 with advisory OWASP treatment and no NIST baseline | retain regression guard; no reopen |
| User Lifecycle subscription identity | `PARTIAL / NOT VERIFIED`; Security evidence on main records provider identity residuals | OPS/PVC-08 provider/runtime remediation/evidence return, then independent re-verification |
| fatal process / exceptional condition `S1-R2-04` | productive code exists on current main; repository behavior re-verification is executed in a sibling evidence document on this branch | remaining post-deploy supervisor/restart evidence from OPS/PVC-08 |
| AI/Agent/MCP SOTA control coverage | `OPEN — INVENTORY REQUIRED` at this historical baseline | use current owner roadmap/current-main evidence; do not infer current state from this historical row alone |
| supply-chain SLSA 1.2 alignment | historical baseline was `OPEN — REVIEW REQUIRED` | current closeout addendum below records `SEC-SOTA-03 = VERIFIED_MAIN / CLOSED` |
| application/API ASVS 5.0 coverage | `OPEN — VERIFICATION MATRIX REQUIRED` | `SEC-SOTA-04` is now the next active Security slice after SOTA-03 closeout |
| CRA reporting applicability/readiness | `REQUIRES_COMP_APPLICABILITY_DECISION` | `CAPITAL-AI-COMP` determines applicability; SEC may then verify technical vulnerability/incident evidence readiness |

## 5. Prioritized work packages

### P0 — current Security-owned execution at the original baseline

1. **`SEC-SOTA-01` — SOTA baseline and roadmap convergence.** Owner: `CAPITAL-AI-SEC`. Exit: current-main baseline, advisory/non-authorizing source treatment, existing-workstream mapping and synchronized Security roadmaps are explicit.
2. **`SEC-VERIFY-R2-04` — fatal-process current-main re-verification.** Owner: `CAPITAL-AI-SEC` for independent verification only. Exit: repository behavior disposition evidence-backed; post-deploy/supervisor evidence remains OPS/PVC-08.
3. **`SEC-SOTA-02` — AI/Agent/MCP control inventory.** Map current agent/tool/MCP surfaces to prompt injection, authority expansion, delegated permissions, session isolation, tool side effects, inspectability and evidence requirements; route productive gaps.
4. **`SEC-SOTA-03` — supply-chain assurance inventory.** Assess current source/build/dependency/provenance/attestation/release surfaces against repository authority plus advisory SLSA 1.2/OWASP themes; no second release system.

### P1

5. **`SEC-SOTA-04` — application/API ASVS 5.0 verification matrix.** Repository-relevant verification objectives only; gaps become owner-routed findings.
6. **`SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle correlation.** No unilateral ESS/ADR lifecycle change.
7. Continue independent evidence returns for S1 findings and User Lifecycle residuals without absorbing productive implementation.

### Cross-project dependency

**`SEC-COMP-CRA-01` — CRA applicability/reporting readiness correlation.** Security records a dependency on `CAPITAL-AI-COMP`; this is not a legal applicability determination and does not authorize Compliance or production mutation. Because the external reporting date is `2026-09-11`, the applicability/readiness question is time-sensitive.

## 6. Security invariants preserved

- `NOT_TESTED`, `NOT_AVAILABLE`, missing, stale or wrong-identity evidence is never PASS.
- `EVIDENCE_READY != VERIFIED`.
- external guidance cannot override current repository authority.
- prompt/tool/external content is untrusted and cannot grant repository or Human/Owner authority.
- Security may define requirements, test, reject, route findings and independently verify; productive remediation remains with the actual Primary Owner unless inherently reusable Security infrastructure in `src/platform/Security`.
- no new IAM, Governance, Data, EventMesh, scoring, billing, release or production control plane is created.
- accepted risk remains a Human/Owner decision under applicable current authority.

## 7. Initial implementation result

`SEC-SOTA-01` is implemented on branch `agent/security-sota-roadmap-sync-20260907` against `main@09ab297c1fd954c37fa2cb8b2fba718cb58402cb`. The roadmap/work-package synchronization and `SEC-VERIFY-R2-04` evidence are part of the same bounded Security documentation/evidence slice.

Hosted PR checks and Human/CODEOWNER merge are not implied by this document and remain separate gates.

## 8. Current verification addendum — SEC-SOTA-03 closeout (2026-09-11)

This addendum updates only the current evidence disposition of `SEC-SOTA-03` and the sequencing gate into `SEC-SOTA-04`. It does not rewrite the original 2026-09-07 baseline, create new repository authority, or claim external MCP-host assurance.

**Correlation baseline:** `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9`  
**Current Project:** `CAPITAL-AI-SEC`  
**Primary Productive PVC ownership:** `[]`  
**Primary Owner:** `CAPITAL-AI-SEC` for Security assurance/verification  
**External MCP-host productive owner:** `CAPITAL-AI-OPS / PVC-02`

### 8.1 MCP executable identity verification

- PR #882 final PR head: `1969555c885ea0e5fb5cc1ee30648b1d5950b773`.
- Human merge: `d67de465c89013f5626a7de8d16569b0017c5ada`.
- Current `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9` is 14 commits ahead of that merge with merge base exactly `d67de465c89013f5626a7de8d16569b0017c5ada`.
- Intervening commits do not modify `.mcp.json`, `scripts/security/validateMcpExecutableIdentity.mjs` or `tests/unit/mcpExecutableIdentity.test.ts`.
- Current `.mcp.json` binds the repository-configured GA4 MCP distribution/executable exactly as `uvx --from analytics-mcp==0.7.0 analytics-mcp`.
- `scripts/security/validateMcpExecutableIdentity.mjs` validates server, command, distribution, version and executable fail-closed.
- `tests/unit/mcpExecutableIdentity.test.ts` covers the valid repository declaration and rejects the previous unconstrained declaration, version drift and executable-name drift.
- Exact PR-head hosted evidence: CI `success`, Container Security `success`, final Governance revalidation `success`. An earlier Governance run failed before the trusted baseline refresh/revalidation; that historical failure remains visible and is not rewritten as PASS.
- No credential material, external MCP-host permission, tool-grant or session-isolation state is represented as verified by this repository-only evidence.

**Disposition:** `SEC-SOTA03-MCP-EXECUTABLE-IDENTITY = VERIFIED_MAIN / CLOSED`.

### 8.2 SEC-SOTA-03 aggregate closeout

The current Security roadmap identifies the bounded repository-side SOTA-03 inventory through the Vite dependency floor, actual-runtime artifact digest/provenance/signature/deployment binding, and MCP executable identity. Those repository-side slices are now merged and separately evidence-backed.

**Disposition:** `SEC-SOTA-03 = VERIFIED_MAIN / CLOSED`.

This closeout does **not** close `SEC-SOTA02-F04` external MCP/connector host AuthN/AuthZ, tool grants, session isolation or read-only ceiling. That evidence gap remains routed to `CAPITAL-AI-OPS / PVC-02` and is intentionally separate from repository executable-identity verification.

### 8.3 Next Security slice

The prior P0 inventory gate blocking the ASVS work is now satisfied for the repository-owned `SEC-SOTA-03` scope.

**Disposition:** `SEC-SOTA-04 — application/API ASVS 5.0 verification matrix = ACTIVE / NEXT`.

The next slice must remain repository-relevant and evidence-based: map ASVS 5.0.0 objectives to current implementation/tests/evidence, treat framework mapping alone as non-PASS, and route productive gaps to the actual Primary Owner/PVC. No ASVS matrix content is pre-created by this closeout addendum.