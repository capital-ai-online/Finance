# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@083d8f25083034e3785d1a8e0c57eaf03463c907` (PR #217 merge)
Authority: ESS-0021, ADR-0065, ESS-0019, ADR-0058, ADR-0059, ADR-0066

## Goal

Introduce a privileged Systemadmin Roadmap Executor that can autonomously implement larger Owner-approved Roadmap work packages through a Pull Request while preserving least privilege, append-only auditability, Human final review and Human merge authority.

## SA0 — Governance package

**Status: COMPLETE — PR #214 MERGED**

- merge: `d342654715b4f1aef23e9fbaf3230b54f327e0a2`;
- governance/REM/ESS/ADR package on `main`;
- branch deleted.

## SA1 — REM validator / Control-Plane enforcement

**Status: COMPLETE / VERIFIED PASS — PR #215 MERGED**

- merge: `d8ccc3c5e136d51ae36b57b103119b25f4a42b8b`;
- final head: `b3aacd0c9ca6dfdfb981c4f563f0c840f93dad2e`;
- CI #909: PASS;
- Governance #634: PASS;
- branch deleted.

Primary controls:

- REM validation and exact scope binding;
- M4 Agent IAM composition;
- risk/path/target/mutation-class/expiry/kill-switch/PR-limit/CI-budget gates;
- self-authority protection.

Capability ceiling:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

`MERGE`, `DEPLOY_REQUEST`, `PRODUCTION_MUTATION`, CRITICAL and reserved Owner mutations remain denied.

## SA2 — Chat execution profile

**Status: COMPLETE / VERIFIED PASS — PR #216 MERGED**

- final head: `14b9ec25dd60a34ae78a852f0a5b689b4811832b`;
- merge: `a5abc1685026651f4297a487e855683a1fa1e58e`;
- CI #919: PASS;
- Google-Marketing #164: PASS;
- Governance #643: PASS;
- TypeScript/unit/build/post-build CSP/Docker: PASS;
- branch deleted.

Authority chain:

`OWNER_APPROVED REM → SA2 CHAT PROFILE → SA1 REM VALIDATOR → M4 AGENT IAM → ACTION ENVELOPE`

Direct mutating SA2 LIVE remains denied. Mutating SA2 envelopes keep `liveMutationPermitted=false`.

## M10 DevelopmentChain synchronization

PR #217 merged the **Passkey-only Human/Owner PR Authorization target architecture** at:

`main@083d8f25083034e3785d1a8e0c57eaf03463c907`

This is architecture only. M10 runtime implementation remains blocked until M9. The current Human/Owner review/attestation gate remains authoritative until the future M10 controlled cutover reaches `VERIFIED PASS`.

M10 does not block SA3 or the non-production SA4 pilot. M10 `VERIFIED PASS` remains required before SA5 external mutation design.

## SA3 — Append-only Audit / Evidence correlation

**Overall status: IN PROGRESS — SA3A IMPLEMENTED / CI PENDING; SA3B EXECUTION-HOST BINDING REQUIRED**

### SA3A — Repository audit adapter

Branch:

`agent/sa3-systemadmin-audit-correlation`

Primary artifacts:

- `server/agentAudit/systemadminAuditedExecution.ts`;
- `tests/unit/systemadminAuditedExecution.test.ts`;
- `.ai/contracts/systemadmin-audit-execution-profile.json`;
- `docs/runbooks/SYSTEMADMIN_AUDITED_EXECUTION.md`;
- `docs/evidence/sa3/SA3_SYSTEMADMIN_AUDIT_CORRELATION_EVIDENCE.md`.

Canonical chain:

`OWNER_APPROVED REM → SA1 → SA2 DRY_RUN ALLOW → SA3 SELF-AUTHORITY CHECK → M5 DURABLE AUTHORIZATION EVENT → auditReference → AUDIT-BOUND EXECUTION PERMIT → EXECUTION HOST → REPOSITORY ACTION → M5 OUTCOME EVENT`

The existing M5 append-only writer and production-verified `agent_audit_events` persistence are reused. No new Supabase schema or external platform mutation is required by SA3A.

SA3A invariants:

- no permit before durable authorization evidence;
- audit-store failure stops before side effect;
- DENY receives no permit;
- second append-only terminal outcome event;
- prompts/full diffs/raw bodies/reusable credentials omitted/redacted;
- SA2/SA3 control-plane self-mutation denied;
- only existing repository capabilities are eligible;
- no MERGE/deploy/production authority.

### SA3B — Actual execution-host binding

Repository TypeScript cannot intercept the external ChatGPT GitHub connector. Therefore **SA3 is not VERIFIED PASS after repository CI/merge alone**.

Before SA4, one enforcement mode must be proven:

1. tool-host pre-action middleware consumes the SA3 permit before every mutating connector action and denies bypass; or
2. a CAPITAL-AI execution gateway validates/consumes the permit and performs the exact repository action.

SA3B required proof:

- actual execution host identified;
- permit consumed before side effect;
- exact capability/target/head binding;
- direct/bypass mutation denied;
- authorization and outcome evidence correlated end-to-end.

Until SA3B passes, direct mutating ChatGPT→GitHub connector calls do not count as SA3-enforced autonomous execution.

### SA3 mutation classification

| Domain | State |
|---|---|
| Repository adapter/tests/docs | REQUIRED / IMPLEMENTED |
| Existing M5 audit persistence | REUSED / NO SCHEMA CHANGE |
| Execution-host binding | REQUIRED / NOT YET VERIFIED |
| Supabase schema/config | NOT REQUIRED |
| Stripe | NOT REQUIRED |
| Render | NOT REQUIRED |
| Deployment | NOT REQUIRED |
| Production mutation | PROHIBITED |

### SA3 exit gate

SA3 becomes `COMPLETE / VERIFIED PASS` only after:

1. SA3A final head repository CI PASS;
2. SA3A Human merge;
3. SA3A branch deletion;
4. SA3B execution host identified;
5. permit-before-mutation positive proof;
6. bypass/direct-mutation negative proof;
7. end-to-end append-only authorization/outcome evidence PASS;
8. Roadmap/traceability synchronized.

## SA4 — First bounded pilot mandate

**Status: BLOCKED BY COMPLETE SA3 VERIFIED PASS (SA3A + SA3B)**

First real autonomous repository work package requires one explicit Owner-approved REM.

Pilot constraints:

- Finance / `main`;
- one Roadmap work package;
- max one open Systemadmin PR;
- no external production mutation;
- max HIGH risk;
- explicit path allowlist;
- expiry <= 7 days;
- kill switch enabled;
- one final `build-and-test` per reviewed head;
- every mutating action through the verified SA3 execution host.

Pilot exit requires autonomous branch/commit/PR success under REM, complete audit correlation, Human review/CI, separate Human merge, branch deletion and evidence completion.

## SA5 — Bounded external mutation design

**Status: BLOCKED BY SA4 + M10 VERIFIED PASS**

A future ADR may consider bounded external `PRODUCTION_MUTATION` only after the repository pilot and strong M10 Owner assurance are verified.

Still reserved unless separately redesigned:

- MERGE;
- repository-protection weakening;
- Owner/admin IAM elevation;
- Owner MFA/break-glass;
- secret disclosure/unrestricted credential rotation;
- destructive production data;
- live billing/money/entitlement;
- production resource deletion;
- DNS/TLS/domain ownership;
- security-control disablement;
- self-expansion of mandate/audit authority.

## Branch lifecycle

`current main → fresh scoped branch → audited work → PR → Human review/CI → Human merge → branch delete`

Merged/superseded branches are not reused.

## Current next action

Complete SA3A through PR/CI/Human merge, then perform SA3B execution-host integration/proof. SA4 remains blocked until both are `VERIFIED PASS`.
