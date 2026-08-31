# CAPITAL-AI-QM — Quality Baseline

**Observed at:** 2026-08-31  
**Observed main:** `0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Open PR correlation at baseline:** no open PRs observed  
**QM branch:** `docs/qm-project-consolidation-20260831`

## Authority findings

| Artifact | Finding | QM action |
|---|---|---|
| `ADR-0096` | Accepted Governance Control Plane; explicitly recognizes the current 18-stage value-chain projection and obsolete earlier 14-stage projection | Retain; subordinate QM to it |
| `ESS-0005` | Correct read-only Quality Center architecture, but documentation still describes a 14-stage projection | Amend same ESS; do not create a competing ESS |
| `ADR-0016` | Historical architecture decision introducing ESS component specifications / Quality Center scope | Retain as history; no supersession required |
| `ADR-0073` | Canonical CI consolidation/build/test authority | Retain; QM consumes evidence only |
| `ADR-0047` | Authoritative GitHub pre-merge CI gate | Retain; QM does not redefine required checks |
| `ESS-0012` | Documentation Governance authority | Retain; QM only checks QM documentation consistency |
| `FintechValueChainQualityProjection.ts` | Runtime already projects 18 stages read-only | Make documentation match runtime; no new projection architecture |
| `securityPerformancePriorityRemediation.test.ts` | Existing lazy-loading / bundle-boundary regression evidence including prohibition of `vendor-react` parallel boundary | Reuse as QM-4 baseline |

## Architecture plausibility result

No second Validator Registry, EventBus, Auth controller, Router/Public Shell, CI topology, release authority, scoring/ranking authority or value-chain architecture is required for CAPITAL-AI-QM.

The consolidation is therefore a **single-execution and evidence-coordination change**, not a new application architecture.

## Supersession policy

Old ADR/ESS documents are not deleted merely because they are old. Under ADR-0096:

1. retain historical decisions for traceability;
2. supersede only an actual authority overlap;
3. provide an explicit supersedes edge and impact package;
4. use suspended/historical/legacy-redirect states for non-authorizing remnants;
5. never infer precedence only from a newer date or number.

At this baseline no existing ADR needs to be superseded by ADR-0103. ADR-0103 adds the missing **QM project execution authority** while remaining subordinate to existing domain authorities.

## Evidence baseline

The Quality Center already has component contracts for mandatory validators, gates, score evidence, coverage, technical debt, documentation consistency, EventMesh publication and value-chain projection. A test file's presence is not execution evidence.

Any CI/runtime result not verified against the exact observed commit is `NOT_AVAILABLE` for this baseline.

## State-of-the-art advisory boundary

Industry standards may be used as **advisory review lenses** for the web application (for example secure-development verification, supply-chain provenance, web performance and telemetry). They do not become normative CAPITAL-AI thresholds through this file. Adoption requires the existing domain authority/contract process.