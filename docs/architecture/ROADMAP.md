# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-11
Baseline branch: `main`
Baseline commit: `e2a405f4435e217ff2ba08f35a29835d4c41d5d9` (PR #192 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Detailed historical evidence remains in ADR/evidence documents.

## Mandatory maintenance rule
Every merged DevelopmentChain step MUST update this file with the new `main` SHA, status date, affected phase status, next gate and evidence pointer. A roadmap-changing PR is incomplete without this update.

## Current status quo after PR #192
- PR #191 remains the consolidated code baseline immediately preceding the documentation freeze.
- PR #192 merged the provider-neutral AI-Agent architecture, ESS-0019, ADR-0057..0063, cross-cutting architecture documents, traceability and implementation roadmap.
- PR #190 is superseded and closed; its deployment-code mutation was not carried forward.
- CoinMarketCap remains removed/deactivated.
- Kraken remains public REST evidence only.
- Required CI check contract remains the stable technical name `build-and-test`.
- M0 Evidence Baseline is COMPLETE.
- M1 Git Guardrails are COMPLETE for the current single-owner topology.
- M2 Documentation Freeze is COMPLETE.
- M3 CI Hardening is now authorized.

## DevelopmentChain M0–M9
| Phase | Status | Authority | Next gate |
|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection policy/CODEOWNERS | independent-review enhancements when topology permits |
| M2A Architecture Inventory | COMPLETE | ESS/ADR inventory + platform comparison | preserve provider-neutral target |
| M2B ESS Definition | COMPLETE | ESS-0019 | maintain as control-plane contract |
| M2C ADR Definition | COMPLETE | ADR-0057..0063 | update only by reviewed architecture change |
| M2D Trust/Threat/Cross-docs | COMPLETE | `docs/architecture/ai-agent/*` | keep synchronized with implementation |
| M2E Traceability | COMPLETE | AI Agent traceability matrix | update every phase |
| M2F Implementation Roadmap | COMPLETE | M0–M9 implementation roadmap | execute phase gates in order |
| M2G Documentation Freeze | COMPLETE | freeze policy + PR #192 | M3 authorized |
| M3 CI Hardening | IN PROGRESS | ADR-0060 + ADR-0053 + Git governance | secure Git source verification, enforce workflow security, reduce avoidable CI cost while preserving required checks |
| M4 Agent IAM | BLOCKED BY M3 | ADR-0058 + ADR-0050/0051 | begin only after M3 closure |
| M5 Observability/Telemetry/Audit | BLOCKED BY M3 | ADR-0059 + ADR-0056 | begin after M4 sequencing decision |
| M6 Supply Chain | BLOCKED BY M3 | ADR-0060 | extend M3 evidence into provenance/attestation |
| M7 Deployment Identity | BLOCKED | ADR-0061 | implement only after prior gates |
| M8 Agent Cutover | BLOCKED | ADR-0062 | no cutover yet |
| M9 Assurance | BLOCKED | ADR-0063 | final negative tests and drills |

## Forced AI-agent architecture decision
CAPITAL-AI uses a provider-neutral Agent Control Plane with four planes: Research & Evidence, Agent Execution, Control, Production. ChatGPT and Claude are controlled execution clients; Google AI Studio/Gemini is a development/prototype profile; NotebookLM is research/evidence only. No provider is a trust root.

## Protected invariants
- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- CoinMarketCap remains decommissioned;
- Kraken public REST only;
- protected `main` + stable `build-and-test` required check;
- no production Stripe/Supabase/Render mutation from development branches without explicit production handoff authorization;
- agent-generated code receives no trust advantage over human-generated code;
- every DevelopmentChain phase updates ROADMAP + traceability + affected ADR/ESS;
- M4–M9 implementation may not bypass M3 closure.

## Next action
Execute M3 CI Hardening from the frozen PR #192 architecture baseline. M3 must preserve `build-and-test`, tighten Git source integrity beyond `xz --test`, keep immutable Action SHAs/minimal permissions, and remove avoidable high-cost CI work without weakening validation.