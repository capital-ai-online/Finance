# AI Agent M0–M10 Implementation Roadmap

> Legacy filename retained for stable references.

Status: IMPLEMENTATION PHASE
Baseline: `main@af88fcdfbc0d6b4a466ce734c0787ad0b6277dd8` (PR #208 merge)

## Global execution rule
Every phase that contains a platform mutation follows:

`ROADMAP/ADR → HUMAN APPROVAL → PRE-MUTATION TEST → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → ROADMAP UPDATE → NEXT PHASE`

No later phase may start while a required mutation/test is missing, failed, inconclusive or undocumented.

Privileged autonomous/semi-autonomous agents require the Human/Owner-approved Roadmap/ESS/ADR package. Daily/recurring agents may be created without prior approval only with `READ`/`ANALYZE`, no write credentials and no branch/commit/PR/CI/deploy/mutation/merge capability.

## Human/Owner CI rule
For PRs targeting `main`:

`FILES CHANGED → VIEWED → CURRENT-HEAD REVIEW (💪/okay) → OWNER CHECKBOXES LAST → ONE build-and-test`

The review itself does not start expensive CI. The final PR-body checkbox edit triggers the single normal `pull_request: edited` CI event. Any new commit invalidates the previous review.

## M0 — Evidence Baseline
**COMPLETE.** Read-only evidence collection.

## M1 — Git Guardrails
**COMPLETE.** Protected `main`, Human/Owner merge gate and stable required check.

## M2 / M2G — Architecture Definition and Documentation Freeze
**COMPLETE.** ESS-0019, ADR-0057..0063, trust/threat models, traceability and Documentation Freeze.

## M3 — CI Hardening
**COMPLETE.** One required `build-and-test`, scope-aware fast/full validation, Owner-before-CI gate and robust final-checkbox trigger.

## M4 — Agent IAM
**COMPLETE.** Provider-neutral principal attribution, explicit non-inheriting capabilities, canonical risk ladder, approval/step-up rules, kill switch and no agent `MERGE` capability.

Mutation state: **NOT REQUIRED** for Stripe/Supabase/Render.

## M5 — Observability / Telemetry / Audit
**IN PROGRESS — PERSISTENCE VERIFIED / APPLICATION INTEGRATION IN REVIEW.**

### M5 persistence
Production Supabase audit authority `public.agent_audit_events` is **VERIFIED PASS**:
- RLS enabled;
- `anon`/`authenticated` no direct access;
- `service_role` SELECT + INSERT only;
- UPDATE/DELETE fail closed;
- redacted synthetic write/read PASS;
- Security Advisor reviewed.

Applied migrations:
- `20260811230540_m5_agent_audit_events`
- `20260811230743_m5_agent_audit_events_least_privilege`

### M5 application integration
Current review branch: `agent/m5-audit-writer-e2e`.

Implemented scope:
1. backend-only `agent_audit_events` writer using the existing privileged server Supabase path;
2. reuse of canonical Telemetry secret/PII redaction;
3. explicit omission of full prompts, full diffs and raw request/response bodies;
4. provider-neutral PolicyGate decision persisted as an immutable authorization event;
5. `auditReference` returned for operational telemetry correlation;
6. terminal `SUCCESS`/`ERROR` recorded as a **second append-only outcome event**, linked to the authorization `auditReference` rather than updating prior evidence;
7. request/trace/actor/app/agent/capability/risk/policy/approval/tool/repository/PR/CI/artifact/deployment/runtime mapping;
8. unit/negative tests for redaction, omission, correlation, denied-outcome prevention and persistence fail-closed behavior.

Mutation state for this substep: **NOT REQUIRED**. No new Supabase/Stripe/Render mutation is authorized or needed.

Because `server/**` is runtime-relevant under current CI scope rules, this PR is **Check Class R** and must run the existing Docker/runtime verification in addition to application checks.

M5 exit gate:
- current-head Owner review and final checkbox trigger;
- one `build-and-test` PASS;
- audit-specific unit/negative tests PASS;
- production build/runtime checks PASS;
- merge after explicit Human instruction;
- post-merge ROADMAP/ADR/evidence sync to final SHA.

Only then is M5 `COMPLETE` and M5A authorized.

## M5A — Supabase TOTP MFA / AAL2 Hardening
**PLANNED — BLOCKED BY M5.**

Required sequence:
1. read-only inventory of application TOTP enroll/challenge/verify flow and Supabase Auth settings;
2. determine exact mutation/config need;
3. Human/Owner approval before any Supabase Auth mutation;
4. privileged Owner/admin operations require verified `aal2`; `aal1` fails closed;
5. invalid/expired TOTP, missing factor, stale session and mismatched challenge fail closed;
6. server/API authorization verifies trusted session/JWT/AAL context, never UI state alone;
7. recovery/factor-reset path is Owner-controlled and audited;
8. rerun Security Advisor after mutation/configuration;
9. positive/negative tests and redacted evidence must be `VERIFIED PASS`.

Leaked Password Protection: **DEFERRED — PLAN DEPENDENCY / PRO+** and not a blocker while unavailable on the current plan.

## M6 — Supply Chain
**BLOCKED BY M5 + M5A.**

Scope: SBOM, provenance and attestations bound to source/artifact digests. No implicit external-platform mutation.

## M7 — Deployment Identity + Production Platform Mutation Gate
**BLOCKED BY M6.**

Render mutations: only approved identity/environment credential/hook changes, followed by controlled deploy, health/readiness and rollback evidence.

Stripe mutations: only explicitly named billing/webhook/credential changes with dedicated ADR/runbook and Owner approval. Unrelated billing remediation stays a separate workstream.

Supabase mutations: only explicitly required deployment/IAM boundary changes; do not opportunistically repeat M5/M5A work.

## M8 — Agent Cutover
**BLOCKED BY M7.**

Route privileged ChatGPT/Claude/future execution clients through the provider-neutral Control Plane. Read-only daily agents remain the documented exception. No agent self-authorizes merge or production mutation.

## M9 — Assurance
**BLOCKED BY M8.**

Injection, replay, exfiltration, negative authorization, kill-switch, break-glass and rollback/recovery drills with independent evidence review.

## M10 — PR WebAuthn / Passkey Step-up
**BLOCKED BY M9.**

Requires Deep Research + repository read + dedicated ESS/ADR/runbook/threat model/negative tests. Assertion must bind Owner `SvenKulessa`, Finance repo, PR, exact head SHA and privileged action. Device ID alone is not authentication.

## Mandatory per-step update
Every completed step updates:
1. `docs/architecture/ROADMAP.md`;
2. this implementation roadmap;
3. `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`;
4. affected ADR/ESS;
5. mutation state (`NOT REQUIRED`, `PLANNED`, `HUMAN APPROVED`, `MUTATED`, `VERIFIED PASS`, `FAILED / ROLLED BACK`);
6. required test/evidence state.

No phase may skip Human/Owner review, required mutation/test gates, or preceding phase closure.
