# CAPITAL-AI-OPS Work Packages

**Project:** `CAPITAL-AI-OPS`  
**Status:** ACTIVE BACKLOG / NON-AUTHORIZING  
**Baseline:** `main@6dea22e5b8c4f2b0b9c9fbfb73615738acf57a54`

## Current-main inbound package

| Priority | Package | PVC | Source | Scope | Exit evidence |
|---:|---|---|---|---|---|
| P1 | `OPS-02-GOV-040` User-Lifecycle Harness & Provider Test Contract | `PVC-02` + `PVC-08` evidence | `GOV-CHAT-040` / `PR-OPS-ULS-HARNESS` | establish the OPS-owned lifecycle/provider test harness and stable server-side auth/billing test contract using isolated provider/test environments; do not implement FE projection, Security verification, Compliance assessment or GOV closeout | stable executable test contract; provider/server lifecycle coverage; webhook/outbox/subscription projection evidence; exact runtime/provider evidence only where actually executed; no Production mutation implied |

The Governance dependency map lists the bounded owner scope as Playwright/provider harness, Supabase Local Stack/Mailpit, Stripe Sandbox/Test Clocks, webhook/outbox/subscription projection tests and server-side auth/billing boundaries. Open PR #683 is the separate productive candidate for this package and owns eight Lifecycle implementation/test/evidence paths. The current claim/project-reconciliation package neither changes those paths nor treats an open candidate as merged evidence.

## Security-priority packages

| Priority | Package | PVC | Source | Scope | Exit evidence |
|---:|---|---|---|---|---|
| P1 | `OPS-02-SEC-06` Entitlement Capability Inventory | `PVC-02` | S1-R2-06 | inventory every premium/protected capability; map server enforcement and actual Primary Owner | complete capability matrix; browser-tier/forged/missing-auth/alternate-path DENY expectations mapped; child handoffs created where foreign code exists |
| P1 | `OPS-06-SEC-03` Node Control-Plane Convergence | `PVC-06` | S1-R2-03 | converge `.nvmrc`, package engine policy and approved control-plane Node identity to Node 24.20.0 | exact-candidate identity checks + CI; runtime identity only if claimed |
| P1 | `OPS-04-SEC-04` Fatal Process Handling | `PVC-04` | S1-R2-04 | readiness unhealthy on fatal error, stop new work, bounded cleanup, non-zero exit | negative child-process test + `PVC-08` supervisor recovery evidence |
| P1 | `OPS-02-SEC-05` Stripe Redirect Boundary | `PVC-02` | S1-R2-05 | server-owned canonical redirect origin/destination policy | allowlist positive tests + attacker absolute/open-redirect negative tests |
| P1 | `OPS-08-SEC-07` Recovery / RPO / RTO | `PVC-08` | S1-R2-07 | approved objectives, recurring encrypted off-site backup, isolated measured restore | integrity-validated restore + measured actual RPO/RTO; runbook alone insufficient |
| P2 | `OPS-08-SEC-09` Strict CSP Promotion Evidence | `PVC-08` | S1-R2-09 | maintain report-only until protected compatibility window satisfies ADR-0040 | violation/compatibility evidence + protected Stripe/Supabase/Consent/hCaptcha verification |
| P2 | `OPS-08-SEC-10` Billing Isolation Post-Deploy | `PVC-08` | S1-R2-10 | prove Production cannot reach DEV simulated-success billing logic | exact runtime/bundle evidence, Production fail-closed behavior |

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

## Merged evidence correlated to the backlog

- PR #642 is merged repository evidence for the OPS-owned Alpha Vantage secret/deployment control-plane consolidation. Its stale post-merge Work Claim is terminalized by the current reconciliation package. This does not prove Production secret presence or authorize a deploy.
- PR #648 is merged `PVC-02` evidence for fail-closed merged-branch lifecycle cleanup. It contributes to `OPS-02-A` but does not complete the broader Controlled Implementation inventory by itself.
- PR #632 remains the merged project-surface/Security-handoff baseline; its historical Work Claim is already released.
- PR #684 is merged Governance baseline evidence for ADR-0104 session/merge-boundary hardening; it does not complete an OPS package and changes no OPS project path.

## Package rules

1. One bounded work package per fresh compliant branch unless a deliberately coherent package is explicitly correlated.
2. Security-related implementation may become `IMPLEMENTED`/`EVIDENCE_READY` only; Security `VERIFIED/CLOSED` belongs to CAPITAL-AI-SEC.
3. Foreign productive code identified during OPS work is handed off and remains `REFERRED_NOT_EXECUTED` locally.
4. HIGH/CRITICAL protected changes retain all applicable Human/Owner gates.
5. Runtime mutation and provider mutation are never implied by a documentation or code package.
6. `OPS-02-SEC-06` and `OPS-02-GOV-040` are semantically adjacent around entitlement/auth/billing boundaries; they remain separate packages unless a fresh correlation proves that one coherent implementation package is safer than parallel work.
7. Open PR #683 is the current writer for `OPS-02-GOV-040`; parallel OPS work must respect its exact claimed/changed paths and semantic boundary until it is terminal.
