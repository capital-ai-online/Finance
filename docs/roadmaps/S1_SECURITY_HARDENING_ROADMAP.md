# CAPITAL-AI S1 Security Hardening Roadmap

Status: ACTIVE / PARTIAL / ACTION REQUIRED  
Status date: 2026-08-30  
Repository baseline reviewed: `main@b8c4757aaa62a2a63745e2f86a777630968f4f5d`  
Production deployment identity reviewed: `b8c4757aaa62a2a63745e2f86a777630968f4f5d`  
Active R2 tail implementation branch: `security/s1-r2-09-11-hardening-20260830`  
Historical security baseline: `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md`  
Current Operations handoff: `docs/runbooks/OPERATIONS_HANDOFF_2026-08-29.md`

## Objective and authority

S1 remains the **single canonical bounded security-hardening gate** inside the DEVELOPMENT Chain. This file is updated in place. No second Security roadmap, parallel hardening program or competing S1 status authority may be introduced.

The active objective remains `HARDENED / VERIFIED`. No finding is closed from intent alone: `VERIFIED PASS` requires the applicable code/configuration/provider evidence, positive/negative tests and exact identity binding.

Production and `main` are currently aligned at `b8c4757aaa62a2a63745e2f86a777630968f4f5d`. Candidate-branch changes are not production evidence until Human merge, deployment and post-deploy verification complete.

## Owner decisions recorded 2026-08-30

1. **S1-R2-08 leaked-password protection is skipped for the current Supabase Free/Base tier.** The Owner explicitly accepted that the native control is unavailable on the active tier and instructed that no custom leaked-password service/database be introduced solely to emulate the paid native feature. Existing compensating controls remain required.
2. **S1-R2-09 through S1-R2-11 are intentionally addressed in one bounded Pull Request.** R2-09 remains behind the accepted ADR-0040 Report-Only Promotion Gate until the required production evidence exists; R2-10 and R2-11 implementation proceeds in the same bounded PR.
3. This batching instruction does **not** authorize merging, deployment, Render/Supabase/GitHub provider mutation or closure of unrelated open P1 controls.

## Reassessment register (R2)

| ID | Source finding | Priority | Current status | Required disposition |
|---|---|---:|---|---|
| S1-R2-00 | P1-C01 simulated client tier transition | P1 Conditional | OPEN / TRACE PENDING | Prove complete reachability and authority |
| S1-R2-01 | P2-04 workflow `345251495` startup failure | P1 Operational | RESOLVED / OBSOLETE HISTORICAL | Retain traceability; do not recreate phantom control |
| S1-R2-02 | P1-01 default-branch enforcement | P1 | PARTIAL / OWNER DISPATCH PENDING | `mode=plan` → separate Owner ACCEPT → `mode=full` → readback |
| S1-R2-03 | P1-02 Node control-plane 24.18.0 | P1 | OPEN / PARTIAL CONVERGENCE | Converge repository/control-plane to Node 24.20.0 |
| S1-R2-04 | P1-03 `uncaughtException` resumes process | P1 | OPEN / CONFIRMED | Fail-fast + bounded cleanup + non-zero exit + supervisor evidence |
| S1-R2-05 | P1-04 client-controlled Stripe redirect URLs | P1 | OPEN / CONFIRMED | Server-owned canonical redirect boundary |
| S1-R2-06 | P1-C01 entitlement authority, if reachable | P1 | CONDITIONAL | Activate only if R2-00 proves authority impact |
| S1-R2-07 | P1-05 RPO/RTO and restore capability | P1 | OPEN / UNVERIFIED | Encrypted off-site backup + isolated measured restore drill |
| S1-R2-08 | P2-03 leaked-password protection | P2 | OWNER-ACCEPTED / TIER EXCEPTION | Native control skipped on Free/Base tier; compensating controls retained |
| S1-R2-09 | P2-02 strict CSP promotion | P2 | PARTIAL / REPORT-ONLY | Collect ADR-0040 promotion evidence before any strict production default |
| S1-R2-10 | P2-05 demo billing/coupon logic | P2 | IMPLEMENTED / PR VERIFY PENDING | Production denies missing Stripe config; simulation DEV-only |
| S1-R2-11 | P2-01/P2-06 evidence identity and staleness | P2 | IMPLEMENTED / PR VERIFY PENDING | Explicit machine `CURRENT`/`STALE` state transitions |
| S1-R2-12 | P2-01 production/main content drift | P2 | VERIFIED / HISTORICAL | Keep identity correlation |

## Mandatory execution order

```text
R2-00 entitlement authority trace
+ R2-01 RESOLVED historical classification
        ↓
R2-02 GitHub main enforcement live reconciliation
        ↓
R2-03 Node control-plane supersession
        ↓
R2-04 fatal process recovery
        ↓
R2-05 Stripe redirect boundary
→ R2-06 entitlement remediation only if R2-00 activates it
        ↓
R2-07 disaster recovery evidence
        ↓
R2-08 OWNER-ACCEPTED tier exception
        ↓
R2-09 promotion-gate preservation + R2-10 + R2-11 combined tail PR by explicit Owner instruction
        ↓
S1-R2 HARDENED / VERIFIED gate
```

The combined R2-09..R2-11 PR does not reorder or implicitly close the earlier open P1 controls.

## S1-R2-00 — Entitlement authority trace

**Current state:** OPEN / TRACE PENDING

Required proof remains:

- identify production-reachable simulated tier/payment callers;
- prove whether browser tier state can influence persisted/server authorization;
- inventory protected API entitlement decision points;
- prove browser-controlled tier values cannot grant protected server capability;
- prove Stripe-verifiable server state is subscription truth;
- classify `NOT AUTHORITY` or `CONFIRMED AUTHORITY GAP`.

If authority impact is proven, R2-06 activates immediately.

## S1-R2-01 — Workflow startup-failure classification

**Current state:** RESOLVED / OBSOLETE HISTORICAL

The historical workflow ID `345251495` remains classified as obsolete phantom-control evidence. No no-op workflow was introduced. Reopening requires new evidence of a real missing current control.

## S1-R2-02 — GitHub default-branch enforcement

**Current state:** PARTIAL / OWNER DISPATCH PENDING  
**Mutation:** Owner-gated GitHub provider mutation

Current canonical target retains pull-request enforcement, four issuer-bound required checks, linear history, deletion protection, CODEOWNER review and review-thread resolution. Commit signing remains intentionally optional under the Owner decision dated 2026-08-30.

Closure still requires trusted-main `ruleset-sync mode=plan`, separate Owner ACCEPT for `mode=full`, provider readback and proof of effective enforcement.

## S1-R2-03 — Node control-plane supersession

**Current state:** OPEN / PARTIAL CONVERGENCE

- Docker runtime is already Node `24.20.0`.
- `.nvmrc` and remaining repository/control-plane policy are not yet fully converged.
- Existing supersession infrastructure must be reused; no parallel updater.

Exit requires all active Node policy to resolve consistently to the approved 24.20.0 baseline and exact-head CI PASS.

## S1-R2-04 — Fatal process handling

**Current state:** OPEN / CONFIRMED

Unhandled exceptions must make readiness unhealthy, stop new work, run only bounded safe cleanup, exit non-zero and rely on the Render supervisor for replacement. Closure requires child-process negative evidence and post-deploy recovery evidence.

## S1-R2-05 — Stripe Checkout redirect boundary

**Current state:** OPEN / CONFIRMED

Client-controlled absolute `successUrl` / `cancelUrl` remain outside the accepted architecture. The server must own redirect origins and accept only constrained relative destinations/tokens when destination choice is needed. Open-redirect negative tests remain mandatory.

## S1-R2-06 — Stripe-verified entitlement projection

**Current state:** CONDITIONAL

Only activates if R2-00 proves an authority gap. A browser or redirect must never become subscription authority; only Stripe-verifiable server state may change protected entitlement.

## S1-R2-07 — Disaster recovery / RPO / RTO

**Current state:** OPEN / UNVERIFIED

A runbook is not recovery evidence. Closure requires business-approved RPO/RTO, recurring encrypted off-site backup, isolated restore, integrity validation and measured actual RPO/RTO.

## S1-R2-08 — Leaked-password protection

**Current state:** OWNER-ACCEPTED / TIER EXCEPTION  
**Owner decision:** 2026-08-30

The active Supabase Free/Base tier does not provide the desired native leaked-password control. By explicit Owner instruction this control is **not** implemented through a custom substitute and does not block execution of the subsequent R2 tail controls.

Required residual controls remain the repository/product controls already used for credential-abuse reduction, including applicable hCaptcha/rate limiting/password-policy/MFA-AAL2 protections. This decision must be revisited if the Supabase tier changes or the native feature becomes available on the active tier.

No Supabase provider mutation is authorized by this exception.

## S1-R2-09 — CSP strict-mode promotion

**Current state:** PARTIAL / REPORT-ONLY

### Current protected state

- `server/securityResponse.ts` remains the single authoritative CSP response boundary.
- Production continues to default to **`report-only`** in accordance with ADR-0040 and GMG-005.
- The enforced baseline remains availability-safe while the strict nonce + `'strict-dynamic'` target is evaluated through `Content-Security-Policy-Report-Only`.
- `'unsafe-eval'` remains absent from the production target policy.
- Explicit `CSP_MODE=strict` remains available only for an evidence-backed protected promotion.
- Explicit `CSP_MODE=baseline` remains an availability-recovery mode.
- Empty/invalid values fail safely to `report-only`; they do not silently promote strict enforcement.
- Regression tests assert the report-only default, explicit strict target, nonce/strict-dynamic and absence of unsafe-eval.

### Promotion evidence still required

The existing 2026-08-29 security evidence records that no measured zero-violation production observation window is available. Therefore this PR does **not** promote the production default to strict. Required evidence remains the ADR-0040 Report-Only Promotion Gate, including successful first-party bootstrap and compatibility of CookieHub/Consent, Stripe, Supabase, hCaptcha and other approved integrations.

### Exit

R2-09 remains open until the required production observation evidence exists and a separately reviewed protected change promotes strict enforcement. Final `VERIFIED PASS` requires Production to report strict CSP with approved integrations operational. Availability rollback remains the existing `report-only`/`baseline` path rather than a second CSP implementation.

## S1-R2-10 — Demo/sandbox billing isolation

**Current state:** IMPLEMENTED / PR VERIFY PENDING

### Implementation in the active tail branch

`src/components/Checkout.tsx` now treats missing/placeholder Stripe publishable configuration as follows:

- **Development:** sandbox/demo mode may be entered only behind `import.meta.env.DEV === true`.
- **Production:** checkout fails closed, demo mode is kept false and the UI reports Stripe Checkout unavailable.
- Production cannot enter the simulated-success UI merely because Stripe configuration is missing.
- Existing server-side coupon validation remains authoritative; this work does not replace it with client coupon authority.
- Regression tests verify that the only `setDemoMode(true)` path is DEV-gated and that the production-deny path remains present.

This closes the production reachability of the UI sandbox behavior; it does not itself close R2-00/R2-06 or R2-05.

### Exit

Exact-head CI must prove the production build/test path. Production deployment must not expose the development sandbox path.

## S1-R2-11 — Content-addressed evidence and stale-state automation

**Current state:** IMPLEMENTED / PR VERIFY PENDING

Existing architecture already provides:

- content-addressed Production/Main/Head Baseline IDs;
- trusted-main preflight generation;
- trusted auto-refresh after PR Governance and verified main deployment;
- fail-closed identity checks before PR-body mutation.

### Added explicit stale semantics in the active tail branch

`scripts/pr/productionBaselineBody.mjs` now returns a machine-readable evidence state:

- `CURRENT` — canonical PR body already matches current Production/Main/Head identity;
- `STALE` — identity/content changed and the canonical baseline requires atomic refresh.

`scripts/pr/updatePrProductionBaseline.mjs` exposes final workflow states:

- `CURRENT`;
- `CURRENT_AFTER_REFRESH` with detected state `STALE`;
- `STALE_RETRY_REQUIRED` when main/head/boundary changes invalidate the preflight before write.

Regression tests prove same-identity `CURRENT`, changed-identity `STALE`, marker-free stale repair and fail-closed duplicate/ambiguous marker states.

### Exit

Exact-head governance tests must PASS and the trusted refresh workflow must continue to execute only from trusted-main policy. No candidate PR may authorize its own weakened stale-state semantics.

## S1-R2-12 — Production/main content drift

**Current state:** VERIFIED / HISTORICAL

The historical runtime/content drift finding remains closed by the prior reconciliation path. Production, `main` and candidate identities must nevertheless always be represented independently.

## Combined R2-09..R2-11 Pull Request contract

The Owner explicitly requested one Pull Request for the remaining tail controls. The PR therefore has a bounded combined security scope:

```text
R2-08 decision evidence only
+ R2-09 preserve ADR-0040 report-only promotion gate and strict target
+ R2-10 production billing sandbox isolation
+ R2-11 explicit evidence staleness state
+ targeted regression tests
+ S1/Ops documentary synchronization
```

Expected check class is application/runtime security (`R` under the canonical PR template). No external provider mutation is performed by the branch itself.

Before PR creation:

- re-read current `main` and open PRs;
- ensure branch contains current `main`;
- review changed files for scope creep;
- bind the canonical Production/Main/Head preflight.

After PR creation:

- Governance/Security checks;
- TypeScript/lint;
- unit tests including the new R2 tests;
- production build including CSP production-path test;
- predeploy/deployment-readiness checks as selected by the canonical workflow;
- final `build-and-test`;
- Human/CODEOWNER review and separate Human merge decision.

## R2 HARDENED / VERIFIED gate

S1-R2 may report `HARDENED / VERIFIED` only when:

```text
R2-00 authority trace resolved
AND R2-01 historical classification remains accepted
AND R2-02 live main protection enforced and read back
AND R2-03 Node control-plane superseded
AND R2-04 fatal process recovery verified
AND R2-05 Stripe redirect boundary closed
AND R2-06 closed or NOT-AUTHORITY evidence accepted
AND R2-07 measured restore drill complete
AND R2-08 Owner tier exception remains valid or native control becomes available
AND R2-09 strict Production CSP verified after deploy
AND R2-10 production sandbox isolation verified
AND R2-11 stale-state automation verified
```

The R2-08 tier exception is an explicit bounded Owner residual-risk decision. It does not imply that other open P1 controls may be skipped.

## Historical S1 traceability

The historical F-01..F-18 baseline remains authoritative for traceability through `docs/security/SECURITY_REMEDIATION_BASELINE_2026-08-12.md` and repository history. R2 changes current execution priority; it does not erase historical closure evidence.

| Historical finding(s) | Canonical ownership retained |
|---|---|
| F-01, F-11, F-12 | S1.1 Documentation API authorization/filesystem boundary |
| F-02 | S1.2 Production runtime controls fail closed |
| F-04, F-15 | S1.3 Trusted proxy/client identity/rate limiting |
| F-05 | S1.4 Server-secret namespace isolation |
| F-03, F-09 | S1.5 CI trust-chain/GitHub output/template integrity |
| F-06, F-07, F-08 | S1.6 Browser HTTP policy hardening |
| F-16 | M5 Audit / Telemetry |
| F-14 | M5A Native MFA / AAL2 |
| F-10, F-17 | M6 Supply Chain Provenance |
| F-13 | M9 independent/adversarial assurance |
| F-18 | Retain accepted state only while deny-by-default RLS intent remains evidenced |

## Verbindlicher PR-Template-Contract

Every PR against `main`, including this combined R2 tail PR, MUST use the complete canonical `.github/pull_request_template.md` contract. Machine-managed Production/Main/Head identity fields remain authoritative; Human/CODEOWNER merge remains required and agent self-merge remains prohibited.

## Definition of Done

S1 is complete only when:

- the R2 `HARDENED / VERIFIED` gate above is satisfied;
- no secrets are present in evidence;
- current evidence is bound to exact identities and stale evidence fails closed;
- remediation PRs receive independent checks and Human review/Human merge;
- external provider/deployment mutations remain separately Owner-authorized and post-change read back;
- DEVELOPMENT Chain, this S1 roadmap and the Operations handoff remain synchronized to final identities.
