# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-12
Baseline branch: `main`
Baseline commit: `2dc9f826eaf740e7def6682cb42a84dc846e65f3` (PR #202 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Detailed historical evidence remains in ADR/evidence documents.

## Mandatory maintenance rule
Every merged DevelopmentChain step MUST update this file with the new `main` SHA, status date, affected phase status, next gate, mutation/test status and evidence pointer. A roadmap-changing PR is incomplete without this update.

## Mandatory Human / Owner approval gate BEFORE expensive CI
Every pull request targeting `main` MUST be human-visible and MUST be verified and explicitly approved by repository Owner `SvenKulessa` before expensive build/test validation begins.

Binding sequence:

`PR OPEN/UPDATE → OWNER FILE REVIEW → OWNER CHECKBOXES → CURRENT-HEAD REVIEW (💪/okay) → TECHNICAL CI → build-and-test → MERGE ELIGIBLE`

Binding rules:
- the Owner MUST inspect the GitHub pull-request diff under `Files changed`;
- every changed file MUST be reviewed and marked `Viewed` in the GitHub UI;
- because GitHub Actions does not expose the per-user `Viewed` state as a reliable API gate, the Owner MUST attest that action through the PR checkbox;
- the PR description MUST contain both checked Owner attestations;
- the Owner MUST submit a GitHub PR review for the exact current PR head commit with either `💪` or `okay`;
- a review attached to an older commit is invalid after a new push;
- before those human signals are valid, expensive Git/toolchain, npm, TypeScript, unit-test, build and Docker jobs MUST NOT start;
- lightweight governance/security checks MAY run before Owner approval;
- successful CI, AI review or policy evaluation MUST NOT be interpreted as merge authorization;
- AI agents MAY prepare branches, commits, PRs, reviews and fixes when authorized by the active roadmap profile but MUST STOP before MERGE;
- an AI client may invoke merge only after valid Owner evidence and a separate explicit human merge instruction;
- `build-and-test` remains the stable final required check after `technical-validation`.

Authority: `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

### Owner authentication assurance
GitHub Actions can verify the review author account `SvenKulessa` but cannot prove which device/passkey authenticated that GitHub session. Device ID alone is not a strong factor. The target architecture introduces a CAPITAL-AI WebAuthn/passkey step-up bound to actor + action + repository + PR + current head SHA as final roadmap phase M10. Until M10 is implemented and verified, repository automation MUST NOT claim passkey/device proof that it cannot verify.

## Roadmap gate before privileged autonomous agents
The required concept for privileged agents is this Roadmap architecture package, not an ad-hoc chat description.

Before a privileged autonomous/semi-autonomous agent is implemented or elevated, the roadmap package MUST be derived from:
1. Deep Research/current best-practice comparison where relevant;
2. read-only inspection of the current Finance repository and available production evidence;
3. gap analysis;
4. required ESS creation/update;
5. required ADR creation/update;
6. traceability, mutation/test gates, rollback and kill-switch definition;
7. explicit Human/Owner approval of the roadmap state.

Without that approved roadmap package, an agent MUST NOT receive BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION or production write credentials. `MERGE` remains outside agent capability vocabulary.

Authority: `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`.

## Daily-task read-only agent exception
Daily/recurring tasks MAY instantiate agents without prior Owner approval only under a strict read-only profile:
- capabilities limited to `READ` and `ANALYZE`;
- no BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION or MERGE;
- no write access to GitHub repository contents, Stripe, Supabase, Render or production configuration;
- read-only least-privilege credentials only;
- outputs limited to evidence, reports, alerts, summaries and analysis;
- retrieval/tool content cannot elevate privileges;
- any capability elevation immediately leaves this exception and requires the full Deep-Research + repo-read + ESS/ADR + Roadmap + Human/Owner approval sequence.

## Mandatory mutation and verification gate
Any DevelopmentChain step that requires a state change in GitHub, Supabase, Stripe, Render or another production-connected platform MUST follow:

`ROADMAP/ADR → HUMAN APPROVAL → PRE-MUTATION TEST → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → ROADMAP UPDATE → NEXT PHASE`

A failed or inconclusive verification requires STOP/ROLLBACK or a new Human/Owner-approved remediation step.

## Platform mutation schedule
| Platform | Planned roadmap point | Allowed mutation scope | Required verification before next step |
|---|---|---|---|
| Supabase | M5 Observability/Telemetry/Audit, only if schema/persistence changes are required by ADR-0059/ADR-0056 | audit/telemetry persistence, immutable evidence support, policy-bound IAM data required by approved M5 design | migration dry-run/staging validation, RLS/permission tests, audit event write/read verification, rollback evidence |
| Stripe | M7 Production Platform Mutation Gate, only for explicitly pre-defined billing/webhook/credential changes with dedicated ADR/runbook | only named production changes approved by Owner | test/non-destructive verification, webhook/idempotency, metadata/customer/subscription mapping, rollback/revocation evidence |
| Render | M7 Deployment Identity | protected deployment identity, environment-scoped deployment credentials/hooks, production environment protection, rotation/revocation configuration | preflight, deployment identity test, controlled deploy, health/readiness verification, rollback evidence |

## Current status quo
- PR #192 established the provider-neutral AI-Agent architecture and Documentation Freeze basis.
- PR #194 closed M2G.
- PR #195/#196 completed M3 CI Hardening and docs-only Fast-Path proof.
- PR #197 established the Human/Owner review gate.
- PR #198 merged canonical M4 Agent-IAM.
- PR #202 merged M4 consolidation/closure into `main` at `2dc9f826eaf740e7def6682cb42a84dc846e65f3`.
- M0–M4 are COMPLETE; M5 follows after the current governance refinement.

## DevelopmentChain M0–M10

| Phase | Status | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | read-only evidence baseline | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection + Human/Owner policy | GitHub policy changes require Owner review and validation | preserve Owner gate |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only | keep synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | freeze verification | implementation phases authorized sequentially |
| M3 CI Hardening | COMPLETE | ADR-0060 + ADR-0053 + PR #195/#196 | full-path + docs-fast-path tests | preserve pre-CI Owner gate |
| M4 Agent IAM | COMPLETE | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 + PR #198/#202 | negative IAM tests + Owner gate | maintain capability boundaries |
| M5 Observability/Telemetry/Audit | NEXT AFTER GOVERNANCE PR | ADR-0059 + ADR-0056 | Deep Research + repo read + ESS/ADR roadmap first; Supabase mutation only if required and approved | M6 blocked until PASS |
| M6 Supply Chain | BLOCKED BY M5 | ADR-0060 | SBOM/provenance/attestation tests | M7 after PASS |
| M7 Deployment Identity + Production Platform Mutation Gate | BLOCKED BY M6 | ADR-0061 + platform ADR/runbooks | Render mutation if target design requires it; Stripe/Supabase only when explicitly named and approved | M8 after PASS |
| M8 Agent Cutover | BLOCKED BY M7 | ADR-0062 | controlled cutover; daily read-only exception remains non-mutating | M9 after PASS |
| M9 Assurance | BLOCKED BY M8 | ADR-0063 | injection/replay/exfiltration/kill-switch/break-glass/rollback drills | M10 after assurance PASS |
| M10 PR WebAuthn / Passkey Step-up | BLOCKED BY M9 | dedicated ADR + ESS + WebAuthn runbook to be created from Deep Research and repository analysis | register Owner passkey; challenge bound to `SvenKulessa + repository + PR number + current head SHA + action`; verify origin/RP ID, challenge freshness, credential ownership, replay resistance and audit evidence; device ID may be telemetry only; successful assertion required for privileged final PR/production authorization | DevelopmentChain assurance complete only after WebAuthn PASS evidence |

## M10 acceptance criteria
1. WebAuthn/passkey is the cryptographic step-up; device ID is never sufficient authentication.
2. Assertion is bound to Owner `SvenKulessa`, Finance repository, PR number, current head SHA and privileged action.
3. Any new commit invalidates the prior step-up and requires a new assertion.
4. Challenge is single-use, short-lived and replay-protected.
5. RP ID/origin and credential ownership are verified server-side.
6. Verification emits immutable/auditable evidence without storing private key material.
7. Failure, expiry, mismatch or replay fails closed and cannot authorize merge/production mutation.
8. Existing Files-changed/Viewed attestation, current-head review and CI gates remain independent controls.
9. Break-glass requires a separately documented recovery path and audit trail.
10. M10 implementation requires its own Deep Research, repository-read, ESS, ADR, threat model, negative tests and rollback/runbook before activation.

## Protected invariants
- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- protected `main` + stable `build-and-test` required check;
- expensive PR CI starts only after the Owner review gate is valid for the current head;
- every PR requires visible Human/Owner review and current-commit review;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require Deep Research + repo-read + ESS/ADR + Human/Owner-approved Roadmap package;
- daily tasks may instantiate read-only READ/ANALYZE agents without Owner preapproval but cannot create PRs or mutate;
- no production Stripe/Supabase/Render mutation from development branches without explicit production handoff authorization;
- M10 passkey proof supplements rather than replaces Human/Owner review and CI;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS.

## Next action
Merge the pre-CI Owner-gate governance change only after Owner review. Then begin M5 from Deep Research + repository read + ESS/ADR. M10 remains the explicit final roadmap phase and must not be implemented opportunistically before M5–M9 have produced their required PASS evidence.