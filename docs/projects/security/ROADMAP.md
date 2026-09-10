# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Primary Owner:** `CAPITAL-AI-SEC`  
**Role:** cross-cutting Security requirements, findings, testing, bounded remediation and independent verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Date:** `2026-09-10`  
**Correlation baseline:** `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`  
**Implementation authority:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` / `CTRL-SEC-BOUNDED-REMEDIATION-001`  
**Component specification:** `ESS-0006 v1.2.0`  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**SOTA baseline:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`  
**SEC-SOTA-02 evidence:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA02_AI_AGENT_MCP_CONTROL_INVENTORY_2026-09-07.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the owner-side execution projection required by the canonical `docs/projects/` model. Current work and priority are resolved here and detailed in the canonical Security roadmap. It creates no second finding register, Security authority, IAM plane, MCP runtime, release path or productive PVC owner.

Current routing resolves from current `/AGENTS.md`, `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`, followed by applicable accepted ADR/ESS contracts and current code/tests/evidence. `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` / `CTRL-SEC-BOUNDED-REMEDIATION-001` now permits CAPITAL-AI-SEC to execute the smallest sufficient Security-primary repository remediation without transferring target Domain/PVC ownership. External standards remain advisory/non-authorizing. Withdrawn post-PVC overlays remain historical and are not routing inputs.

## Current-main authority update — 2026-09-10

The Security execution model is now explicitly:

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
| Bounded Security remediation authority | current GOV branch based on `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46` | `GOVERNANCE_IMPLEMENTED_BRANCH / VALIDATION OPEN` |
| `SEC-VERIFY-R2-04` fatal-process repository re-verification | repository code/test contract independently verified in merged evidence | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` |
| `SEC-SOTA-02` AI/Agent/MCP control inventory | historical 2026-09-07 static/control inspection + routed evidence matrix | `INVENTORY_IMPLEMENTED_BRANCH / FINDINGS_ROUTED / PR GATE OPEN AT THAT BASELINE` |
| `SEC-VERIFY-ULS-001` subscription identity | current Security evidence retains provider identity residuals | `PARTIAL / NOT VERIFIED` |
| Owner Device Authorization Stage-C | independent evidence on main | `COMPLETE / HISTORICAL` |
| S1 hardening findings | current owner roadmaps/code/evidence | mixed; no blanket closure |

Historical findings/evidence remain evidence of the execution model that applied at their recorded baseline. This current authority update does not rewrite old evidence or retroactively claim that Security implemented owner-routed remediation.

## State-of-the-art overlay

The external reference set is `ADVISORY_NON_AUTHORIZING` and mapped into existing `SEC-01..SEC-10`; it creates no parallel workstream or repository authority. Current reference families remain OWASP Top 10:2025, OWASP ASVS 5.0.0, OWASP GenAI/Agentic/Agent Control Standard/Secure MCP guidance, SLSA v1.2, CISA Secure by Design and the CRA dependency routed to `CAPITAL-AI-COMP` for applicability. NIST publications/frameworks remain outside the CURRENT repository governance baseline under current `/AGENTS.md`.

## Priority queue

### P0 — Security-owned executable work

1. **Bounded P0/P1 Security remediation.**  
   **State:** `GOVERNANCE_IMPLEMENTED_BRANCH / VALIDATION OPEN`.  
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
   **State:** `READY`.  
   Correlate dependency/source/build/provenance/attestation/release controls. Confirmed dependency vulnerabilities can now be patched directly by SEC when they meet the bounded-remediation criteria; productive release/deployment authority remains unchanged.

### P1

6. **`SEC-SOTA-04` — application/API ASVS 5.0 verification matrix.** Repository-relevant controls only; eligible pure Security remediation may execute under the bounded control, while business/architecture remainder routes to its owner.
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
| `SEC-SOTA02-F03` Documentary real mutation path lacks durable ADR-0059-grade execution audit | `CAPITAL-AI-DOC / PVC-03` | `CONFIRMED / OWNER_ROUTED` | actor/app/agent/session/request/capability/policy/tool/branch/commit/PR authorization+outcome evidence; fail-closed audit where required |
| `SEC-SOTA02-F04` external MCP/connector host assurance not independently proven | `CAPITAL-AI-OPS / PVC-02` | `EVIDENCE_GAP / OWNER_ROUTED` | effective host AuthN/AuthZ/tool grant/session isolation/read-only ceiling readback; executable identity additionally assessed in `SEC-SOTA-03` |
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

## Current correlation state for this authority update

- Governance work baseline: `main@2a6909ead7dc4ed3299de3d07d84123ce53f9e46`.
- Authority-owning project: `CAPITAL-AI-GOV / PVC-05`; Security remains cross-cutting with productive PVC ownership `[]`.
- Work branch: `agent/governance-security-remediation-authority-20260910`.
- The active/open PR and stale parallel Governance branches must be re-correlated again immediately before PR-creation approval; no historical branch content is implicitly adopted by this Security roadmap projection.
- No provider permission, connector, credential, runtime, deployment or protected Production mutation is included in this Governance slice.

## Validation / completion gate

1. current `/AGENTS.md` is fully read from then-current main;
2. project/PVC mapping, Security README/roadmaps, ESS-0006/ESS-0019, relevant ADRs/Controls and actual affected repository surfaces are correlated;
3. `CTRL-SEC-BOUNDED-REMEDIATION-001` has explicit PASS/DENY semantics and file location alone is not a DENY condition;
4. pure Security remediation can use a Security project branch while canonical target ownership remains unchanged;
5. business/product semantics, foreign Architecture Authority and protected external mutation remain explicit DENY/Owner boundaries;
6. implementation evidence cannot create `VERIFIED/CLOSED`; separate positive/negative re-test and relevant hosted/runtime evidence remain required;
7. no parallel Security/IAM/Policy/Audit/Release/Deployment/Governance control plane is created;
8. local/sandbox checks not actually executed remain `NOT RUN` and are not represented as PASS;
9. exact current main/head/open-PR correlation is repeated immediately before PR creation;
10. PR creation requires explicit Human/Owner approval for the exact snapshot; merge remains Human/CODEOWNER-only.