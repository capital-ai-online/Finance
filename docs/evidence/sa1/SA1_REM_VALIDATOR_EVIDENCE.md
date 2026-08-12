# SA1 — REM Validator / Control-Plane Enforcement Evidence

Status: IMPLEMENTATION CANDIDATE — FULL REPOSITORY CI PENDING
Date: 2026-08-12
Base: `main@d342654715b4f1aef23e9fbaf3230b54f327e0a2`
Branch: `agent/sa1-rem-validator-control-plane`
Authority: ESS-0021, ADR-0065, ADR-0058, Systemadmin Agent Roadmap

## Purpose

SA1 turns the Roadmap Execution Mandate (REM) from governance text into a fail-closed runtime authorization layer for the Systemadmin Roadmap Executor.

This evidence covers repository/control-plane implementation only. No Supabase, Stripe, Render, deployment, billing, credential or other production mutation is part of SA1.

## Implementation scope

Primary code:

- `src/platform/Security/roadmapExecutionMandate.ts`
- `src/platform/Compliance/PolicyGate.ts`
- `tests/unit/roadmapExecutionMandate.test.ts`

Contract synchronization:

- `docs/governance/ROADMAP_EXECUTION_MANDATE.schema.json`
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`
- `docs/traceability/SYSTEMADMIN_AGENT_TRACEABILITY_MATRIX.md`

## Security design

The SA1 evaluator composes two independent gates:

`REM VALIDATION/SCOPE → EXISTING M4 AGENT IAM`

A REM cannot bypass or replace the existing Agent IAM. Provider/model metadata remains non-authoritative.

### Canonical identity binding

The runtime binds the mandate to:

- Owner: `SvenKulessa`
- Agent: `capital-ai-systemadmin-roadmap-executor`
- Repository: `SvenKulessa/Finance`
- Base branch: `main`

A mismatch is DENY.

### SA1 capability ceiling

Only the following can reach ALLOW in SA1:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

The following remain technically blocked:

- `MERGE`
- `DEPLOY_REQUEST`
- `PRODUCTION_MUTATION`
- effective `CRITICAL` execution

This remains true even if an over-broad or malicious REM lists those capabilities.

### Scope enforcement

The validator checks:

- `OWNER_APPROVED` status;
- mandatory `approvalEvidenceRef`;
- validity window and expiry;
- roadmap item membership;
- capability membership;
- effective risk <= mandate maximum and <= HIGH;
- exact allowed target;
- exact path or `prefix/**` path allowlist;
- no absolute/backslash/traversal paths or unsupported wildcards;
- explicit mutation class for repository-mutating capabilities;
- complete reserved Human/Owner mutation denylist;
- maximum number of open Systemadmin PRs;
- exact changed-file overlap with already open PRs;
- CI budget/duplicate unchanged-head request protection;
- kill-switch mechanism availability.

### Self-elevation protection

The Systemadmin principal is hard-denied from mutating its own trust root, including:

- ESS-0021;
- ADR-0065;
- AGENTS.md;
- Autonomous Agent Concept Gate;
- REM schema;
- Systemadmin execution policy;
- Agent IAM;
- REM validator itself;
- PolicyGate REM entry point.

These changes remain on the normal Human/Owner-governed path.

## Pre-PR validation evidence

An isolated local security harness was executed before PR creation.

Environment used for the isolated check:

- Node: `v22.16.0`
- TypeScript: `5.8.3`

The repository requires Node 24.x, therefore this preflight is supporting evidence only and does not replace GitHub CI.

### Type check

The SA1 module was compiled together with the current `agentIam.ts` contract using TypeScript 5.8.x.

Result: **PASS**

### Functional security harness

The compiled SA1 evaluator was executed against representative ALLOW/DENY cases.

Result: **PASS**

Verified negative cases:

- unknown REM field → DENY/invalid;
- missing REM → DENY;
- expired REM → DENY;
- wrong Human Actor → DENY;
- wrong Agent → DENY;
- `MERGE` → DENY;
- `DEPLOY_REQUEST` → DENY;
- `PRODUCTION_MUTATION` → DENY;
- path traversal → DENY;
- path outside allowlist → DENY;
- Systemadmin self-authority path → DENY;
- exact open-PR changed-file overlap → DENY;
- open Systemadmin PR limit exceeded → DENY;
- CI budget exceeded → DENY;
- unchanged head already validated → DENY;
- reserved Owner mutation class → DENY.

Verified positive case:

- valid Owner-approved HIGH-risk repository PR request inside exact REM scope → ALLOW through REM scope and existing Agent IAM.

## Required repository CI

Before SA1 can become `VERIFIED PASS`, the final reviewed PR head must pass the repository's normal code validation, including as selected by the current check-class workflow:

- dependency/integrity checks;
- TypeScript;
- unit tests, including `roadmapExecutionMandate.test.ts`;
- production build/predeploy checks where selected;
- governance/security checks;
- final `build-and-test`.

## Mutation state

| Domain | State |
|---|---|
| Repository code | IMPLEMENTED / PR REVIEW PENDING |
| REM runtime enforcement | IMPLEMENTED / CI PENDING |
| Supabase | NOT REQUIRED |
| Stripe | NOT REQUIRED |
| Render | NOT REQUIRED |
| Deployment | NOT REQUIRED |
| Production mutation | PROHIBITED IN SA1 |

## Exit criteria

SA1 is complete only after:

1. Human/Owner current-head review;
2. required CI PASS;
3. Human merge into `main`;
4. merged SA1 branch deletion;
5. resulting main SHA/evidence recorded for SA2.

Until then SA2 remains blocked.
