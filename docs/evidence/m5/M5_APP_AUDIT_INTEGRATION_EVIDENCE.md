# M5 — Application Audit Integration Evidence

Status: HISTORICAL CI PASS / CORRECTIVE RUNTIME CONTRACT VERIFICATION ACTIVE
Date: 2026-08-12
Original baseline: `main@e39d5370d8b1498e84952535a38a339cc200082f` (PR #210 merge)
Corrective baseline: `main@156142102e7d2a97ad466aee0340f758fa4365e5` (PR #220 merge)
Authority: ADR-0056, ADR-0059, ESS-0019

## Original scope

PR #210 integrated the application-side M5 audited execution path with the already-created Supabase audit authority `public.agent_audit_events`.

The production table, RLS, least-privilege grants and append-only trigger had already been applied and verified. PR #210 changed application code/tests only.

## Original controls

1. `server/agentAudit/agentAuditWriter.ts`
   - backend-only privileged Supabase writer;
   - writes only to `agent_audit_events`;
   - returns `supabase:agent_audit_events:<id>` as `auditReference`;
   - propagates persistence failure (fail closed);
   - reuses the canonical Telemetry redaction contract;
   - omits complete prompt/diff/raw-body payload classes before persistence.

2. `server/agentAudit/authorizedAgentExecution.ts`
   - keeps provider-neutral authorization in the existing PolicyGate;
   - couples each server-side authorization decision to durable audit persistence;
   - returns the durable `auditReference` to the caller;
   - records terminal `SUCCESS`/`ERROR` as a second append-only outcome event.

3. `tests/unit/agentAudit.test.ts`
   - redaction/omission tests;
   - persistence failure = fail closed;
   - authorization/outcome correlation;
   - mocked Supabase insert chain.

## Historical PR #210 validation

Final PR head: `ffeab08c218314edd5292fbaf5ccb77413cee80e`

Merge commit: `e39d5370d8b1498e84952535a38a339cc200082f`

Required CI #892 / run `31559124198`: **PASS**.

Verified in that run:
- Human-/Owner-Vorprüfung;
- repository integrity;
- `npm ci`;
- production dependency audit;
- TypeScript/lint;
- unit tests;
- production build;
- deployment readiness;
- Docker hardening/image verification.

## Corrective runtime finding from SA3B

The first real SA3B execution-host probe after PR #220 merge provided the production integration test that the original mocked writer tests did not provide.

Issue #221 / workflow run `31570833507` reached the production broker with:

- exact trusted `main` SHA — PASS;
- strict request validation — PASS;
- trusted REM binding — PASS;
- GitHub Actions OIDC — PASS.

The broker then failed closed during durable M5 persistence with:

`[AgentAudit][SECURITY] durable audit persistence failed: Unregistered API key`

The branch side-effect step was skipped and the requested probe branch was confirmed absent.

## Independent writer/schema drift found during diagnosis

Read-only comparison of the actual production table, canonical migration and writer showed that the pre-remediation writer used application aliases that do not exist in the M5 table.

Canonical migration/table fields include:

- `human_actor_id`;
- `intent`;
- `scope`;
- `authorization_decision`;
- `approval_reference`;
- `step_up_reference`;
- `tool_name`;
- `branch` / `commit_sha`;
- `pull_request_number`;
- `ci_run_id`;
- `attributes`.

Pre-remediation aliases included:

- `actor_id`;
- `decision`;
- `approval_id`;
- `tool_id`;
- `pr_number`;
- `workflow_run_id`;
- `metadata`.

The original unit tests asserted those application aliases against a mock and therefore could not detect production schema drift.

## Corrective contract

Corrective branch: `fix/sa3b-m5-audit-schema-contract`.

The production migration/table remain authoritative. No Supabase schema mutation is required or authorized.

Corrective controls:

1. writer DB row uses only canonical migration column names;
2. `intent` and structured `scope` are explicit application inputs;
3. generic audited execution supplies semantic authorization/outcome intents;
4. Systemadmin audited execution supplies REM/Roadmap/target/path scope;
5. non-UUID external actor identity is preserved in sanitized `attributes` and never fabricated into `human_actor_id uuid`;
6. non-UUID approval/step-up references follow the same rule;
7. runtime unit tests assert canonical keys and reject legacy DB row aliases;
8. a migration↔writer contract test prevents future vocabulary drift.

## Production secret boundary

The deployed service currently also has an invalid/unregistered privileged Supabase API key. This is independent from the writer/schema defect.

No production secret value is included in this evidence. Restoring or rotating the backend-only credential is an Owner-controlled production operation.

## Security invariants retained

- No `anon` or `authenticated` audit-table access is introduced.
- No new database privilege is introduced.
- No schema rollback/replacement is authorized.
- Full prompts, full diffs and raw request/response bodies remain omitted.
- Secret-like/PII fields remain redacted.
- Only syntactically valid audit references bypass generic authorization-key redaction.
- Audit persistence failure remains fail-closed.
- Authorization and terminal outcome remain separate append-only events.
- External IDs are not coerced into UUID columns.

## Corrective exit criteria

Application integration is considered runtime-verified again only after:

1. corrective PR final-head CI PASS;
2. Human merge + branch deletion;
3. corrected `main` deployment;
4. valid privileged Supabase credential available in production;
5. a real audited authorization insert succeeds against `public.agent_audit_events`;
6. a correlated terminal outcome insert succeeds;
7. SA3B positive host probe proves audit-before-side-effect ordering.

Until then, the historical PR #210 CI result remains valid as code-test evidence, but it must not be treated as proof that the pre-remediation writer matched the actual production schema.
