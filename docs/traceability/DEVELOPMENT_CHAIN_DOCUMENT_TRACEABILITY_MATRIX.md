# DEVELOPMENT Chain Document Traceability Matrix

Status: PROPOSED
Date: 2026-08-12
Baseline: `main@2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd` (PR #229 merge)
Production deploy: `dep-d9u392nlk1mc73fg1hk0` — `live` — same commit

## Zweck

Diese Matrix zeigt für jeden DEVELOPMENT Chain Roadmap-Punkt die normative Authority, Ausführungsdokumente, Machine Contracts, Evidence, Mutation State und das Exit Gate. Sie ergänzt die bestehende `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` um die Dokument-/Handoff-Ebene.

Der Status `PROPOSED` dieses Dokuments wird durch diese reine State-Synchronisierung bewusst nicht eigenmächtig auf `ACCEPTED` geändert. Normative Statuswechsel bleiben Human/Owner-Entscheidung.

## Cross-cutting Controls

| Control | Authority / Artifact | Zweck |
|---|---|---|
| DEVELOPMENT Chain Execution | `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` | kanonische Ausführungs- und Mutationsreihenfolge |
| Branch / Clone Lifecycle | `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md` | fresh branch, Human merge, branch delete, clone/worktree cleanup |
| Responsibilities | `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md` | Owner / Dev / Prod / Executor / CI Trennung |
| PR Check Classes | `docs/governance/PR_CHECK_CLASSIFICATION.md` | D/C/R/M Validation Scope |
| Human Owner Approval | `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md` | current transitional Owner gate until M10 cutover |
| Autonomous Agent Concept Gate | `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md` | privileged agent prerequisites |
| Mutation Handoff | `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md` | nicht autorisierende Work Order |
| Mutation Handoff Schema | `.ai/contracts/development-chain-mutation-handoff.schema.json` | machine validation |
| Generic Phase Runbook | `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md` | wiederholbarer Ablauf |
| Generic Evidence Template | `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md` | Mindest-Evidence pro Phase |
| Systemadmin Roadmap | `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | bounded autonomous execution stages |
| Systemadmin Traceability | `docs/traceability/SYSTEMADMIN_AGENT_TRACEABILITY_MATRIX.md` | REM/host/audit/capability evidence |

## Phase Matrix

| Phase | Execution State | Primary Authority | Execution / Risk Documents | Machine Contract / Implementation | Evidence | Mutation State | Exit Gate |
|---|---|---|---|---|---|---|---|
| M0 | **COMPLETE** | M0 evidence baseline | `docs/evidence/m0/*` | read-only | M0 Evidence | `NOT REQUIRED` | baseline preserved |
| M1 | **COMPLETE** | Git Guardrails / Owner Policy | PR governance / CODEOWNERS / protection | GitHub policy | guardrail evidence | repository governance only | protected main preserved |
| M2 | **COMPLETE** | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | architecture contracts | M2 Evidence | `NOT REQUIRED` | Documentation Freeze complete |
| M3 | **COMPLETE** | ADR-0053 + ADR-0060 | CI / PR Check Classification | `.github/workflows/ci.yml` | M3 Evidence | repository workflow | bounded build-and-test preserved |
| M4 | **COMPLETE** | ADR-0058 + ESS-0018/0019 | IAM / risk / capability models | Agent IAM / PolicyGate | M4 Evidence | `NOT REQUIRED` external | negative IAM PASS |
| M5 | **COMPLETE / VERIFIED PASS** | ADR-0056 + ADR-0059 | M5 + SA3B Evidence | `public.agent_audit_events`, `server/agentAudit/*`, SA3B host | Issues #221/#223/#224 + branch cleanup | audit/runtime `VERIFIED PASS` | preserve |
| M5A | **IN PROGRESS** | ESS-0020 + ADR-0064 + ADR-0003.5 | `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md` | Native Supabase MFA/AAL2 code | `docs/evidence/m5a/*` | repo `PLANNED`; production `NOT AUTHORIZED` baseline | native factor/AAL2/recovery/advisor `VERIFIED PASS` |
| M6 | **BLOCKED BY M5A** | ADR-0060 | `AI_AGENT_SUPPLY_CHAIN_MODEL.md`, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md` | SBOM/provenance/attestation outputs | `docs/evidence/m6/*` | `PLANNED / BLOCKED` | source→artifact→attestation trace VERIFIED PASS |
| M7 | **BLOCKED BY M6** | ADR-0061 | `AI_AGENT_DEPLOYMENT_IDENTITY.md`, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` | per-mutation Handoff Contract | `docs/evidence/m7/*` | `PLANNED / BLOCKED` | all required platform mutations VERIFIED PASS |
| M8 | **BLOCKED BY M7** | ADR-0062 + ESS-0019 | Provider Profile Contract + `docs/runbooks/M8_AGENT_CUTOVER.md` | provider adapters / profiles | `docs/evidence/m8/*` | `PLANNED / BLOCKED` | equivalent provider policy + rollback VERIFIED PASS |
| M9 | **BLOCKED BY M8** | ADR-0063 | Incident Response + `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` | kill-switch / audit / recovery controls | `docs/evidence/m9/*` | `PLANNED / BLOCKED` | all drills PASS; no unowned CRITICAL control |
| M10 | **BLOCKED BY M9** | ADR-0066 + ESS-0022 | M10 Threat Model + `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` | PR-bound WebAuthn approval contract/service | `docs/evidence/m10/*` | `PLANNED / BLOCKED` | passkey-only gate VERIFIED PASS; legacy auth removed |

## Requirement-to-Evidence Rules

### Repository change

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

### External platform mutation

```text
Mutation Requirement
→ Exact Target
→ Pre-Mutation Check
→ Human Mutation Approval Evidence
→ Handoff Contract ID
→ REM / IAM / Execution Host Decision
→ Authorization Audit Reference
→ Side Effect
→ Outcome Audit Reference
→ Post-Mutation Positive/Negative Verification
→ Rollback State
→ Final Mutation State
```

## M5 / SA3B closure trace

The full corrective chain is now complete:

- PR #220 implemented the GitHub-Actions/OIDC execution host.
- Issue #221 proved audit persistence failure fails closed with no branch.
- PR #222 corrected the application writer↔production schema mapping.
- Issue #223 proved real durable authorization before BRANCH and durable SUCCESS outcome after the side effect.
- Issue #224 proved stale-base DENY before OIDC/broker and no branch.
- final lookup proved `agent/sa3b-host-probe-20260812b` absent.

Therefore:

- M5 production schema/persistence controls: **VERIFIED PASS**;
- M5 corrected application writer runtime: **VERIFIED PASS**;
- SA3B execution host: **COMPLETE / VERIFIED PASS**.

## SA4 closure trace

PR #226 bootstrapped the bounded autonomous host. Owner Issue #228 / Workflow `31579519025` executed the real pilot on base `f7dfcda36905d9a55d74f57f2140224928960379`.

Real outputs:

- branch `agent/sa4-pilot-proof-20260812b`;
- commit `02f012e71106d5ffd9a4baa3e6f3eba7160eb55d`;
- exact file `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`;
- Draft PR #229;
- separate durable BRANCH/COMMIT/PR authorization and outcome references.

Human/Owner then reviewed and merged PR #229. Merge SHA `2e86d5fbc54f9b5ea2af4e6db33e9749c2ac15dd`; main CI #966 PASS; pilot branch deleted; Render deploy `dep-d9u392nlk1mc73fg1hk0` live.

Closure Evidence:

`docs/evidence/sa4/SA4_VERIFIED_PASS_CLOSURE_2026-08-12.md`.

**SA4 = COMPLETE / VERIFIED PASS for the exact deterministic docs-only `BRANCH → COMMIT → Draft PR` contract.**

This does not automatically satisfy traceability for arbitrary code patches. A code-producing DEVELOPMENT work package needs its own requirement→path→test→REM→host→audit trace.

## M5A implementation handoff trace requirement

Before M5A application code may be executed autonomously by Systemadmin, traceability must include:

1. Human/Owner-consistent ESS-0020 / ADR-0064 state;
2. dedicated M5A REM;
3. exact allowed application/test/documentation paths;
4. max risk and prohibited trust-root paths;
5. technically enforceable code/patch execution mechanism;
6. required positive and negative tests;
7. BRANCH/COMMIT/PR durable authorization/outcome evidence;
8. Human final review/CI/merge;
9. branch deletion.

The existing `REM-SA4-PILOT-001` does not authorize M5A code.

External Native MFA enrollment remains outside repository authority and requires a separate Owner production mutation approval.

## Documentation Readiness vs Execution State

- **Documentation Ready** — Planungs-/Runbook-Artefakte vorhanden;
- **Execution Unblocked** — Vorgänger-Exit-Gate erfüllt;
- **Mutation Approved** — separate Owner-Mutation-Autorisierung vorhanden;
- **Verified Pass** — tatsächliche Ausführung und Verifikation abgeschlossen.

`Documentation Ready` ist weder `Mutation Approved` noch `Verified Pass`.

## Branch Closure Trace

Every merged repository work item needs `branchDeleted=true` or equivalent evidence. Cloned repositories/worktrees are cleaned after required Evidence retention. Merged or superseded branches are never reused for new work.

## Mutation State Vocabulary

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

## Current Next Gate

M5 and SA3B/SA4 are complete. M5A is the active DEVELOPMENT phase.

A normal Development implementation may proceed through the Human-authorized repository path once its Authority state is confirmed. Systemadmin-autonomous M5A code requires a dedicated REM and bounded code execution contract before mutation.

## Closure

A DEVELOPMENT Chain Roadmap item is closed only when Authority, implementation/Handoff, tests, Evidence, mutation state, Roadmap, Branch Lifecycle and Traceability are consistent and the Next Gate is explicit.