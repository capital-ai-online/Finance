# CAPITAL-AI — AI System Administration & Diagnostics IAM Roadmap

Date: 2026-08-10
Scope: GitHub, Render, Supabase, Stripe, application runtime, market-data providers and AI orchestration.

## Mission

Enable AI-assisted system administration and diagnosis while preserving least privilege, human-controlled critical mutations, evidence-first operations and strict separation between observation, diagnosis and production mutation.

## Target operating model

### Tier A — Observer

Capabilities:
- read deployment state, health, logs and metrics;
- read Supabase schema metadata, migrations and advisors;
- read GitHub code, PRs, CI and release evidence;
- read Stripe catalog/webhook configuration metadata;
- generate diagnostic reports and incident timelines.

Credential model:
- read-only connector/service identity;
- no raw production secret exposure;
- no DDL/DML mutation rights.

### Tier B — Diagnostic Operator

Capabilities:
- execute bounded read-only SQL;
- correlate request IDs, deploy IDs, Stripe event IDs and audit IDs;
- run health probes, integrity checks and controlled read-only test queries;
- classify incidents and produce remediation plans;
- create GitHub issues/PRs containing remediation code and migrations.

Credential model:
- purpose-specific diagnostics service account;
- RLS-/read-only database role where feasible;
- repository write permission only for isolated branches/PRs.

### Tier C — Operations Agent

Capabilities:
- controlled redeploy/restart;
- retry idempotent jobs/events;
- update bounded non-secret configuration;
- pause/resume approved workers;
- perform reversible cache/queue maintenance.

Controls:
- IAM capability check;
- mutation intent + reason;
- idempotency key;
- pre/post health evidence;
- automatic rollback trigger where possible.

### Tier D — Privileged Administrator

Capabilities:
- apply reviewed database migrations;
- rotate service credentials;
- change RLS/grants/functions;
- modify production secrets/environment variables;
- change webhook and provider security configuration.

Controls:
- owner/admin role;
- step-up TOTP/passkey;
- explicit production-change authorization;
- dual evidence: precondition + postcondition;
- mandatory audit record;
- rollback/runbook reference.

### Tier E — Break Glass

Capabilities:
- emergency privileged recovery only.

Controls:
- disabled by default;
- owner activation;
- short TTL;
- reason and incident ID mandatory;
- narrowest possible capability set;
- session/token revocation at expiry;
- mandatory post-incident review.

## Service-account/key architecture

| Identity | Intended use | Default rights | Mutation rights |
|---|---|---|---|
| `capital-ai-diagnostics` | health, logs, reports | read-only | none |
| `capital-ai-web-runtime` | application requests | application-scoped | only approved runtime RPCs |
| `capital-ai-billing-processor` | Stripe event processing | billing tables/RPCs | idempotent billing side effects |
| `capital-ai-ci-release` | CI/release evidence | repo/build | reviewed deployment workflow only |
| `capital-ai-db-migrator` | schema migration | schema-admin during job | DDL only in approved migration window |
| `capital-ai-security-auditor` | IAM/RLS/advisor review | read-only security metadata | none |
| `capital-ai-break-glass` | incident recovery | disabled | temporary explicit grant |

Modern Supabase key contract:
- client/public: `sb_publishable_*` only;
- server privileged API client: `sb_secret_*` only;
- do not use publishable credentials as privileged fallback;
- legacy `anon`/`service_role` removed only after consumer inventory and cutover evidence.

## Roadmap

### Phase 0 — Credential inventory and containment (P0)

- inventory every consumer of Supabase/Stripe/Render/GitHub credentials;
- classify each credential as public, service, admin or break-glass;
- prohibit secret values in logs, PRs and diagnostic reports;
- set modern Supabase publishable key contract;
- provision/store `SUPABASE_SECRET_KEY` using `sb_secret_*`;
- maintain legacy keys only as temporary rollback compatibility.

DoD: every credential has owner, scope, storage location, consumers and rotation procedure.

### Phase 1 — Diagnostic plane (P0/P1)

Build a read-only diagnostic control plane capable of:
- `/healthz` and deploy identity validation;
- Render CPU/memory/request/latency checks;
- Supabase migration drift, RLS/advisor and connection checks;
- Stripe webhook/event/catalog consistency checks;
- GitHub main/PR/CI/deploy drift checks;
- provider health and freshness checks;
- cross-system incident report generation.

DoD: an AI diagnostic agent can explain platform state without mutation credentials.

### Phase 2 — Mutation gateway (P1)

Introduce one policy-enforced mutation gateway/contract rather than direct arbitrary tool use.

Required mutation envelope:
- `operation_id` / idempotency key;
- principal/service identity;
- target;
- action/capability;
- reason/work item;
- requested parameters with secret redaction;
- precondition evidence hash;
- approval/step-up claim when required;
- execution timestamp;
- result;
- rollback action;
- postcondition evidence.

DoD: every production mutation is attributable and replay-safe where meaningful.

### Phase 3 — Database administration roles (P1)

- create/read-only diagnostics DB role or equivalent constrained service path;
- isolate migration execution under `capital-ai-db-migrator`;
- remove generic service-secret use from diagnostic tooling;
- constrain application runtime writes to explicit tables/RPCs;
- review SECURITY DEFINER functions, EXECUTE grants and search_path;
- centralize migration drift/evidence reporting.

DoD: diagnostics cannot accidentally execute DDL/DML; migrator cannot act as web runtime.

### Phase 4 — Platform operations capabilities (P1/P2)

Capability catalogue examples:
- `render.deploy.read`
- `render.deploy.trigger`
- `render.logs.read`
- `supabase.schema.read`
- `supabase.sql.read`
- `supabase.migration.apply`
- `supabase.auth.config.write`
- `supabase.secret.rotate`
- `stripe.events.read`
- `stripe.webhook.write`
- `github.repo.read`
- `github.pr.write`
- `github.merge.request`

Map each capability to IAM role, service identity, required step-up and audit severity.

### Phase 5 — Automated diagnostics and evidence reports (P2)

- scheduled platform integrity report;
- deployment drift report;
- database/security advisor report;
- billing/webhook integrity report;
- market-data freshness/provider report;
- IAM privilege drift report;
- secret/key age and rotation-due report.

Reports MUST redact secrets and provide evidence references, not credential material.

### Phase 6 — Controlled self-healing (P2/P3)

Permit only pre-approved low-risk actions automatically:
- retry idempotent jobs;
- restart unhealthy worker;
- redeploy same known-good commit;
- quarantine a failed provider and switch to an approved fallback;
- disable a non-critical failing scheduled task.

Schema changes, secret rotation, billing mutations, IAM grants and destructive actions remain human-authorized.

### Phase 7 — Break-glass and incident command (P2)

- TTL-based emergency elevation;
- incident commander role;
- scoped emergency capability grants;
- immutable incident audit trail;
- automatic credential/session revocation;
- post-incident evidence package and remediation PR.

## Audit severity

- `READ`: diagnostic read, normal retention.
- `CHANGE_LOW`: reversible operational mutation.
- `CHANGE_HIGH`: configuration/security/billing mutation; step-up required.
- `PRIVILEGED`: schema/IAM/secret mutation; owner authorization required.
- `BREAK_GLASS`: emergency; highest retention and mandatory review.

## Immediate execution order

1. Complete Supabase modern key cutover (`sb_publishable_*`, then `sb_secret_*`).
2. Verify web/runtime/CI consumers and remove legacy fallback only after evidence.
3. Close the outstanding R-003 Supabase migration drift.
4. Implement R-004 transactional PDF credit ledger.
5. Introduce diagnostic service identity and read-only capability catalogue.
6. Introduce mutation gateway + audit envelope.
7. Split web-runtime, billing, migrator and diagnostics privileges.
8. Add scheduled integrity/security/credential-age reports.
9. Add controlled self-healing for low-risk idempotent operations.
10. Formalize break-glass TTL and incident review.

## Non-negotiable invariants

- No raw secret in model context when a connector can hold it.
- No VITE/client exposure of `sb_secret_*`.
- No privilege downgrade from secret to publishable key.
- No production mutation without attributable identity and evidence.
- No autonomous destructive mutation.
- No billing/IAM/schema mutation without explicit policy authorization.
- Every critical mutation has rollback and postcondition validation.
