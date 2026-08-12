# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@156142102e7d2a97ad466aee0340f758fa4365e5` (PR #220 merge)
Authority: ESS-0021, ADR-0065, ADR-0058, ADR-0059, ADR-0066, ADR-0067

## Goal

The Systemadmin Roadmap Executor may autonomously implement Owner-approved repository work packages only through bounded REM authority, least privilege, durable append-only audit evidence, Human final review and Human-only merge.

## Completed stages

### SA0 — Governance

**COMPLETE — PR #214 MERGED**

Governance, REM schema, ESS/ADR authority and branch lifecycle are on `main`.

### SA1 — REM validator / Control Plane

**COMPLETE / VERIFIED PASS — PR #215 MERGED**

- merge `d8ccc3c5e136d51ae36b57b103119b25f4a42b8b`;
- CI #909 PASS;
- Governance #634 PASS;
- branch deleted.

Capability ceiling remains:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

`MERGE`, `DEPLOY_REQUEST`, `PRODUCTION_MUTATION`, CRITICAL execution and reserved Owner mutations remain denied.

### SA2 — Chat execution profile

**COMPLETE / VERIFIED PASS — PR #216 MERGED**

- merge `a5abc1685026651f4297a487e855683a1fa1e58e`;
- CI #919 PASS;
- Google-Marketing #164 PASS;
- Governance #643 PASS;
- branch deleted.

Direct mutating SA2 LIVE remains denied. SA2 envelopes alone are not mutation authority.

### M10 target architecture

PR #217 merged Passkey-only Human/Owner PR authorization architecture at `083d8f25083034e3785d1a8e0c57eaf03463c907`.

M10 runtime remains sequentially blocked by M9. Until its controlled cutover reaches `VERIFIED PASS`, the current Human/Owner review/attestation gate remains authoritative.

### SA3A — Append-only audit adapter

**COMPLETE / VERIFIED PASS — PR #218 MERGED**

- final head `4178f76c1c33b50b957cd073d83ed9eeb0493642`;
- merge `8de5a538ae9d2f0afc7b2e505ddda427ceb77780`;
- CI #926 PASS;
- Governance #647 PASS;
- branch deleted.

Canonical control:

`SA1/SA2 ALLOW → durable M5 authorization event → auditReference → audit-bound permit → action → second append-only outcome event`

## SA3B — Execution-host binding

**Status: HOST MERGED + DEPLOYED / FAIL-CLOSED LIVE PROBE PASS / POSITIVE PROBE BLOCKED**

PR #220 is merged:

- final reviewed head `c4c7d00b33e521dfd12b14ddfdc097288a80f385`;
- merge `156142102e7d2a97ad466aee0340f758fa4365e5`;
- CI #936 PASS;
- Governance #653 PASS;
- implementation branch deleted.

ADR-0067 selects **GitHub Actions + GitHub OIDC + CAPITAL-AI audit broker** as the first enforceable host.

Canonical chain:

`OWNER EXECUTION ISSUE → TRUSTED MAIN WORKFLOW → STRICT REQUEST VALIDATION → GITHUB ACTIONS OIDC → CAPITAL-AI BROKER → SA1/SA2/SA3A → M5 auditReference → EXACT SIDE EFFECT → M5 OUTCOME`

### Production host deployment

Render `Finance` deployed `main@156142102e7d2a97ad466aee0340f758fa4365e5` through deploy `dep-d9u19jjm8hqs73e95la0` and reached `live`.

The deployment required no Render configuration mutation.

### Real probe #1 — fail-closed boundary verified

Owner Issue #221 triggered workflow run `31570833507` on the exact deployed `main` SHA.

Results:

1. strict Issue request validation — PASS;
2. trusted `main` + REM binding — PASS;
3. GitHub OIDC acquisition — PASS;
4. broker reached — PASS;
5. durable M5 authorization persistence — **FAIL: `Unregistered API key`**;
6. branch creation — **SKIPPED**;
7. requested branch `agent/sa3b-host-probe-20260812a` — confirmed absent.

Thus the real security invariant is proven:

`AUDIT/PERMIT FAILURE → ZERO REPOSITORY SIDE EFFECT`

This counts as **negative/fail-closed PASS**, not SA3B completion.

### Independent M5 contract drift discovered by the live probe

Read-only verification of `public.agent_audit_events` and its canonical migration exposed an application integration mismatch:

Production schema uses:

`human_actor_id, intent, scope, authorization_decision, approval_reference, step_up_reference, tool_name, pull_request_number, ci_run_id, attributes`

The pre-remediation writer used aliases such as:

`actor_id, decision, approval_id, tool_id, pr_number, workflow_run_id, metadata`

and did not provide required `intent`/`scope`.

The table/migration remain authoritative and must not be destructively changed to match the buggy writer.

### Active corrective work package

Branch:

`fix/sa3b-m5-audit-schema-contract`

Purpose:

- bind `agentAuditWriter.ts` exactly to the existing production migration;
- make audit `intent` and `scope` explicit;
- preserve non-UUID external identities as sanitized attributes rather than inventing database UUIDs;
- update generic + Systemadmin audited callers;
- add migration↔writer schema drift regression coverage;
- synchronize SA3B evidence/traceability.

**No Supabase schema mutation is required or authorized by this repository remediation.**

### Remaining production-secret blocker

`server/db.ts` resolves privileged server credentials in this order:

`SUPABASE_SECRET_KEY → SUPABASE_SERVICE_ROLE_KEY`

The deployed service currently receives `Unregistered API key` from privileged Supabase operations. Supabase project `AIFINANCIAL` is itself `ACTIVE_HEALTHY`, so the Render-side privileged credential must be verified/replaced by the Owner through the production secret-management boundary.

No secret value may be copied into source, PR text, evidence, logs or chat.

### SA3B exit gate

`COMPLETE / VERIFIED PASS` now requires:

1. corrective writer/schema PR final-head CI PASS;
2. Human merge + corrective branch deletion;
3. corrected `main` deployment;
4. valid privileged Supabase server credential restored in Render;
5. privileged persistence health verified;
6. fresh Owner `BRANCH_PROBE` obtains durable audit reference before any branch API call;
7. probe branch equals exact current `main` SHA;
8. terminal SUCCESS outcome reference exists;
9. probe branch deleted after evidence capture;
10. separate invalid/stale/no-permit path proves zero side effect;
11. evidence/Roadmap/traceability synchronized.

## SA4 — First bounded autonomous work-package REM

**Status: BLOCKED BY SA3B VERIFIED PASS**

Only after the positive host probe passes may the host be extended for one bounded non-production Roadmap work package.

Required SA4 constraints remain:

- Finance / `main`;
- one Owner-approved REM and one Roadmap item;
- max one open Systemadmin PR;
- no external production mutation;
- max HIGH risk;
- explicit path allowlist;
- expiry <= 7 days;
- kill switch enabled;
- every BRANCH/COMMIT/PR action audit-bound;
- one final expensive CI for the reviewed head;
- Human review and Human-only merge;
- branch deletion after merge.

Before SA4 adds COMMIT/PR authority, the broader SA1 trust-root list must include the SA3B host/control-plane artifacts in addition to the current SA3 self-protection.

## SA5 — Bounded external mutation design

**Status: BLOCKED BY SA4 + M10 VERIFIED PASS**

External production mutation remains prohibited until a separate future ADR proves exact-target, reversible execution plus strong M10 Owner assurance.

## Branch lifecycle

`current main → fresh scoped branch → audited actions → PR → Human review/CI → Human merge → branch delete`

Merged/superseded branches are never reused.

## Current next action

Complete the M5 writer/schema remediation PR. After Human merge, deploy corrected `main`, restore/verify the Owner-controlled privileged Supabase credential, then repeat the SA3B positive host probe. **SA4 remains blocked until the full Authorization → Branch → Outcome chain is VERIFIED PASS.**
