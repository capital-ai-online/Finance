# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-11
Baseline branch: `main`
Baseline commit: `69f719683b60ba6aadc0022381c6cecc430f0ea5` (PR #198 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Detailed historical evidence remains in ADR/evidence documents.

## Mandatory maintenance rule
Every merged DevelopmentChain step MUST update this file with the new `main` SHA, status date, affected phase status, next gate and evidence pointer. A roadmap-changing PR is incomplete without this update.

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

## Current status quo
- PR #192 established the provider-neutral AI-Agent architecture and Documentation Freeze basis.
- PR #194 closed M2G.
- PR #195/#196 completed M3 CI Hardening and the docs-only Fast-Path proof.
- PR #197 established the Human/Owner checklist + current-commit review gate.
- PR #198 merged the canonical M4 Agent-IAM implementation into `main` at `69f719683b60ba6aadc0022381c6cecc430f0ea5`.
- PRs #200 and #201 are superseded parallel M4 drafts from the older PR-#197 baseline and are not independent roadmap phases.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.
- M0, M1, M2/M2G and M3 are COMPLETE.
- M4 Agent IAM is IMPLEMENTED; this consolidation PR performs the final closure hardening and documentation synchronization.

## DevelopmentChain M0–M9

| Phase | Status | Authority | Next gate |
|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection + Human/Owner policy | preserve Owner gate |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | keep synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | implementation phases authorized sequentially |
| M3 CI Hardening | COMPLETE | ADR-0060 + ADR-0053 + PR #195/#196 | preserve full/fast paths |
| M4 Agent IAM | CLOSURE IN REVIEW | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 + PR #198 | merge this single consolidation PR after Owner review |
| M5 Observability/Telemetry/Audit | BLOCKED BY M4 CLOSURE | ADR-0059 + ADR-0056 | authorize immediately after M4 closure merge |
| M6 Supply Chain | BLOCKED BY M4/M5 | ADR-0060 | provenance/attestation |
| M7 Deployment Identity | BLOCKED | ADR-0061 | protected deployment identity |
| M8 Agent Cutover | BLOCKED | ADR-0062 | controlled client cutover |
| M9 Assurance | BLOCKED | ADR-0063 | negative tests and drills |

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
- no production Stripe/Supabase/Render mutation from development branches without explicit production handoff authorization;
- agent-generated code receives no trust advantage over human-generated code;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS.

## Next action
Validate this single M4 consolidation/closure PR. After its explicit Human/Owner-approved merge, set M4 to COMPLETE and authorize M5 Observability/Telemetry/Audit. No additional M4 implementation PR is authorized.
