# ADR-0059 — Agent Execution Audit and OpenTelemetry Correlation

Status: ACCEPTED — PERSISTENCE VERIFIED / APPLICATION INTEGRATION IN REVIEW
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

Therefore the M5 Supabase mutation was classified **REQUIRED** and has now been executed after Human/Owner approval of PR #206.

Production target: `public.agent_audit_events` in Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`).

Applied migrations:
- `20260811230540_m5_agent_audit_events`
- `20260811230743_m5_agent_audit_events_least_privilege`

The table is append-only, RLS-enabled and deny-by-default for `anon`/`authenticated`. `service_role` is explicitly limited to `SELECT` + `INSERT`.

## Application integration decision

The remaining M5 application integration is implemented as a server-only adapter and requires **no additional Supabase mutation**:

- `server/agentAudit/agentAuditWriter.ts` is the single durable writer for `agent_audit_events`;
- the writer reuses `src/platform/Telemetry/redaction.ts` for secret/PII redaction;
- complete prompts, complete diffs and raw request/response bodies are omitted before persistence;
- `server/agentAudit/authorizedAgentExecution.ts` composes the existing provider-neutral PolicyGate with durable audit persistence;
- persistence returns an `auditReference` suitable for operational telemetry correlation;
- persistence errors propagate and therefore fail closed instead of silently producing an unaudited authorization result.

The existing synchronous `evaluateAgentPolicy()` remains unchanged for compatibility. Server-side agent execution that requires ADR-0059 evidence must use the audited adapter.

Evidence authority while in review: `docs/evidence/m5/M5_APP_AUDIT_INTEGRATION_EVIDENCE.md`.

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

## Remaining M5 gate

M5 is not complete yet. The application implementation now exists on the M5 review branch, but before M5 can be declared `VERIFIED PASS` the Human-reviewed PR must prove:
1. server-side writer uses the existing privileged server Supabase path;
2. prohibited payload classes are omitted/redacted before persistence;
3. request/trace/actor/app/agent/capability/risk/policy/approval/tool/repository/PR/CI/runtime correlation is mapped correctly;
4. `auditReference` is returned to the caller for operational telemetry correlation;
5. unit and negative fail-closed tests pass;
6. an audited authorization can be reconstructed without exposing secrets;
7. the merged Roadmap/ADR/evidence reference the final merge SHA.

## Rollback

No rollback was required for the persistence mutation because all mandatory post-mutation checks passed.

For the application integration, rollback is code-only: disable/revert the audited adapter while preserving all previously persisted audit evidence. No schema rollback is authorized by this PR.

After productive audit evidence exists, destructive database rollback is forbidden without separate Human/Owner approval. Writers are disabled first and evidence preserved before any schema remediation.

## Verification

M5 is complete only when the application PR's required `build-and-test` and audit-specific tests are PASS, the final Human/Owner review is valid, and both persistence and application integration evidence are `VERIFIED PASS`.
