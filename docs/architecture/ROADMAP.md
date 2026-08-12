# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-12
Baseline branch: `main`
Baseline commit: `3b6bba0ec5c156c7bc1c68115284555f7560c2bf` (PR #231 merge)
Production deploy: `dep-d9u3ifbm8hqs73eedgq0` — `live` — same commit
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Historical detail remains in ADR/evidence documents.
Operational roadmap: `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`.

## Mandatory maintenance rule

Every merged DevelopmentChain step MUST update this file with the new `main` SHA, affected phase status, mutation/test state, next gate and evidence pointer. A roadmap-changing PR is incomplete without this synchronization.

Documentation readiness and execution authorization are distinct states. A prepared Runbook/ESS/Threat Model does not unblock a phase whose predecessor gate is incomplete.

## DevelopmentChain execution invariant

```text
READ-ONLY BASELINE
→ ROADMAP / ESS / ADR / RUNBOOK
→ HUMAN/OWNER REVIEW
→ FRESH BRANCH FROM CURRENT MAIN
→ IMPLEMENTATION
→ PR / HUMAN FILE REVIEW / CI
→ HUMAN MERGE
→ BRANCH DELETE
→ OPTIONAL EXTERNAL PRECHECK
→ EXPLICIT HUMAN MUTATION APPROVAL
→ NON-AUTHORIZING MUTATION HANDOFF
→ AUTHORIZED EXECUTION HOST
→ POST-MUTATION VERIFICATION
→ APPEND-ONLY EVIDENCE
→ ROADMAP / TRACEABILITY SYNC
→ NEXT PHASE
```

Authorities:

- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md`
- `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md`

## Branch / Clone lifecycle

Every work item uses a fresh scoped branch from current `main`. Direct work on `main` is prohibited for AI/agent workspaces. After successful Human merge into Finance, the corresponding remote work branch MUST be deleted and MUST NOT be reused. Ephemeral clone/worktree copies created only for the work item are cleaned up after required Evidence is secured.

Repository rollback uses a new revert/rollback branch from current `main`, not a resurrected merged branch.

## Human / Owner gate before expensive CI

Until M10 is `VERIFIED PASS`:

```text
PR OPEN/UPDATE
→ OWNER FILE REVIEW
→ ALL FILES VIEWED
→ CURRENT-HEAD REVIEW (💪/okay)
→ OWNER CHECKBOXES LAST
→ ONE build-and-test
→ HUMAN MERGE
```

New commits invalidate current-head review evidence. Green CI is technical Evidence, never merge authorization.

M10 target after controlled cutover:

```text
OWNER FILE REVIEW / VIEWED
→ EXACT PR STATE RESOLUTION
→ CAPITAL-AI WEBAUTHN/PASSKEY APPROVAL
→ ONE CI CONSUMPTION
→ build-and-test
→ HUMAN MERGE
```

Authorities: ADR-0066, ESS-0022, M10 Threat Model and `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`.

## Roadmap package before privileged autonomous agents

Privileged agent capability is allowed only after an approved Roadmap package derived from current evidence, gap analysis, ESS/ADR, runbook/threat model, traceability, mutation/test gates, rollback/kill switch and Human/Owner approval.

Transport/provider identity is never authority. `MERGE` remains outside autonomous agent capability vocabulary.

## Mutation handoff boundary

Machine-readable work orders:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `.ai/contracts/development-chain-mutation-handoff.schema.json`

A Handoff is non-authorizing. Autonomous mutation additionally requires exact Human/Owner mutation Approval when applicable, REM/IAM/reserved-action enforcement, verified execution-host support for the requested capability and durable M5 authorization/outcome evidence.

## Current verified Systemadmin state

### SA3B — COMPLETE / VERIFIED PASS

Real evidence now proves:

- audit persistence outage → no permit → no branch (Issue #221);
- positive OIDC + durable authorization → BRANCH → durable SUCCESS outcome (Issue #223);
- stale-base → DENY before side effect (Issue #224);
- positive probe branch deleted after evidence capture.

The M5 writer/schema correction from PR #222 is therefore production-verified through a real privileged audit insert/outcome path.

### SA4 — COMPLETE / VERIFIED PASS

PR #226 bootstrapped the bounded SA4 host. Owner Issue #228 / Workflow `31579519025` then exercised the real autonomous pilot:

`BRANCH → COMMIT → Draft PR`

The host generated exact commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d` and PR #229 with separate durable authorization/outcome evidence for each capability. Human/Owner review and merge remained separate. PR #229 merged to `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`; main CI #966 passed; the pilot branch was deleted. The closure remains recorded in `docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

PR #230 and PR #231 subsequently advanced `main` without changing the SA4 execution proof. Current production is now `main@3b6bba0ec5c156c7bc1c68115284555f7560c2bf` on Render deploy `dep-d9u3ifbm8hqs73eedgq0`.

SA4 proves the bounded control chain, not an arbitrary application-code patch executor. New code-producing Systemadmin work packages require their own exact REM and technical execution-path enforcement.

## Platform mutation schedule

| Platform | Roadmap point | Allowed scope | Gate before next phase |
|---|---|---|---|
| Supabase | M5 Audit | append-only audit persistence + application writer | **VERIFIED PASS**; preserve |
| Supabase Auth | M5A | Native TOTP/AAL2, recovery, exact conditional Auth config only | code+CI → precheck → explicit Owner approval → factor/AAL2/recovery/advisor verification |
| Render | M7 | exact deployment identity / environment-scoped deploy config | precheck → explicit Owner approval → mutation → deploy/health/readiness/rollback verification |
| Stripe | M7 only when separately named | exact webhook/config/credential operation | dedicated authority + explicit approval + verification |
| IONOS / DNS / TLS | Human-reserved | exact separately approved ownership/config action | Human-only absent later stronger ADR |

## Current status quo

Repository/governance milestones:

- M0–M4 are complete.
- M5 append-only audit persistence and corrected application writer are **COMPLETE / VERIFIED PASS**.
- PR #214 established Systemadmin Roadmap Executor governance.
- PR #215 completed SA1 REM validator / Control-Plane enforcement.
- PR #216 completed SA2 Chat Execution Profile.
- PR #217 merged M10 passkey-only target architecture.
- PR #218 completed SA3A append-only authorization/outcome correlation.
- PR #220 implemented the SA3B GitHub-Actions/OIDC Execution Host.
- PR #222 corrected the M5 writer↔production-schema contract.
- Issues #221/#223/#224 plus final branch cleanup complete SA3B `VERIFIED PASS`.
- PR #226 bootstrapped SA4.
- Issue #228 / Workflow `31579519025` produced the first autonomous bounded work package.
- PR #229 was generated by the audit-bound SA4 host, Human-reviewed, Human-merged, final CI PASS, branch deleted.
- PR #231 synchronized the Systemadmin roadmap/traceability to SA4 `COMPLETE / VERIFIED PASS`.
- SA4 is **COMPLETE / VERIFIED PASS** for the exact bounded `BRANCH/COMMIT/Draft PR` pilot contract.
- M5A remains the active DEVELOPMENT Chain phase.
- M6–M10 planning documents exist in advance, but execution remains sequentially blocked.

## DevelopmentChain M0–M10

| Phase | Execution status | Documentation readiness | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|---|
| M0 Evidence Baseline | **COMPLETE** | COMPLETE | `docs/evidence/m0/*` | read-only | preserve |
| M1 Git Guardrails | **COMPLETE** | COMPLETE | Owner/GitHub governance | policy validation | preserve |
| M2 Architecture/Documentation | **COMPLETE** | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | **COMPLETE** | COMPLETE | Freeze policy | freeze verification | sequential implementation |
| M3 CI Hardening | **COMPLETE** | COMPLETE | ADR-0053/0060 + CI policy | bounded scope-aware CI | preserve until M10 cutover |
| M4 Agent IAM | **COMPLETE** | COMPLETE | ADR-0058 + ESS-0018/0019 | negative IAM tests | preserve |
| M5 Observability/Telemetry/Audit | **COMPLETE / VERIFIED PASS** | COMPLETE | ADR-0056/0059 + M5/SA3B Evidence | real permit-before-side-effect + outcome + outage negative proof | preserve |
| M5A Supabase Native MFA/AAL2 | **IN PROGRESS** | BASELINE/RUNBOOK READY | ESS-0020 + ADR-0064 + ADR-0003.5 | repository remediation + CI; Owner native factor mutation separately approved | M6 blocked until VERIFIED PASS |
| M6 Supply Chain | **BLOCKED BY M5A** | RUNBOOK READY | ADR-0060 | exact source/lock/SBOM/artifact/provenance/attestation | M7 after M6 VERIFIED PASS |
| M7 Deployment Identity / Platform Mutation | **BLOCKED BY M6** | RUNBOOK READY | ADR-0061 | exact target + approval + postverify/rollback | M8 after M7 PASS |
| M8 Agent Cutover | **BLOCKED BY M7** | RUNBOOK READY | ADR-0062 + ESS-0019 | provider-neutral equivalence/bypass tests | M9 after cutover PASS |
| M9 Assurance | **BLOCKED BY M8** | RUNBOOK READY | ADR-0063 | injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills | M10 after assurance PASS |
| M10 Passkey-only Owner PR Authorization | **BLOCKED BY M9** | ESS/RUNBOOK/THREAT MODEL READY | ADR-0066 + ESS-0022 | PR-state-bound WebAuthn + shadow/replay/recovery/single-CI + legacy cleanup | final DevelopmentChain assurance |

## M5A active gaps

Recorded M5A baseline establishes:

- Supabase Native MFA factors = 0 at the recorded baseline;
- recorded sessions are AAL1 only;
- historical CAPITAL-AI custom TOTP is distinct from Supabase Native MFA/AAL2;
- native `mfa.enroll/challenge/verify` is not yet authoritative runtime behavior;
- privileged server IAM does not yet centrally require trusted AAL2;
- privileged factor/status lookup has fail-open behavior to remove;
- application step-up may remain only as defense-in-depth over trusted AAL2.

M5A mutation classification:

- repository/application code: `REQUIRED`;
- Owner Native TOTP enrollment: `REQUIRED / NOT YET AUTHORIZED` at recorded baseline;
- Supabase project Auth configuration: `CONDITIONAL` only when exact need is proven;
- Native MFA Postgres DDL: `NOT REQUIRED`;
- legacy custom-TOTP cleanup: `DEFERRED / SEPARATE APPROVAL`;
- Render/Stripe: `NOT REQUIRED` for M5A core.

## Phase execution documents

- Generic: `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md`
- M5A: `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`
- M6: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`
- M7: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`
- M8: `docs/runbooks/M8_AGENT_CUTOVER.md`
- M9: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- M10: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

Traceability:

- `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`
- `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`
- `docs/traceability/SYSTEMADMIN_AGENT_TRACEABILITY_MATRIX.md`

## Protected invariants

- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- protected `main` + bounded required CI;
- Human File Review mandatory;
- current transitional Owner gate authoritative until M10 cutover;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require exact approved Roadmap/ESS/ADR/REM scope and verified execution controls;
- no next phase while required mutation/test Evidence is incomplete;
- fresh branch per work item; remote branch deletion after Human merge.

## Current next action

**M5A remains the next DEVELOPMENT Chain implementation action.** M5/SA3B/SA4 are no longer blockers.

For normal development, implementation may proceed through the established Human-authorized Development PR path once M5A Authority state is accepted. For autonomous Systemadmin implementation, a dedicated M5A REM plus technically bounded code/test execution path is required first.

Production Native MFA enrollment remains a separate Human/Owner mutation gate after repository code + CI + Human merge.