# M4 — Agent IAM Evidence

Status: IMPLEMENTATION PR
Date: 2026-08-11
Baseline: `main@c093052c22ed620bc9b086ba4ec05612d7dd2150`
Authority: ADR-0058, ADR-0050, ADR-0051, ESS-0018, ESS-0019

## Scope

M4 generalizes the existing Supabase-specific capability/grant foundation into a provider-neutral Agent Control Plane authorization contract without replacing existing domain IAM.

## Implemented controls

- attributable execution principal: human actor, client/app, agent session, credential holder;
- provider/model metadata is informational only, never sufficient authorization;
- canonical capabilities: READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION;
- no wildcard capability;
- MERGE is not an agent capability;
- deny-by-default on unknown capability, missing grant or incomplete principal;
- LOW/MEDIUM/HIGH/CRITICAL risk classes;
- DEPLOY_REQUEST minimum risk HIGH;
- PRODUCTION_MUTATION minimum risk CRITICAL;
- HIGH requires explicit human approval;
- CRITICAL requires human approval plus step-up;
- approval identity must match the bound human actor.

## Existing controls preserved

- Supabase domain grants in `src/platform/Security/capabilities.ts`;
- single-use plan-bound approvals in `src/platform/Security/approvals.ts`;
- Compliance PolicyGate allowlists;
- Supervisor approval/dry-run/fingerprint chain;
- PR #197 Human/Owner merge gate.

## Negative verification

`tests/unit/agentAuthorization.test.ts` verifies:

1. granted LOW action can pass;
2. missing grant is denied;
3. unknown capability including `MERGE` is denied;
4. HIGH deploy request without human approval is denied;
5. CRITICAL production mutation without step-up is denied;
6. CRITICAL production mutation with matching human approval + step-up can pass;
7. incomplete execution identity is denied.

## Exit criteria

M4 may close only when:

- TypeScript validation passes;
- unit tests pass;
- production build/predeploy gates pass;
- Human/Owner review requirements are fulfilled for the exact PR head;
- merge is performed only after explicit human authorization;
- post-merge ROADMAP and traceability are synchronized to the resulting `main` SHA.

M5 remains blocked until these conditions are satisfied.
