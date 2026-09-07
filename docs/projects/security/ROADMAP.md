# CAPITAL-AI-SEC — Project Roadmap

**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Primary Productive PVC ownership:** `[]`  
**Primary Owner:** `CAPITAL-AI-SEC`  
**Role:** cross-cutting Security requirements, findings, testing and independent verification  
**Status:** ACTIVE EXECUTION PROJECTION — NON-AUTHORIZING  
**Date:** `2026-09-07`  
**Correlation baseline:** `main@fe27d901a7a505b1e0b87f8970e3f4a33991d968`  
**Detailed roadmap:** `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md`  
**SOTA baseline:** `docs/evidence/security/CAPITAL_AI_SEC_SOTA_BASELINE_2026-09-07.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This file is the owner-side execution projection required by the canonical `docs/projects/` model. Current work and priority are resolved here and detailed in the canonical Security roadmap. It creates no second finding register, Security authority, IAM plane, release path or productive PVC owner.

Current routing resolves from current `/AGENTS.md`, `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`, followed by applicable accepted ADR/ESS contracts and current code/tests/evidence. External standards are advisory/non-authorizing. Withdrawn post-PVC overlays are historical and are not routing inputs.

## Current-main consolidation — 2026-09-07

| Work item | Current evidence | Security disposition |
|---|---|---|
| Security project/PVC consolidation | PR #749 merged | `DONE_MAIN` |
| Security Assessment capability + raw-test binding | current main | `DONE_MAIN` |
| `SEC-ASSESS-ALIGN` | PR #766 merged; skill v1.0.1 aligned to current authority and advisory OWASP methodology | `DONE_MAIN` |
| `SEC-SOTA-01` SOTA baseline + roadmap convergence | PR #832 merged as `75c926f12ae514036aa508ea8faf1a82b1a91059`; PR-head hosted Governance, Container Security and CI checks completed `success`; merge-main build/test, supply-chain attestation, exact-SHA Render deployment and post-deployment identity verification completed `success` | `DONE_MAIN` |
| `SEC-VERIFY-R2-04` fatal-process repository re-verification | repository code/test contract independently verified in merged evidence | `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN` |
| `SEC-VERIFY-ULS-001` subscription identity | current Security evidence retains provider identity residuals | `PARTIAL / NOT VERIFIED` |
| Owner Device Authorization Stage-C | independent evidence on main | `COMPLETE / HISTORICAL` |
| S1 hardening findings | current owner roadmaps/code/evidence | mixed; no blanket closure |

## State-of-the-art overlay

The external reference set is `ADVISORY_NON_AUTHORIZING` and mapped into existing `SEC-01..SEC-10`; it creates no parallel workstream or repository authority.

Current reference families:

- OWASP Top 10:2025;
- OWASP ASVS 5.0.0;
- OWASP GenAI LLM Top 10 2026;
- OWASP Top 10 for Agentic Applications 2026;
- OWASP Agent Control Standard and Secure MCP guidance;
- SLSA v1.2 Source/Build Track;
- CISA Secure by Design;
- EU Cyber Resilience Act reporting guidance as a **Compliance dependency only**, subject to `CAPITAL-AI-COMP` applicability determination.

NIST publications/frameworks remain outside the CURRENT repository governance baseline under current `/AGENTS.md` and are not used here as normative or backlog-authorizing sources.

## Priority queue

### P0 — Security-owned executable work

1. **`SEC-SOTA-01` — SOTA baseline and roadmap convergence.**  
   **State:** `DONE_MAIN`.  
   Merged by PR #832 at merge SHA `75c926f12ae514036aa508ea8faf1a82b1a91059`. Hosted PR checks and the merge-main production identity/deployment pipeline completed successfully. The immutable SOTA evidence may retain its original execution baseline; current status is projected here.

2. **`SEC-VERIFY-R2-04` — fatal-process current-main re-verification.**  
   **State:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`.  
   Repository-level fail-fast, unhealthy readiness, duplicate-fatal suppression and non-zero-exit intent are independently verified from source/test contracts. The successful main deployment after PR #832 does not by itself prove destructive fatal-process supervisor/restart behavior. Full runtime closure still requires exact post-deploy supervisor/restart/readiness evidence from `CAPITAL-AI-OPS / PVC-08`.

3. **`SEC-SOTA-02` — AI/Agent/MCP control inventory.**  
   **State:** `READY`.  
   Map current agent/tool/MCP surfaces to prompt injection, authority expansion, delegated permissions, session isolation, tool side effects, inspectability and evidence requirements. Route productive gaps to actual owners.

4. **`SEC-SOTA-03` — supply-chain assurance inventory.**  
   **State:** `READY`.  
   Correlate current dependency/source/build/provenance/attestation/release controls against repository authority and advisory SLSA 1.2/OWASP supply-chain themes. Reuse existing Development Chain and Release mechanisms.

### P1

5. **`SEC-SOTA-04` — application/API ASVS 5.0 verification matrix.** Repository-relevant controls only; findings route to productive owners.
6. **`SEC-AUTH-LIFECYCLE` — MFA/AAL lifecycle correlation.** ESS-0020 remains proposed; no unilateral lifecycle promotion/retirement.
7. Continue independent evidence returns for current S1 and User Lifecycle residuals.

### Compliance dependency

**`SEC-COMP-CRA-01` — CRA applicability/reporting readiness correlation.** External CRA reporting obligations begin `2026-09-11` for in-scope products with digital elements. `CAPITAL-AI-COMP` must determine applicability and legal obligation scope. Security may provide and verify technical vulnerability/incident evidence only after that ownership decision; this roadmap does not make a legal applicability determination.

## Current finding projection

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

No row grants CAPITAL-AI-SEC productive implementation ownership.

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

## Correlation state

- Current task baseline: `main@fe27d901a7a505b1e0b87f8970e3f4a33991d968`.
- PR #832 is merged; merge SHA `75c926f12ae514036aa508ea8faf1a82b1a91059` is an ancestor of current main.
- PR #833 is closed without merge and is not an active writer.
- Open PRs at branch creation: none.
- Current bounded work branch: `agent/security-post832-roadmap-sync-20260907`, created from the exact current-main baseline.
- The later PR #834 Frontend merge advanced main after PR #832 without changing Security roadmap/evidence files; its merge commit is the current baseline.
- Productive runtime/provider/IAM/billing/deployment surfaces are not changed by this documentation sync.

## Validation / completion gate

1. current `/AGENTS.md`, project/PVC mapping, Security README/roadmaps, ESS-0006 and ESS-0019 were re-read;
2. current main and open PRs were re-correlated; no open PR writer exists at branch creation;
3. PR #832 merge identity and hosted PR check success were re-read from GitHub;
4. post-merge main pipeline evidence confirms successful build/test, supply-chain/attestation, exact-SHA Render deployment and deployed identity verification for merge SHA `75c926f12ae514036aa508ea8faf1a82b1a91059`;
5. `SEC-SOTA-01` is now projected as `DONE_MAIN`; obsolete branch/PR-gate wording is removed from current roadmap status;
6. `SEC-VERIFY-R2-04` remains intentionally open for specific supervisor/restart/readiness runtime evidence and is not overclaimed from generic deployment success;
7. no foreign productive remediation is included;
8. local/unit/build execution for this docs-only sync is `NOT RUN`; no pre-PR paid CI was triggered;
9. exact main/head/open-PR re-correlation remains required immediately before PR creation;
10. PR creation requires explicit Human/Owner approval for the exact snapshot; merge remains Human/CODEOWNER-only.
