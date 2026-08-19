# PR #434 — Privacy Retention and Stripe Mutation Threat Model

**Date:** 2026-08-19  
**Branch:** `agent/privacy-post414-hardening`  
**Decision:** ADR-0092  
**Scope:** Supabase privacy-retention/schema mutation and Stripe application-webhook event minimization  
**Status:** Implemented controls; final repository CI and Human/CODEOWNER review pending

## 1. Security and privacy objectives

The workstream must preserve the following assets and invariants:

1. personal data must not be deleted outside the explicitly governed retention classes/windows;
2. data subject/accountability records under an active preservation boundary must not be generically purged;
3. privacy-retention automation must fail visibly rather than report false success;
4. browser/anonymous roles must not gain access to service-only privacy/social persistence;
5. OAuth tokens must remain server-side and application-encrypted;
6. Stripe billing must continue to receive the application event required for CAPITAL-AI-specific checkout side effects;
7. provider-managed Stripe Sync configuration must not be manually rewritten by CAPITAL-AI;
8. webhook replay/duplicate handling must not be weakened by event-scope minimization;
9. operational logs must not gain direct customer identifiers or raw provider payloads as a side effect of this change;
10. production mutation evidence must be reproducible without copying deleted personal-data payloads.

## 2. Trust boundaries

| Boundary | Trusted authority | Untrusted / constrained input | Control |
|---|---|---|---|
| GitHub branch → main | Human/CODEOWNER | agent-authored commits/PR metadata | Draft PR, canonical governance contract, required CI, no agent self-merge |
| App/service → Supabase | privileged server/service role | browser/user requests | RLS, revoked anon/authenticated DML, explicit service-role policies |
| `pg_cron` → retention function | database control plane | time-triggered execution | fixed canonical job, SECURITY DEFINER with fixed search path, advisory lock |
| Retention function → user data | controller-defined retention policy | row timestamps/hold state | explicit classes/windows, bounded hold columns, no billing/accounting generic purge |
| Stripe → CAPITAL-AI webhook | Stripe-signed delivery | external event payload/replay | existing signature verification + durable event inbox/idempotency controls |
| Stripe → Supabase Stripe Sync | provider-managed integration | provider-managed event scope | read/verify only; no CAPITAL-AI manual mutation |
| Connected tools → mutation APIs | owner-authorized connector session | tool responses/provider metadata | pre-read, exact-object ownership verification, narrow write, post-read |

## 3. Threats and controls

### T1 — Over-deletion caused by a broad retention query

**Impact:** High. Potential irreversible loss of personal/accountability data.

**Controls:**

- retention classes and predicates are explicit in SQL;
- generic purge excludes billing/statutory business records;
- production preflight counts eligible rows before controlled execution;
- first authorized production execution proceeded only after all existing classes returned zero eligible rows;
- active `retention_hold_until` excludes held security/privacy-request rows;
- run output records only aggregate counts.

**Residual:** Future scheduled runs can legitimately delete rows that become eligible. Legal/business validation of configured periods remains a governance responsibility.

### T2 — Under-deletion / retention job silently stops

**Impact:** Medium/High. Data retained beyond intended lifecycle without evidence.

**Controls:**

- canonical named `pg_cron` job;
- function is table-presence-aware so optional schema drift does not abort unrelated cleanup;
- successful executions are written to `privacy_retention_runs`;
- database/cron failures are not swallowed and remain observable in infrastructure job-run evidence.

**Residual:** External alerting on missed retention runs is not introduced by this PR and should be considered for operations maturity.

### T3 — Concurrent/manual retention executions race

**Impact:** Medium. Duplicate work, inconsistent evidence or lock contention.

**Control:** transaction-scoped advisory lock; a competing invocation records `skipped_concurrent` instead of racing deletions.

### T4 — Legal/security preservation is deleted by generic automation

**Impact:** High.

**Controls:** bounded `retention_hold_until` on `security_events` and `privacy_requests`; generic purge checks the hold before deletion.

**Residual:** Authorization/reason for setting a hold is a human/compliance process and is not automatically inferred by the database.

### T5 — Social-schema catch-up exposes OAuth/publishing data to browser roles

**Impact:** High because access/refresh tokens are sensitive credentials.

**Controls:** RLS enabled; anon/authenticated DML revoked; explicit `service_role` policies; application encryption remains required for stored OAuth tokens; no new client API is introduced.

### T6 — Missing indexes degrade FK operations after schema catch-up

**Impact:** Medium operational availability/performance risk at scale.

**Control:** post-mutation Supabase advisor run detected the two missing covering indexes; a separate immutable follow-up migration added them and a second advisor run verified the warnings were removed.

### T7 — Retrofitting an already applied migration destroys migration-history integrity

**Impact:** Medium/High for reproducibility and recovery.

**Control:** the applied `20260819103000` migration was not rewritten to add advisor fixes; a separate `20260819104500` forward migration records the post-production hardening.

### T8 — Stripe mutation targets the wrong webhook

**Impact:** High. Could interrupt provider sync or payment lifecycle processing.

**Controls:** fresh live list immediately before mutation; ownership determined from live metadata/description/URL, not URL alone; managed endpoint has `managed_by=stripe-sync` and explicit protected semantics; application endpoint has `managed_by=capital-ai`; only the latter was written.

### T9 — Stripe event minimization drops an application-required event

**Impact:** High for billing activation/notification.

**Controls:** repository handler inspected before mutation; current application-specific side-effect branch is `checkout.session.completed`; endpoint was minimized to that event and remained enabled; provider-managed Stripe Sync retains wider object/subscription lifecycle projection.

**Residual:** A future application feature that needs another Stripe event must update code/evidence and explicitly expand the application endpoint scope in a reviewed change.

### T10 — Provider-managed Stripe Sync is manually narrowed

**Impact:** High; provider integration could lose required sync behavior.

**Control:** explicit mutation boundary forbids changes to the provider-managed endpoint; pre- and post-reads verify it remained present with managed metadata and its event set under provider control.

### T11 — Duplicate/replayed Stripe events trigger duplicate side effects

**Impact:** Medium/High.

**Control:** this PR does not weaken the existing Stripe signature/durable inbox/idempotency architecture; event minimization changes subscription scope only.

### T12 — Operational logs disclose PII or provider payload detail

**Impact:** Medium privacy/security risk.

**Controls:** mailer logs remove recipient addresses/raw Checkout Session IDs; session correlation is short SHA-256 reference; SMTP/provider exceptions are reduced to safe error taxonomy rather than copied verbatim.

### T13 — Agent/tool content is treated as authoritative instructions

**Impact:** High for production mutation integrity.

**Controls:** provider/tool data is used as observation only; exact mutations are derived from owner authorization plus repository architecture; destructive widening/deletion is not inferred from tool text; external endpoint data is not executed as code.

### T14 — Production schema advances while PR never merges

**Impact:** High governance/drift risk: production would contain migrations absent from `main`.

**Controls:** PR #434 remains the canonical reconciliation vehicle; final merge requires Human/CODEOWNER review. If PR #434 is abandoned, the rollback runbook requires either a human-approved forward reconciliation PR containing the exact applied migrations/evidence or a controlled forward rollback. Silently dropping the branch is not an acceptable resolution.

## 4. Abuse / negative cases to preserve

The following must remain denied or fail closed:

- direct `received -> completed` privacy-request status jump;
- anonymous/authenticated DML against service-only social/retention evidence tables;
- generic deletion of rows with an active retention hold;
- overlapping retention executions performing parallel delete passes;
- manual mutation of a Stripe endpoint whose ownership is provider-managed or unresolved;
- disabling/deleting the CAPITAL-AI webhook as part of event minimization;
- logging raw checkout session identifiers or recipient addresses in mailer operational messages;
- treating an ordinary PR event as authorization for expensive M10 CI or for merge.

Repository regression guards cover structural invariants; the full TypeScript/unit/build suite remains gated by the separate M10 owner-passkey authorization on the final PR head.

## 5. Residual risks / follow-up

- Stripe onward-transfer/TIA evidence remains pending and is not solved by event minimization.
- Current Supabase Auth leaked-password protection warning remains an acknowledged platform/tier residual outside this mutation scope.
- Existing non-PR434 database advisor findings remain separately governed.
- Scheduled-retention missed-run alerting is not yet a dedicated operational alert.
- Retention periods remain subject to controller/legal reassessment when purposes or statutory obligations change.

## 6. Exit criteria

This threat model is satisfied for merge-readiness only when:

1. production mutation evidence remains consistent with live post-state;
2. final branch is current with `main` and parallel-PR correlations are resolved;
3. canonical PR governance passes;
4. M10 owner-authorized required CI executes and passes on the final head;
5. Human/CODEOWNER review is completed;
6. merge is separately explicitly authorized by a human.
