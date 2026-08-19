# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-19
Baseline branch: `main`
Closure baseline commit: `eb75921316943c7b3cfaba4d185e2b7f47eb6853` (PR #433 merge; M10 closure is landed on main)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Historical detail remains in ADR/evidence documents.
Operational roadmap: `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`.

## Mandatory maintenance rule

Every merged DevelopmentChain step MUST update this file with the new `main` SHA, affected phase status, mutation/test state, next gate and evidence pointer. A roadmap-changing PR is incomplete without this synchronization.

Documentation readiness and execution authorization are distinct states. A prepared Runbook/ESS/Threat Model does not unblock a phase whose predecessor gate is incomplete.

This M10 closure work package updates the M10/CI-authorization sections only. Unrelated historical M5A-M9 status text is not re-adjudicated here unless required for the already-accepted M10 prerequisite statement; broader roadmap reconciliation is a separate governance task.

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

### Historical pre-M10 state — RETIRED

Before the Human-merged/deployed M10 Controlled Cutover, normal `pull_request` events could enter scope-aware `build-and-test` automatically. That execution model is historical and is no longer the normal expensive-PR-CI authorization path.

PR-body checkboxes, Files-Viewed state, `💪`/`okay`, comments, labels and reactions were already retired as CI authorization signals by the ADR-0069 Owner addendum on 2026-08-16 and remain retired.

### Current enforced M10 state — COMPLETE / VERIFIED PASS

```text
PR OPEN/UPDATE
→ cheap required-check DENY before expensive work
→ OWNER FILE REVIEW
→ EXACT PR STATE RESOLUTION
→ CAPITAL-AI WEBAUTHN/PASSKEY APPROVAL
→ IMMUTABLE APPROVAL EVIDENCE
→ ATOMIC ONE-HEAD CONSUMPTION
→ EXACT SAME-REPO PR-BRANCH workflow_dispatch
→ GITHUB ACTIONS OIDC WORKLOAD IDENTITY
→ SINGLE-USE SERVER WORKFLOW GATE
→ ONE scope-aware build-and-test on approved head
→ HUMAN MERGE
```

Verified invariants:

- Human File Review remains mandatory for merge governance but is not a machine CI credential;
- passkey/WebAuthn is the sole normal cryptographic Owner authorization for expensive PR CI;
- approval binds Owner, repository, PR, base SHA, exact head SHA, changed-file-set hash, diff/review digest and `AUTHORIZE_PR_CI`;
- server-generated short-lived single-use challenge, expected RP ID/origin, signature, UP and required UV are verified;
- immutable approval Evidence persists before CI dispatch;
- the current same-repository PR branch is re-resolved and must still point at the approved head before durable claim;
- exactly one approval/head claim creates a high-entropy single-use CI consumption capability;
- GitHub workflow dispatch targets the exact PR branch;
- the workflow obtains short-lived GitHub Actions OIDC and must redeem OIDC + the one-time capability server-side before checkout/npm/test/build/docker;
- CAPITAL-AI verifies OIDC signature/issuer/audience plus exact repository/ref/SHA/run/workflow claims and re-resolves PR state immediately before redemption;
- manual/malformed/replayed workflow attempts fail before expensive work;
- successful required `build-and-test` is bound to the approved current head;
- `💪`, `okay`, PR-body Owner checkboxes, comments, reactions, labels, Viewed-state and generic GitHub review state do not authorize CI;
- Human merge remains separate.

Authorities:

- `docs/adr/ADR-0066-passkey-only-owner-pr-authorization.md`
- `.ai/skills/ESS-0022-Passkey-Only-Owner-PR-Authorization.md`
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/evidence/m10/M10_CLOSURE_EVIDENCE_2026-08-19.md`

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
- M9 is `COMPLETE / VERIFIED PASS` and satisfied the M10 prerequisite gate.
- PR #217 merged the M10 passkey-only target architecture.
- M10 Phases 1-5 implemented trusted PR-state resolution, challenge/credential/assertion verification, immutable approval evidence and atomic exact-head CI consumption.
- Phase 6 Shadow Mode reached `VERIFIED PASS` with real Owner WebAuthn, negative/recovery evidence and zero authoritative Shadow-side CI effects.
- Controlled-Cutover PR #429 was Human-merged and deployed. Resolver and dispatcher credentials are separated; GitHub Actions OIDC is conjunctive with the one-time M10 consumption.
- Post-cutover assurance PR #431 proved ordinary-event cheap DENY, real authoritative exact-head Owner approvals, exactly one authorized CI per approved head, duplicate/replay DENY, stale-state isolation, fresh recovery, OIDC/current-state workflow-gate verification and Human-only Merge separation.
- Closure PR #433 was Human-merged as `eb75921316943c7b3cfaba4d185e2b7f47eb6853`; the remote branch `agent/m10-closure-verified-pass` was deleted after merge in accordance with the Branch Lifecycle Policy.
- The single-device Phase-6 live drift timing exercise remained explicitly inconclusive and is not misrepresented; deterministic drift tests plus post-cutover stale-state isolation provide the required invariant evidence.
- M10 is therefore **COMPLETE / VERIFIED PASS** under ADR-0066/ESS-0022 and `docs/evidence/m10/M10_CLOSURE_EVIDENCE_2026-08-19.md`.
- M10 completion satisfies the M10 prerequisite for later SA5 design, but it does **not** authorize SA5 or any external production mutation. SA5 still needs its own accepted authority, exact Owner approval, fresh branch, least-privilege execution and pre/post mutation Evidence.

Historical DevelopmentChain statuses outside the M10 scope remain governed by their own accepted evidence/roadmaps and are not silently rewritten by this work package.

## DevelopmentChain M0–M10

| Phase | Execution status | Documentation readiness | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | COMPLETE | `docs/evidence/m0/*` | read-only | preserve |
| M1 Git Guardrails | COMPLETE | COMPLETE | Owner/GitHub governance | policy validation | preserve |
| M2 Architecture/Documentation | COMPLETE | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | synchronized |
| M2G Documentation Freeze | COMPLETE | COMPLETE | Freeze policy | freeze verification | sequential implementation |
| M3 CI Hardening | COMPLETE | COMPLETE | ADR-0053/0060 + CI policy | scope-aware `build-and-test`; historical pre-M10 automatic path retired | preserve M10 gate |
| M4 Agent IAM | COMPLETE | COMPLETE | ADR-0058 + ESS-0018/0019 | negative IAM tests | preserve |
| M5 Observability/Telemetry/Audit | **VERIFIED PASS** | COMPLETE | ADR-0056/0059 + M5 Evidence | append-only durable audit | preserve |
| M5A Supabase Native MFA/AAL2 | historical status retained outside this M10 work package | existing authority | ESS-0020 + ADR-0064 + ADR-0003.5 | see M5A evidence/runbook | separate reconciliation |
| M6 Supply Chain | historical status retained outside this M10 work package | existing authority | ADR-0060 | see M6 evidence/runbook | separate reconciliation |
| M7 Deployment Identity / Platform Mutation | historical status retained outside this M10 work package | existing authority | ADR-0061 | see M7 evidence/runbook | separate reconciliation |
| M8 Agent Cutover | historical status retained outside this M10 work package | existing authority | ADR-0062 + ESS-0019 | see M8 evidence/runbook | separate reconciliation |
| M9 Assurance | **COMPLETE / VERIFIED PASS** | COMPLETE | ADR-0063 + M9 closure evidence | assurance exit gate closed | preserve |
| M10 Passkey-only Owner PR Authorization | **COMPLETE / VERIFIED PASS** | COMPLETE | ADR-0066 + ESS-0022 | Phase 6 + Cutover + production exact-head/negative/replay/drift/recovery/OIDC/audit matrix PASS | preserve; later SA5 requires separate authorization |

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
- exact-state WebAuthn/passkey is the sole normal expensive-PR-CI authorization signal;
- successful authorized `build-and-test` must correspond to the current approved PR head;
- GitHub Actions OIDC + one-time M10 consumption are conjunctive before expensive CI;
- checkbox/Viewed/emoji/text/label/reaction signals never regain CI authority;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require approved Roadmap/ESS/ADR scope and verified execution controls;
- no next phase while required mutation/test Evidence is incomplete;
- every work item uses a fresh branch and deletes it after successful Human merge.

## Current next action

**M10 is closed at `COMPLETE / VERIFIED PASS`.** No further M10 implementation phase is pending. Preserve the passkey/OIDC/one-time-consumption control as an operational invariant and handle any future defect through fail-closed incident/recovery plus a fresh Human-authorized branch.

M10 completion removes the *prerequisite blocker* for later SA5 design only. It does not authorize SA5, production mutation, new IAM scope, deploys or merge. Any such work requires its own current-main correlation, authority package and explicit Human/Owner authorization.

No statement in this M10 synchronization silently supersedes unrelated accepted M5A-M9 evidence; broader historical roadmap cleanup requires a separate correlation review.
