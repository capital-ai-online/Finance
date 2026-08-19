# CAPITAL-AI Governance Authority & Supersession Policy

**Document ID:** GOV-AUTH-SUPERSESSION-0001  
**Status:** PROPOSED — becomes ACTIVE only after Human/Owner merge  
**Version:** 1.0.0  
**Date:** 2026-08-19  
**Authority:** ADR-0086 (proposed), existing Accepted Decisions remain controlling until merge

## Purpose

Define a deterministic rule for resolving conflicting governance artifacts without allowing document recency, agent output, or repository write access to manufacture authority.

## Authority hierarchy

Highest to lowest unless an applicable legal instrument or explicit Owner decision defines otherwise:

1. **Applicable law, regulation, supervisory obligation, binding contract/control obligation.**
2. **Explicit Human/Owner decision and Accepted ADR** within its decision scope.
3. **Accepted/Active ESS and Governance Policy** within delegated scope.
4. **Approved Roadmap, Contract, Runbook, Traceability or Control Specification** implementing higher authority.
5. **Proposed/Draft ADR, ESS, policy or roadmap.** Design input only; non-authorizing.
6. **Evidence, report, snapshot, archive and historical documentation.** Evidentiary value only; not current authority unless a higher artifact explicitly adopts it.

### Recency rule

A newer artifact may supersede an older correlating artifact only when:

- it has equal or higher authority for the same scope;
- no higher authority, regulatory obligation or Accepted Decision conflicts;
- the semantic delta and impact are documented;
- the Owner can review the change before the supersession becomes effective.

**Newer is not, by itself, higher authority.**

## Proposed / Draft material

`PROPOSED`, `DRAFT`, `NOT ENABLED` and equivalent lifecycle states MUST NOT be used as the sole authority for:

- Merge authorization;
- production mutation;
- IAM/capability elevation;
- security-control weakening;
- billing/money/entitlement mutation;
- deletion of protected production resources;
- break-glass / recovery changes;
- semantic supersession of an Accepted Decision.

They may be used as implementation plans or references if a separate higher authority authorizes the work.

## Mandatory supersession package

Before semantic supersession or archival, provide an Owner-visible package containing:

| Field | Required content |
|---|---|
| Source artifact | current/older path and lifecycle |
| Replacement artifact | proposed new path/version |
| Correlation | exact rule/topic that overlaps |
| Authority comparison | hierarchy tier + status for each artifact |
| Semantic diff | old behavior → new behavior |
| Operational impact | workflow/runtime/CI/agent behavior |
| Security impact | trust boundary, privilege, fail-open/fail-closed changes |
| Regulatory impact | affected obligations/controls or `N/A` |
| Evidence impact | what remains historical and how it is labeled |
| Rollback | how to restore the last accepted state |
| Owner decision | ACCEPT / REJECT / MODIFY, captured in PR/evidence |

No archival deletion is required merely because an artifact is superseded. Historical evidence should normally be retained and marked historical/non-normative.

## Conflict-resolution algorithm

1. identify all correlating artifacts;
2. classify each by authority tier and lifecycle status;
3. fail closed on unresolved higher-tier conflict;
4. prefer Accepted/Active authority over Proposed/Draft material;
5. within the same tier/scope, use the later explicit decision only if the supersession package exists;
6. preserve historical evidence;
7. require Human Merge for repository governance changes;
8. for external mutation, apply the separate DevelopmentChain mutation gate.

## Current PR-gate interpretation

For the checkbox/Viewed/`💪`/`okay` PR ritual, Accepted ADR-0069's Owner addendum dated 2026-08-16 explicitly retires the ritual. Current policy therefore is:

```text
PR OPEN / UPDATE
→ Governance + technical CI
→ Human/Owner merge decision
→ Human Merge
```

M10 later introduces a Passkey/WebAuthn authorization layer for `AUTHORIZE_PR_CI` only after its controlled cutover. Historical evidence may still describe the former ritual but must not present it as current.

## Enforcement roadmap

Phase 1 (this PR): normalize known stale current-authority references and add regression tests.

Phase 2: extend the existing governance validator so every `Authority:` reference to an ADR/ESS is resolved against lifecycle status and reported when a Proposed/Draft artifact is treated as normative.

Phase 3: include authority-conflict findings in the weekly governance score as a separate component without inflating the existing advisory subset into a full production gate.
