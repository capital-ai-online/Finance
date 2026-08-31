# CAPITAL-AI — Quality Management

**Project ID:** `CAPITAL-AI-QM`  
**Domain:** Quality Management  
**Lifecycle:** `PROPOSED — ACTIVATES AFTER ADR-0103 ACCEPTANCE / HUMAN MERGE`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

This project is the single operational execution point for quality-management work packages after ADR-0103 becomes effective. It consolidates quality execution without taking authority from Security, Compliance, Governance, IAM, Release, Frontend Product or Financial Runtime domains.

## Authority chain

```text
Human / Owner
  -> ADR / ESS / Contracts
  -> ADR-0096 Governance Control Plane
  -> Domain Authority
  -> CAPITAL-AI-QM ROADMAP
  -> ESS-0005 Quality Center
  -> Validators / tests / measurements / evidence
  -> Quality report / findings / domain handoff
```

Normative authority remains at canonical locations. No ADR or ESS copies are stored here.

- `ESS-0001-CONTRACTS`, Chapter 12 — validation and quality contracts.
- `ESS-0005 Quality Center` — technical Quality Center component boundary.
- `ADR-0096` — Governance Control Plane and supersession rules.
- `ADR-0073` / `ADR-0047` — CI and pre-merge gate authority.
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` — portfolio authority.
- `ADR-0103` — proposed QM single-execution authority.

## Execution boundary

QM may execute existing validators, aggregate quality evidence, verify tests/coverage/build evidence, measure runtime and performance, detect regressions and technical debt, validate QM documentation consistency and produce a non-authorizing release-readiness snapshot.

QM MUST NOT define or mutate Security/IAM/Compliance/Governance policy, authorize merge/deploy/release, invent numeric quality thresholds, replace frontend/auth/routing architecture, or alter financial/scoring/ranking logic.

## Canonical value-chain projection

The current implementation in `src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` projects the full 18-stage chain read-only:

1. `VC-01-REQUEST-INTAKE`
2. `VC-02-IDENTITY-ACCESS`
3. `VC-03-ENTITLEMENT-USAGE`
4. `VC-04-ASSET-UAI`
5. `VC-05-ORCHESTRATION-RUNTIME-GUARD`
6. `VC-06-EVIDENCE-ACQUISITION`
7. `VC-07-DATA-VALIDATION-PROVENANCE`
8. `VC-08-DISPLAY-RESEARCH`
9. `VC-09-CLASSIFICATION-FEATURE-CONTRACT`
10. `VC-10-SCORING-MODEL-REGISTRY`
11. `VC-11-SCORING-DISPATCHER`
12. `VC-12-DOMAIN-EXECUTOR`
13. `VC-13-CANONICAL-SCORE-LINEAGE`
14. `VC-14-CONFIDENCE-DQ`
15. `VC-15-RANKING-COMPARABILITY`
16. `VC-16-RANKING-ELIGIBILITY-SLO`
17. `VC-17-EVENT-TRACEABILITY-SUPERVISOR`
18. `VC-18-DELIVERY-SURFACES`

No parallel value-chain model may be introduced by this project.

## Navigation

- [`ROADMAP.md`](./ROADMAP.md) — operational QM status and work items.
- [`TAKEOVER_INDEX.md`](./TAKEOVER_INDEX.md) — single mapping table from source roadmaps to QM.
- [`QUALITY_BASELINE.md`](./QUALITY_BASELINE.md) — observed repository and authority baseline.
- [`METRICS_AND_EVIDENCE.md`](./METRICS_AND_EVIDENCE.md) — evidence semantics and metric rules.
- [`runbooks/`](./runbooks/) — repeatable execution procedures.
- [`evidence/`](./evidence/) — append-only evidence guidance.

## Takeover rule

A source roadmap retains domain context and dependencies. Once a quality-only subtask is marked `HANDED_OFF_TO_QM`, operational status is maintained only in `ROADMAP.md`. Mixed work packages transfer only their `QUALITY_EXECUTION` portion.