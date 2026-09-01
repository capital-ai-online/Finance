# ADR-0104 v1.4.0 — Bounded Cross-Project Session Impact

**Document ID:** `DOC-GOV-ADR0104-V1-4-PROJECT-SET-IMPACT-2026-09-01`  
**Status:** `CANDIDATE / NON-AUTHORIZING UNTIL HUMAN MERGE`  
**Date:** `2026-09-01`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Authority:** `AUTH-ADR-HUMAN-OWNER-TIMEBOXED-EXECUTION-2026-09-01`  
**Base:** `main@c9697f433db7f91daffd9aa5b0fdf938f616ecc4`

## Decision delta

| Dimension | v1.3.1 | v1.4.0 |
|---|---|---|
| Chat binding | one exact chat | unchanged |
| Duration | `PT8H` | unchanged |
| Project scope | one canonical project | immutable predeclared set of 1–3 canonical projects |
| Cross-project movement | STOP + handoff + separate chat/slot | visible audited switch only between predeclared set members |
| Outside-set work | full handoff | unchanged |
| Branch / PR | scoped work item | one fresh branch and PR per active project |
| Merge | Human-only | unchanged |
| Device binding | none for current text activation | unchanged; later device cutover remains separate |

## Superseded surface

Only the STOP/separate-chat portion of `FOREIGN_PROJECT_HANDOFF` is conditionally superseded when all ADR-0104 v1.4.0 activation and switch predicates pass.

## Preserved surface

Human merge, project/PVC/Primary-Owner ownership, direct-main prohibition, set immutability, per-project branch/PR separation, correlation, validation, secrets, provider authentication, least privilege, independent assurance, evidence integrity and all out-of-set handoff behavior remain controlling.

## Current S1 transition

The current text-activated S1 may expand from `CAPITAL-AI-GOV` to exactly `CAPITAL-AI-GOV` plus `CAPITAL-AI-OPS` only after Human Merge before `2026-09-02T02:46:32Z`. Start/end and `PT8H` do not change. No timely merge means no expansion. No device binding is created.

## Threat model and negative gates

| Threat | Required result |
|---|---|
| project added after activation | DENY |
| project outside set | full handoff / no implementation |
| digest or canonical mapping drift | DENY / recorrelation |
| different chat or expired slot | DENY |
| hidden project switch | DENY |
| multi-project branch or PR | DENY |
| agent self-merge or auto-merge | DENY |
| raw device ID used as authority | DENY |
| current-main/open-writer ambiguity | DENY / recorrelation |

## Alternatives considered

- **Unlimited foreign-project scope:** rejected because it violates least privilege and makes ownership/audit boundaries indeterminate.
- **One unrestricted project addition during a session:** rejected because it enables privilege growth after activation.
- **One slot per project and separate chat:** safe but does not satisfy the Human Owner's requested same-chat cross-project execution.
- **Immutable bounded set:** selected because scope is explicit before use, reviewable, auditable and fail-closed.

## Rollback

A fresh Human-merged governance change can remove the in-set exception. Historical activation/switch evidence remains immutable. Rollback does not rewrite completed actions and does not restore consumed slots.

## Validation contract

The governance validator and unit tests must enforce:

- ADR/Authority registry version parity at `1.4.0`;
- set mode, minimum, maximum and no runtime additions;
- exact current S1 GOV+OPS conditional transition and unchanged end;
- S2 consumption;
- Human-only merge and out-of-set handoff exclusions;
- visible in-session switch contract.
