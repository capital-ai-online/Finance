# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Primary Owner:** `CAPITAL-AI-SEC`  
**Role:** cross-cutting Security requirements, findings, testing and independent verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Date:** `2026-09-07`  
**Correlation baseline:** `main@96119f958cacbf35614747380a066b87fdb1ee40`  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**SOTA baseline:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`  
**SEC-SOTA-02 evidence:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the owner-side execution projection required by the canonical `docs/projects/` model. Current work and priority are resolved here and detailed in the canonical Security roadmap. It creates no second finding register, Security authority, IAM plane, MCP runtime, release path or productive PVC owner.

Current routing resolves from current `/AGENTS.md`, `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`, followed by applicable accepted ADR/ESS contracts and current code/tests/evidence. External standards are advisory/non-authorizing. Withdrawn post-PVC overlays are historical and are not routing inputs.

## Current-main consolidation — 2026-09-07

| Work item | Current evidence | Security disposition |
|---|---|---|
| Security project/PVC consolidation | PR #749 merged | `DONE_MAIN` |
| Security Assessment capability + raw-test binding | current main | `DONE_MAIN` |
| `SEC-ASSESS-ALIGN` | PR #766 merged | `DONE_MAIN` |
| `SEC-SOTA-01` SOTA baseline + roadmap convergence | PR #832 merged; hosted PR checks and merge-main build/deploy/identity evidence completed | `DONE_MAIN` |
| Post-#832 Security roadmap sync | PR #837 merged as `8ab11ae749639a67c28b3d685f4943df19b9e72c`; final PR head `d5e77d5fded414931896f4e6781e3dcfffcaed19` passed Governance, Container Security and Class-D `build-and-test` | `DONE_MAIN` |
| `SEC-VERIFY-R2-04` fatal-process repository re-verification | repository code/test contract independently verified in merged evidence | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` |
| `SEC-SOTA-02` AI/Agent/MCP control inventory | current-main static/control inspection + routed evidence matrix on current branch | `INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / PR GATE OPEN` |
| `SEC-VERIFY-ULS-001` subscription identity | current Security evidence retains provider identity residuals | `PARTIAL / NOT VERIFIED` |
| Owner Device Authorization Stage-C | independent evidence on main | `COMPLETE / HISTORICAL` |
| S1 hardening findings | current owner roadmaps/code/evidence | mixed; no blanket closure |

## State-of-the-art overlay

The external reference set is `ADVISORY_NON_AUTHORIZING` and mapped into existing `SEC-01..SEC-10`; it creates no parallel workstream or repository authority. Current reference families remain OWASP Top 10:2025, OWASP ASVS 5.0.0, OWASP GenAI/Agentic/Agent Control Standard/Secure MCP guidance, SLSA v1.2, CISA Secure by Design and the CRA dependency routed to `CAPITAL-AI-COMP` for applicability. NIST publications/frameworks remain outside the CURRENT repository governance baseline under current `/AGENTS.md`.

## Priority queue

### P0 — Security-owned executable work

1. **`SEC-SOTA-01` — SOTA baseline and roadmap convergence.**  
   **State:** `DONE_MAIN`.  
   PR #832 merged; PR #837 subsequently synchronized the active lifecycle projections on main.

2. **`SEC-VERIFY-R2-04` — fatal-process current-main re-verification.**  
   **State:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`.  
   Repository-level fail-fast, unhealthy readiness, duplicate-fatal suppression and non-zero-exit intent are independently verified from source/test contracts. Full runtime closure still requires exact post-deploy supervisor/restart/readiness evidence from `CAPITAL-AI-OPS / PVC-08`.

3. **`SEC-SOTA-02` — AI/Agent/MCP control inventory.**  
   **State:** `INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / PR GATE OPEN`.  
   Evidence: `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`. The inventory reuses `/AGENTS.md`, ESS-0019, ADR-0058/0059, current Security IAM/provider-profile/audit controls, actual business-agent/RAG/tool paths and current MCP execution-host surfaces. It creates no parallel Control Plane and includes no foreign productive remediation.

4. **`SEC-SOTA-03` — supply-chain assurance inventory.**  
   **State:** `READY`.  
   Correlate dependency/source/build/provenance/attestation/release controls. `SEC-SOTA02-F04` has a bounded supply-chain dependency because `.mcp.json` invokes a mutable external MCP executable identity; ownership remains OPS and the actual supply-chain analysis belongs here.

### P1

5. **`SEC-SOTA-04` — application/API ASVS 5.0 verification matrix.** Repository-relevant controls only; findings route to productive owners.
6. **`SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle correlation.** ESS-0020 remains proposed; no unilateral lifecycle promotion/retirement.
7. Continue independent evidence returns for current S1 and User Lifecycle residuals.

### Compliance dependency

**`SEC-COMP-CRA-01` — CRA applicability/reporting readiness correlation.** External CRA reporting obligations begin `2026-09-11` for in-scope products with digital elements. `CAPITAL-AI-COMP` determines applicability/legal scope; Security only supplies/verifies technical evidence after that decision.

## SEC-SOTA-02 routed findings

| Finding | Primary productive owner | Current Security state | Security verification gate |
|---|---|---|---|
| `SEC-SOTA02-F01` AI Chat indirect prompt-injection trust boundary | `CAPITAL-AI-FINTECH / PVC-15`; CLIENT/PVC-01 dependency for history contract | `CONFIRMED / OWNER_ROUTED` | malicious retrieved-instruction + history-role-spoof DENY/isolation evidence; model output cannot gain tool/execution authority |
| `SEC-SOTA02-F02` Documentary automatic Draft-PR dispatch lacks current exact Human PR-creation gate | `CAPITAL-AI-DOC / PVC-03` | `CONFIRMED / OWNER_ROUTED` | control loop terminates at approval-ready handoff; exact main/head/scope/title Human approval precedes every PR dispatch |
| `SEC-SOTA02-F03` Documentary real mutation path lacks durable ADR-0059-grade execution audit | `CAPITAL-AI-DOC / PVC-03` | `CONFIRMED / OWNER_ROUTED` | actor/app/agent/session/request/capability/policy/tool/branch/commit/PR authorization+outcome evidence; fail-closed audit where required |
| `SEC-SOTA02-F04` external MCP/connector host assurance not independently proven | `CAPITAL-AI-OPS / PVC-02` | `EVIDENCE_GAP / OWNER_ROUTED` | effective host AuthN/AuthZ/tool grant/session isolation/read-only ceiling readback; executable identity additionally assessed in `SEC-SOTA-03` |
| `SEC-SOTA02-F05` stale `CLAUDE.md` authority references in current ESS-0018/ADR-0051 | `CAPITAL-AI-GOV / PVC-05` | `CONFIRMED / OWNER_ROUTED` | current Trust Root/stable authority replaces provider-specific wording without changing technical semantics |
| `SEC-SOTA02-F06` AI Chat session/history provenance not independently attestable | `CAPITAL-AI-CLIENT / PVC-01`; FINTECH/PVC-15 server dependency | `EVIDENCE_GAP / OWNER_ROUTED` | explicit stateless contract or server-attested session/history chain; negative cross-session/context-substitution tests |

No row grants CAPITAL-AI-SEC productive implementation ownership.

## Existing finding projection

| Finding / residual | Primary productive owner | Current-main state | Security next gate |
|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `CAPITAL-AI-OPS / PVC-06` | owner roadmap remains source of productive state | verify exact identity after OPS implementation |
| `S1-R2-04` fatal process handling | `CAPITAL-AI-OPS / PVC-04`; runtime evidence `PVC-08` | `REPOSITORY_CONTRACT_VERIFIED`; post-deploy evidence open | exact deployed supervisor/restart/readiness evidence |
| `S1-R2-05` Stripe redirect boundary | `CAPITAL-AI-OPS / PVC-02` | open owner-routed finding | open-redirect DENY evidence after remediation |
| `S1-R2-06` entitlement authority | OPS parent inventory; FINTECH/DATA children by actual capability owner | parent evidence exists; child remediation + verification remain | per-capability server-side DENY verification |
| `S1-R2-07` recovery / RPO / RTO | `CAPITAL-AI-OPS / PVC-08` | `OPEN / UNVERIFIED` | measured restore/integrity/RPO/RTO evidence |
| `S1-R2-09` strict CSP promotion | `CAPITAL-AI-OPS / PVC-08` | evidence-dependent | compatibility/violation evidence before strict-state claim |
| `S1-R2-10` demo billing isolation | `CAPITAL-AI-OPS / PVC-08` | evidence-dependent | production reachability proof bound to deployed identity |
| `S1-R2-11` evidence identity/freshness | `CAPITAL-AI-DATA / PVC-10` | open Security evidence semantics | current/stale/wrong-identity behavior evidence |
| User Lifecycle subscription identity | `CAPITAL-AI-OPS / PVC-08` evidence provider | `PARTIAL / NOT VERIFIED` | remediate/return provider identity evidence, then independent SEC re-verification |
| User Lifecycle provider E2E | OPS/PVC-08 plus applicable provider/runtime owners | required isolated/provider scenarios remain incomplete | remain non-PASS until reproducible evidence exists |
| leaked-password protection | `CAPITAL-AI-OPS / PVC-08` provider configuration | defense-in-depth residual | separately authorized configuration action + readback |
| MFA/AAL authority lifecycle | applicable current authority/Human decision | `OPEN / CLARIFY`; ESS-0020 `PROPOSED` | no unilateral Security lifecycle mutation |

## Security execution invariants

- Missing, stale, wrong-identity, `NOT_TESTED` or `NOT_AVAILABLE` required evidence is never PASS.
- `EVIDENCE_READY != VERIFIED`.
- Security may define, test, reject, route and independently verify but does not silently implement foreign productive code.
- `ACCEPTED_RISK` requires applicable Human/Owner authority.
- External frameworks/guidance are advisory and cannot create repository Authority.
- Prompt, tool, retrieved and inter-agent content is untrusted and cannot expand repository or Human/Owner authority.
- `src/platform/Security` is the reusable Security implementation boundary only for inherently Security-owned controls.
- Technical `VC-*` identifiers and organizational `PVC-*` routing remain separate namespaces.
- Merge, Release, Production and protected external mutation remain under current repository/Human gates.
- Missing in-app MCP runtime is not a gap where current accepted contracts explicitly keep MCP unimplemented.
- Retired M10 / `AUTHORIZE_PR_CI` remains historical and is not a current implementation gap.

## Correlation state

- Current `SEC-SOTA-02` branch baseline: `main@96119f958cacbf35614747380a066b87fdb1ee40`.
- PR #837 is Human-merged at `8ab11ae749639a67c28b3d685f4943df19b9e72c`; its final PR head `d5e77d5fded414931896f4e6781e3dcfffcaed19` passed Governance, Container Security and Class-D `build-and-test` before merge.
- Current bounded work branch: `agent/security-sota02-agent-mcp-inventory-20260907`, created from the exact current-main baseline.
- Open PR at branch creation: #839 (`CAPITAL-AI-OPS` workflow/zizmor hardening). Its changed files do not overlap this Security inventory/evidence/roadmap slice; supply-chain conclusions remain OPS-owned and may inform `SEC-SOTA-03` later.
- No foreign productive implementation, connector permission mutation, MCP installation, provider configuration change, runtime mutation or deployment is included in this Security slice.

## Validation / completion gate

1. current `/AGENTS.md` was fully re-read from `main@96119f958cacbf35614747380a066b87fdb1ee40`;
2. project/PVC mapping, Security README/roadmaps, ESS-0019, ADR-0058, ADR-0059 and relevant ESS-0018/ADR-0051/tool/runtime surfaces were inspected;
3. actual business LLM, RAG, Supabase agent-tool, Systemadmin audited execution, Documentary automation and MCP developer-tooling surfaces were correlated;
4. `SEC-SOTA-02` matrix records controls, actual gaps, explicit non-gaps and Primary Owner/PVC routing without creating a parallel architecture;
5. no foreign productive remediation is included;
6. external MCP/connector host readback and mutation are `NOT RUN` and remain separately authorized where applicable;
7. new local/unit/build execution for this documentation/evidence slice is `NOT RUN` and not represented as PASS;
8. exact main/head/open-PR correlation remains required immediately before PR creation;
9. PR creation requires explicit Human/Owner approval for the exact snapshot; merge remains Human/CODEOWNER-only.
