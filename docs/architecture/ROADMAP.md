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
- PR #197 merged the streamlined Human/Owner review gate using PR checkboxes + current-commit review.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.
- Required CI check contract remains the stable technical name `build-and-test`.
- M0 Evidence Baseline is COMPLETE.
- M1 Git Guardrails are COMPLETE for the current single-owner topology.
- M2 Documentation Freeze is COMPLETE.
- M3 CI Hardening is COMPLETE.
- M4 Agent IAM is IN PROGRESS on a dedicated branch/PR and must pass the Human/Owner gate before merge.

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
| M3 CI Hardening | COMPLETE | ADR-0060 + ADR-0053 + PR #195/#196 evidence | preserve Full Path, Docs Fast Path and Human/Owner gate |
| M4 Agent IAM | IN PROGRESS | ADR-0058 + ADR-0050/0051 + `src/platform/Security/agentAuthorization.ts` | negative authorization tests + Owner-reviewed M4 merge |
| M5 Observability/Telemetry/Audit | BLOCKED BY M4 | ADR-0059 + ADR-0056 | begin after M4 closure |
| M6 Supply Chain | BLOCKED BY M4/M5 | ADR-0060 | extend M3 evidence into provenance/attestation |
| M7 Deployment Identity | BLOCKED | ADR-0061 | implement only after prior gates |
| M8 Agent Cutover | BLOCKED | ADR-0062 | no cutover yet |
| M9 Assurance | BLOCKED | ADR-0063 | final negative tests and drills |

## M4 implementation scope
M4 generalizes the already implemented Supabase-specific ADR-0050/0051 IAM foundation into a provider-neutral DevelopmentChain authorization contract. The implementation binds human actor, app/client, logical agent and session; uses explicit capabilities and risk classes; denies by default; requires approval for HIGH/CRITICAL and step-up for CRITICAL; and keeps `MERGE` outside the delegable agent capability set.

The existing Supabase `capability_grants`, approval artifacts and PolicyGate remain intact as a lower-level product/tool IAM profile. M4 does not perform live Supabase, Stripe or Render mutation.

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
- `MERGE` is not a delegable Agent Execution capability;
- provider/model metadata never grants authority;
- no production Stripe/Supabase/Render mutation from development branches without explicit production handoff authorization;
- agent-generated code receives no trust advantage over human-generated code;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS;
- M5–M9 implementation may not bypass preceding phase closures.

## Next action
Validate M4 through full CI and negative authorization tests, then complete the Human/Owner review gate. After the Owner explicitly merges the M4 PR, update this roadmap to the M4 merge SHA and authorize M5 Observability/Telemetry/Audit.
