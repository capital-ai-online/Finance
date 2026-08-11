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
- AI agents, ChatGPT, Claude and other execution clients MAY prepare branches, commits, PRs, reviews and fixes but MUST STOP before MERGE;
- an AI client may invoke merge only after the Owner checklist and current-commit review are valid and the human explicitly instructs the client to merge that specific PR;
- the stable required check `build-and-test` remains the final merge gate;
- expensive software validation is separated into `technical-validation`, so a missing Human/Owner approval can be rechecked without repeating the full technical pipeline.

Authority: `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`.

## Current status quo after PR #197

- PR #191 remains the consolidated code baseline preceding the documentation freeze.
- PR #192 merged the provider-neutral AI-Agent architecture, ESS-0019, ADR-0057..0063, cross-cutting architecture documents, traceability and implementation roadmap.
- PR #194 closed M2G and synchronized the Documentation Freeze.
- PR #195 implemented M3 CI Hardening through a regular pull request and Full-Path CI/Governance validation.
- PR #196 validated the Docs-only Fast Path.
- PR #197 merged the streamlined Human/Owner review gate using PR checkboxes + current-commit review comment and preserved `build-and-test` as the final required check.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.
- M0 Evidence Baseline is COMPLETE.
- M1 Git Guardrails are COMPLETE.
- M2 Documentation Freeze is COMPLETE.
- M3 CI Hardening is COMPLETE.
- M4 Agent IAM is ACTIVE / IN REVIEW.

## DevelopmentChain M0–M9

| Phase | Status | Authority | Next gate |
|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection policy/CODEOWNERS + Human/Owner approval policy | preserve Owner approval gate |
| M2A Architecture Inventory | COMPLETE | ESS/ADR inventory + platform comparison | preserve provider-neutral target |
| M2B ESS Definition | COMPLETE | ESS-0019 | maintain as control-plane contract |
| M2C ADR Definition | COMPLETE | ADR-0057..0063 | update only by reviewed architecture change |
| M2D Trust/Threat/Cross-docs | COMPLETE | `docs/architecture/ai-agent/*` | keep synchronized with implementation |
| M2E Traceability | COMPLETE | AI Agent traceability matrix | update every phase |
| M2F Implementation Roadmap | COMPLETE | M0–M9 implementation roadmap | execute phase gates in order |
| M2G Documentation Freeze | COMPLETE | freeze policy + PR #192/#194 | M3 executed |
| M3 CI Hardening | COMPLETE | ADR-0060 + ADR-0053 + PR #195/#196/#197 evidence | preserve Full Path, Docs Fast Path and Human/Owner gate |
| M4 Agent IAM | ACTIVE / IN REVIEW | ADR-0058 + ADR-0050/0051 + ESS-0018/0019 | validate provider-neutral deny-by-default capabilities and merge separation |
| M5 Observability/Telemetry/Audit | BLOCKED BY M4 | ADR-0059 + ADR-0056 | begin after M4 Human/Owner-approved merge |
| M6 Supply Chain | BLOCKED BY M4/M5 | ADR-0060 | extend M3 evidence into provenance/attestation |
| M7 Deployment Identity | BLOCKED | ADR-0061 | implement only after prior gates |
| M8 Agent Cutover | BLOCKED | ADR-0062 | no cutover yet |
| M9 Assurance | BLOCKED | ADR-0063 | final negative tests and drills |

## M4 Agent IAM implementation scope

M4 adds a provider-neutral authorization layer above the existing provider-specific capability profiles. The policy binds each authorization decision to an attributable human actor, app/client, agent, session and tool credential holder.

Canonical agent capabilities:

`READ → ANALYZE → PLAN → BRANCH → COMMIT → PR → CI_REQUEST → DEPLOY_REQUEST → PRODUCTION_MUTATION`

Risk classes:

- LOW: READ, ANALYZE
- MEDIUM: PLAN, BRANCH
- HIGH: COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST
- CRITICAL: PRODUCTION_MUTATION

Security rules:

- deny by default;
- every capability requires explicit grant evidence;
- HIGH/CRITICAL require matching human approval evidence;
- CRITICAL requires verified step-up;
- expired/mismatched/self-issued approval fails closed;
- provider/model identity grants no privilege;
- `MERGE` is not an AgentCapability and remains exclusively behind the Human/Owner PR approval gate;
- M4 introduces no new production Supabase/Stripe/Render mutation.

Evidence: `docs/evidence/m4/M4_AGENT_IAM_EVIDENCE.md`.

## Forced AI-agent architecture decision
CAPITAL-AI uses a provider-neutral Agent Control Plane with four planes: Research & Evidence, Agent Execution, Control, Production. ChatGPT and Claude are controlled execution clients; Google AI Studio/Gemini is a development/prototype profile; NotebookLM is research/evidence only. No provider is a trust root.

## Protected invariants

- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- CoinMarketCap remains decommissioned;
- Kraken public REST only;
- protected `main` + stable `build-and-test` required check;
- every PR requires visible Human/Owner review, two checked Owner attestations and a current-commit review with `💪` or `okay` before merge;
- AI agents cannot self-approve or autonomously merge;
- no production Stripe/Supabase/Render mutation from development branches without explicit production handoff authorization;
- agent-generated code receives no trust advantage over human-generated code;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS;
- M5–M9 implementation may not bypass preceding phase closures.

## Next action
Validate the M4 provider-neutral Agent IAM pull request through full CI/Governance and the Human/Owner review gate. After merge, record the M4 merge SHA, set M4 to COMPLETE and authorize M5 Observability/Telemetry/Audit.