# M4 Agent IAM — Implementation Evidence

Status: CLOSURE IN REVIEW
Date: 2026-08-11
Baseline: `main@69f719683b60ba6aadc0022381c6cecc430f0ea5` (PR #198 merge)
Authority: ESS-0019, ESS-0018, ADR-0058, ADR-0050, ADR-0051

## Objective

Generalize the existing Supabase/tool-specific CapabilityGrant and Approval controls into a provider-neutral Agent IAM decision layer without weakening or replacing the existing domain/tool policies.

## Canonical implementation

PR #198 is the canonical M4 implementation. It merged the provider-neutral Agent IAM into `main` and remains the architectural baseline.

Parallel PRs #200 and #201 were created from the older PR-#197 baseline. They are not separate roadmap phases. Their contents were reviewed against ADR-0058 and the current Roadmap. Only one useful missing control from #201 is retained: approval evidence is additionally bound to the exact logical `agentId`.

The conflicting #201 risk mapping is rejected because it diverges from the canonical M4 ladder.

## Canonical controls

- explicit capabilities READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION;
- no MERGE capability;
- LOW: READ/ANALYZE/PLAN;
- MEDIUM: BRANCH/COMMIT/PR/CI_REQUEST;
- HIGH: DEPLOY_REQUEST;
- CRITICAL: PRODUCTION_MUTATION;
- contextual risk may increase but never reduce minimum risk;
- principal binds human actor, app, logical agent, session, request and credential holder;
- provider/model are metadata only;
- exact non-inheriting grants;
- HIGH requires current Human Approval;
- CRITICAL requires Human Approval plus verified Step-up;
- approval binds human actor + subject agent + capability + target and must be unexpired;
- development -> production mutation is denied;
- mutation kill switch is enforced;
- ESS-0018 tool-specific grants, approvals and PolicyGate checks remain a second independent layer.

## Negative-test evidence

`tests/unit/agentIam.test.ts` covers:

- capability non-inheritance;
- MERGE denial;
- incomplete attribution;
- provider/model non-authority;
- minimum-risk enforcement;
- HIGH approval without mandatory step-up;
- CRITICAL approval plus step-up;
- approval subject-agent mismatch;
- target mismatch;
- expired approval;
- self-approval;
- development production boundary;
- kill switch.

## Production boundary

This closure PR introduces no direct mutation of Stripe, Supabase or Render configuration, no database migration and no new production secret.

## Closure gate

M4 becomes COMPLETE only after this single consolidation/closure PR:

- passes technical/governance CI;
- is fully reviewed under the Human/Owner gate;
- has both Owner attestation checkboxes checked;
- has a current-head `💪` or `okay` Owner review;
- is merged only after a separate explicit Human merge instruction.

After that merge, M5 Observability/Telemetry/Audit becomes the next authorized phase.
