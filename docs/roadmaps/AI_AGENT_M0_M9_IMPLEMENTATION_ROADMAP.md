# AI Agent M0–M10 Implementation Roadmap

> Legacy filename retained for stable references. Canonical operational phase index: `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`.

Status: IMPLEMENTATION PHASE
Status date: 2026-08-12
Baseline: `main@3b6bba0ec5c156c7bc1c68115284555f7560c2bf` (PR #231 merge)
Production deploy: `dep-d9u3ifbm8hqs73eedgq0` — `live` — same commit
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

A Mutation Handoff is non-authorizing. Human/Owner approval, REM/IAM/reserved-action policy, verified execution-host capability and durable audit remain separate gates.

## Current Systemadmin execution-host state

### SA3B — COMPLETE / VERIFIED PASS

The real host evidence covers audit-outage fail-closed, positive durable authorization→BRANCH→SUCCESS outcome, stale-base deny and final probe-branch deletion.

### SA4 — COMPLETE / VERIFIED PASS

PR #226 bootstrapped the bounded SA4 work-package host. Owner Issue #228 / Workflow run `31579519025` executed the first real autonomous pilot and produced a fresh branch, deterministic commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d`, Draft PR #229 and separate durable authorization/outcome references for BRANCH, COMMIT and PR.

Human/Owner review and merge remained separate. PR #229 merged to `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`; main CI #966 passed; pilot branch was deleted. PR #231 subsequently synchronized the Systemadmin roadmap/traceability. Current repository/production baseline is `main@3b6bba0ec5c156c7bc1c68115284555f7560c2bf`, Render deploy `dep-d9u3ifbm8hqs73eedgq0` live.

Closure Evidence: `docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

SA4 proves the bounded deterministic repository control chain. It does not automatically authorize or technically prove arbitrary application-code patch execution.

## Human/Owner CI rule

Until M10 `VERIFIED PASS`:

```text
FILES CHANGED
→ VIEWED
→ CURRENT-HEAD REVIEW (💪/okay)
→ OWNER CHECKBOXES LAST
→ ONE build-and-test
→ HUMAN MERGE
```

New commits invalidate current-head review evidence. CI does not authorize merge.

After controlled M10 cutover:

```text
FILES CHANGED / VIEWED
→ exact PR-state resolution
→ WebAuthn/passkey Owner assertion
→ immutable approval evidence
→ exactly one CI consumption
→ build-and-test
→ Human merge
```

## Repository lifecycle

Every work item uses a fresh branch from then-current `main`. After successful Human merge, the Finance remote branch is deleted and never reused. Ephemeral clones/worktrees created only for the work item are removed after required Evidence is secured.

## Phase summary

| Phase | Status | Key gate |
|---|---|---|
| M0 Evidence Baseline | **COMPLETE** | preserve read-only evidence |
| M1 Git Guardrails | **COMPLETE** | Human merge + protected main |
| M2/M2G Architecture + Freeze | **COMPLETE** | sequential implementation only |
| M3 CI Hardening | **COMPLETE** | one bounded expensive CI path |
| M4 Agent IAM | **COMPLETE** | negative IAM / no autonomous MERGE |
| M5 Audit | **COMPLETE / VERIFIED PASS** | real permit-before-side-effect, SUCCESS outcome and audit-outage fail-closed proof |
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

1. synchronize/confirm Human/Owner Authority state for ESS-0020 and ADR-0064;
2. choose execution path: normal Human-authorized Development PR path, or autonomous Systemadmin path only with a dedicated M5A REM and technically bounded code/test execution contract;
3. fresh implementation branch from current `main`;
4. Native TOTP `enroll → challenge → verify`;
5. centralized server AAL2 verification;
6. privileged AAL1 and Auth/factor lookup errors fail closed;
7. purpose-bound application step-up remains defense-in-depth only;
8. recovery/factor reset redesign;
9. positive/negative tests;
10. repository CI `VERIFIED PASS`;
11. Human merge and branch deletion;
12. read-only production precheck;
13. separate explicit Human/Owner mutation approval;
14. Owner native factor enrollment one identity at a time;
15. AAL2/recovery/advisor verification;
16. Evidence + Roadmap synchronization.

Mutation classification:

- repository code: `REQUIRED / PLANNED`;
- Owner Native TOTP enrollment: `REQUIRED / NOT YET AUTHORIZED` at baseline;
- Supabase Auth project config: `CONDITIONAL` only if exact need is proven;
- new Native MFA Postgres DDL: `NOT REQUIRED`;
- legacy custom-TOTP cleanup: `DEFERRED / SEPARATE APPROVAL`;
- Stripe/Render: `NOT REQUIRED` for M5A core.

M6 remains blocked until M5A `VERIFIED PASS`.

## M6 — Supply Chain Provenance & Attestation

**BLOCKED — DOCUMENTATION READY.** Authority/runbook: ADR-0060, `docs/architecture/ai-agent/AI_AGENT_SUPPLY_CHAIN_MODEL.md`, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`.

Required chain:

```text
source SHA → lockfile digest → SBOM → tests/build → artifact digest → provenance → attestation → deployment/runtime identity
```

External platform mutation is `NOT REQUIRED` by default for M6.

## M7 — Deployment Identity + Platform Mutation Gate

**BLOCKED — DOCUMENTATION READY.** Authority/runbook: ADR-0061, `docs/architecture/ai-agent/AI_AGENT_DEPLOYMENT_IDENTITY.md`, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`.

Every external mutation requires exact target, precheck, separate Owner mutation approval, non-authorizing Handoff, audited authorized execution, post-verification and rollback.

## M8 — Provider-neutral Agent Cutover

**BLOCKED — DOCUMENTATION READY.** Authority/runbook: ADR-0062, ESS-0019, Provider Profile Contract, `docs/runbooks/M8_AGENT_CUTOVER.md`.

## M9 — Assurance / Incident / Break-Glass

**BLOCKED — DOCUMENTATION READY.** Authority/runbook: ADR-0063, `docs/architecture/ai-agent/AI_AGENT_INCIDENT_RESPONSE.md`, `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`.

## M10 — Passkey-only Human/Owner PR Authorization

**BLOCKED — COMPLETE PLANNING PACKAGE PREPARED.** Authorities: ADR-0066, `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`, `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`.

Human file review and Human-only merge remain mandatory.

## Mutation Executor integration

The `capital-ai-systemadmin-roadmap-executor` has real `VERIFIED PASS` evidence for the exact bounded SA3B/SA4 host path. This does **not** create standing authority for unrelated DevelopmentChain work.

Every new autonomous work package still requires active Owner-approved REM, current-main binding, exact path/target/capability/risk scope, execution-host support for the requested operation, durable authorization/outcome evidence and Human final review/Human-only merge.

Handoff artifacts:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`;
- `.ai/contracts/development-chain-mutation-handoff.schema.json`.

## Mandatory per-step synchronization

Every completed work item updates:

1. `docs/architecture/ROADMAP.md`;
2. `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`;
3. this legacy implementation roadmap;
4. `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`;
5. `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`;
6. affected Systemadmin roadmap/traceability when executor authority/evidence changes;
7. affected ADR/ESS;
8. Evidence and mutation state;
9. branch deletion state;
10. explicit next gate.

## Current next gate

**M5A repository remediation is the next executable DEVELOPMENT Chain phase.** M5 and SA3B/SA4 are closed and no longer block it.

Autonomous Systemadmin code implementation is not authorized by `REM-SA4-PILOT-001`; it requires a dedicated M5A REM plus a technically enforceable code/test execution path. M6–M10 planning completeness does not authorize their implementation or mutation.