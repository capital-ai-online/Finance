# M5 — Application Audit Integration Evidence

Status: IMPLEMENTATION IN REVIEW
Date: 2026-08-12
Baseline: `main@af88fcdfbc0d6b4a466ce734c0787ad0b6277dd8` (PR #208 merge)
Authority: ADR-0056, ADR-0059, ESS-0019

## Scope

This evidence covers the remaining M5 application-side integration with the already verified Supabase audit authority `public.agent_audit_events`.

External platform mutation for this substep: **NOT REQUIRED**.

The production table, RLS, least-privilege grants and append-only trigger were already applied and verified in the preceding M5 mutation gate. This PR changes application code and tests only.

## Implemented controls

1. `server/agentAudit/agentAuditWriter.ts`
   - backend-only privileged Supabase writer;
   - writes only to `agent_audit_events`;
   - requires request, trace, actor, app, agent, capability, risk and policy attribution;
   - returns `supabase:agent_audit_events:<id>` as `auditReference`;
   - propagates persistence failure (fail closed);
   - reuses the canonical Telemetry redaction contract;
   - explicitly omits complete prompt, diff and raw request/response payload classes before persistence.

2. `server/agentAudit/authorizedAgentExecution.ts`
   - keeps provider-neutral authorization in the existing PolicyGate;
   - couples each server-side authorization decision to durable audit persistence;
   - binds the audit record to real principal/request context plus optional tool/repository/PR/CI/artifact/deployment/runtime evidence;
   - returns the durable `auditReference` to the caller for operational telemetry correlation.

3. `tests/unit/agentAudit.test.ts`
   - secret/PII redaction;
   - full prompt/diff/raw-body omission;
   - complete correlation mapping;
   - persistence error = fail closed;
   - provider-neutral ALLOW decision + durable audit reference reconstruction.

## Security invariants

- No Supabase schema/config mutation in this PR.
- No `anon` or `authenticated` audit-table access is introduced.
- No new credential is added.
- Provider/model metadata never grants authorization.
- Full prompts, full diffs and raw request/response bodies are never persisted by the writer.
- Secret-like and PII fields are redacted using the existing Telemetry redaction contract.
- Audit persistence failure is not converted into a successful audited decision.

## Required PR validation

Check class: **C — Application/Test**.

After Human/Owner gate, the single `build-and-test` run must execute:
- repository integrity;
- `npm ci`;
- production dependency audit;
- TypeScript/lint;
- unit tests including `tests/unit/agentAudit.test.ts`;
- production build;
- production configuration/predeploy checks.

Docker image build is **N/A** unless the final PR scope changes to include runtime/Docker/deployment files.

## Exit criteria

M5 application integration may be marked `VERIFIED PASS` only after:
1. Human/Owner review is valid for the final PR head;
2. the single required `build-and-test` is PASS;
3. audit-writer unit/negative tests are PASS;
4. the PR remains free of new external platform mutations;
5. the merged code provides the canonical server-side audited authorization entry point;
6. ROADMAP/ADR-0059 are synchronized to the merge SHA.

Until then M5 remains `IN PROGRESS`, M5A remains blocked, and M6 remains blocked.
