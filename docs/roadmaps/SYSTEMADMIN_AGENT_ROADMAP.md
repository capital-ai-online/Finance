# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@d8ccc3c5e136d51ae36b57b103119b25f4a42b8b` (PR #215 merge)
Authority: ESS-0021, ADR-0065, ESS-0019, ADR-0058, ADR-0059

## Goal

Introduce a privileged Systemadmin Roadmap Executor that can autonomously implement larger Owner-approved Roadmap work packages through a Pull Request while preserving least privilege, auditability, Human final review and Human merge authority.

## SA0 — Governance package

**Status: COMPLETE — PR #214 MERGED**

Verified merge baseline:

- PR #214 merged;
- merge commit `d342654715b4f1aef23e9fbaf3230b54f327e0a2`;
- ESS-0021, ADR-0065, REM schema, Systemadmin Policy, AGENTS exception and Concept Gate are on `main`;
- former SA0 work branch is no longer present;
- SA0 authorized SA1 implementation only.

## SA1 — REM validator / Control-Plane enforcement

**Status: COMPLETE / VERIFIED PASS — PR #215 MERGED**

Verified merge baseline:

- PR #215 merged;
- merge commit `d8ccc3c5e136d51ae36b57b103119b25f4a42b8b`;
- final PR head `b3aacd0c9ca6dfdfb981c4f563f0c840f93dad2e`;
- CI-Prüfung #909: PASS;
- Governance-Prüfung #634: PASS;
- former SA1 branch is no longer present;
- no Supabase/Stripe/Render/deployment/production mutation occurred.

Primary implementation:

- `src/platform/Security/roadmapExecutionMandate.ts`;
- `src/platform/Compliance/PolicyGate.ts`;
- `tests/unit/roadmapExecutionMandate.test.ts`;
- `docs/evidence/sa1/SA1_REM_VALIDATOR_EVIDENCE.md`.

SA1 verifies REM structure, exact Owner/agent/repository/base binding, Roadmap scope, capabilities, paths, targets, risk, mutation class, validity/expiry, kill-switch availability, open-PR conflict, PR limit and CI budget. It composes with the existing M4 Agent IAM.

SA1 can authorize only:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

Still technically denied:

- `MERGE`;
- `DEPLOY_REQUEST`;
- `PRODUCTION_MUTATION`;
- CRITICAL execution;
- reserved Human/Owner mutation classes;
- Systemadmin self-authority/control-plane mutation covered by SA1.

### CI regression discovered after PR #215

The separate `Google-Marketing-Schutzprüfung` run #155 failed while SA1 CI #909 and Governance #634 passed. The same failure reproduced on initial SA2 head as run #157.

Diagnosis proved two CI defects:

1. the protected Google Marketing workflow watched the over-broad path `src/platform/Security/**`, causing unrelated Systemadmin security work to invoke it;
2. central CI consolidation had removed the dedicated post-build execution of `tests/unit/securityResponse.production.test.ts`, although that test intentionally skips when `dist/index.html` does not yet exist.

PR #216 therefore includes a **security-preserving CI remediation** instead of ignoring the failed guard:

- Owner attestations are evaluated against the body snapshot of the exact `edited` event to prevent checkbox race/double-build authorization;
- `securityResponse.production.test.ts` is restored after `npm run build` and before `predeploy:check`;
- the Google Marketing workflow monitors exact security dependencies plus `ci.yml` and `package.json`;
- its lightweight static check validates invariant-script wiring and the ordered central evidence chain `build → production CSP test → predeploy`.

This remediation is pending current-head review and GitHub CI and is not considered VERIFIED PASS until those checks succeed.

## SA2 — Chat execution profile

**Status: IMPLEMENTED ON BRANCH / PR+CI PENDING**

Implementation branch:

`agent/sa2-systemadmin-chat-execution-profile`

Primary artifacts:

- `src/platform/Security/systemadminExecutionProfile.ts`;
- `.ai/contracts/systemadmin-roadmap-execution-profile.json`;
- `tests/unit/systemadminExecutionProfile.test.ts`;
- `docs/runbooks/SYSTEMADMIN_CHAT_EXECUTION_PROFILE.md`;
- `docs/evidence/sa2/SA2_CHAT_EXECUTION_PROFILE_EVIDENCE.md`;
- `.github/workflows/ci.yml` Owner-gate race fix + restored post-build CSP evidence;
- `.github/workflows/google-marketing-protected-change.yml` protected-scope/evidence hardening.

### SA2 authority chain

`OWNER_APPROVED REM → SA2 CHAT PROFILE → SA1 REM VALIDATOR → M4 AGENT IAM → ACTION ENVELOPE`

The exact ChatGPT app/client id is only an execution-surface constraint. It grants no authority by itself. Provider/model metadata remains non-authoritative.

### SA2 initial delegated policy surface

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

The profile adds mandatory execution-sequence checks:

1. current `main` resolved;
2. current Roadmap work package resolved;
3. SA1 VERIFIED PASS;
4. security/negative-test preflight PASS;
5. open-PR overlap check PASS;
6. D/C/R/M check class resolved;
7. rollback defined;
8. targeted tests defined;
9. fresh `agent/*` branch before commits;
10. targeted validation before commit;
11. implementation complete + current head before PR;
12. open PR + current head before CI request;
13. stop mutating once final Human/Owner review has begun.

### SA2 dry-run safety boundary

SA2 intentionally does **not** create unaudited standing mutation authority.

- `DRY_RUN`: full initial capability sequence can be policy-evaluated and prepared as an immutable, secret-free action envelope.
- mutating envelopes always carry `liveMutationPermitted = false`.
- `LIVE`: READ/ANALYZE may be allowed when REM/profile allow them; BRANCH/COMMIT/PR/CI_REQUEST are denied until SA3 append-only audit correlation is VERIFIED PASS.

This resolves the sequencing tension between profile enablement and audit: SA2 proves the execution contract; SA3 enables auditable mutation; SA4 is the first real autonomous work-package pilot.

### SA2 stop conditions

Immediate DENY/STOP on:

- invalid/expired/revoked/out-of-scope REM;
- wrong Owner/agent/client/repository/base;
- path/target/capability mismatch;
- incomplete security preflight;
- credential exposure;
- prompt/tool/retrieval scope-elevation attempt;
- unexpected production mutation requirement;
- reserved Human/Owner action requirement;
- concurrent writer conflict;
- CI budget/duplicate-head violation;
- final Human/Owner review already started;
- kill switch/revocation.

### SA2 exit gate

SA2 becomes complete only when:

1. current-head Human/Owner review is complete;
2. required repository CI for final reviewed head passes;
3. Google Marketing protected-change guard passes for the final head when triggered;
4. restored post-build production CSP test passes;
5. SA2 PR is Human-merged into `main`;
6. SA2 branch is deleted;
7. mutating LIVE mode remains disabled;
8. no external production mutation occurred;
9. SA3 becomes the next active stage.

## SA3 — Audit / Evidence verification

**Status: BLOCKED BY SA2 VERIFIED PASS**

Connect the Systemadmin action path to the existing M5 append-only audit mechanism and prove:

`mandateId → roadmap item → actor → agent/client/session/request → capability → target → policy decision → branch/commit/PR → result`

Required properties:

- durable append-only authorization + execution-outcome evidence;
- fail-closed when audit persistence is unavailable;
- no secret/raw credential evidence;
- mutation enabled only after audit reference exists;
- SA2 profile self-authority paths added to protected mutation scope before LIVE mutation is enabled.

Exit gate: append-only correlation VERIFIED PASS.

## SA4 — First bounded pilot mandate

**Status: BLOCKED BY SA3**

The Owner creates the first concrete REM for one non-production Roadmap work package.

Recommended pilot constraints:

- repository: `SvenKulessa/Finance`;
- base: `main`;
- one Roadmap work package;
- max one open Systemadmin PR;
- no external production mutation;
- max risk HIGH;
- repository paths explicitly enumerated;
- expiry <= 7 days;
- kill switch enabled;
- one final build-and-test per reviewed head.

Pilot exit:

- autonomous branch/commit/PR creation succeeds under the REM;
- scope and negative tests pass;
- Owner final review/CI succeed;
- Human merge occurs separately;
- merged branch is deleted;
- audit/evidence complete.

## SA5 — Bounded external mutation design

**Status: BLOCKED BY SA4 + M10 STRONG OWNER APPROVAL ASSURANCE**

Only after the repository pilot is verified may CAPITAL-AI consider delegated `PRODUCTION_MUTATION`.

A future production-capable REM must bind exact target and mutation class and prove deterministic preconditions, rollback, postconditions and audit.

The following remain outside delegated authority unless separately redesigned:

- MERGE;
- repository protection weakening;
- Owner/admin IAM elevation;
- Owner MFA/break-glass;
- secret disclosure/unrestricted credential rotation;
- destructive production data;
- live billing money/entitlement changes;
- production resource deletion;
- DNS/TLS/domain ownership;
- security-control disablement;
- self-expansion of mandate.

## Target operating sequence after SA3/SA4 enablement

`OWNER APPROVES REM → SYSTEMADMIN READ/PREFLIGHT → AUDITED BRANCH → IMPLEMENT/VALIDATE/COMMIT → PR → OWNER VIEWED/REVIEW → ONE CI → HUMAN MERGE → BRANCH DELETE → EVIDENCE → NEXT WORK PACKAGE`

## Branch lifecycle

Every work package gets a fresh branch. After successful merge into Finance the branch is deleted. Closed/superseded branches are also deleted after Evidence retention. No merged branch is reused.

## Relationship to current DevelopmentChain

The Systemadmin roadmap is cross-cutting. It does not bypass M5A–M10 sequencing or mark blocked phases as complete. It changes **who may execute an already authorized Roadmap work package**, not the acceptance criteria of that work package.

SA2 performs no Supabase, Stripe, Render, billing, deployment or production mutation. SA3 remains blocked until SA2 reaches `VERIFIED PASS`.
