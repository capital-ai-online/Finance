# CAPITAL-AI Systemadmin Agent Roadmap

Status: PROPOSED / OWNER REVIEW REQUIRED
Date: 2026-08-12
Baseline: `main@4ef148b86773e5756641417ec7b6a7cc9ae0b188`
Authority: ESS-0021, ADR-0065, ESS-0019, ADR-0058, ADR-0059

## Goal

Introduce a privileged Systemadmin Roadmap Executor that can autonomously implement larger Owner-approved Roadmap work packages through a Pull Request while preserving least privilege, auditability, Human final review and Human merge authority.

## SA0 — Governance package

**Status: IN REVIEW**

Deliverables:

- ESS-0021 Systemadmin Roadmap Executor;
- ADR-0065 Roadmap Execution Mandate;
- Systemadmin execution policy;
- machine-readable REM schema;
- AGENTS.md exception to ADR-0039 for a valid REM;
- Autonomous Agent Concept Gate integration;
- canonical Roadmap/traceability references.

Exit gate:

- Human/Owner reviews and merges the governance package;
- no Systemadmin profile is considered enabled merely by drafting the package.

## SA1 — REM validator / Control-Plane enforcement

**Status: BLOCKED BY SA0**

Implement a provider-neutral validator that consumes a signed/approved REM and evaluates:

- mandate status/expiry;
- owner/subject/repository/base binding;
- Roadmap and authority references;
- capability allowlist;
- path/target allowlist;
- maximum risk;
- mutation class;
- reserved Human-only actions;
- kill switch;
- concurrent-scope conflicts;
- audit correlation.

Required negative tests:

- expired/revoked mandate DENY;
- wrong agent/repository/target/path DENY;
- missing capability DENY;
- risk above mandate DENY;
- self-expansion DENY;
- MERGE DENY;
- reserved Owner action DENY;
- kill switch DENY.

## SA2 — Chat execution profile

**Status: BLOCKED BY SA1**

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

The first practical use should be a repository-only implementation package after SA0–SA3 are verified. Production mutation remains blocked until both technical REM enforcement and strong Owner approval assurance exist.
