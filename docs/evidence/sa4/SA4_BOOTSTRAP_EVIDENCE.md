# SA4 Bootstrap Evidence

Status: OWNER-DIRECTED BOOTSTRAP / LIVE PILOT NOT YET EXECUTED
Date: 2026-08-12
Base: `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e`
Authority: ADR-0068, ESS-0021, ADR-0065, ADR-0067

## Why this bootstrap exists

SA3B has now proven a real positive and negative execution-host path. SA4 is the first increase in autonomous mutation authority from branch-only proof to a bounded repository work package containing branch, commit and draft PR creation.

The bootstrap itself is Owner-directed normal repository maintenance because it modifies the Systemadmin trust root. It is not evidence that the Systemadmin agent may modify its own authority.

## Preflight evidence

### PR #222 remediation

- merged: yes;
- final head `1bb6fa3a3bb30d1671d14ba012462070ccd7293d`;
- merge `91963f59b74c8c3c3c0b33c6a23237a01ac0128e`;
- CI #951 PASS;
- corrective branch deleted;
- corrected runtime deployed on Render as `dep-d9u1v5942hec739bsc6g` and `live`.

### Supabase privileged path

Positive SA3B live probe #223 proves the Owner-managed Render `finance-secrets.env` is functional for privileged M5 persistence. No secret value was read into this evidence.

Real authorization row:

`supabase:agent_audit_events:194f1198-492c-4d4f-b1e4-0c13a5d99d20`

Real terminal outcome row:

`supabase:agent_audit_events:5ab9eefe-f472-4396-a7e7-2a3ceb029e34`

Both rows were independently verified read-only in `public.agent_audit_events`.

### Negative execution evidence

- Issue #221 proved audit persistence failure → no permit → no branch.
- Issue #224 / run `31574221718` proved stale base → deny before OIDC/broker → no branch.

### Open PR overlap

At SA4 bootstrap start:

- PR #225 changes DevelopmentChain documentation;
- PR #193 changes cost/monetization documentation;
- exact SA4 pilot path `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md` is in neither open PR.

## Remaining SA3B lifecycle cleanup

The successful positive probe branch:

`agent/sa3b-host-probe-20260812b`

still exists and must be deleted after evidence capture.

The connected GitHub connector exposes no ref-delete mutation, so the bootstrap does not falsely claim completion. The new SA4 trusted runner independently checks for this branch and terminates before OIDC if it still exists.

## SA4 bootstrap artifacts

### Architecture and mandate

- `docs/adr/ADR-0068-first-bounded-autonomous-work-package.md`
- `.ai/mandates/REM-SA4-PILOT-001.json`

### Execution host

- `.github/workflows/systemadmin-sa4-pilot.yml`
- `scripts/systemadmin/validateSa4PilotIssue.mjs`
- `scripts/systemadmin/runSa4Pilot.mjs`

### Control-plane hardening

- `src/platform/Security/roadmapExecutionMandate.ts`
- `server/agentAudit/systemadminAuditedExecution.ts`
- `server/systemadmin/githubActionsOidc.ts`
- `server/systemadmin/systemadminExecutionBrokerRouter.ts`

### Tests

- `tests/unit/systemadminSa4PilotIssue.test.ts`
- `tests/unit/systemadminSa4Contracts.test.ts`
- updated `tests/unit/githubActionsOidc.test.ts`
- updated `tests/unit/systemadminExecutionBroker.test.ts`

### Governance synchronization

- `docs/evidence/sa3b/SA3B_EXECUTION_HOST_BINDING_EVIDENCE.md`
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`
- `docs/traceability/SYSTEMADMIN_AGENT_TRACEABILITY_MATRIX.md`

## Authority increase

Before SA4:

`BRANCH` was the only real host side effect proven by SA3B.

SA4 pilot target:

`BRANCH → COMMIT → Draft PR`

The increase is constrained by:

- exact Owner issue identity;
- strict six-field JSON ingress;
- exact current-main SHA;
- exact stage-specific OIDC workflow ref;
- workflow↔mandate binding in broker;
- SA1 REM policy;
- SA2 sequence preconditions;
- SA3 durable authorization-before-side-effect;
- one exact allowed evidence path;
- MEDIUM risk ceiling;
- open-PR overlap inventory;
- one open SA4 PR maximum;
- deterministic file content generated only by trusted host code;
- post-commit digest validation;
- separate authorization/outcome pair for BRANCH, COMMIT and PR;
- Human-only final CI authorization and merge.

## Explicit non-authority

The SA4 REM does not grant:

- CI_REQUEST;
- merge;
- deploy;
- production mutation;
- IAM role changes;
- MFA/break-glass changes;
- secret disclosure/rotation;
- billing/entitlement changes;
- DNS/TLS;
- repository protection weakening;
- control-plane self-modification.

## Bootstrap validation required

The bootstrap PR is Check Class **R + Workflow Security** because it modifies Runtime/Security/Audit control-plane code and a write-capable GitHub workflow.

Final reviewed head must pass:

- repository integrity;
- workflow security validator;
- Node 24.18.0;
- production dependency audit;
- TypeScript;
- complete unit/contract suite including SA4 negative tests;
- production build;
- post-build CSP;
- deployment readiness;
- Docker hardening/image where selected by the existing scope resolver.

No redundant expensive rerun should be triggered before final Owner review.

## Rollback

Before live pilot activation, bootstrap rollback is repository-only through a protected revert PR.

After a successful Human merge of this bootstrap, Render deployment is required because OIDC/broker runtime changed. No Supabase schema, Stripe, IONOS or other production configuration mutation is part of this bootstrap PR.

## Live-pilot activation

The first real `[SA4-PILOT]` Issue must not be opened until:

1. bootstrap PR is Human-merged;
2. bootstrap branch is deleted;
3. `agent/sa3b-host-probe-20260812b` is deleted;
4. bootstrap merge is deployed and healthy;
5. current `main` SHA is re-resolved;
6. exact target path remains free of concurrent-writer overlap.

Only the resulting real audit rows, commit and draft PR can qualify SA4 as `VERIFIED PASS`.