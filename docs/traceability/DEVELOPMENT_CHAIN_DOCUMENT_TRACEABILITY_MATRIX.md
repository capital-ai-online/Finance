# DEVELOPMENT Chain Document Traceability Matrix

Status: PROPOSED
Date: 2026-08-12
Current repository baseline: `main@5bd5f4d78b87a89258126d0453eaf5e4bc6b6125`
Execution baseline rule: every work item re-resolves current `main`; this matrix does not authorize mutation.

## Zweck

Diese Matrix zeigt für jeden DEVELOPMENT Chain Roadmap-Punkt die normative Authority, Ausführungsdokumente, Machine Contracts, Evidence, Mutation State und das Exit Gate. Sie ergänzt `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` um die Dokument-/Handoff-/Autonomous-Block-Ebene.

Der kanonische Phase-/Blockstatus bleibt in `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`. Diese Matrix bildet Traceability ab und darf keinen konkurrierenden Status erzeugen.

## Cross-cutting Controls

| Control | Authority / Artifact | Zweck |
|---|---|---|
| DEVELOPMENT Chain Execution | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | kanonische Ausführungs- und Mutationsreihenfolge |
| Branch / Clone Lifecycle | `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md` | fresh branch, Human merge, branch delete, clone/worktree cleanup |
| Responsibilities | `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md` | Owner / Dev / Prod / Executor / CI Trennung |
| PR Check Classes | `docs/governance/PR_CHECK_CLASSIFICATION.md` | D/C/R/M Validation Scope |
| Human Owner Approval | `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md` | jeweils aktuelle Human-review/CI boundary |
| Autonomous Agent Concept Gate | `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md` | privileged agent prerequisites |
| Systemadmin REM | `.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md` + ADR-0065 | standing bounded repository authority |
| Autonomous Roadmap Block Decision | `docs/adr/ADR-0069-autonomous-roadmap-block-pr-checkpoint-execution.md` | block→execution-unit→PR-checkpoint architecture |
| Roadmap Block Contract | `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md` | non-authorizing per-unit execution boundary |
| Roadmap Block Schema | `.ai/contracts/development-chain-roadmap-block.schema.json` | machine-readable per-unit contract shape |
| Roadmap Block Runbook | `docs/runbooks/SYSTEMADMIN_AUTONOMOUS_ROADMAP_BLOCK_EXECUTION.md` | autonomous execution/resume/STOP sequence |
| SA4B Traceability | `docs/traceability/SA4B_AUTONOMOUS_ROADMAP_BLOCK_TRACEABILITY.md` | requirement→implementation→test→runtime evidence |
| Mutation Handoff | `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md` | nicht autorisierende external-mutation Work Order |
| Mutation Handoff Schema | `.ai/contracts/development-chain-mutation-handoff.schema.json` | machine validation |
| Generic Phase Runbook | `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md` | wiederholbarer Ablauf |
| Generic Evidence Template | `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md` | Mindest-Evidence pro Phase |
| Systemadmin Roadmap | `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | bounded autonomous execution stage status |
| Systemadmin Traceability | `docs/traceability/SYSTEMADMIN_AGENT_TRACEABILITY_MATRIX.md` | REM/host/audit/capability evidence |

## Phase Matrix

| Phase | Execution State | Primary Authority | Execution / Risk Documents | Machine Contract / Implementation | Evidence | Mutation State | Exit Gate |
|---|---|---|---|---|---|---|---|
| M0 | **COMPLETE** | M0 evidence baseline | `docs/evidence/m0/*` | read-only | M0 Evidence | `NOT REQUIRED` | baseline preserved |
| M1 | **COMPLETE** | Git Guardrails / Owner Policy | PR governance / CODEOWNERS / protection | GitHub policy | guardrail evidence | repository governance only | protected main preserved |
| M2 | **COMPLETE** | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | architecture contracts | M2 Evidence | `NOT REQUIRED` | Documentation Freeze complete |
| M3 | **COMPLETE** | ADR-0053 + ADR-0060 | CI / PR Check Classification | `.github/workflows/ci.yml` | M3 Evidence | repository workflow | bounded build-and-test preserved |
| M4 | **COMPLETE** | ADR-0058 + ESS-0018/0019 | IAM / risk / capability models | Agent IAM / PolicyGate | M4 Evidence | `NOT REQUIRED` external | negative IAM PASS |
| M5 | **COMPLETE / VERIFIED PASS** | ADR-0056 + ADR-0059 | M5 + SA3B Evidence | `public.agent_audit_events`, `server/agentAudit/*`, SA3B host | Issues #221/#223/#224 + cleanup | audit/runtime `VERIFIED PASS` | preserve |
| M5A | **IN PROGRESS** | ESS-0020 + ADR-0064 + ADR-0003.5 | `M5A_SUPABASE_TOTP_AAL2_HARDENING.md` + DevelopmentChain Roadmap block | normal Development path OR, after SA4B, M5A per-unit Block Contract | `docs/evidence/m5a/*` | repo `PLANNED`; production `NOT AUTHORIZED` baseline | code/CI + native factor/AAL2/recovery/advisor VERIFIED PASS |
| M6 | **BLOCKED BY M5A** | ADR-0060 | supply-chain model + M6 runbook | SBOM/provenance/attestation; future ARB decomposition optional after SA4B | `docs/evidence/m6/*` | `PLANNED / BLOCKED` | source→artifact→attestation trace VERIFIED PASS |
| M7 | **BLOCKED BY M6** | ADR-0061 | deployment identity + M7 runbook | repository block optional; external mutation handoff mandatory | `docs/evidence/m7/*` | `PLANNED / BLOCKED` | required platform mutations VERIFIED PASS |
| M8 | **BLOCKED BY M7** | ADR-0062 + ESS-0019 | provider profile + M8 runbook | provider adapters / profiles | `docs/evidence/m8/*` | `PLANNED / BLOCKED` | equivalent policy + rollback VERIFIED PASS |
| M9 | **BLOCKED BY M8** | ADR-0063 | incident/assurance runbook | kill-switch / audit / recovery controls | `docs/evidence/m9/*` | `PLANNED / BLOCKED` | all drills PASS |
| M10 | **BLOCKED BY M9** | ADR-0066 + ESS-0022 | M10 threat model/runbook | PR-bound WebAuthn service | `docs/evidence/m10/*` | `PLANNED / BLOCKED` | passkey-only gate VERIFIED PASS |

## Repository change trace

Normal repository work:

```text
Roadmap Item
→ Authority Ref
→ current-main baseline
→ fresh Branch
→ Commit / PR Head
→ Human Review
→ Required CI
→ Human Merge
→ Merge SHA
→ Branch Deleted
→ Roadmap/Traceability Sync
```

## Autonomous Roadmap Block trace

After SA4B VERIFIED PASS:

```text
Canonical Roadmap Block
→ Owner-approved REM containing explicit EU IDs
→ Roadmap Block Contract bound to REM
→ select next unblocked EU
→ per-EU preflight / current main / overlap / audit
→ BRANCH authorization → side effect → outcome
→ bounded implementation + targeted tests
→ COMMIT authorization → side effect → outcome
→ PR authorization → side effect → outcome
→ optional CI_REQUEST authorization/outcome
→ PR CHECKPOINT / AUTONOMOUS STOP
→ Human review + required CI + Human merge
→ branch deletion
→ re-resolve current main
→ resume next EU only if resume gate PASS
```

The Block Contract contains no execution state. Completion is derived from Roadmap + GitHub + M5 Evidence.

## External platform mutation trace

```text
Mutation Requirement
→ Exact Target
→ Read-only Pre-Mutation Check
→ Human Mutation Approval Evidence
→ Handoff Contract ID
→ REM / IAM / Execution Host Decision when applicable
→ Authorization Audit Reference
→ Side Effect
→ Outcome Audit Reference
→ Post-Mutation Positive/Negative Verification
→ Rollback State
→ Final Mutation State
```

Repository ARB authority never substitutes the separate Human production mutation approval.

## M5 / SA3B closure trace

PR #220 execution host; Issue #221 audit persistence fail-closed/no branch; PR #222 writer↔schema correction; Issue #223 durable authorization before BRANCH and durable SUCCESS outcome; Issue #224 stale-base DENY; final probe branch deletion.

Therefore M5 production persistence and SA3B are **COMPLETE / VERIFIED PASS**.

## SA4 closure trace

PR #226 bootstrapped the bounded autonomous host. Owner Issue #228 / Workflow `31579519025` produced branch `agent/sa4-pilot-proof-20260812b`, commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d`, exact evidence file, Draft PR #229 and separate durable BRANCH/COMMIT/PR authorization/outcome references.

Human/Owner reviewed and merged PR #229; CI PASS; pilot branch deleted.

Closure Evidence: `docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

**SA4 = COMPLETE / VERIFIED PASS for the exact deterministic docs-only contract.**

It does not satisfy traceability for general code patches.

## SA4B enablement trace requirement

Before any multi-PR Systemadmin code block is executable:

1. ADR-0069 / ESS-0021 v1.1 merged;
2. Roadmap Block Contract schema/validator implemented;
3. per-unit path/capability/risk/mutation-class enforcement implemented;
4. new contract/host paths added to self-authority protection;
5. bounded code/test executor implemented without arbitrary untrusted commands;
6. BRANCH/COMMIT/PR/CI_REQUEST permit-before-side-effect implemented;
7. negative suite in `SA4B_AUTONOMOUS_ROADMAP_BLOCK_TRACEABILITY.md` PASS;
8. two real repository units under one REM complete separate Human PR checkpoints;
9. each work branch deleted before resume;
10. Roadmap/Systemadmin Traceability synchronized to VERIFIED PASS.

Until then, SA4B is documentation/implementation planning only.

## M5A autonomous repository block trace

Canonical block: `DC-M5A-NATIVE-MFA-AAL2-REPOSITORY` in `DEVELOPMENT_CHAIN_ROADMAP.md`.

### M5A-EU1

Native MFA enrollment/challenge/session client boundary and fail-closed AAL state handling.

Trace must freeze exact current-main paths; current candidate areas include `TotpSettings`, `LoginStepUpGate`, `loginStepUp` and narrowly required tests/helpers.

Exit: `M5A-PR1` Human merge + branch delete.

### M5A-EU2

Canonical server-side AAL2 enforcement and privileged route composition.

Trace must include discovered privileged route inventory, server helper implementation, negative tests and exact allowed paths.

Exit: `M5A-PR2` Human merge + branch delete.

### M5A-EU3

Recovery/factor-admin contract, audit requirements, integration negative tests and production-handoff readiness. No actual Owner factor mutation.

Exit: `M5A-PR3` Human merge + branch delete.

### M5A production boundary

After repository block closure:

`read-only precheck → explicit Owner production mutation approval → native Owner enrollment one identity at a time → AAL2/recovery/negative verification → Advisor → Evidence`

Legacy custom-TOTP cleanup remains a separate later decision.

## Documentation Readiness vs Execution State

- **Documentation Ready** — Planungs-/Runbook-/Contract-Artefakte vorhanden;
- **Execution Unblocked** — predecessor/enablement gates fulfilled;
- **Mutation Approved** — separate Owner-Mutation-Autorisierung vorhanden;
- **Verified Pass** — actual execution and verification completed.

`Documentation Ready` is neither `Mutation Approved` nor `Verified Pass`.

## Branch Closure Trace

Every merged repository Execution Unit needs `branchDeleted=true` or equivalent ref-absence evidence. Merged/superseded branches are never reused. The next EU starts from then-current `main` only after lifecycle closure.

## Current Next Gates

- M5A remains the active DEVELOPMENT phase.
- SA4B is the next Systemadmin capability-enablement gate for autonomous general code/test blocks.
- Normal Human-authorized M5A repository implementation is not blocked by SA4B.
- Systemadmin-autonomous M5A requires SA4B VERIFIED PASS + dedicated M5A REM + validated per-unit Block Contract.
- M6 remains blocked until M5A VERIFIED PASS.
