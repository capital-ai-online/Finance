# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-12
Baseline branch: `main`
Baseline commit: `91963f59b74c8c3c3c0b33c6a23237a01ac0128e` (PR #222 merge)
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

Every PR targeting `main` MUST be human-visible and explicitly reviewed by repository Owner `SvenKulessa` before expensive build/test validation starts.

### Current transitional gate — until M10 VERIFIED PASS

```text
PR OPEN/UPDATE
→ OWNER FILE REVIEW
→ ALL FILES VIEWED
→ CURRENT-HEAD REVIEW (💪/okay)
→ OWNER CHECKBOXES LAST
→ ONE build-and-test
→ MERGE ELIGIBLE
```

Rules:

- every changed file is reviewed and marked `Viewed`;
- Owner review targets the exact current head;
- the current transitional review signal is `💪` or `okay`;
- Owner checkbox edit is the final normal expensive-CI trigger;
- new commits invalidate current-head review evidence;
- documentation-only changes use the docs fast path;
- green CI is technical Evidence, not merge authorization;
- AI clients stop before merge unless separate Human merge authority exists.

Authority: `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

### Target gate after M10 VERIFIED PASS — File Review + Passkey only

```text
PR OPEN/UPDATE
→ OWNER FILE REVIEW / VIEWED
→ EXACT PR STATE RESOLUTION
→ CAPITAL-AI WEBAUTHN/PASSKEY APPROVAL
→ ONE build-and-test
→ HUMAN MERGE
```

After verified cutover:

- Human File Review remains mandatory;
- passkey/WebAuthn is the sole normal cryptographic Owner authorization for expensive CI;
- approval binds Owner, repository, PR, base SHA, exact head SHA, changed-file-set hash, diff/review digest and `AUTHORIZE_PR_CI`;
- server-generated short-lived single-use challenge, expected RP ID/origin, signature, UP and required UV are verified;
- immutable approval Evidence must persist before CI request;
- exactly one CI request consumes an approval/head;
- `💪`, `okay`, PR-body Owner checkboxes, comments, reactions, labels, generic GitHub review state and GitHub login method no longer authorize CI;
- Human merge remains separate.

Authorities:

- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Roadmap package before privileged autonomous agents

Privileged agent capability is allowed only after an approved Roadmap architecture package derived from:

1. current best-practice / standards research where relevant;
2. read-only repository and production Evidence;
3. gap analysis;
4. required ESS;
5. required ADR;
6. Runbook / threat model as applicable;
7. traceability, mutation/test gates, rollback and kill switch;
8. Human/Owner approval.

Without the package, no privileged `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST`, `DEPLOY_REQUEST` or `PRODUCTION_MUTATION` capability is implied. `MERGE` remains outside autonomous agent capability vocabulary.

## Daily read-only agent exception

Recurring/daily agents may run without prior Owner approval only when strictly limited to `READ` and `ANALYZE`, with no write credentials and no branch/commit/PR/CI/deploy/mutation/merge capability.

## Mutation handoff boundary

Machine-readable work orders:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `.ai/contracts/development-chain-mutation-handoff.schema.json`

The Handoff is **non-authorizing**. A valid Handoff alone cannot cause a side effect. Autonomous mutation additionally requires exact Human/Owner mutation Approval when applicable, REM/IAM/reserved-action enforcement, a verified Execution Host and durable M5 authorization/outcome audit Evidence.

## Mandatory mutation and verification gate

Any external state change follows:

```text
ROADMAP / ADR / ESS
→ HUMAN APPROVAL
→ PRE-MUTATION VERIFICATION
→ MUTATION
→ POST-MUTATION VERIFICATION
→ EVIDENCE
→ ROADMAP UPDATE
→ NEXT PHASE
```

Mutation states:

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

A later phase cannot start while a predecessor required mutation/test is missing, failed, inconclusive or undocumented.

## Platform mutation schedule

| Platform | Roadmap point | Allowed scope | Gate before next phase |
|---|---|---|---|
| Supabase | M5 Audit | append-only audit persistence and application writer both VERIFIED PASS (corrective runtime verification after PR #222 closed 2026-08-14) | real privileged audit insert confirmed, see `docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md` |
| Supabase Auth | M5A | Native TOTP/AAL2, recovery, exact conditional Auth config only | code+CI → precheck → explicit Owner approval → factor/AAL2/recovery/advisor verification |
| Render | M7 | exact deployment identity / environment-scoped deploy config | precheck → explicit Owner approval → mutation → deploy/health/readiness/rollback verification |
| Stripe | M7 only when separately named | exact webhook/config/credential operation | dedicated authority + test/non-destructive precheck + explicit approval + verification |
| IONOS / DNS / TLS | Human-reserved | exact separately approved ownership/config action | Human-only absent later stronger ADR |

## Current status quo

Repository/governance milestones:

- M0–M4 are complete.
- M5 production table/RLS/least-privilege persistence controls remain verified; the application writer entered corrective runtime verification after the first real SA3B host probe exposed schema-vocabulary drift and a separate privileged Supabase credential failure.
- PR #214 established the Systemadmin Roadmap Executor governance package.
- PR #215 completed SA1 REM validator / Control-Plane enforcement.
- PR #216 completed SA2 Chat Execution Profile + CI hardening.
- PR #217 merged the M10 passkey-only target architecture.
- PR #218 merged SA3A append-only authorization/outcome audit correlation.
- PR #219 merged Node-24 type/lockfile synchronization.
- PR #220 merged the SA3B GitHub-Actions/OIDC Execution-Host repository implementation.
- The first real SA3B post-merge host probe reached the broker and failed closed at durable M5 persistence; no probe branch was created.
- PR #222 merged the corrective M5 writer↔production-schema mapping and regression contract into `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e`.
- PR #222 performs no Supabase schema/config, Render, Stripe, DNS or workflow mutation.
- **SA3B remains `VERIFICATION PENDING`.** Its positive host exit gate still requires a valid Owner-controlled privileged Supabase backend credential, a successful real bounded branch probe, authorization-before-side-effect evidence, SUCCESS outcome evidence, a negative no-permit/stale probe and cleanup.
- Until SA3B reaches `VERIFIED PASS`, the Systemadmin Executor is not treated by DEVELOPMENT Chain as a generally verified autonomous mutation executor.
- M5A remains the active DEVELOPMENT Chain repository phase.
- M6–M10 planning documents may exist in advance, but execution remains sequentially blocked.

## DevelopmentChain M0–M10

| Phase | Execution status | Documentation readiness | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | COMPLETE | `docs/evidence/m0/*` | read-only | preserve |
| M1 Git Guardrails | COMPLETE | COMPLETE | Owner/GitHub governance | policy validation | preserve |
| M2 Architecture/Documentation | COMPLETE | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | COMPLETE | COMPLETE | Freeze policy | freeze verification | sequential implementation |
| M3 CI Hardening | COMPLETE | COMPLETE | ADR-0053/0060 + CI policy | scope-aware one `build-and-test` | preserve until M10 cutover |
| M4 Agent IAM | COMPLETE | COMPLETE | ADR-0058 + ESS-0018/0019 | negative IAM tests | preserve |
| M5 Observability/Telemetry/Audit | **VERIFIED PASS** | COMPLETE | ADR-0056/0059 + M5 Evidence | corrected writer merged in PR #222; real successful audit insert confirmed 2026-08-14 (`docs/evidence/m5/M5_VERIFIED_PASS_CLOSURE_EVIDENCE.md`) | autonomous mutation remains blocked independent of this (SA5/M10 gate) |
| M5A Supabase Native MFA/AAL2 | **IN PROGRESS** | BASELINE/RUNBOOK READY | ESS-0020 + ADR-0064 + ADR-0003.5 | repository remediation + CI; Owner native factor mutation separately approved; AAL2/recovery/advisor tests | M6 blocked until VERIFIED PASS |
| M6 Supply Chain | **BLOCKED BY M5A** | RUNBOOK READY | ADR-0060 | exact source/lock/SBOM/artifact/provenance/attestation verification | M7 after M6 VERIFIED PASS |
| M7 Deployment Identity / Platform Mutation | **BLOCKED BY M6** | RUNBOOK READY | ADR-0061 | exact target + approval + platform mutation + postverify/rollback | M8 after all required M7 PASS |
| M8 Agent Cutover | **BLOCKED BY M7** | RUNBOOK READY | ADR-0062 + ESS-0019 | provider-neutral profiles + equivalent policy/bypass tests | M9 after cutover PASS |
| M9 Assurance | **BLOCKED BY M8** | RUNBOOK READY | ADR-0063 | injection/replay/exfiltration/audit/kill-switch/break-glass/rollback drills | M10 after assurance PASS |
| M10 Passkey-only Owner PR Authorization | **BLOCKED BY M9** | ESS/RUNBOOK/THREAT MODEL READY | ADR-0066 + ESS-0022 | PR-state-bound WebAuthn + shadow/replay/recovery/single-CI + legacy cleanup | final DevelopmentChain assurance |

## M5A verified baseline and active gaps

Current baseline Evidence establishes:

- Supabase Native MFA factors = 0 at the recorded baseline;
- current assurance = AAL1 only at that baseline;
- historical CAPITAL-AI custom TOTP state is distinct from Supabase Native MFA/AAL2;
- native `mfa.enroll/challenge/verify` is not yet the authoritative flow;
- privileged server IAM does not yet centrally require trusted AAL2;
- privileged factor/status lookup has fail-open behavior that must be eliminated;
- application step-up may remain only as defense-in-depth over trusted AAL2.

Authority: `docs/evidence/m5a/M5A_SUPABASE_TOTP_AAL2_BASELINE.md`.

M5A external mutation classification:

- repository/application code: `REQUIRED`;
- Owner Native TOTP enrollment: `REQUIRED / NOT YET AUTHORIZED` at recorded baseline;
- Supabase project Auth configuration: `CONDITIONAL` only when exact need is proven;
- Native MFA Postgres DDL: `NOT REQUIRED`;
- legacy custom-TOTP cleanup: `DEFERRED / SEPARATE APPROVAL`;
- Render/Stripe: `NOT REQUIRED` for M5A baseline.

## Phase execution documents

- Generic: `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md`
- M5A: `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`
- M6: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`
- M7: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`
- M8: `docs/runbooks/M8_AGENT_CUTOVER.md`
- M9: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- M10: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

Evidence template: `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md`.

Traceability:

- `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`
- `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`

## Protected invariants

- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- CoinMarketCap remains decommissioned;
- Kraken remains public REST Evidence only;
- protected `main` + bounded required CI;
- Human File Review remains mandatory;
- until M10 cutover, current transitional Owner gate remains authoritative;
- after M10 cutover, exact-state WebAuthn/passkey becomes the sole normal CI authorization signal;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require approved Roadmap/ESS/ADR scope and verified execution controls;
- no next phase while required mutation/test Evidence is incomplete;
- every work item uses a fresh branch and deletes it after successful Human merge.

## Current next action

**M5A remains the next DEVELOPMENT Chain repository implementation action.** Its repository implementation must use a fresh branch from the then-current `main`, complete code + CI first, and only then proceed to a separate read-only pre-mutation check and explicit Human/Owner production mutation approval for Native Owner-factor enrollment or any exact Auth configuration mutation proven necessary.

Parallel dazu muss die PR-#222-Korrektur im realen M5-Auditpfad produktiv verifiziert und SA3B anschließend positiv/negativ abgeschlossen werden, bevor DEVELOPMENT Chain den autonomen Mutation Executor für spätere externe Mutationen als `VERIFIED PASS` verwendet.

M6–M10 documentation is prepared to remove future planning gaps, but no blocked phase is authorized by this documentation package.