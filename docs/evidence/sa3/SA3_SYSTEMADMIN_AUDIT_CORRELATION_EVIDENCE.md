# SA3 Systemadmin Audit Correlation Evidence

Status: SA3A IMPLEMENTED / REPOSITORY CI PENDING — SA3B EXECUTION-HOST BINDING REQUIRED
Date: 2026-08-12
Current baseline: `main@083d8f25083034e3785d1a8e0c57eaf03463c907` (PR #217 merge)
SA3 prerequisite baseline: `main@a5abc1685026651f4297a487e855683a1fa1e58e` (PR #216 merge)
Authority: ESS-0021, ADR-0065, ADR-0059, M5 verified append-only audit persistence

## Prerequisite verification

SA2 is complete and merged through PR #216.

Final SA2 evidence on head `14b9ec25dd60a34ae78a852f0a5b689b4811832b`:

- CI run #919 / `31566058836`: SUCCESS;
- Human-/Owner-Vorprüfung: SUCCESS;
- TypeScript: SUCCESS;
- Unit tests: SUCCESS;
- production build: SUCCESS;
- post-build production CSP test: SUCCESS;
- Docker/runtime validation: SUCCESS;
- Google-Marketing guard #164: SUCCESS;
- Governance #643: SUCCESS;
- merge commit: `a5abc1685026651f4297a487e855683a1fa1e58e`;
- former SA2 branch is deleted.

PR #217 subsequently merged the M10 passkey-only target architecture at `083d8f25083034e3785d1a8e0c57eaf03463c907`. It does not activate M10 runtime enforcement; M10 remains sequentially blocked until M9.

Therefore SA3 remains the next active Systemadmin stage.

## Existing M5 control reused

SA3 does not create a second audit database or a new production schema.

Existing M5 controls are reused:

- `public.agent_audit_events` is already production-verified append-only;
- server-only privileged writer: `server/agentAudit/agentAuditWriter.ts`;
- authorization persistence failure propagates as an exception;
- terminal outcome is a second append-only event rather than UPDATE;
- central metadata sanitization omits prompts, full diffs and raw bodies and redacts credential-like values.

Mutation state for Supabase/Stripe/Render: `NOT REQUIRED` for this repository implementation.

## SA3A — repository audit adapter

Implemented artifacts:

- `server/agentAudit/systemadminAuditedExecution.ts`;
- `.ai/contracts/systemadmin-audit-execution-profile.json`;
- `tests/unit/systemadminAuditedExecution.test.ts`;
- `docs/runbooks/SYSTEMADMIN_AUDITED_EXECUTION.md`.

The adapter keeps direct mutating SA2 LIVE evaluation disabled. It performs:

`SA2 DRY_RUN ALLOW → SA3 self-authority check → durable authorization INSERT → auditReference → audit-bound execution permit`

The existing SA2 envelope retains `liveMutationPermitted=false`. The SA3 server result adds a distinct `auditBoundExecutionPermitted=true` only after the durable audit insert returned a syntactically valid `supabase:agent_audit_events:<id>` reference.

This separation prevents an old or unaudited SA2 envelope from being interpreted as repository mutation authority.

## SA3B — execution-host binding gap

The repository implementation cannot by itself intercept external ChatGPT GitHub connector calls. This limitation was already documented by the SA2 runbook and remains materially relevant.

Therefore repository CI/merge alone cannot prove end-to-end autonomous enforcement.

Before SA3 may become `COMPLETE / VERIFIED PASS`, one actual execution mode must be proven:

1. the execution tool host consumes and validates the SA3 permit before the mutating GitHub action and rejects bypass/direct mutation; or
2. a CAPITAL-AI execution gateway consumes the SA3 permit and itself performs the exact repository action.

Until that evidence exists, direct mutating ChatGPT→GitHub connector actions are not classified as SA3-enforced autonomous Systemadmin execution and SA4 remains blocked.

Required SA3B evidence:

- actual execution host/gateway identity;
- permit checked before side effect;
- exact capability/target/head binding;
- bypass/direct mutation DENY;
- authorization and terminal outcome references correlated end-to-end.

## Correlation contract

Authorization/outcome evidence reconstructs:

`mandateId → roadmapItem → humanActorId → app/agent/session/request → traceId → capability/risk → target/repository/paths → branch/head/PR → policy decision → authorizationAuditReference → commit/PR/workflow → result`

No reusable credential is part of the execution permit.

## Additional SA3 self-authority protection

The audited execution layer denies repository-mutating requests targeting its own SA2/SA3 control plane, including:

- `.ai/contracts/systemadmin-roadmap-execution-profile.json`;
- `.ai/contracts/systemadmin-audit-execution-profile.json`;
- `src/platform/Security/systemadminExecutionProfile.ts`;
- `server/agentAudit/agentAuditWriter.ts`;
- `server/agentAudit/authorizedAgentExecution.ts`;
- `server/agentAudit/systemadminAuditedExecution.ts`.

Existing SA1 self-authority protections remain in force independently.

## Required repository tests

Repository CI must prove at least:

1. valid scoped PR action receives no permit before audit persistence succeeds;
2. durable audit failure throws before an execution permit is returned;
3. SA2/SA3 self-authority path request is DENY and auditable;
4. MERGE remains DENY;
5. PRODUCTION_MUTATION remains DENY;
6. successful authorization returns a durable reference and audit-bound permit;
7. SUCCESS/ERROR outcome is a second correlated append-only event;
8. outcome without an audited ALLOW permit is rejected;
9. prompt/raw response metadata remains omitted/redacted through the existing writer.

## Security boundary

SA3A covers only the already approved repository capability surface:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

Still excluded:

- `MERGE`;
- `DEPLOY_REQUEST`;
- `PRODUCTION_MUTATION`;
- CRITICAL/reserved Owner mutation classes;
- self-expansion of the audit/control plane.

Human final review and Human merge authority are unchanged. The current transitional Owner gate remains authoritative until a future M10 implementation reaches `VERIFIED PASS` and performs the controlled passkey cutover defined by ADR-0066.

## Exit gate

SA3 may become `COMPLETE / VERIFIED PASS` only when all of the following hold:

1. SA3A final PR head passes repository CI and positive/negative tests;
2. SA3A is Human-merged;
3. SA3 work branch is deleted;
4. SA3B actual execution-host binding is identified;
5. permit-before-mutation enforcement is proven;
6. direct/bypass mutation is proven DENY;
7. end-to-end authorization/outcome audit correlation is verified without secret evidence;
8. roadmap/traceability are synchronized.

Only then may SA4 create the first bounded non-production REM pilot.
