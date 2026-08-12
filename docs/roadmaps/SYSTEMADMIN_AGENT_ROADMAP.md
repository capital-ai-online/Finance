# CAPITAL-AI Systemadmin Agent Roadmap

Status: IMPLEMENTATION PHASE
Date: 2026-08-12
Baseline: `main@d342654715b4f1aef23e9fbaf3230b54f327e0a2` (PR #214 merge)
Authority: ESS-0021, ADR-0065, ESS-0019, ADR-0058, ADR-0059

## Goal

Introduce a privileged Systemadmin Roadmap Executor that can autonomously implement larger Owner-approved Roadmap work packages through a Pull Request while preserving least privilege, auditability, Human final review and Human merge authority.

## SA0 — Governance package

**Status: COMPLETE — PR #214 MERGED**

Verified merge baseline:

- PR #214 merged;
- merge commit `d342654715b4f1aef23e9fbaf3230b54f327e0a2`;
- ESS-0021, ADR-0065, REM schema, Systemadmin Policy, AGENTS exception and Concept Gate are on `main`;
- the former SA0 work branch is no longer present;
- SA0 authorizes SA1 implementation only and does not itself enable autonomous execution.

## SA1 — REM validator / Control-Plane enforcement

**Status: IMPLEMENTED — PR/CI VALIDATION PENDING**

Implementation branch:

`agent/sa1-rem-validator-control-plane`

Primary implementation:

- `src/platform/Security/roadmapExecutionMandate.ts`;
- `src/platform/Compliance/PolicyGate.ts`;
- `tests/unit/roadmapExecutionMandate.test.ts`;
- `docs/evidence/sa1/SA1_REM_VALIDATOR_EVIDENCE.md`.

The validator is provider-neutral and evaluates:

- strict REM structure and unknown-field rejection;
- `OWNER_APPROVED` status and explicit approval evidence;
- validity window / expiry;
- exact Owner, Systemadmin agent, repository and base binding;
- Roadmap item and authority references;
- exact capability allowlist;
- exact target allowlist;
- exact-path or `prefix/**` repository path allowlist;
- path traversal / unsafe wildcard rejection;
- effective risk against mandate and SA1 ceiling;
- mutation class;
- complete reserved Human-only mutation set;
- self-modification of the Systemadmin trust root;
- exact open-PR changed-file conflicts;
- maximum number of open Systemadmin PRs;
- CI budget / duplicate unchanged-head CI requests;
- kill-switch availability;
- composition with the existing M4 Agent IAM.

### SA1 hard boundary

SA1 may authorize only:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

The following remain technically DENY even if a malicious or over-broad REM tries to include them:

- `MERGE`;
- `DEPLOY_REQUEST`;
- `PRODUCTION_MUTATION`;
- `CRITICAL` execution;
- any reserved Human/Owner mutation class;
- changes to the Systemadmin agent's own authority/control-plane files.

### SA1 validation

Pre-PR isolated checks completed:

- TypeScript compile of `agentIam.ts + roadmapExecutionMandate.ts`: PASS;
- functional security harness: PASS;
- negative checks covered expiry, identity mismatch, MERGE, deploy/production, traversal, out-of-scope path, self-authority mutation, concurrent-writer overlap, PR limit, CI budget/redundant CI and reserved mutation classes.

The isolated validation environment used Node 22 and TypeScript 5.8.x; repository-required Node 24/full dependency graph remains for normal GitHub CI. The PR is not SA1 `VERIFIED PASS` until repository CI passes on the final reviewed head.

### SA1 exit gate

SA1 becomes complete only when:

1. current-head Human/Owner review is complete;
2. required Class C/R scope checks and `build-and-test` pass;
3. the SA1 PR is Human-merged into `main`;
4. the merged work branch is deleted;
5. no external production mutation occurred.

## SA2 — Chat execution profile

**Status: BLOCKED BY SA1 VERIFIED PASS**

Enable the logical agent id `capital-ai-systemadmin-roadmap-executor` in supported execution clients.

Initial delegated capability set:

`READ, ANALYZE, PLAN, BRANCH, COMMIT, PR, CI_REQUEST`

The client/tool host retains credentials. The model receives no raw reusable secrets.

Required behavior:

1. resolve current `main` and Roadmap;
2. validate REM;
3. perform security/overlap/check-class preflight;
4. create fresh work branch;
5. implement/test/commit autonomously;
6. create/update PR;
7. remediate technical failures inside scope;
8. stop before Human review/merge.

## SA3 — Audit / Evidence verification

**Status: BLOCKED BY SA2**

Prove M5 audit correlation for Systemadmin mutations:

`mandateId → roadmap item → actor → agent/client/session/request → capability → target → decision → branch/commit/PR → result`

No secrets/full sensitive prompts/raw private bodies may enter audit evidence.

Exit gate: append-only evidence VERIFIED PASS.

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

- autonomous branch/commit/PR creation succeeds;
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

## Operating sequence after enablement

`OWNER APPROVES REM → SYSTEMADMIN READ/PREFLIGHT → BRANCH → IMPLEMENT/TEST/COMMIT → PR → OWNER VIEWED/REVIEW → ONE CI → HUMAN MERGE → BRANCH DELETE → EVIDENCE → NEXT WORK PACKAGE`

## Branch lifecycle

Every work package gets a fresh branch. After successful merge into Finance the branch is deleted. Closed/superseded branches are also deleted after Evidence retention. No merged branch is reused.

## Relationship to current DevelopmentChain

The Systemadmin roadmap is cross-cutting. It does not bypass M5A–M10 sequencing or mark blocked phases as complete. It changes **who may execute an already authorized Roadmap work package**, not the acceptance criteria of that work package.

SA1 performs no Supabase, Stripe, Render, billing, deployment or other production mutation. SA2 remains blocked until SA1 reaches `VERIFIED PASS`.
