# CAPITAL-AI-OPS Work Packages

**Project:** `CAPITAL-AI-OPS`  
**Status:** ACTIVE BACKLOG / NON-AUTHORIZING  
**Correlation baseline:** `main@75c926f12ae514036aa508ea8faf1a82b1a91059`

Canonical current-main correlation evidence: [`evidence/OPS_SECURITY_BACKLOG_RECORRELATION_2026-09-06.md`](./evidence/OPS_SECURITY_BACKLOG_RECORRELATION_2026-09-06.md).  
Canonical post-PR-#828 correlation evidence: [`evidence/OPS_POST_828_PRIORITY_RECORRELATION_2026-09-07.md`](./evidence/OPS_POST_828_PRIORITY_RECORRELATION_2026-09-07.md).

## Security-priority packages

| Priority | Package | PVC | Source | Scope | Exit evidence / current disposition |
|---:|---|---|---|---|---|
| P1 | `OPS-08-SEC-07` Recovery / RPO / RTO | `PVC-08` | S1-R2-07 | approved objectives, recurring encrypted off-site backup, deterministic measured RPO, isolated measured restore | **HIGHEST EXECUTABLE LOCAL OPS SECURITY/DATA-INTEGRITY WORK** — recovery harness on main via PR #776; prior evaluator PR #802 is closed unmerged, its branch is absent and evaluator code is absent from main. Fresh current-main re-intake required; operational evidence and Security verification remain open |
| P1 | `OPS-06-SEC-03` Node Control-Plane Convergence | `PVC-06` | S1-R2-03 | converge `.nvmrc`, package engine policy and approved control-plane Node identity only after effective authority resolves the target | **BLOCKED_BY_AUTHORITY_CONFLICT** — current `.nvmrc` remains 24.18.0 and Accepted ADR-0053 still selects Node 24.18.0; the later 24.20.0 supersession remains proposed. Governance/ADR authority must be resolved before OPS mutation |
| P1 | `OPS-02-SEC-06` Entitlement Capability Inventory | `PVC-02` | S1-R2-06 | inventory every premium/protected capability; map server enforcement and actual Primary Owner | **PARENT EVIDENCE READY / RETURN-ONLY** — seven-capability matrix, DENY expectations and FINTECH/DATA child handoffs in `controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`; child remediation and Security verification remain open |
| P1 | `OPS-04-SEC-04` Fatal Process Handling | `PVC-04` | S1-R2-04 | readiness unhealthy on fatal error, stop new work, bounded cleanup, non-zero exit | **IMPLEMENTED_ON_MAIN via PR #720 / REPOSITORY_CONTRACT_VERIFIED via Security PR #832 / POST_DEPLOY_EVIDENCE_OPEN** |
| P1 | `OPS-02-SEC-05` Stripe Redirect Boundary | `PVC-02` | S1-R2-05 | server-owned canonical redirect origin/destination policy | **IMPLEMENTED_ON_MAIN / EVIDENCE_READY / RETURN-ONLY** — `stripeReturnUrlGuard` is mounted before `stripeRouter`; focused allow/deny/open-redirect tests exist on main. CAPITAL-AI-SEC verification remains open |
| P2 | `OPS-08-SEC-09` Strict CSP Promotion Evidence | `PVC-08` | S1-R2-09 | maintain report-only until protected compatibility window satisfies ADR-0040 | WAITING_FOR_EVIDENCE — violation/compatibility evidence + protected Stripe/Supabase/Consent/hCaptcha verification |
| P2 | `OPS-08-SEC-10` Billing Isolation Post-Deploy | `PVC-08` | S1-R2-10 | prove Production cannot reach DEV simulated-success billing logic | WAITING_FOR_EVIDENCE — exact runtime/bundle evidence, Production fail-closed behavior |

### OPS-02-SEC-06 disposition

The parent inventory is complete for the current candidate. It does **not** close `S1-R2-06`.

Current classifications:

- `verified_screening` — partial server enforcement / canonical alternate-route gap;
- `backtest` — no paid server entitlement enforcement;
- `monte_carlo` — browser-local alternate-path gap;
- `full_ai_analysis` — named plan capability not bound to one productive execution boundary;
- `realtime_ai_newsfeed` — accepted paid product contract conflicts with public runtime route;
- `buffett_value_check` — server authority present, current browser bearer integration fails closed;
- `pdf_compliance_export` — server-enforced reference pattern retained.

Foreign productive remediation is `REFERRED_NOT_EXECUTED`; CAPITAL-AI-SEC remains the independent verifier.

### OPS-02-SEC-05 disposition

Current main already contains the server-owned redirect boundary and focused negative tests. This corrects the stale backlog projection that still described S1-R2-05 as an unimplemented remediation. OPS records `IMPLEMENTED_ON_MAIN / EVIDENCE_READY` only; Security `VERIFIED/CLOSED` remains exclusively with CAPITAL-AI-SEC.

### OPS-06-SEC-03 disposition

The Node convergence requirement remains P1/HIGH, but it is not currently executable. Accepted ADR-0053 still names Node `24.18.0`, while the OPS/Security roadmap requests `24.20.0` and the existing write-boundary supersession is only proposed. The repository trust-root precedence therefore requires Governance/ADR resolution before OPS changes the Node control plane.

### OPS-08-SEC-07 disposition

PR #776 is the current-main Recovery Evidence Harness implementation baseline. The later deterministic RPO evaluator from PR #802 is **not** current implementation: PR #802 is closed and `merged=false`, `agent/operations-recovery-rpo-evidence-20260907` is absent, and `scripts/operations/recoveryRpoEvidence.mjs` is absent from current main.

Historical #802 diff/evidence may be reused only as implementation input. A new implementation requires a fresh branch from then-current main and a new exact-head validation cycle. Actual scheduled RPO, restore integrity/database-RTO, full-service RTO and independent CAPITAL-AI-SEC verification remain separate open gates.

Current-main re-correlation also includes Security PR #832. It changes no OPS target file and independently upgrades the R2-04 repository contract state to `REPOSITORY_CONTRACT_VERIFIED`; it does not close the remaining post-deploy evidence gate.

## Core OPS packages retained from V2.1

| Priority | Package | PVC | Scope | Current disposition |
|---:|---|---|---|---|
| P1 | `OPS-02-A` Controlled Implementation Inventory | `PVC-02` | correlate active execution paths, claims, branch/pre-PR boundaries | ACTIVE / recurring |
| P1 | `OPS-04-A` Supervisor Ownership & Gap Closure | `PVC-04` | finding lifecycle, recovery and non-deciding contract | PARTIAL; fatal-process implementation merged and repository contract re-verified, post-deploy evidence remains |
| P1 | `OPS-06-A` Version Boundary & Drift | `PVC-06` | package authority, compatibility adapter and drift testing | BLOCKED at `OPS-06-SEC-03` authority boundary; no Node mutation until Governance/ADR resolution |
| P1 | `OPS-07-A` Release Evidence Contract | `PVC-07` | candidate evidence, gate, rollback and handoff completeness | OPEN |
| P1 | `OPS-08-A` Production Handoff & Recovery | `PVC-08` | readiness, post-deploy health, rollback/recovery and evidence | OPEN / PARTIAL; `OPS-08-SEC-07` is the current highest executable local OPS Security/Data-Integrity gap |
| P1 | `OPS-18-A` EventMesh/Traceability Coverage | `PVC-18` | replay/reliability plus ETM publish/consume/axis gaps | OPEN / PARTIAL |
| P2 | `OPS-08-B` Reliability & Capacity Baseline | `PVC-08` | SLO/SLI/capacity/degradation evidence | OPEN |
| P2 | `OPS-18-B` Traceability Freshness | `PVC-18` | staleness/identity coverage without authority expansion | OPEN |

## DR-03 — Provider Adapter / Execution Integration

| Priority | Package | PVC | Source | Scope | Current disposition |
|---:|---|---|---|---|---|
| queued after higher-priority OPS gates | `DR-03` Provider Adapter / Execution Integration | primary `PVC-02`; supporting `PVC-04`, `PVC-18`; Release/Production boundaries remain `PVC-07`/`PVC-08` | `docs/architecture/ROADMAP.md`, ADR-0060 v1.1.0, ESS-0019 v1.2.0 | extend the existing provider-neutral Control Plane with the smallest productive provider-adapter execution boundary; preserve Identity/Capability/Policy/Audit/Trace gates; no second control plane or direct SDK bypass | **BLOCKED_BY_HIGHER_PRIORITY_OPS_GATE** — former GOV-03/DR-02B dependency is terminal; Node convergence is authority-blocked and `OPS-08-SEC-07` remains an executable P1/HIGH OPS Security/Data-Integrity gap ahead of DR-03 |

### DR-03 reuse disposition

- Provider profiles/canonical provider inventory — **REUSE** (`src/platform/Security/providerProfile.ts`).
- Provider-neutral Agent IAM/capability controls — **REUSE** (`src/platform/Security/agentIam.ts` plus existing grant/policy controls).
- Supervisor provider-chain observation — **EXTEND** only when DR-03 becomes executable (`src/platform/Supervisor/agentProviderObservation.ts`).
- Existing request/orchestration and approved execution boundaries — **EXTEND**, never bypass.
- Audit/Trace correlation — **REUSE / EXTEND evidence only** under ESS-0019/W3C trace semantics.
- Productive OpenAI/Anthropic/xAI adapter layer — current-main scan did not identify a separate completed adapter layer; later DR-03 must implement only the minimal missing boundary behind existing gates.
- Governance, identity, registry, Release, deployment or Production authority — **DO NOT IMPLEMENT** as DR-03 parallel architecture.

DR-03 is not authorized to start productive adapter code while higher-priority OPS gates remain open. Its current authorized action is correlation/materialization only.

## Package rules

1. One bounded work package per fresh compliant branch unless a deliberately coherent package is explicitly correlated.
2. Security-related implementation may become `IMPLEMENTED`/`EVIDENCE_READY` only; Security `VERIFIED/CLOSED` belongs to CAPITAL-AI-SEC.
3. Foreign productive code identified during OPS work is handed off and remains `REFERRED_NOT_EXECUTED` locally.
4. HIGH/CRITICAL protected changes retain all applicable Human/Owner gates.
5. Runtime mutation and provider mutation are never implied by a documentation or code package.
6. A terminal Governance dependency may unblock correlation without overriding a higher-priority active OPS Security/Data-Integrity gate.
7. A lower-precedence project roadmap must not silently override an Accepted ADR; unresolved authority divergence is fail-closed.
8. Closed-unmerged PRs and absent branches are historical implementation inputs only, not current repository state.

## Current-main terminal OPS work — 2026-09-07

The following recent OPS work is already Human-merged, repository-implemented or explicitly closed-unmerged and must not remain an executable implementation package solely because historical coordination/roadmap metadata is stale:

| Work | Terminal repository evidence | Residual boundary |
|---|---|---|
| Alpha Vantage canonical secret/deployment contract | PR #642 merged | any Production secret/deploy mutation remains separately gated |
| Retired PR-authorization runtime | PR #691 merged / current trust root keeps productive runtime retired | no reconstruction |
| Fatal Process Handling | PR #720 merged; Security PR #832 repository contract re-verification merged | exact post-deploy supervisor/restart/readiness evidence remains separate |
| R-Class CI cost control | PR #721 merged | recurring CI behavior remains governed by current classifier/contracts |
| Auth Lifecycle re-correlation | PR #722 merged; claim released | foreign FE/GOV/SEO/Security work remains with actual owners |
| User Lifecycle OPS closeout | PR #729 merged | isolated provider E2E unavailable in closeout surface; Security verification remains separate |
| GOV-03 / DR-02B | PR #743 merged under CAPITAL-AI-GOV | terminal foreign dependency only; no Governance ownership transfer |
| Stripe Redirect Boundary `OPS-02-SEC-05` | current main contains `stripeReturnUrlGuard`, route composition and focused negative tests; implementation commit `bcefb1b2cdf2ecc56becfa7c5c8fcd6db8cbc43f` | independent CAPITAL-AI-SEC verification remains open |
| DR-03 roadmap re-correlation | PR #747 merged | terminal coordination metadata |
| Recovery/RPO/RTO harness | PR #776 merged | scheduled RPO/restore/RTO and Security evidence remain open |
| GOV-07 OPS evidence return | PR #794 merged | broader provider/foreign-owner/Security gates remain |
| RPO measurement evaluator | PR #802 closed unmerged; former branch absent; evaluator absent from main | **NOT_IMPLEMENTED_ON_MAIN / FRESH_REINTAKE_REQUIRED** |
| qs 6.16.0 DoS remediation | PR #828 merged; final hosted CI/Governance/Container Security successful; current live later main contains override/lock/test | **IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL** |

## User Lifecycle terminal closeout — 2026-09-05

`OPS-ULS-CLOSEOUT-2026-09-05` is terminal for the OPS-owned repository/read-only-provider closeout after Human merge of PR #729. Canonical package/evidence remain:

- `work-packages/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`;
- `evidence/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`.

Bounded residuals remain explicit:

- historical Supabase migration baseline is still insufficient to prove full clean local application-schema replay;
- Supabase Local/Mailpit and Stripe sandbox/Test Clock E2E were `NOT_AVAILABLE` in the closeout execution surface;
- `public.subscriptions` RLS/provider identity evidence remains evidence, not Security closure;
- leaked-password protection remains a separate protected provider-config decision;
- Annual Pro price drift remains foreign shared/product-contract work;
- Security closure remains CAPITAL-AI-SEC.

The User Lifecycle closeout itself did not close `OPS-02-SEC-05`; the separate current-main re-correlation establishes that S1-R2-05 implementation is already present and evidence-ready. `OPS-06-SEC-03`, `OPS-08-SEC-07`, DR-03 and foreign productive entitlement work remain unresolved as scoped above.
