# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Primary Owner:** `CAPITAL-AI-SEC`  
**Role:** cross-cutting Security requirements, findings, testing, bounded remediation and independent verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Date:** `2026-09-11`  
**Correlation baseline:** `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9`  
**Implementation authority:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` / `CTRL-SEC-BOUNDED-REMEDIATION-001`  
**Component specification:** `ESS-0006 v1.2.0`  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**SOTA baseline:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`  
**SEC-SOTA-02 evidence:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the owner-side execution projection required by the canonical `docs/projects/` model. Current work and priority are resolved here and detailed in the canonical Security roadmap. It creates no second finding register, Security authority, IAM plane, MCP runtime, release path or productive PVC owner.

Current routing resolves from current `/AGENTS.md`, `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`, followed by applicable accepted ADR/ESS contracts and current code/tests/evidence. `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` / `CTRL-SEC-BOUNDED-REMEDIATION-001` permits CAPITAL-AI-SEC to execute the smallest sufficient Security-primary repository remediation without transferring target Domain/PVC ownership. External standards remain advisory/non-authorizing. Withdrawn post-PVC overlays remain historical and are not routing inputs.

## Current-main authority update — 2026-09-11

The Security execution model is explicitly:

```text
Security Finding
→ CAPITAL-AI-SEC classifies risk + cause
→ correlate current owner / authority / open writers
→ pure bounded Security remediation?
  → YES: SEC may implement on a fresh Security branch
  → NO: SEC implements only cleanly separable Security hardening and routes the Domain remainder
→ Security positive + negative tests
→ separate verification / evidence step
→ normal PR / hosted-CI / Human-CODEOWNER merge lifecycle
```

This does not assign a productive `PVC-*` stage to Security. File position alone is not a DENY criterion: an eligible fix may update `src/platform/Security/**`, `server/**`, `scripts/security/**`, `scripts/automation/**`, `.github/workflows/**`, `package.json`, lockfiles, Docker/runtime Security configuration or Security-relevant tests where the vulnerable implementation actually exists. The long-term file/Domain/PVC owner remains unchanged.

The delegation stops at business/product semantics, foreign Architecture Authority, protected external Production/IAM/Billing/Secret/DNS/destructive-data mutation, Security-gate weakening or parallel control-plane creation. Mixed work is split; only the cleanly separable Security portion is eligible for SEC execution.

Implementation and verification may both be performed by CAPITAL-AI-SEC but remain distinct evidence/review steps. Implementation evidence alone is never `VERIFIED/CLOSED`; `EVIDENCE_READY != VERIFIED`.

## Current-main consolidation

| Work item | Current evidence | Security disposition |
|---|---|---|
| Security project/PVC consolidation | PR #749 merged | `DONE_MAIN` |
| Security Assessment capability + raw-test binding | current main | `DONE_MAIN` |
| `SEC-ASSESS-ALIGN` | PR #766 merged | `DONE_MAIN` |
| `SEC-SOTA-01` SOTA baseline + roadmap convergence | PR #832 merged; hosted PR checks and merge-main build/deploy/identity evidence completed | `DONE_MAIN` |
| Post-#832 Security roadmap sync | PR #837 merged as `8ab11ae749639a67c28b3d685f4943df19b9e72c`; final PR head `d5e77d5fded414931896f4e6781e3dcfffcaed19` passed Governance, Container Security and Class-D `build-and-test` | `DONE_MAIN` |
| Bounded Security remediation authority | current main exposes `CTRL-SEC-BOUNDED-REMEDIATION-001`; Security README and ESS-0006 v1.2.0 project the same bounded-remediation boundary | `DONE_MAIN / ACTIVE` |
| `SEC-SOTA-03` Vite-6 dependency floor | PR #870 final PR head `83f073d5cc9017f5cf5c8cebb9a2cf44bffeead3`; Hosted `build-and-test`, Governance, Container Security and GitGuardian passed; Human merge entered main as `5664332aac99befa819abbbc2cf23c30a8982147` | `MERGED_MAIN / REPOSITORY_CONTRACT_VERIFIED` |
| Post-#870 `SEC-SOTA-03` roadmap sync | PR #871 final PR head `dbc6b2e1b8a99e0da9b9e1677adc2579c325a300`; Governance, CI, Container Security and GitGuardian passed; Human merge is `e9839f5e3eccc0ae01d6a10e53d3787435e1379d` | `DONE_MAIN` |
| `SEC-SOTA03-ARTIFACT-DIGEST-BINDING` | PR #872 final PR head `e59308599dde3f7cf050601a2b6e64c5a73aaf59`; Human merge `a05d75f27fdd0c3bea5321a23cbf2de24bdbc56c`; exact main build/provenance/signature/deployment evidence from workflow run `34514847089` | `VERIFIED_MAIN / CLOSED` |
| `SEC-SOTA03-MCP-EXECUTABLE-IDENTITY` | PR #882 final PR head `1969555c885ea0e5fb5cc1ee30648b1d5950b773`; Human merge `d67de465c89013f5626a7de8d16569b0017c5ada`; final Hosted CI, Container Security and Governance revalidation succeeded; current main still contains exact `analytics-mcp==0.7.0` distribution/executable binding and fail-closed positive/negative tests | `VERIFIED_MAIN / CLOSED` |
| `SEC-SOTA-03` aggregate | Vite floor + artifact digest binding + MCP executable identity are all on main and separately evidence-backed; no remaining repository-owned SOTA-03 inventory gap is projected | `VERIFIED_MAIN / CLOSED` |
| `SEC-VERIFY-R2-04` fatal-process repository re-verification | repository code/test contract independently verified in merged evidence | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` |
| `SEC-SOTA-02` AI/Agent/MCP control inventory | historical 2026-09-07 static/control inspection + routed evidence matrix | `INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / PR GATE OPEN AT THAT BASELINE` |
| `SEC-VERIFY-ULS-001` subscription identity | current Security evidence retains provider identity residuals | `PARTIAL / NOT VERIFIED` |
| Owner Device Authorization Stage-C | independent evidence on main | `COMPLETE / HISTORICAL` |
| S1 hardening findings | current owner roadmaps/code/evidence | mixed; no blanket closure |

Historical findings/evidence remain evidence of the execution model that applied at their recorded baseline. This current projection does not rewrite old evidence or retroactively claim that Security implemented owner-routed remediation.

## State-of-the-art overlay

The external reference set is `ADVISORY_NON_AUTHORIZING` and mapped into existing `SEC-01..SEC-10`; it creates no parallel workstream or repository authority. Current reference families remain OWASP Top 10:2025, OWASP ASVS 5.0.0, OWASP GenAI/Agentic/Agent Control Standard/Secure MCP guidance, SLSA v1.2, CISA Secure by Design and the CRA dependency routed to `CAPITAL-AI-COMP` for applicability. NIST publications/frameworks remain outside the CURRENT repository governance baseline under current `/AGENTS.md`.

## Priority queue

### P0 — Security-owned executable work

1. **Bounded P0/P1 Security remediation.**  
   **State:** `ACTIVE`.  
   Confirmed `CRITICAL`/`HIGH` findings may use the bounded Security branch path when remediation is technically unambiguous, Domain semantics are not expanded, no protected external mutation is required and current-main/open-writer correlation is conflict-free or explicitly sequenced. PR creation, hosted CI, Human/CODEOWNER merge, Release and Production gates remain unchanged.

2. **`SEC-SOTA-01` — SOTA baseline and roadmap convergence.**  
   **State:** `DONE_MAIN`.  
   PR #832 merged; PR #837 subsequently synchronized the active lifecycle projections on main.

3. **`SEC-VERIFY-R2-04` — fatal-process current-main re-verification.**  
   **State:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`.  
   Repository-level fail-fast, unhealthy readiness, duplicate-fatal suppression and non-zero-exit intent are independently verified from source/test contracts. Full runtime closure still requires exact post-deploy supervisor/restart/readiness evidence from `CAPITAL-AI-OPS / PVC-08`.

4. **`SEC-SOTA-02` — AI/Agent/MCP control inventory.**  
   **State:** historical current-state inventory at its recorded baseline.  
   Evidence: `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`. Its owner-routing decisions remain historical evidence and are not rewritten. Future remediation eligibility is evaluated under `CTRL-SEC-BOUNDED-REMEDIATION-001` against then-current main and contracts.

5. **`SEC-SOTA-03` — supply-chain assurance inventory.**  
   **State:** `VERIFIED_MAIN / CLOSED`.  
   PR #870 closed the Vite dependency-regression slice. PR #872 closed actual-runtime artifact digest/provenance/signature/deployment binding. PR #882 closed the final confirmed repository-side inventory gap by pinning the GA4 MCP distribution/executable identity to `analytics-mcp==0.7.0` and adding fail-closed drift validation. Current `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9` retains all three bounded outcomes; changes after merge `d67de465c89013f5626a7de8d16569b0017c5ada` do not modify the MCP files.

   **Completed bounded slice — `SEC-SOTA03-ARTIFACT-DIGEST-BINDING`:** `VERIFIED_MAIN / CLOSED`.  
   PR #872 merged as `a05d75f27fdd0c3bea5321a23cbf2de24bdbc56c`. Exact main workflow run `34514847089` built the production application/server output, bound the release manifest `buildIdentity=133874f85e07de4e8c1cfb403fbeb2a6b6eda3a472be3e1122d8dc3773450f9b` to runtime-artifact aggregate `sha256:44166829069481d1f611920afe877bc82641fe7977f6afae1592a943c31f2ce1` across 49 included runtime files and dependency-lock digest `sha256:ed0c4aba1e6186758a6646eb215c3791438de71963e11f19fd47bff289269170`. The generated SLSA provenance carries those real runtime-file subjects and the same source SHA; the hosted run completed provenance binding, cosign keyless signing and expected workflow-identity verification successfully. Deployment evidence observed `a05d75f27fdd0c3bea5321a23cbf2de24bdbc56c` on `main` at Render and records `VERIFIED PASS`. GitHub retained `supply-chain-provenance-a05d75f...` and `deployment-identity-evidence-a05d75f...` artifacts with independent artifact digests. The workflow aggregate is recorded as `cancelled`, but all bounded exit-gate build/provenance/signature/deployment steps completed successfully and the two required evidence artifacts were persisted before cancellation; this projection therefore relies on those exact step/evidence results rather than converting the aggregate workflow conclusion into `success`.

   **Completed bounded slice — `SEC-SOTA03-MCP-EXECUTABLE-IDENTITY`:** `VERIFIED_MAIN / CLOSED`.  
   PR #882 merged as `d67de465c89013f5626a7de8d16569b0017c5ada` from final PR head `1969555c885ea0e5fb5cc1ee30648b1d5950b773`. Current main keeps `.mcp.json` at `uvx --from analytics-mcp==0.7.0 analytics-mcp`, keeps `scripts/security/validateMcpExecutableIdentity.mjs`, and keeps `tests/unit/mcpExecutableIdentity.test.ts`. The exact PR head has Hosted CI `success`, Container Security `success`, and final Governance revalidation `success`; the earlier Governance failure remains historical and is not rewritten. The validator/test contract rejects unconstrained, version-drifted and executable-drifted declarations. No reusable credential, external MCP-host permission, tool-grant or session-isolation state is claimed verified by this repository-only closure.

### P1 — active next Security slice

6. **`SEC-SOTA-04` — application/API ASVS 5.0 verification matrix.**  
   **State:** `ACTIVE / NEXT`.  
   Repository-relevant controls only. Map OWASP ASVS 5.0.0 objectives to existing implementation, tests and evidence; framework mapping alone is never PASS. Any productive gap is routed to its actual Primary Owner/PVC. This closeout slice intentionally does not pre-create or populate the ASVS matrix.
7. **`SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle correlation.** ESS-0020 remains proposed; no unilateral lifecycle promotion/retirement.
8. Continue independent evidence returns for current S1 and User Lifecycle residuals.

### Compliance dependency

**`SEC-COMP-CRA-01` — CRA applicability/reporting readiness correlation.** `CAPITAL-AI-COMP` determines applicability/legal scope; Security only supplies/verifies technical evidence after that decision. The Security implementation delegation does not transfer Legal/Compliance authority.

## SEC-SOTA-02 historical routed findings

The following table records the 2026-09-07 routing result. It is not a current prohibition on future SEC remediation. Each finding must be re-correlated against then-current main and `CTRL-SEC-BOUNDED-REMEDIATION-001` before implementation.

| Finding | Primary productive owner | Recorded Security state | Verification gate |
|---|---|---|---|
| `SEC-SOTA02-F01` AI Chat indirect prompt-injection trust boundary | `CAPITAL-AI-FINTECH / PVC-15`; CLIENT/PVC-01 dependency for history contract | `CONFIRMED / OWNER_ROUTED` | malicious retrieved-instruction + history-role-spoof DENY/isolation evidence; model output cannot gain tool/execution authority |
| `SEC-SOTA02-F02` Documentary automatic Draft-PR dispatch lacks current exact Human PR-creation gate | `CAPITAL-AI-DOC / PVC-03` | `CONFIRMED / OWNER_ROUTED` | control loop terminates at approval-ready handoff; exact main/head/scope/title Human approval precedes every PR dispatch |
| `SEC-SOTA02-F03` Documentary real Git mutation path lacks durable ADR-0059-grade execution audit | `CAPITAL-AI-DOC / PVC-03` | `CONFIRMED / OWNER_ROUTED` | actor/app/agent/session/request/capability/policy/tool/branch/commit/PR authorization+outcome evidence; fail-closed audit where required |
| `SEC-SOTA02-F04` external MCP/connector host assurance not independently proven | `CAPITAL-AI-OPS / PVC-02` | `EVIDENCE_GAP / OWNER_ROUTED` | effective host AuthN/AuthZ/tool grant/session isolation/read-only ceiling readback; repository executable identity is now separately `VERIFIED_MAIN / CLOSED` under `SEC-SOTA-03` |
| `SEC-SOTA02-F05` stale `CLAUDE.md` authority references in current ESS-0018/ADR-0051 | `CAPITAL-AI-GOV / PVC-05` | `CONFIRMED / OWNER_ROUTED` | current Trust Root/stable authority replaces provider-specific wording without changing technical semantics |
| `SEC-SOTA02-F06` AI Chat session/history provenance not independently attestable | `CAPITAL-AI-CLIENT / PVC-01`; FINTECH/PVC-15 server dependency | `EVIDENCE_GAP / OWNER_ROUTED` | explicit stateless contract or server-attested session/history chain; negative cross-session/context-substitution tests |

No row grants CAPITAL-AI-SEC the productive owner's business or PVC authority. A future pure Security remediation can nevertheless be SEC-implemented after current correlation when no Domain-semantic or protected-mutation boundary is crossed.

## Existing finding projection

| Finding / residual | Primary productive owner | Current evidence state | Security next gate |
|---|---|---|---|
| `S1-R2-03` Node control-plane convergence | `CAPITAL-AI-OPS / PVC-06` | owner roadmap remains source of productive state | re-correlate; implement only a cleanly separable bounded Security part if eligible, otherwise owner dependency |
| `S1-R2-04` fatal process handling | `CAPITAL-AI-OPS / PVC-04`; runtime evidence `PVC-08` | `REPOSITORY_CONTRACT_VERIFIED`; post-deploy evidence open | exact deployed supervisor/restart/readiness evidence |
| `S1-R2-05` Stripe redirect boundary | `CAPITAL-AI-OPS / PVC-02` | open finding | re-correlate bounded redirect hardening eligibility; protected provider mutation remains separate |
| `S1-R2-06` entitlement authority | OPS parent inventory; FINTECH/DATA children by actual capability owner | parent evidence exists; child remediation + verification remain | bounded Security code fix only if no business entitlement semantics change; otherwise owner handoff |
| `S1-R2-07` recovery / RPO / RTO | `CAPITAL-AI-OPS / PVC-08` | `OPEN / UNVERIFIED` | measured restore/integrity/RPO/RTO evidence; no Security takeover of runtime/recovery authority |
| `S1-R2-09` strict CSP promotion | `CAPITAL-AI-OPS / PVC-08` | evidence-dependent | repository CSP guardrails may be eligible; production promotion/evidence remains separately authorized |
| `S1-R2-10` demo billing isolation | `CAPITAL-AI-OPS / PVC-08` | evidence-dependent | production reachability proof; no Billing authority transfer |
| `S1-R2-11` evidence identity/freshness | `CAPITAL-AI-DATA / PVC-10` | open Security evidence semantics | Security hardening only if data semantics stay unchanged; otherwise DATA owner dependency |
| User Lifecycle subscription identity | `CAPITAL-AI-OPS / PVC-08` evidence provider | `PARTIAL / NOT VERIFIED` | provider identity evidence plus separate SEC re-verification |
| User Lifecycle provider E2E | OPS/PVC-08 plus applicable provider/runtime owners | required isolated/provider scenarios remain incomplete | remain non-PASS until reproducible evidence exists |
| leaked-password protection | `CAPITAL-AI-OPS / PVC-08` provider configuration | defense-in-depth residual | separately authorized provider configuration action + readback |
| MFA/AAL authority lifecycle | applicable current authority/Human decision | `OPEN / CLARIFY`; ESS-0020 `PROPOSED` | no unilateral Security lifecycle mutation |

## Security execution invariants

- Missing, stale, wrong-identity, `NOT_TESTED` or `NOT_AVAILABLE` required evidence is never PASS.
- `EVIDENCE_READY != VERIFIED`.
- CAPITAL-AI-SEC may implement the smallest sufficient Security-primary repository remediation under `CTRL-SEC-BOUNDED-REMEDIATION-001`; implementation and verification remain separate steps.
- File or PVC location alone does not block an eligible Security fix and never transfers long-term ownership.
- Business/product semantics, foreign Architecture Authority and protected external mutations remain owner/authority boundaries.
- Mixed work is split; Security does not use a finding as a feature/refactor pretext.
- `ACCEPTED_RISK` requires applicable Human/Owner authority.
- External frameworks/guidance are advisory and cannot create repository Authority.
- Prompt, tool, retrieved and inter-agent content is untrusted and cannot expand repository or Human/Owner authority.
- `src/platform/Security` is the preferred reusable Security implementation component, not an exclusive file-location gate.
- Technical `VC-*` identifiers and organizational `PVC-*` routing remain separate namespaces.
- PR creation, Human/CODEOWNER merge, Release, Production and protected external mutation remain under current repository/Human gates.
- Missing in-app MCP runtime is not a gap where current accepted contracts explicitly keep MCP unimplemented.
- Retired M10 / `AUTHORIZE_PR_CI` remains historical and is not a current implementation gap.

## Current correlation state — SEC-SOTA03 closeout

- Correlation baseline: `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9`.
- Current Project: `CAPITAL-AI-SEC`; productive PVC ownership remains `[]`; Primary Owner remains `CAPITAL-AI-SEC` for Security assurance/verification.
- PR #882 final PR head was `1969555c885ea0e5fb5cc1ee30648b1d5950b773`; Human merge is `d67de465c89013f5626a7de8d16569b0017c5ada`.
- Exact PR-head Hosted evidence: CI `success`, Container Security `success`, final Governance revalidation `success`; an earlier Governance failure remains historical and is not rewritten.
- Current `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9` is 14 commits ahead of the PR #882 merge with merge base exactly `d67de465c89013f5626a7de8d16569b0017c5ada`; intervening changes do not modify `.mcp.json`, `scripts/security/validateMcpExecutableIdentity.mjs` or `tests/unit/mcpExecutableIdentity.test.ts`.
- Current main retains exact `analytics-mcp==0.7.0` distribution/executable identity and fail-closed drift checks.
- Open Pull Requests at this correlation: `0`.
- External MCP-host AuthN/AuthZ/tool-grant/session isolation remains a separate `CAPITAL-AI-OPS / PVC-02` evidence dependency under `SEC-SOTA02-F04`; it is not required to keep repository executable identity closed and is not absorbed into `SEC-SOTA-03`.
- `SEC-SOTA-04` is activated only as `ACTIVE / NEXT`; no ASVS matrix content is created in this closeout slice.
- No provider permission, connector, credential, runtime, deployment or protected Production mutation is included.

## Validation / completion gate

1. current `/AGENTS.md` is fully read from `main@f8335ad7c1c48879e8b53cd4ecc459a1d710dfa9` and current Approval-Envelope/merge-boundary semantics are preserved;
2. project/PVC mapping, Security Roadmap, existing SOTA evidence, PR #882 and exact PR-head hosted evidence are correlated;
3. `SEC-SOTA03-MCP-EXECUTABLE-IDENTITY` is projected `VERIFIED_MAIN / CLOSED` only after Human merge and independent current-main re-verification;
4. current main contains the exact pinned MCP declaration, fail-closed validator and focused positive/negative tests with no subsequent drift;
5. `SEC-SOTA-03` aggregate is closed because all repository-owned bounded inventory gaps projected by the current Security roadmap are closed;
6. external MCP-host permission/session assurance remains separately routed to OPS/PVC-02 and is not falsely represented as verified;
7. `SEC-SOTA-04` becomes the next active Security slice without pre-populating its matrix in this branch;
8. no parallel Security/IAM/Policy/Audit/Release/Deployment/Governance/Quality/MCP or Supply-Chain control plane is created;
9. exact current main/head/open-PR correlation is repeated before any PR creation; Human/CODEOWNER merge remains separate and Human-only.
