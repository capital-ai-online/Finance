# M5 — Application Audit Integration Evidence

Status: VERIFIED PASS
Date: 2026-08-12
Baseline: `main@e39d5370d8b1498e84952535a38a339cc200082f` (PR #210 merge)
Authority: ADR-0056, ADR-0059, ESS-0019

## Scope

This evidence closes the remaining M5 application-side integration with the already verified Supabase audit authority `public.agent_audit_events`.

External platform mutation for this substep: **NOT REQUIRED**.

The production table, RLS, least-privilege grants and append-only trigger were already applied and verified in the preceding M5 mutation gate. PR #210 changed application code and tests only.

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
   - returns the durable `auditReference` to the caller for operational telemetry correlation;
   - records terminal `SUCCESS`/`ERROR` as a second append-only outcome event linked to the authorization evidence.

3. `tests/unit/agentAudit.test.ts`
   - secret/PII redaction;
   - full prompt/diff/raw-body omission;
   - complete correlation mapping;
   - persistence error = fail closed;
   - denied authorization cannot emit a successful terminal outcome;
   - provider-neutral ALLOW decision + durable audit reference reconstruction;
   - typed Supabase `insert` mock so TypeScript can safely inspect payload arguments.

## Security invariants

- No Supabase schema/config mutation was introduced by PR #210.
- No `anon` or `authenticated` audit-table access was introduced.
- No new credential was added.
- Provider/model metadata never grants authorization.
- Full prompts, full diffs and raw request/response bodies are never persisted by the writer.
- Secret-like and PII fields are redacted using the existing Telemetry redaction contract.
- Only syntactically valid `supabase:agent_audit_events:<id>` audit references bypass generic authorization-key redaction.
- Audit persistence failure is not converted into a successful audited decision.
- Audit evidence remains append-only; terminal outcomes are separate correlated events, not UPDATEs.

## Final validation evidence

PR: **#210** — `feat(m5): serverseitige Agent-Audit-Evidence und E2E-Korrelation integrieren`

Final PR head: `ffeab08c218314edd5292fbaf5ccb77413cee80e`

Merge commit: `e39d5370d8b1498e84952535a38a339cc200082f`

Required GitHub Actions run: **#892** / run id `31559124198` — **PASS**.

Verified PASS steps:
- Human-/Owner-Vorprüfung;
- Repository-Integrität;
- `npm ci`;
- production dependency audit;
- TypeScript/lint;
- unit tests including `tests/unit/agentAudit.test.ts`;
- production build;
- production configuration / deployment readiness;
- Docker hardening;
- production Docker image build and inspection;
- deployment verification job.

The earlier TS2493 mock-signature failure was remediated before the final PASS by typing the Supabase `insert` mock payload and keeping that parameter intentionally referenced.

## Exit criteria result

1. Human/Owner review valid for final PR head — **PASS**.
2. Single required `build-and-test` — **PASS**.
3. Audit-writer unit/negative tests — **PASS**.
4. No new external platform mutation — **PASS / NOT REQUIRED**.
5. Canonical server-side audited authorization entry point merged — **PASS**.
6. ROADMAP/ADR/evidence synchronized to merge SHA — **this post-merge sync**.

M5 application integration is therefore **VERIFIED PASS** and M5 may be closed once this post-merge synchronization PR is merged. M5A may begin only after that repository synchronization is on `main`.
