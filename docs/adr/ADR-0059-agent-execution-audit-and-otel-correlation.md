# ADR-0059 — Agent Execution Audit and OpenTelemetry Correlation

Status: ACCEPTED — CORRECTIVE APPLICATION REMEDIATION ACTIVE
Date: 2026-08-11
Last updated: 2026-08-12

## Decision
Every AI-assisted command is correlated end-to-end with `request_id`, `trace_id` and attributable actor/agent identity. OpenTelemetry and W3C Trace Context are the preferred neutral correlation standards. Security audit evidence is a separate durability/retention class from sampled operational telemetry.

Minimum audit fields: human_actor_id, app_id, agent_id, provider/model metadata, intent, scope, capability, risk_class, policy_id/version, authorization decision, approval/step-up reference, tool/command, repository/branch/commit/PR, CI run, artifact digest, deployment/runtime identity, result/error, rollback reference and timestamps.

## M5 architecture decision

M5 extends the existing ADR-0056 / `src/platform/Telemetry` baseline and does not introduce a second logging stack.

Operational Telemetry:
- remains vendor-neutral in `src/platform/Telemetry`;
- may be sampled/exported later;
- carries request/trace/span correlation and an optional audit reference;
- MUST NOT become the durable security-audit store.

Security Audit Evidence:
- uses dedicated durable append-only persistence;
- MUST support reconstruction of an authorized AI-assisted change across actor, agent, policy, PR/CI and runtime evidence;
- MUST be redacted before persistence;
- MUST NOT store secrets, tokens, complete prompts, complete diffs or raw sensitive request bodies.

## Supabase persistence decision

Read-only repository and production-schema assessment on 2026-08-12 found that existing `audit_logs_iam`, `iam_access_log` and `agent_action_approvals` did not carry the full ADR-0059 correlation contract. No dedicated agent execution audit table existed.

Therefore the M5 Supabase mutation was classified **REQUIRED** and was executed after Human/Owner approval of PR #206.

Production target: `public.agent_audit_events` in Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`).

Applied migrations:
- `20260811230540_m5_agent_audit_events`;
- `20260811230743_m5_agent_audit_events_least_privilege`.

The table is append-only, RLS-enabled and deny-by-default for `anon`/`authenticated`. `service_role` is explicitly limited to `SELECT` + `INSERT`.

The migration and actual production schema are the canonical persistence contract. Application code MUST adapt to that schema; production evidence MUST NOT be destructively reshaped to accommodate application-only aliases.

## Application integration decision

The M5 application integration is implemented as a server-only adapter and requires **no additional Supabase schema mutation**:

- `server/agentAudit/agentAuditWriter.ts` is the single durable writer for `agent_audit_events`;
- the writer reuses `src/platform/Telemetry/redaction.ts` for secret/PII redaction;
- complete prompts, complete diffs and raw request/response bodies are omitted before persistence;
- `server/agentAudit/authorizedAgentExecution.ts` composes the existing provider-neutral PolicyGate with durable audit persistence;
- persistence returns an `auditReference` suitable for operational telemetry correlation;
- terminal `SUCCESS`/`ERROR` is persisted as a second append-only event correlated to the authorization evidence;
- persistence errors propagate and therefore fail closed instead of silently producing an unaudited authorization result.

The existing synchronous `evaluateAgentPolicy()` remains unchanged for compatibility. Server-side agent execution that requires ADR-0059 evidence must use the audited adapter.

## Corrective addendum — runtime schema-contract verification

The real SA3B post-merge host probe on 2026-08-12 exposed an application/schema integration defect that mocked tests had not caught.

Canonical production migration fields include:

`human_actor_id, intent, scope, authorization_decision, approval_reference, step_up_reference, tool_name, branch, commit_sha, pull_request_number, ci_run_id, attributes`.

The pre-remediation application writer sent legacy/application-only aliases including:

`actor_id, decision, approval_id, tool_id, pr_number, workflow_run_id, metadata`

and omitted required `intent`/`scope`.

Decision:

1. **Do not mutate or roll back the production M5 schema to match the buggy writer.**
2. Correct the writer and audited callers to the canonical migration contract.
3. Add a migration↔writer CI contract test so this class of drift fails before deployment.
4. Never fabricate a Supabase UUID from a GitHub login or other external identity:
   - syntactically valid UUID may populate the database UUID field;
   - non-UUID external identifiers remain attributable in sanitized `attributes`, while the corresponding UUID column is `NULL`.
5. Apply the same non-coercion rule to approval and step-up UUID references.
6. Keep all persistence failures fail-closed.

Corrective repository branch: `fix/sa3b-m5-audit-schema-contract`.

This addendum changes the application mapping, **not** the accepted append-only persistence architecture and not the production schema.

## Production credential boundary discovered by SA3B

The same live probe reached the production broker with valid GitHub OIDC but durable persistence returned `Unregistered API key`.

That credential failure is separate from the writer/schema defect. Production secret values are Owner-controlled and must not be written to repository evidence, PR text or logs. A valid backend-only Supabase secret/service-role credential must be restored and verified before the positive SA3B probe can complete.

## Security

1. Redaction occurs before persistence/export.
2. Secrets/tokens/full prompts/full diffs are prohibited by default.
3. `anon` and `authenticated` have no direct access to the audit store.
4. UPDATE/DELETE of durable evidence fail closed via table privileges and append-only trigger.
5. Audit correlation IDs are metadata, not authorization credentials.
6. W3C `traceparent` / `tracestate` are treated as untrusted inbound context and validated at trust boundaries.
7. Operational telemetry retention/sampling MUST NOT delete or weaken required audit evidence.
8. Provider/model metadata is recorded for provenance only and never grants authority.
9. Application audit persistence failure is fail-closed for the audited server execution path.
10. Only syntactically valid `supabase:agent_audit_events:<id>` references may bypass generic authorization-key redaction; tokens/headers and malformed values remain redacted.
11. External identity strings MUST NOT be coerced into database UUID columns.
12. Canonical migration/application mapping is a CI-enforced contract.

## Verified production persistence evidence

The production mutation passed:
- RLS verification;
- least-privilege verification;
- synthetic redacted event write/read;
- UPDATE negative test;
- DELETE negative test;
- Supabase Security Advisor review.

Evidence authority: `docs/evidence/m5/M5_SUPABASE_AGENT_AUDIT_MUTATION_EVIDENCE.md`.

The Advisor's `RLS Enabled No Policy` INFO is intentional for this deny-by-default table. Existing Auth warnings for leaked-password protection and MFA are independent of M5 and tracked under M5A.

## Historical M5 application validation

PR #210 completed the original application integration and was merged on 2026-08-12.

- final PR head: `ffeab08c218314edd5292fbaf5ccb77413cee80e`;
- merge commit: `e39d5370d8b1498e84952535a38a339cc200082f`;
- required CI run #892 / run id `31559124198`: PASS;
- Human-/Owner gate: PASS;
- TypeScript/lint: PASS;
- unit tests including audit-specific negative tests: PASS;
- production build/predeploy: PASS;
- Docker hardening and production image verification: PASS.

Those tests used a mocked Supabase client and therefore proved fail-closed adapter behavior but did **not** prove the exact production column vocabulary. The SA3B runtime probe supplied the missing integration evidence and revealed the contract drift.

## Rollback

No destructive database rollback is authorized by this ADR.

For application integration, rollback is code-only: revert the application adapter change while preserving all previously persisted audit evidence. After productive audit evidence exists, writers are disabled first and evidence preserved before any future schema remediation.

## Verification state

The append-only production table, RLS and least-privilege controls remain verified.

The application writer is under corrective verification until the schema-contract remediation passes final CI, Human merge, deployment and a real successful audit insert. SA3B and later autonomous mutation stages MUST remain blocked while this corrective verification is incomplete.
