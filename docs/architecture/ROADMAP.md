# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-11
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
- the PR description MUST contain both checked Owner attestations:
  - `[x] Human/Owner: vollständigen PR-Diff geprüft.`
  - `[x] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`
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
GitHub Actions can verify the review author account `SvenKulessa` but cannot prove which device/passkey authenticated that GitHub session. Device ID alone is not a strong factor. The target architecture SHOULD introduce a CAPITAL-AI WebAuthn/passkey step-up bound to actor + action + target + request/PR-head for privileged roadmap approvals, production mutations and break-glass. Until that service exists, repository automation MUST NOT claim passkey/device proof that it cannot verify.

## Roadmap gate before privileged autonomous agents
The required "concept" for privileged agents is this **Roadmap architecture package**, not an ad-hoc chat description.

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
- no BRANCH;
- no COMMIT;
- no PR creation/update;
- no CI_REQUEST;
- no DEPLOY_REQUEST;
- no PRODUCTION_MUTATION;
- no MERGE;
- no write access to GitHub repository contents, Stripe, Supabase, Render or production configuration;
- read-only least-privilege credentials only;
- outputs limited to evidence, reports, alerts, summaries and analysis;
- retrieval/tool content cannot elevate privileges;
- any capability elevation immediately leaves this exception and requires the full Deep-Research + repo-read + ESS/ADR + Roadmap + Human/Owner approval sequence.

This exception is intended for daily briefings, read-only repository audits, status monitoring and evidence collection. It never permits pull-request creation.

## Mandatory mutation and verification gate
Any DevelopmentChain step that requires a state change in GitHub, Supabase, Stripe, Render or another production-connected platform MUST follow this sequence:

`ROADMAP/ADR → HUMAN APPROVAL → PRE-MUTATION TEST → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → ROADMAP UPDATE → NEXT PHASE`

Binding rules:
- a mutation MUST NOT be executed before the corresponding roadmap/ADR/runbook and Human/Owner approval exist;
- a mutation MUST identify the exact environment, resource, expected effect and rollback path;
- pre-mutation validation MUST establish the baseline and prove rollback readiness;
- post-mutation verification MUST prove the intended state and check for unintended side effects;
- mutation evidence MUST include timestamp, actor, target, before/after state, relevant request/trace/deployment IDs and verification result where available;
- the next roadmap step remains BLOCKED until the required mutation is complete, verified and documented as PASS;
- failed or inconclusive verification requires STOP/ROLLBACK or a new Human/Owner-approved remediation step;
- development branches MUST NOT perform production Stripe/Supabase/Render mutation directly.

## Platform mutation schedule
| Platform | Planned roadmap point | Allowed mutation scope | Required verification before next step |
|---|---|---|---|
| Supabase | M5 Observability/Telemetry/Audit, only if schema/persistence changes are required by ADR-0059/ADR-0056 | audit/telemetry persistence, immutable evidence support, policy-bound IAM data required by the approved M5 design | migration dry-run/staging validation, RLS/permission tests, audit event write/read verification, rollback evidence; M6 remains blocked until PASS |
| Stripe | M7 Production Platform Mutation Gate, only for explicitly pre-defined billing/webhook/credential changes with a dedicated ADR/runbook | no generic Stripe mutation; only named production changes approved by Owner and tied to a specific billing/agent integration requirement | test-mode or non-destructive verification where applicable, webhook/idempotency verification, metadata/customer/subscription mapping checks, rollback/revocation evidence; M8 remains blocked until PASS |
| Render | M7 Deployment Identity | protected deployment identity, environment-scoped deployment credentials/hooks, production environment protection, rotation/revocation configuration | preflight, deployment identity test, controlled deploy, health/readiness verification, rollback deployment evidence; M8 remains blocked until PASS |

Notes:
- M4 performs no production Stripe/Supabase/Render mutation.
- M5 may require Supabase mutation only if the approved observability/audit design needs persistence changes. If no mutation is required, document `NOT REQUIRED` with evidence.
- M6 is supply-chain/provenance work and does not by itself authorize Stripe/Supabase/Render production mutation.
- M7 is the primary production mutation window for deployment identity and explicitly approved external platform changes.
- Stripe business/billing remediations outside the AI-Agent DevelopmentChain remain a separate billing/product workstream and require their own ADR/roadmap entry before mutation.

## Current status quo
- PR #192 established the provider-neutral AI-Agent architecture and Documentation Freeze basis.
- PR #194 closed M2G.
- PR #195/#196 completed M3 CI Hardening and the docs-only Fast-Path proof.
- PR #197 established the Human/Owner review gate.
- PR #198 merged the canonical M4 Agent-IAM implementation after Human/Owner review.
- PR #202 merged the M4 consolidation/closure controls into `main` at `2dc9f826eaf740e7def6682cb42a84dc846e65f3`.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.
- M0, M1, M2/M2G, M3 and M4 are COMPLETE from a code/governance perspective; the next roadmap change is the pre-CI Owner gate refinement before M5 begins.

## DevelopmentChain M0–M9

| Phase | Status | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | read-only evidence baseline | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection + Human/Owner policy | GitHub policy changes require Owner review and validation | preserve Owner gate |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only; no production mutation | keep synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | freeze verification | implementation phases authorized sequentially |
| M3 CI Hardening | COMPLETE | ADR-0060 + ADR-0053 + PR #195/#196 | CI mutation validated by full-path and docs-fast-path tests | preserve full/fast paths and pre-CI Owner gate |
| M4 Agent IAM | COMPLETE | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 + PR #198/#202 | no production platform mutation; negative IAM tests + Owner gate | maintain capability boundaries |
| M5 Observability/Telemetry/Audit | NEXT AFTER THIS GOVERNANCE PR | ADR-0059 + ADR-0056 | Deep Research + repo read + ESS/ADR roadmap first; if Supabase persistence mutation is required: staging/dry-run → Owner approve → mutate → verify → evidence | M6 blocked until M5 verification PASS |
| M6 Supply Chain | BLOCKED BY M5 | ADR-0060 | SBOM/provenance/attestation tests; no external platform mutation unless separately approved | proceed only after provenance evidence PASS |
| M7 Deployment Identity + Production Platform Mutation Gate | BLOCKED BY M6 | ADR-0061 + platform-specific ADR/runbooks | Render mutation mandatory if target design requires it; Stripe/Supabase only when explicitly named in approved roadmap; each mutation must verify PASS before M8 | M8 blocked until all required M7 mutations/tests PASS |
| M8 Agent Cutover | BLOCKED BY M7 | ADR-0062 | privileged execution-client/agent cutover requires approved roadmap package; daily read-only agents remain allowed under the strict exception | proceed only after cutover verification PASS |
| M9 Assurance | BLOCKED BY M8 | ADR-0063 | negative tests, prompt/tool injection, replay, exfiltration, kill-switch/break-glass/rollback drills | final assurance requires PASS evidence |

## Protected invariants
- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- CoinMarketCap remains decommissioned;
- Kraken public REST only;
- protected `main` + stable `build-and-test` required check;
- expensive PR CI starts only after the Owner review gate is valid for the current head;
- every PR requires visible Human/Owner review, both Owner attestations and a current-commit `💪`/`okay` review;
- AI agents cannot self-approve or autonomously merge;
- privileged autonomous agents require a Deep-Research + repo-read + ESS/ADR + Human/Owner-approved Roadmap package before implementation;
- daily tasks may instantiate read-only READ/ANALYZE agents without Owner preapproval, but those agents cannot branch, commit, create PRs, request CI, deploy or mutate;
- no production Stripe/Supabase/Render mutation from development branches without explicit production handoff authorization;
- no next roadmap phase may start while a required mutation/test gate is incomplete, failed or undocumented;
- agent-generated code receives no trust advantage over human-generated code;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS.

## Assessment of PR #198/#202 versus the original roadmap
PR #198 and PR #202 did not reorder M5–M9 and did not authorize production platform mutation. They implemented/closed the already-planned M4 Agent-IAM slice and preserved `M4 → M5 → M6 → M7 → M8 → M9`.

Restoring `main` to PR #197 is NOT REQUIRED and would remove Human-reviewed M4 controls without restoring any Stripe/Supabase/Render production state.

## Next action
Merge the pre-CI Owner-gate governance change only after Owner review. Then begin M5 by first creating/updating the Deep-Research + repository-read + ESS/ADR Roadmap package. Before any M5 external mutation, determine whether Supabase mutation is REQUIRED or NOT REQUIRED, obtain Human/Owner approval where required, execute the defined test/mutation sequence, record PASS evidence and only then authorize M6.
