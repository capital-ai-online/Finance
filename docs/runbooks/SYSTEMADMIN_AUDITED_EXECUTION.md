# Systemadmin Audited Execution Runbook — SA3

Status: IMPLEMENTED / CI + EXECUTION-HOST BINDING PENDING
Date: 2026-08-12
Authority: ESS-0021, ADR-0065, ADR-0059

## Purpose

This runbook governs the repository-only audited execution path for the logical Systemadmin Roadmap Executor.

It does not authorize external production mutation and does not grant merge authority.

## Mandatory authorization path

For repository actions that may mutate state, the canonical policy path is:

`authorizeSystemadminAuditedExecution()`

A raw SA2 prepared envelope is never mutation authority.

Required sequence:

1. resolve current `main` and Roadmap work package;
2. validate Owner-approved REM through SA1;
3. pass SA2 security/sequence preflight;
4. prepare SA2 action as DRY_RUN;
5. apply SA3 self-authority protection;
6. persist authorization to M5 append-only audit;
7. require returned `supabase:agent_audit_events:<id>` reference;
8. require `auditBoundExecutionPermitted=true`;
9. execution host validates and consumes the permit for the exact action;
10. execute the exact repository action;
11. persist terminal `SUCCESS` or `ERROR` through `recordSystemadminAuditedOutcome()`;
12. stop on any evidence failure;
13. stop before Human final review / merge boundary.

## Execution-host boundary

Repository TypeScript cannot intercept the external ChatGPT GitHub connector by itself. Therefore SA3 has two sub-gates:

### SA3A — repository audit adapter

Implemented by this branch:

- SA1/SA2 policy composition;
- durable M5 authorization event;
- audit-bound permit only after durable evidence;
- terminal append-only outcome event;
- self-authority protection and negative tests.

### SA3B — actual execution-host binding

Still required before SA3 can reach `VERIFIED PASS` and before SA4 may start.

One of these enforcement modes must be proven:

1. **Tool-host middleware:** the actual execution host consumes a valid SA3 permit before each mutating connector action and rejects direct/bypass calls; or
2. **CAPITAL-AI execution gateway:** ChatGPT sends the exact intended action to a CAPITAL-AI gateway which validates/consumes the SA3 permit and performs the repository mutation itself.

Until one mode is verified:

- direct ChatGPT→GitHub mutating connector calls are **not** treated as SA3-enforced autonomous execution;
- `auditBoundExecutionPermitted=true` is a repository/runtime contract, not proof that the external connector consumed it;
- SA4 remains blocked.

## Fail-closed rules

The caller/execution host must not execute when:

- REM/SA1/SA2 decision is DENY;
- audit persistence throws or returns no valid reference;
- execution-host binding is absent or cannot prove permit consumption;
- the request targets SA2/SA3 self-authority paths;
- requested capability is MERGE, DEPLOY_REQUEST or PRODUCTION_MUTATION;
- requested repository/path/target is outside the REM;
- security preflight is incomplete;
- credential exposure or untrusted scope elevation is detected;
- production mutation unexpectedly becomes necessary;
- final Human/Owner review has started;
- kill switch/revocation is active.

## Audit fields

Authorization evidence must correlate at least:

- `mandateId`;
- Roadmap item;
- Human actor;
- app/agent/session/request;
- trace id;
- capability/risk;
- repository/target/requested paths;
- branch/current head/PR when available;
- policy reason/decision;
- authorization audit reference.

Outcome evidence adds the resulting branch/commit/PR/workflow identifiers where available and references the authorization audit event.

## Sensitive-data policy

Never persist:

- raw reusable tokens or API keys;
- passwords or TOTP values;
- complete prompts;
- complete diffs;
- raw request/response bodies;
- private keys or recovery material.

The existing M5 writer remains the canonical sanitizer/redactor.

## Human boundary

The audited permit is repository execution authority only. It does not authorize:

- final PR approval;
- CI bypass;
- merge;
- production deploy;
- external production mutation.

At Human final review start, agent mutation stops. Human merge remains separate.

## Branch lifecycle

`current main → fresh agent/* branch → audited actions → PR → Human review/CI → Human merge → branch delete`

Merged and superseded branches are never reused.

## SA3 exit gate

SA3 requires all of:

1. SA3A repository implementation merged with CI `VERIFIED PASS`;
2. SA3 work branch deleted;
3. actual execution-host binding identified;
4. positive proof that the host consumes the permit before mutation;
5. negative proof that direct/bypass mutation is denied;
6. authorization/outcome audit correlation verified end-to-end without secret evidence.

## SA4 handoff

Only after the complete SA3 exit gate is `VERIFIED PASS` may the first SA4 pilot REM run. The pilot remains non-production, max HIGH risk, one open Systemadmin PR, explicit path allowlist, expiry <= 7 days, kill switch enabled and one final build-and-test per reviewed head.
