# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@8de5a538ae9d2f0afc7b2e505ddda427ceb77780` (PR #218 merge)
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

Canonical SA3A control:

`SA1/SA2 ALLOW → durable M5 authorization event → auditReference → audit-bound permit → action → second append-only outcome event`

No new Supabase schema or external platform mutation was required.

## SA3B — Execution-host binding

**Status: IMPLEMENTED ON `agent/sa3b-execution-host-binding` / PR+CI+POST-MERGE HOST PROBE PENDING**

ADR-0067 selects **GitHub Actions + GitHub OIDC + CAPITAL-AI audit broker** as the first enforceable host.

Canonical chain:

`OWNER EXECUTION ISSUE → TRUSTED MAIN WORKFLOW → STRICT REQUEST VALIDATION → GITHUB ACTIONS OIDC → CAPITAL-AI BROKER → SA1/SA2/SA3A → M5 auditReference → EXACT SIDE EFFECT → M5 OUTCOME`

### Why this host

Repository TypeScript cannot intercept direct ChatGPT→GitHub connector writes. The direct connector therefore remains invalid as the autonomous mutation path.

The GitHub Actions host provides a concrete pre-action enforcement point with bounded `GITHUB_TOKEN` permissions and short-lived OIDC workload identity. No reusable GitHub-to-CAPITAL-AI shared secret is introduced.

### Initial SA3B probe capability

Before SA4, the host is deliberately restricted to:

`BRANCH_PROBE → BRANCH`

The one-time mandate `.ai/mandates/REM-SA3B-PROBE-001.json` can create one empty `agent/sa3b-host-probe-*` branch from the exact current `main` SHA only after durable authorization evidence exists.

The probe cannot:

- commit files;
- open a PR;
- request CI;
- deploy;
- merge;
- perform production mutation;
- execute arbitrary shell supplied by the issue.

The probe is security-control verification, not the SA4 product work-package pilot.

### SA3B implementation artifacts

- `docs/adr/ADR-0067-systemadmin-github-actions-execution-host.md`;
- `.github/workflows/systemadmin-roadmap-executor.yml`;
- `.ai/mandates/REM-SA3B-PROBE-001.json`;
- `server/systemadmin/githubActionsOidc.ts`;
- `server/systemadmin/systemadminExecutionBrokerRouter.ts`;
- `scripts/systemadmin/validateExecutionIssue.mjs`;
- OIDC / ingress / workflow negative tests;
- route-composition contract;
- SA3 audit self-authority extension.

### SA3B fail-closed invariants

- exact Owner issue author required;
- JSON-only allowlisted request schema;
- exact probe REM/work package/branch namespace;
- current `main` SHA binding;
- GitHub OIDC signature + issuer + audience + repository/immutable IDs + actor + event + ref + workflow binding;
- no branch before broker `ALLOW` + valid append-only audit reference + bound BRANCH permit;
- branch failure records terminal `ERROR` evidence;
- outcome persistence failure after branch creation triggers immediate probe-branch rollback;
- direct ChatGPT connector mutation is not counted as SA3B enforcement;
- SA3B execution-host/control-plane paths are protected by the SA3 audit layer.

### SA3B exit gate

SA3B is **not** complete merely because its PR merges.

`COMPLETE / VERIFIED PASS` requires:

1. final reviewed SA3B head passes repository CI and workflow-security validation;
2. Human merge;
3. SA3B implementation branch deletion;
4. `main` deployment exposes the OIDC broker;
5. Owner creates the exact `BRANCH_PROBE` request;
6. GitHub Actions obtains OIDC identity and receives durable SA3 authorization before branch creation;
7. a valid probe branch is created from exact current `main`;
8. Authorization + SUCCESS Outcome references are durably correlated;
9. a negative no/invalid-permit path proves no branch side effect;
10. probe branch is deleted after evidence capture;
11. roadmap/traceability/evidence are synchronized.

## SA4 — First bounded autonomous work-package REM

**Status: BLOCKED BY SA3B VERIFIED PASS**

Only after the real host probe passes may the host be extended for one bounded non-production Roadmap work package.

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

Complete the SA3B PR and final-head CI. After Human merge and main deployment, execute the one-time real BRANCH_PROBE. **SA4 remains blocked until that post-merge proof and cleanup are VERIFIED PASS.**
