# M4 — Agent IAM Evidence

Status: IMPLEMENTED PENDING CI + HUMAN/OWNER REVIEW
Date: 2026-08-11
Baseline: `main@c093052c22ed620bc9b086ba4ec05612d7dd2150` (PR #197 merge)
Authority: ESS-0019, ESS-0018, ADR-0058, ADR-0050, ADR-0051

## Objective

M4 introduces the provider-neutral Agent IAM authorization core required by the DevelopmentChain without replacing the already implemented Supabase-specific grant/approval controls.

The implementation must ensure that ChatGPT, Claude, Gemini/AI Studio or any future AI client cannot derive authority from provider/model identity and cannot self-authorize sensitive actions.

## Implemented control surface

`src/platform/Security/agentAuthorization.ts` defines the canonical capability ladder:

`READ → ANALYZE → PLAN → BRANCH → COMMIT → PR → CI_REQUEST → DEPLOY_REQUEST → PRODUCTION_MUTATION`

Risk classification:

| Capability | Risk |
|---|---|
| READ | LOW |
| ANALYZE | LOW |
| PLAN | MEDIUM |
| BRANCH | MEDIUM |
| COMMIT | HIGH |
| PR | HIGH |
| CI_REQUEST | HIGH |
| DEPLOY_REQUEST | HIGH |
| PRODUCTION_MUTATION | CRITICAL |

Authorization identity binds:

- human actor;
- app/client;
- agent;
- session;
- tool credential holder;
- provider/model only as non-authoritative metadata.

## Fail-closed decisions

The authorization core denies when:

- identity is incomplete;
- the requested capability is not explicitly granted;
- HIGH/CRITICAL capability lacks human approval;
- an agent attempts self-approval;
- approval belongs to another human actor;
- approval belongs to another agent;
- approval covers another capability;
- approval is expired or invalid;
- CRITICAL capability lacks verified step-up.

`MERGE` is not part of the agent capability namespace. It remains controlled by `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

## Existing controls preserved

M4 does not modify or replace:

- Supabase `capability_grants` persistence;
- ESS-0018 concrete Supabase capability allowlist;
- ADR-0051 approval consumption and supervised execution;
- Supabase RLS or production database schema;
- Stripe, Render or production provider configuration;
- deployment identity.

## Verification

`tests/unit/agentAuthorization.test.ts` covers:

1. deterministic risk classification;
2. incomplete identity denial;
3. missing explicit grant denial;
4. LOW/MEDIUM allow path with grant;
5. HIGH approval requirement;
6. self-approval denial;
7. different-human approval denial;
8. different-agent/capability approval denial;
9. CRITICAL step-up requirement;
10. approved HIGH allow path;
11. MERGE remains human-only.

## Exit criteria

M4 may be marked COMPLETE only when:

- TypeScript, unit tests, build and governance checks pass;
- M4 PR passes the required `build-and-test` Human/Owner gate;
- all changed files are reviewed and marked Viewed by the Owner;
- both Owner attestations are checked;
- the current-commit Owner review contains `💪` or `okay`;
- the M4 merge SHA is recorded in ROADMAP and traceability;
- M5 is authorized only after this closure.
