# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-11
Baseline branch: `main`
Baseline commit: `c093052c22ed620bc9b086ba4ec05612d7dd2150` (PR #197 merge)
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
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.
- M0, M1, M2/M2G and M3 are COMPLETE.
- M4 Agent IAM is now IN PROGRESS on baseline `c093052c22ed620bc9b086ba4ec05612d7dd2150`.

## DevelopmentChain M0–M9

| Phase | Status | Authority | Next gate |
|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection + Human/Owner policy | preserve Owner gate |
| M2 Architecture/Documentation | COMPLETE | ESS-0019 + ADR-0057..0063 | keep synchronized |
| M2G Documentation Freeze | COMPLETE | PR #192/#194 | implementation phases authorized sequentially |
| M3 CI Hardening | COMPLETE | ADR-0060 + ADR-0053 + PR #195/#196 | preserve full/fast paths |
| M4 Agent IAM | IN PROGRESS | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | provider-neutral deny-by-default IAM + negative tests + Owner-reviewed merge |
| M5 Observability/Telemetry/Audit | BLOCKED BY M4 | ADR-0059 + ADR-0056 | begin only after M4 closure |
| M6 Supply Chain | BLOCKED BY M4/M5 | ADR-0060 | provenance/attestation |
| M7 Deployment Identity | BLOCKED | ADR-0061 | protected deployment identity |
| M8 Agent Cutover | BLOCKED | ADR-0062 | controlled client cutover |
| M9 Assurance | BLOCKED | ADR-0063 | negative tests and drills |

## M4 implementation scope
M4 generalizes the existing ESS-0018/Supabase capability model into the provider-neutral Agent Control Plane without replacing the existing tool-specific grants.

Required invariants:
- canonical agent capabilities are explicit and non-inheriting;
- `MERGE` is not an agent capability;
- principal attribution binds human actor, app, agent/session, request and credential holder;
- provider/model identifiers are metadata only;
- unknown principals/capabilities and missing grants fail closed;
- HIGH/CRITICAL operations require exact Human/Step-up evidence;
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
Validate M4 provider-neutral Agent IAM, negative tests and PolicyGate integration in the M4 pull request. The PR must stop at the Human/Owner gate. After an explicitly Owner-approved merge and post-merge evidence update, M4 may become COMPLETE and M5 may be authorized.
