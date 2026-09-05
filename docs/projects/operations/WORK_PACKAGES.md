# CAPITAL-AI-OPS Work Packages

**Project:** `CAPITAL-AI-OPS`  
**Status:** ACTIVE BACKLOG / NON-AUTHORIZING  
**Correlation baseline:** `main@891f3933ac0476b1e7d4fa5cd6f397257ac52e68`

## Security-priority packages

| Priority | Package | PVC | Source | Scope | Exit evidence |
|---:|---|---|---|---|---|
| P1 | `OPS-02-SEC-06` Entitlement Capability Inventory | `PVC-02` | S1-R2-06 | inventory every premium/protected capability; map server enforcement and actual Primary Owner | **PARENT EVIDENCE READY** — seven-capability matrix, DENY expectations and FINTECH/DATA child handoffs in `controlled-implementation/OPS_02_SEC_06_ENTITLEMENT_CAPABILITY_INVENTORY.md`; child remediation and Security verification remain open |
| P1 | `OPS-06-SEC-03` Node Control-Plane Convergence | `PVC-06` | S1-R2-03 | converge `.nvmrc`, package engine policy and approved control-plane Node identity to Node 24.20.0 | exact-candidate identity checks + CI; runtime identity only if claimed |
| P1 | `OPS-04-SEC-04` Fatal Process Handling | `PVC-04` | S1-R2-04 | readiness unhealthy on fatal error, stop new work, bounded cleanup, non-zero exit | negative child-process test + `PVC-08` supervisor recovery evidence |
| P1 | `OPS-02-SEC-05` Stripe Redirect Boundary | `PVC-02` | S1-R2-05 | server-owned canonical redirect origin/destination policy | allowlist positive tests + attacker absolute/open-redirect negative tests |
| P1 | `OPS-08-SEC-07` Recovery / RPO / RTO | `PVC-08` | S1-R2-07 | approved objectives, recurring encrypted off-site backup, isolated measured restore | integrity-validated restore + measured actual RPO/RTO; runbook alone insufficient |
| P2 | `OPS-08-SEC-09` Strict CSP Promotion Evidence | `PVC-08` | S1-R2-09 | maintain report-only until protected compatibility window satisfies ADR-0040 | violation/compatibility evidence + protected Stripe/Supabase/Consent/hCaptcha verification |
| P2 | `OPS-08-SEC-10` Billing Isolation Post-Deploy | `PVC-08` | S1-R2-10 | prove Production cannot reach DEV simulated-success billing logic | exact runtime/bundle evidence, Production fail-closed behavior |

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

Current-main recorrelation includes merged PR #683 (User Lifecycle Harness), merged PR #688 (terminal claim release) and merged PR #689 (ADR-0104 v1.3 slot reset). None changes the identified productive entitlement entry points or child ownership. Open PR #691 retires the M10 runtime and has zero changed-file/semantic overlap with this package.

## Core OPS packages retained from V2.1

| Priority | Package | PVC | Scope |
|---:|---|---|---|
| P1 | `OPS-02-A` Controlled Implementation Inventory | `PVC-02` | correlate active execution paths, claims, branch/pre-PR boundaries |
| P1 | `OPS-04-A` Supervisor Ownership & Gap Closure | `PVC-04` | finding lifecycle, recovery and non-deciding contract |
| P1 | `OPS-06-A` Version Boundary & Drift | `PVC-06` | package authority, compatibility adapter and drift testing |
| P1 | `OPS-07-A` Release Evidence Contract | `PVC-07` | candidate evidence, gate, rollback and handoff completeness |
| P1 | `OPS-08-A` Production Handoff & Recovery | `PVC-08` | readiness, post-deploy health, rollback/recovery and evidence |
| P1 | `OPS-18-A` EventMesh/Traceability Coverage | `PVC-18` | replay/reliability plus ETM publish/consume/axis gaps |
| P2 | `OPS-08-B` Reliability & Capacity Baseline | `PVC-08` | SLO/SLI/capacity/degradation evidence |
| P2 | `OPS-18-B` Traceability Freshness | `PVC-18` | staleness/identity coverage without authority expansion |

## Package rules

1. One bounded work package per fresh compliant branch unless a deliberately coherent package is explicitly correlated.
2. Security-related implementation may become `IMPLEMENTED`/`EVIDENCE_READY` only; Security `VERIFIED/CLOSED` belongs to CAPITAL-AI-SEC.
3. Foreign productive code identified during OPS work is handed off and remains `REFERRED_NOT_EXECUTED` locally.
4. HIGH/CRITICAL protected changes retain all applicable Human/Owner gates.
5. Runtime mutation and provider mutation are never implied by a documentation or code package.

## User Lifecycle current-main closeout — 2026-09-05

`OPS-ULS-CLOSEOUT-2026-09-05` is the current bounded OPS package for the remaining User Lifecycle evidence/coordination work. Canonical package/evidence:

- `work-packages/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`;
- `evidence/USER_LIFECYCLE_OPS_CLOSEOUT_2026-09-05.md`.

Current disposition against `main@0c595dc4f07fc279eabec272ca6046967f3b83e8`:

- repository User Lifecycle harness and stable-user-ID migration: implemented on main;
- connected Supabase subscription projection: still old email-based function -> `PRODUCTION_GATE_REQUIRED`;
- historical Supabase migration baseline: incomplete in repository -> local full schema replay `NOT_AVAILABLE` until safely imported/correlated;
- Supabase Local/Mailpit and Stripe sandbox/Test Clock E2E: `NOT_AVAILABLE` in the current execution surface;
- Annual Pro price drift: retained as foreign shared/product-contract work; OPS does not mutate it;
- Security closure: remains CAPITAL-AI-SEC; no OPS `VERIFIED/CLOSED` assertion.

This closeout does not absorb the separate `OPS-02-SEC-05` Stripe redirect remediation or any foreign `S1-R2-06` child implementation.
