# AI Agent M0–M10 Implementation Roadmap

> **Lifecycle:** HISTORICAL SNAPSHOT / NON-AUTHORIZING. The filename is retained only for stable historical references. The former `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` and standalone DevelopmentChain execution surfaces are retired/removed.
>
> **Current-authority note (2026-09-22):** Repository execution resolves exclusively through `/AGENTS.md@CURRENT_MAIN`. The historical M0–M10/M10, policy, handoff and approval rules below are preserved as provenance and MUST NOT select work, grant capability, authorize CI/merge/deploy, or override current Project/PVC/Security/Compliance/domain constraints. Productive M10 is `RETIRED / OFF`.

Status: HISTORICAL SNAPSHOT / NON-AUTHORIZING
Status date: 2026-08-12
Baseline: `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e` (PR #222 merge)
Platform version: `0.6.0`

## Global execution rule

Every required DEVELOPMENT Chain mutation follows:

```text
ROADMAP / ESS / ADR / RUNBOOK
→ HUMAN APPROVAL
→ PRE-MUTATION VERIFICATION
→ MUTATION
→ POST-MUTATION VERIFICATION
→ EVIDENCE
→ ROADMAP / TRACEABILITY UPDATE
→ NEXT PHASE
```

No later phase starts while a required predecessor mutation/test is missing, failed, inconclusive or undocumented.

Cross-cutting authorities:

- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md`
- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `.ai/contracts/development-chain-mutation-handoff.schema.json`
- `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md`

A Mutation Handoff is non-authorizing. Human/Owner approval, REM/IAM/reserved-action policy, verified Execution Host and durable audit remain separate gates.

## Current Systemadmin execution-host state

PR #220 merged the SA3B GitHub-Actions/OIDC Execution-Host repository implementation.

The first real post-merge host probe reached the broker and proved fail-closed: strict request/REM/OIDC checks passed, durable M5 persistence failed, and the requested branch side effect was skipped.

Diagnosis found:

- application writer↔production M5 schema vocabulary drift;
- separate privileged Supabase backend credential failure (`Unregistered API key`).

PR #222 corrected the writer↔schema contract and regression coverage and merged at `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e`.

SA3B is still **VERIFICATION PENDING** until a valid Owner-controlled privileged Supabase backend credential is available, a real positive `BRANCH_PROBE` proves Authorization Evidence before the side effect and SUCCESS Outcome Evidence after it, a no-permit/stale negative probe produces no side effect, and the probe branch is deleted.

Until then, DEVELOPMENT Chain does not classify that host as a generally verified autonomous mutation executor.

## Human/Owner CI rule

### Transitional until M10 VERIFIED PASS

```text
FILES CHANGED → VIEWED → CURRENT-HEAD REVIEW (💪/okay) → OWNER CHECKBOXES LAST → ONE build-and-test
```

New commits invalidate current-head review evidence. CI does not authorize merge.

### M10 target after controlled cutover

```text
FILES CHANGED / VIEWED
→ exact PR-state resolution
→ WebAuthn/passkey Owner assertion
→ immutable approval evidence
→ exactly one CI consumption
→ build-and-test
→ Human merge
```

After cutover, emoji/text reviews and Owner checkboxes no longer authorize CI.

## Repository lifecycle

Every work item uses a fresh branch from then-current `main`. After successful Human merge, the Finance remote branch is deleted and never reused. Ephemeral clones/worktrees created only for the work item are removed after required Evidence is secured.

## Phase summary

| Phase | Status | Key gate |
|---|---|---|
| M0 Evidence Baseline | COMPLETE | preserve read-only evidence |
| M1 Git Guardrails | COMPLETE | Human merge + protected main |
| M2/M2G Architecture + Freeze | COMPLETE | sequential implementation only |
| M3 CI Hardening | COMPLETE | one bounded expensive CI path |
| M4 Agent IAM | COMPLETE | negative IAM / no autonomous MERGE |
| M5 Audit | **VERIFIED PASS** | PR #222 corrected mapping; real privileged audit insert confirmed 2026-08-14, see `docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md` |
| M5A Native MFA/AAL2 | **IN PROGRESS** | code/CI then separate Owner production approval and native AAL2 verification |
| M6 Supply Chain | **BLOCKED BY M5A** | source→SBOM→artifact→provenance/attestation verified |
| M7 Deployment Identity | **BLOCKED BY M6** | exact approved platform mutation + postverify/rollback |
| M8 Agent Cutover | **BLOCKED BY M7** | provider-neutral policy equivalence + no bypass |
| M9 Assurance | **BLOCKED BY M8** | injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills |
| M10 Passkey-only Owner CI Auth | **BLOCKED BY M9** | exact-state WebAuthn + shadow/recovery/replay + legacy cleanup |

## M5A — Supabase Native TOTP MFA / AAL2 Hardening

Authorities:

- ESS-0020;
- ADR-0064;
- ADR-0003.5;
- `docs/evidence/m5a/M5A_SUPABASE_TOTP_AAL2_BASELINE.md`;
- `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`.

Recorded baseline proves the historical CAPITAL-AI custom TOTP mechanism is distinct from Supabase Native MFA/AAL2. Native factor/AAL2 enforcement still requires implementation and controlled Owner enrollment.

Required sequence:

1. fresh implementation branch from current `main`;
2. Native TOTP `enroll → challenge → verify`;
3. centralized server AAL2 verification;
4. privileged AAL1 and Auth/factor lookup errors fail closed;
5. purpose-bound app step-up remains defense-in-depth only;
6. recovery/factor reset redesign;
7. positive/negative tests;
8. repository CI `VERIFIED PASS`;
9. read-only production precheck;
10. separate explicit Human/Owner mutation approval;
11. Owner native factor enrollment one identity at a time;
12. AAL2/recovery/advisor verification;
13. Evidence + Roadmap synchronization.

Mutation classification:

- repository code: `REQUIRED / PLANNED`;
- Owner Native TOTP enrollment: `REQUIRED / NOT YET AUTHORIZED` at baseline;
- Supabase Auth project config: `CONDITIONAL` only if exact need is proven;
- new Native MFA Postgres DDL: `NOT REQUIRED`;
- legacy custom-TOTP cleanup: `DEFERRED / SEPARATE APPROVAL`;
- Stripe/Render: `NOT REQUIRED` for M5A.

M6 remains blocked until M5A `VERIFIED PASS`.

## M6 — Supply Chain Provenance & Attestation

**BLOCKED — DOCUMENTATION READY.**

Authority/runbook:

- ADR-0060;
- `docs/architecture/ai-agent/AI_AGENT_SUPPLY_CHAIN_MODEL.md`;
- `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`.

Required chain:

```text
source SHA → lockfile digest → SBOM → tests/build → artifact digest → provenance → attestation → deployment/runtime identity
```

External platform mutation is `NOT REQUIRED` by default for M6.

## M7 — Deployment Identity + Platform Mutation Gate

**BLOCKED — DOCUMENTATION READY.**

Authority/runbook:

- ADR-0061;
- `docs/architecture/ai-agent/AI_AGENT_DEPLOYMENT_IDENTITY.md`;
- `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`.

Every external mutation requires exact target, precheck, separate Owner mutation approval, non-authorizing Handoff, audited authorized execution, post-verification and rollback.

Stripe/Supabase are included only when explicitly named by dedicated Authority. DNS/TLS/IONOS remains Human-reserved absent a later stronger ADR.

## M8 — Provider-neutral Agent Cutover

**BLOCKED — DOCUMENTATION READY.**

Authority/runbook:

- ADR-0062;
- ESS-0019;
- Provider Profile Contract;
- `docs/runbooks/M8_AGENT_CUTOVER.md`.

ChatGPT, Claude, Google AI Studio and future transports obey the same semantic capability policy. Read-only research profiles fail mutation tests. Provider/model identity cannot elevate authority.

## M9 — Assurance / Incident / Break-Glass

**BLOCKED — DOCUMENTATION READY.**

Authority/runbook:

- ADR-0063;
- `docs/architecture/ai-agent/AI_AGENT_INCIDENT_RESPONSE.md`;
- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`.

Mandatory assurance includes authorization bypass, prompt/tool injection, replay/idempotency, secret/data exfiltration, audit outage/completeness, kill switch, break-glass, rollback/recovery and independent Evidence review.

## M10 — Passkey-only Human/Owner PR Authorization

**BLOCKED — COMPLETE PLANNING PACKAGE PREPARED.**

Authorities:

- ADR-0066;
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`;
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`;
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`.

Every approval binds Owner, Finance repository, PR, exact base/head SHA, canonical changed-file-set hash, diff/review digest, `AUTHORIZE_PR_CI`, challenge freshness and consumption state.

Human file review and Human-only merge remain mandatory.

## Mutation Executor integration

The `capital-ai-systemadmin-roadmap-executor` becomes a bounded DEVELOPMENT Chain mutation executor only after its actual execution-host exit gate is independently `VERIFIED PASS`.

Handoff artifacts:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`;
- `.ai/contracts/development-chain-mutation-handoff.schema.json`.

A Handoff cannot expand REM/capabilities, bypass Human approval or authorize `MERGE`.

## Mandatory per-step synchronization

Every completed work item updates:

1. `docs/architecture/ROADMAP.md`;
2. `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`;
3. this legacy implementation roadmap;
4. `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`;
5. `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`;
6. affected ADR/ESS;
7. Evidence and mutation state;
8. branch deletion state;
9. explicit next gate.

## Current next gate

**M5A repository remediation is the next executable DEVELOPMENT Chain step.** Parallel dazu muss die PR-#222-Korrektur produktiv verifiziert und SA3B positiv/negativ abgeschlossen werden, bevor der autonome Mutation Executor für spätere externe Mutationen als `VERIFIED PASS` gilt. M6–M10 planning completeness does not authorize their implementation or mutation.