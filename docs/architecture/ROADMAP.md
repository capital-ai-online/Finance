# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-19
Baseline branch: `main`
Baseline commit: `4c280fb53e74e38d571e4b44b620a7b33681e0be` (PR #427 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Historical detail remains in ADR/evidence documents.
Operational roadmap: `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`.

## Mandatory maintenance rule

Every merged DevelopmentChain step MUST update this file with the new `main` SHA, affected phase status, mutation/test state, next gate and evidence pointer. A roadmap-changing PR is incomplete without this synchronization.

Documentation readiness and execution authorization are distinct states. A prepared Runbook/ESS/Threat Model does not unblock a phase whose predecessor gate is incomplete.

This Controlled-Cutover work package updates the M10/CI-authorization sections only. Unrelated historical M5A-M9 status text is not re-adjudicated here unless required for the already-accepted M10 prerequisite statement; broader roadmap reconciliation is a separate governance task.

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

Human File Review and Human Merge are distinct from expensive-CI authorization. Green CI never authorizes merge.

### Current pre-M10 state — until Controlled Cutover is Human-merged and deployed

```text
PR OPEN/UPDATE
→ normal pull_request CI event
→ scope-aware build-and-test
→ HUMAN FILE REVIEW
→ HUMAN MERGE
```

Rules:

- PR-body checkboxes, Files-Viewed state, `💪`/`okay`, comments, labels and reactions are **not** CI authorization signals; they were retired by the ADR-0069 Owner addendum on 2026-08-16;
- documentation-only changes use the docs fast path;
- green CI is technical Evidence, not merge authorization;
- AI clients stop before merge unless separate Human merge authority exists.

Authority: ADR-0069 Owner addendum 2026-08-16 and `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

### M10 Controlled-Cutover target — Passkey-only expensive-CI authorization

```text
PR OPEN/UPDATE
→ cheap required-check DENY before expensive work
→ OWNER FILE REVIEW
→ EXACT PR STATE RESOLUTION
→ CAPITAL-AI WEBAUTHN/PASSKEY APPROVAL
→ ATOMIC ONE-HEAD CONSUMPTION
→ EXACT SAME-REPO PR-BRANCH workflow_dispatch
→ SINGLE-USE SERVER WORKFLOW GATE
→ ONE scope-aware build-and-test on approved head
→ HUMAN MERGE
```

After verified cutover:

- Human File Review remains mandatory for merge governance but is not a machine CI credential;
- passkey/WebAuthn is the sole normal cryptographic Owner authorization for expensive PR CI;
- approval binds Owner, repository, PR, base SHA, exact head SHA, changed-file-set hash, diff/review digest and `AUTHORIZE_PR_CI`;
- server-generated short-lived single-use challenge, expected RP ID/origin, signature, UP and required UV are verified;
- immutable approval Evidence persists before CI dispatch;
- the current same-repository PR branch is re-resolved and must still point at the approved head before durable claim;
- exactly one approval/head claim creates a high-entropy single-use CI consumption capability;
- GitHub workflow dispatch targets the exact PR branch; the workflow must redeem that capability server-side before checkout/npm/test/build/docker;
- manual/malformed/replayed workflow dispatches fail before expensive work;
- `💪`, `okay`, PR-body Owner checkboxes, comments, reactions, labels, Viewed-state and generic GitHub review state do not authorize CI;
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
| Supabase Auth | M5A | Native TOTP/AAL2, recovery, exact conditional Auth config only | code+CI → precheck → explicit Owner approval → factor/AAL2/recovery/advisor tests |
| Render | M7 / M10 runtime secrets | exact deployment identity / environment-scoped deploy config / M10 server-only credentials | precheck → explicit Owner approval → mutation → deploy/health/readiness/rollback verification |
| Stripe | M7 only when separately named | exact webhook/config/credential operation | dedicated authority + test/non-destructive precheck + explicit approval + verification |
| IONOS / DNS / TLS | Human-reserved | exact separately approved ownership/config action | Human-only absent later stronger ADR |

## Current status quo

Repository/governance milestones relevant to this work package:

- M0–M4 are complete.
- M5 append-only audit is verified and is used by M10 authorization/workflow-gate evidence.
- PR #217 merged the M10 passkey-only target architecture.
- M10 Phases 1-5 are implemented; Phase-5 atomic claim enforces one consumption per exact PR head.
- Phase 6 Shadow Mode is deployed; a real Owner passkey is enrolled.
- Phase-6 production assurance on 2026-08-19 verified real Owner `APPROVED_SHADOW`, closed-PR fail-closed, challenge freshness/replay controls, deterministic state-drift denial, recovery on a fresh changed head, durable audit correlation, and zero authoritative approval/CI consumption from Shadow.
- The single-device live drift timing exercise was inconclusive and is not counted as live drift PASS; deterministic Phase-4 tests cover exact base/head/file-set/diff drift denial.
- Owner explicitly authorized creation of the separate M10 Controlled-Cutover PR on 2026-08-19.
- Controlled Cutover requires separate read-only resolver and Actions-write dispatcher credentials. The existing `M10_GITHUB_TOKEN` remains resolver-only; `M10_GITHUB_DISPATCH_TOKEN` must be provisioned server-side before Human merge to avoid fail-closed CI lockout.
- M10 remains **not COMPLETE** until post-merge production evidence proves one authorized current-head expensive CI, no expensive CI for unapproved events, replay/drift/recovery controls, immutable audit correlation and Human-only Merge separation.

Historical DevelopmentChain statuses outside the M10 scope remain governed by their own accepted evidence/roadmaps and are not silently rewritten by this work package.

## DevelopmentChain M0–M10

| Phase | Execution status | Documentation readiness | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | COMPLETE | `docs/evidence/m0/*` | read-only | preserve |
| M1 Git Guardrails | COMPLETE | COMPLETE | Owner/GitHub governance | policy validation | preserve |
| M2 Architecture/Documentation | COMPLETE | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | COMPLETE | COMPLETE | Freeze policy | freeze verification | sequential implementation |
| M3 CI Hardening | COMPLETE | COMPLETE | ADR-0053/0060 + CI policy | scope-aware `build-and-test`; pre-M10 automatic PR path | replaced by M10 only after verified cutover |
| M4 Agent IAM | COMPLETE | COMPLETE | ADR-0058 + ESS-0018/0019 | negative IAM tests | preserve |
| M5 Observability/Telemetry/Audit | **VERIFIED PASS** | COMPLETE | ADR-0056/0059 + M5 Evidence | append-only durable audit | preserve |
| M5A Supabase Native MFA/AAL2 | historical status retained outside this M10 work package | existing authority | ESS-0020 + ADR-0064 + ADR-0003.5 | see M5A evidence/runbook | separate reconciliation |
| M6 Supply Chain | historical status retained outside this M10 work package | existing authority | ADR-0060 | see M6 evidence/runbook | separate reconciliation |
| M7 Deployment Identity / Platform Mutation | historical status retained outside this M10 work package | existing authority | ADR-0061 | see M7 evidence/runbook | separate reconciliation |
| M8 Agent Cutover | historical status retained outside this M10 work package | existing authority | ADR-0062 + ESS-0019 | see M8 evidence/runbook | separate reconciliation |
| M9 Assurance | **prerequisite VERIFIED PASS for M10** | COMPLETE for M10 prerequisite | ADR-0063 + M9 closure evidence | injection/replay/exfiltration/audit/kill-switch/break-glass/rollback assurance | preserve |
| M10 Passkey-only Owner PR Authorization | **CONTROLLED CUTOVER IN IMPLEMENTATION** | PHASES 1-6 VERIFIED / CUTOVER RUNBOOK READY | ADR-0066 + ESS-0022 | Human merge/deploy → real authorized current-head CI → unapproved no-expensive-CI → replay/drift/recovery → audit/traceability | `COMPLETE / VERIFIED PASS` only after post-cutover exit gate |

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
- Human File Review remains mandatory for merge governance;
- pre-M10 normal PR events remain authoritative only until Controlled Cutover is Human-merged/deployed;
- after verified M10 cutover, exact-state WebAuthn/passkey is the sole normal expensive-PR-CI authorization signal;
- checkbox/Viewed/emoji/text/label/reaction signals never regain CI authority;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require approved Roadmap/ESS/ADR scope and verified execution controls;
- no next phase while required mutation/test Evidence is incomplete;
- every work item uses a fresh branch and deletes it after successful Human merge.

## Current next action

**M10 Controlled Cutover is the currently Owner-authorized work package.** Implement and validate the authoritative Passkey → atomic consumption → exact same-repository PR-ref dispatch → single-use workflow-gate path on a fresh branch from current `main`; create the PR before running cost-causing CI; preserve the current pre-M10 path for this one bootstrap PR only; require separate server-side Actions-write credential provisioning before Human merge; after Human merge/deployment execute the live current-head / no-unapproved-expensive-CI / replay / drift / recovery matrix before declaring M10 `COMPLETE / VERIFIED PASS`.

No statement in this M10 synchronization silently supersedes unrelated accepted M5A-M9 evidence; broader historical roadmap cleanup requires a separate correlation review.
