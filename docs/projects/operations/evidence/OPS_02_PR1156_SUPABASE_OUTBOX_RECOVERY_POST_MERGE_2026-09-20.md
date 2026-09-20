# OPS-02 — PR #1156 Supabase Outbox Recovery Post-Merge Evidence

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02 — Controlled Implementation  
**Production correlation:** PVC-08 — Production Operations  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Evidence type:** post-merge readback / coordination convergence  
**Runtime mutation:** none

## Purpose

PR #1156 (`[CAPITAL-AI-OPS] [ChatGPT] Fix Supabase Outbox Recovery RPC`) was merged after correcting the PL/pgSQL ambiguity in `public.claim_outbox_job_v2`. This record closes the stale coordination state left by the original work claim and records the read-back evidence observed after merge.

This document is evidence only. It does not create a new runtime, database, Security, Governance or merge authority.

## Repository identity

- PR: `#1156`
- final PR head: `c64168f39372143cf080d27cf9d59449266d52e8`
- Human merge timestamp: `2026-09-20T16:44:27Z`
- merge commit: `10dd68d1c448a71f681da78b76329d960d7a9279`
- correlated current main for this follow-up: `24850d31cc503b28b1ff786b377826733bf9671f`
- ancestry readback: PR #1156 merge commit remains an ancestor of current main.

## Exact-head hosted validation

The final PR head completed the following GitHub Actions workflow runs successfully:

- Container Security — SUCCESS
- complete PR label classification — SUCCESS
- automated PR workflow/review gate — SUCCESS
- PR Governance — SUCCESS
- full CI check — SUCCESS

The `Required Checks=PENDING` and `Security / Compliance=PENDING` values retained in the merged PR body are therefore stale projections and are not current gate state.

## Production Supabase readback

Project `AIFINANCIAL` / ref `ryzywoktpmyhwzxmstyu` was read without mutation.

Observed state:

- migration `20260920161445_fix_outbox_worker_recovery_job_id_ambiguity` is present in the production migration ledger;
- `public.claim_outbox_job_v2(text,integer,text[])` is still `SECURITY DEFINER`;
- function `search_path` remains `public, pg_temp`;
- the function body contains the corrected `returning 1 as recorded` projection rather than the ambiguous `returning job_id`;
- EXECUTE privilege readback:
  - `anon = false`
  - `authenticated = false`
  - `service_role = true`
- repository migration on current main retains the same revoke/grant boundary.

The Supabase Security Advisor separately reports `Leaked Password Protection Disabled`. That finding is unrelated to the outbox RPC and does not invalidate the PR #1156 recovery fix.

## Convergence decision

The original claim `CAPITAL-AI-OPS-SUPABASE-OUTBOX-RECOVERY-FIX-20260920` reached its declared Human/CODEOWNER merge release condition. Its stale `active/exclusive` state is therefore changed to `released/non-exclusive`.

No runtime rollback, RPC rewrite, grant change, database mutation, workflow restart or provider mutation is part of this evidence-only follow-up.
