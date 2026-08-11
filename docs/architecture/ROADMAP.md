# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-11
Baseline branch: `main`
Baseline commit: `69f719683b60ba6aadc0022381c6cecc430f0ea5` (PR #198 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Detailed historical evidence remains in ADR/evidence documents.

## Mandatory maintenance rule
Every merged DevelopmentChain step MUST update this file with the new `main` SHA, status date, affected phase status, next gate, mutation/test status and evidence pointer. A roadmap-changing PR is incomplete without this update.

## Mandatory Human / Owner approval gate
Every pull request targeting `main` MUST be human-visible and MUST be verified and explicitly approved by the repository Owner before merge.

Binding rules:
- the Owner MUST inspect the GitHub pull-request diff under `Files changed`;
- every changed file MUST be reviewed and marked `Viewed` in the GitHub UI;
- the PR description MUST contain both checked Owner attestations:
  - `[x] Human/Owner: vollständigen PR-Diff geprüft.`
  - `[x] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`
- the Owner MUST submit a GitHub PR review for the exact current PR head commit with either `💪` or `okay`;
- a review attached to an older commit is invalid after a new push;
- successful CI, AI review or policy evaluation MUST NOT be interpreted as merge authorization;
- AI agents MAY prepare branches, commits, PRs, reviews and fixes but MUST STOP before MERGE;
- an AI client may invoke merge only after valid Owner evidence and a separate explicit human merge instruction;
- `build-and-test` remains the stable final required check; heavy software validation remains separated as `technical-validation`.

Authority: `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

## Mandatory concept gate before autonomous agents
No autonomous or semi-autonomous agent may be created, enabled, granted mutation capability, connected to production credentials or allowed to execute a DevelopmentChain phase unless a predefined concept has first been written into the roadmap and explicitly approved by the Human/Owner.

The concept MUST define at minimum:
1. agent purpose and owner;
2. provider/client profile;
3. exact capabilities and prohibited capabilities;
4. target systems/resources;
5. risk classification;
6. human approval points;
7. mutation points;
8. test/verification points;
9. telemetry/audit evidence;
10. rollback/kill-switch procedure;
11. exit criteria and next-phase gate.

Agent creation from an ad-hoc chat request, prompt, model suggestion or tool output is prohibited when this concept does not already exist and is not Human/Owner-approved.

Authority: `docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`.

## Mandatory mutation and verification gate
Any DevelopmentChain step that requires a state change in GitHub, Supabase, Stripe, Render or another production-connected platform MUST follow this sequence:

`CONCEPT → HUMAN APPROVAL → PRE-MUTATION TEST → MUTATION → POST-MUTATION VERIFICATION → EVIDENCE → ROADMAP UPDATE → NEXT PHASE`

Binding rules:
- a mutation MUST NOT be executed before the corresponding concept/ADR/runbook and Human/Owner approval exist;
- a mutation MUST identify the exact environment, resource, expected effect and rollback path;
- pre-mutation validation MUST establish the baseline and prove rollback readiness;
- post-mutation verification MUST prove the intended state and check for unintended side effects;
- mutation evidence MUST include timestamp, actor, target, before/after state, relevant request/trace/deployment IDs and verification result where available;
- the next roadmap step remains BLOCKED until the required mutation is complete, verified and documented as PASS;
- failed or inconclusive verification requires STOP/ROLLBACK or a new Human/Owner-approved remediation step;
- development branches MUST NOT perform production Stripe/Supabase/Render mutation directly.

## Platform mutation schedule
The currently deferred platform changes are assigned to explicit roadmap gates rather than being executed opportunistically.

| Platform | Planned roadmap point | Allowed mutation scope | Required verification before next step |
|---|---|---|---|
| Supabase | M5 Observability/Telemetry/Audit, only if schema/persistence changes are required by ADR-0059/ADR-0056 | audit/telemetry persistence, immutable evidence support, policy-bound IAM data required by the approved M5 design | migration dry-run/staging validation, RLS/permission tests, audit event write/read verification, rollback evidence; M6 remains blocked until PASS |
| Stripe | M7 Production Platform Mutation Gate, only for explicitly pre-defined billing/webhook/credential changes with a dedicated ADR/runbook | no generic Stripe mutation; only named production changes approved by Owner and tied to a specific billing/agent integration requirement | test-mode or non-destructive verification where applicable, webhook/idempotency verification, metadata/customer/subscription mapping checks, rollback/revocation evidence; M8 remains blocked until PASS |
| Render | M7 Deployment Identity | protected deployment identity, environment-scoped deployment credentials/hooks, production environment protection, rotation/revocation configuration | preflight, deployment identity test, controlled deploy, health/readiness verification, rollback deployment evidence; M8 remains blocked until PASS |

Notes:
- M4 performs no production Stripe/Supabase/Render mutation.
- M5 may require Supabase mutation only if the approved observability/audit design needs persistence changes. If no mutation is required, that fact must be documented as `NOT REQUIRED` with evidence.
- M6 is supply-chain/provenance work and does not by itself authorize Stripe/Supabase/Render production mutation.
- M7 is the primary production mutation window for deployment identity and explicitly approved external platform changes.
- Stripe business/billing remediations that are not required by the AI-Agent DevelopmentChain remain a separate billing/product workstream and require their own ADR/roadmap entry before mutation.

## Current status quo
- PR #192 established the provider-neutral AI-Agent architecture and Documentation Freeze basis.
- PR #194 closed M2G.
- PR #195/#196 completed M3 CI Hardening and the docs-only Fast-Path proof.
- PR #197 established the Human/Owner checklist + current-commit review gate.
- PR #198 merged the canonical M4 Agent-IAM implementation into `main` at `69f719683b60ba6aadc0022381c6cecc430f0ea5` after Human/Owner review.
- PRs #200 and #201 are superseded parallel M4 drafts from the older PR-#197 baseline and are not independent roadmap phases.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.
- M0, M1, M2/M2G and M3 are COMPLETE.
- M4 Agent IAM is IMPLEMENTED; PR #202 performs the final closure hardening and roadmap synchronization.

## DevelopmentChain M0–M9

| Phase | Status | Authority | Mutation / test gate | Next gate |
|---|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | read-only evidence baseline | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection + Human/Owner policy | GitHub policy changes require Owner review and validation | preserve Owner gate |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | documentation only; no production mutation | keep synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | freeze verification | implementation phases authorized sequentially |
| M3 CI Hardening | COMPLETE | ADR-0060 + ADR-0053 + PR #195/#196 | CI mutation validated by full-path and docs-fast-path tests | preserve full/fast paths |
| M4 Agent IAM | CLOSURE IN REVIEW | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 + PR #198/#202 | no production platform mutation; negative IAM tests + Owner gate | merge PR #202 after Owner review |
| M5 Observability/Telemetry/Audit | BLOCKED BY M4 CLOSURE | ADR-0059 + ADR-0056 | implement instrumentation first; if Supabase persistence mutation is required: staging/dry-run → Owner approve → mutate → verify → evidence | authorize only after M4 closure; M6 blocked until M5 verification PASS |
| M6 Supply Chain | BLOCKED BY M5 | ADR-0060 | SBOM/provenance/attestation tests; no external platform mutation unless separately approved | proceed only after provenance evidence PASS |
| M7 Deployment Identity + Production Platform Mutation Gate | BLOCKED BY M6 | ADR-0061 + platform-specific ADR/runbooks | Render mutation mandatory if target design requires it; Stripe/Supabase only when explicitly named in approved concept; each mutation must verify PASS before M8 | M8 blocked until all required M7 mutations/tests PASS |
| M8 Agent Cutover | BLOCKED BY M7 | ADR-0062 | controlled client cutover test; no autonomous agent creation without approved concept gate | proceed only after cutover verification PASS |
| M9 Assurance | BLOCKED BY M8 | ADR-0063 | negative tests, prompt/tool injection, replay, exfiltration, kill-switch/break-glass/rollback drills | final assurance requires PASS evidence |

## M4 canonical implementation scope
M4 generalizes the existing ESS-0018/Supabase capability model into the provider-neutral Agent Control Plane without replacing existing tool-specific grants.

Required invariants:
- canonical agent capabilities are explicit and non-inheriting;
- `MERGE` is not an agent capability;
- principal attribution binds human actor, app, logical agent, session, request and credential holder;
- provider/model identifiers are metadata only;
- unknown principals/capabilities and missing grants fail closed;
- LOW: READ/ANALYZE/PLAN; MEDIUM: BRANCH/COMMIT/PR/CI_REQUEST; HIGH: DEPLOY_REQUEST; CRITICAL: PRODUCTION_MUTATION;
- contextual risk may increase but never reduce capability minimum risk;
- HIGH requires current Human Approval bound to actor + agent + capability + target;
- CRITICAL requires the same Human Approval plus verified Step-up;
- Development principals cannot execute `PRODUCTION_MUTATION`;
- `DEPLOY_REQUEST` never implies `PRODUCTION_MUTATION`;
- kill-switch policy can deny mutating agent capabilities;
- existing tool-specific PolicyGate/CapabilityGrant/Approval controls remain an additional independent layer.

## Protected invariants
- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- CoinMarketCap remains decommissioned;
- Kraken public REST only;
- protected `main` + stable `build-and-test` required check;
- every PR requires visible Human/Owner review, both Owner attestations and a current-commit `💪`/`okay` review;
- AI agents cannot self-approve or autonomously merge;
- no autonomous agent may be created or enabled before its Human/Owner-approved roadmap concept exists;
- no production Stripe/Supabase/Render mutation from development branches without explicit production handoff authorization;
- no next roadmap phase may start while a required mutation/test gate is incomplete, failed or undocumented;
- agent-generated code receives no trust advantage over human-generated code;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS.

## Assessment of PR #198 versus the original roadmap
PR #198 did not reorder M5–M9 and did not authorize production platform mutation. It implemented the already-planned M4 provider-neutral Agent-IAM slice and preserved the original sequencing `M4 → M5 → M6 → M7 → M8 → M9`.

Therefore restoring `main` to PR #197 is NOT REQUIRED and would remove an Owner-reviewed M4 implementation without restoring any Stripe/Supabase/Render production state. PR #197 remains the governance baseline for the Human/Owner gate; PR #198 is the current code baseline.

## Next action
Validate PR #202 under the Human/Owner gate. After its explicit Owner-approved merge, set M4 to COMPLETE and authorize M5. Before any M5 external mutation, complete the M5 concept, identify whether Supabase mutation is REQUIRED or NOT REQUIRED, obtain Human/Owner approval, execute the defined tests/mutation sequence, record PASS evidence and only then authorize M6.
