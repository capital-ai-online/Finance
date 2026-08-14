# DEVELOPMENT Chain Document Traceability Matrix

Status: PROPOSED
Date: 2026-08-14
Baseline: `main@66da35b80ba23e4f216318a9cd9f9b4e7b787679` (PR #255 merge)

## Zweck

Diese Matrix zeigt für jeden DEVELOPMENT Chain Roadmap-Punkt die normative Authority, Ausführungsdokumente, Machine Contracts, Evidence, Mutation State und das Exit Gate. Sie ergänzt die bestehende `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` um die Dokument-/Handoff-Ebene.

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

## Phase Matrix

| Phase | Execution State | Primary Authority | Execution / Risk Documents | Machine Contract / Implementation | Evidence | Mutation State | Exit Gate |
|---|---|---|---|---|---|---|---|
| M0 | COMPLETE | M0 evidence baseline | `docs/evidence/m0/*` | read-only | M0 Evidence | `NOT REQUIRED` | baseline preserved |
| M1 | COMPLETE | Git Guardrails / Owner Policy | PR governance / CODEOWNERS / protection | GitHub policy | guardrail evidence | repository governance only | protected main preserved |
| M2 | COMPLETE | ESS-0019 + ADR-0057..0063 | `docs/architecture/ai-agent/*` | architecture contracts | M2 Evidence | `NOT REQUIRED` | Documentation Freeze complete |
| M3 | COMPLETE | ADR-0053 + ADR-0060 | CI / PR Check Classification | `.github/workflows/ci.yml` | M3 Evidence | repository workflow | one bounded build-and-test preserved |
| M4 | COMPLETE | ADR-0058 + ESS-0018/0019 | IAM / risk / capability models | Agent IAM / PolicyGate | M4 Evidence | `NOT REQUIRED` external | negative IAM PASS |
| M5 | **VERIFIED PASS** | ADR-0056 + ADR-0059 | M5 Evidence + PR #222 corrective contract | `public.agent_audit_events`, `server/agentAudit/*` | `docs/evidence/m5/*` | schema `VERIFIED`; app runtime verification pending | real privileged audit insert PASS required before autonomous mutation reliance |
| M5A | **VERIFIED PASS** | ESS-0020 + ADR-0064 + ADR-0003.5 | `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md` + `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md` | Native Supabase MFA/AAL2 code (direkt implementiert, `REM-M5A-REPOSITORY-001` bleibt `DRAFT`/nicht aktiviert) | `docs/evidence/m5a/M5A_VERIFIED_PASS_CLOSURE_EVIDENCE.md` | repo `MERGED`; beide Owner-Profile mit verifiziertem nativen Faktor + `aal2`-Session read-only bestätigt | erreicht — M6 unblocked |
| M6 | **VERIFIED PASS** | ADR-0060 | `AI_AGENT_SUPPLY_CHAIN_MODEL.md`, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md` | SBOM/provenance/attestation outputs implemented, `supply-chain-attestation` CI job merged (push+main only); first real push run found `actions/attest-build-provenance` blocked for user-owned private repos, fixed with cosign keyless signing (Sigstore Fulcio/Rekor); second real push run (`31834114193`) signed and, in the same run, verified the signature against the exact expected certificate identity and OIDC issuer | `docs/evidence/m6/M6_REPOSITORY_IMPLEMENTATION_EVIDENCE.md` | `MERGED, VERIFIED ON HOSTED BUILD PATH` | source→artifact→attestation trace VERIFIED PASS — met |
| M7 | UNBLOCKED (M6 VERIFIED PASS) | ADR-0061 | `AI_AGENT_DEPLOYMENT_IDENTITY.md`, `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` | per-mutation Handoff Contract | `docs/evidence/m7/*` | `PLANNED — not started` | all required platform mutations VERIFIED PASS |
| M8 | BLOCKED BY M7 | ADR-0062 + ESS-0019 | Provider Profile Contract + `docs/runbooks/M8_AGENT_CUTOVER.md` | provider adapters / profiles | `docs/evidence/m8/*` | `PLANNED / BLOCKED` | equivalent provider policy + rollback VERIFIED PASS |
| M9 | BLOCKED BY M8 | ADR-0063 | Incident Response + `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` | kill-switch / audit / recovery controls | `docs/evidence/m9/*` | `PLANNED / BLOCKED` | all drills PASS; no unowned CRITICAL control |
| M10 | BLOCKED BY M9 | ADR-0066 + ESS-0022 | M10 Threat Model + `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` | PR-bound WebAuthn approval contract/service | `docs/evidence/m10/*` | `PLANNED / BLOCKED` | passkey-only gate VERIFIED PASS; legacy auth removed |

## Requirement-to-Evidence Rules

### Repository change

```text
Roadmap Item
→ Authority Ref
→ Branch
→ Commit / PR Head
→ Human Review
→ Required CI
→ Human Merge
→ Merge SHA
→ Branch Deleted
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

## Documentation Readiness vs Execution State

- **Documentation Ready** — Planungs-/Runbook-Artefakte vorhanden;
- **Execution Unblocked** — Vorgänger-Exit-Gate erfüllt;
- **Mutation Approved** — separate Owner-Mutation-Autorisierung vorhanden;
- **Verified Pass** — tatsächliche Ausführung und Verifikation abgeschlossen.

`Documentation Ready` ist weder `Mutation Approved` noch `Verified Pass`.

## M5 / SA4 verified execution trace

The M5 persistence and application writer path, the SA3B GitHub-Actions/OIDC execution host and the SA4 policy-validation pilot are recorded as **COMPLETE / VERIFIED PASS** in the canonical Systemadmin roadmap and traceability matrix.

The Development Chain therefore records:

- M5 production schema/persistence and application writer: **VERIFIED PASS**;
- SA3B execution host: **COMPLETE / VERIFIED PASS**;
- SA4 policy-validation pilot: **COMPLETE / VERIFIED PASS**;
- SA5 external production mutation: **DENY until M10 VERIFIED PASS**.

## M5A Systemadmin Repository Package Trace

The next bounded Systemadmin activity is repository-only M5A implementation under:

- work package: `docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md`;
- mandate draft: `.ai/mandates/REM-M5A-REPOSITORY-001.json`;
- authority candidates: ESS-0020 and ADR-0064.

The package is **DRAFT / NOT ACTIVATED**. The permit sequence is:

```text
Documentation PR merged
→ Owner accepts ESS-0020 and ADR-0064 for repository implementation
→ mandate baseline updated to exact current main
→ mandate status set to OWNER_APPROVED with approval evidence
→ Systemadmin validates permit and SA3B/SA4 state
→ fresh branch
→ bounded code + tests + evidence
→ Draft PR
→ Human review and merge
```

Explicitly denied by this package: Supabase production factor enrollment or removal, owner IAM/MFA changes, secrets, Render/Stripe/DNS mutations, GitHub ruleset changes, merge, and mandate self-expansion.

## Branch Closure Trace

Every merged repository work item needs `branchDeleted=true` or equivalent Evidence. Cloned repositories/worktrees are cleaned after required Evidence retention. Merged or superseded branches are never reused for new work.

## Mutation State Vocabulary

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

## Closure

A DEVELOPMENT Chain Roadmap item is closed only when Authority, implementation/Handoff, tests, Evidence, mutation state, Roadmap, Branch Lifecycle and Traceability are consistent and the Next Gate is explicit.