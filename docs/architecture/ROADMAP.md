# CAPITAL-AI Enterprise Roadmap

Status date: 2026-08-11
Baseline branch: `main`
Baseline commit: `1c3706c4f24e5f5a9fe5b0398a2fcd5bee758b17` (PR #191 merge)
Platform version: `0.6.0`
Canonical role: current-state DevelopmentChain status index. Detailed historical evidence remains in ADR/evidence documents.

## Mandatory maintenance rule
Every merged DevelopmentChain step MUST update this file with the new `main` SHA, status date, affected phase status, next gate and evidence pointer. A roadmap-changing PR is incomplete without this update.

## Current status quo after PR #191
- PR #191 is the current consolidation baseline.
- PR #182/#184/#185 are superseded and closed.
- CoinMarketCap remains removed/deactivated.
- Kraken is public REST evidence only; no private Kraken trading credentials are part of the architecture.
- Required CI check contract is the stable technical name `build-and-test`.
- M0 Evidence Baseline is complete.
- M1 Git Guardrails are complete for the current single-owner topology.
- Existing ESS-0018 + ADR-0050/0051 implement part of Agent IAM.
- ADR-0056/O1 implements the observability/telemetry baseline.

## DevelopmentChain M0–M9
| Phase | Status | Authority | Next gate |
|---|---|---|---|
| M0 Evidence Baseline | COMPLETE | `docs/evidence/m0/*` | preserve evidence baseline |
| M1 Git Guardrails | COMPLETE | main protection policy/CODEOWNERS | independent-review enhancements when topology permits |
| M2A Architecture Inventory | COMPLETE IN PR #192 | ESS/ADR inventory + platform comparison | merge docs-only baseline |
| M2B ESS Definition | COMPLETE IN PR #192 | ESS-0019 | review/merge |
| M2C ADR Definition | COMPLETE IN PR #192 | ADR-0057..0063 | review/merge |
| M2D Trust/Threat/Cross-docs | COMPLETE IN PR #192 | `docs/architecture/ai-agent/*` | review/merge |
| M2E Traceability | COMPLETE IN PR #192 | AI Agent traceability matrix | review/merge |
| M2F Implementation Roadmap | COMPLETE IN PR #192 | M0–M9 implementation roadmap | review/merge |
| M2G Documentation Freeze | PENDING MERGE | freeze policy | becomes COMPLETE only after PR #192 merges |
| M3 CI Hardening | BLOCKED BY M2G | ADR-0060 | no implementation yet |
| M4 Agent IAM | BLOCKED BY M2G | ADR-0058 + ADR-0050/0051 | no further implementation yet |
| M5 Observability/Telemetry/Audit | BLOCKED BY M2G | ADR-0059 + ADR-0056 | no further implementation yet |
| M6 Supply Chain | BLOCKED BY M2G | ADR-0060 | no implementation yet |
| M7 Deployment Identity | BLOCKED BY M2G | ADR-0061 | PR #190 deployment code not carried forward |
| M8 Agent Cutover | BLOCKED BY M2G | ADR-0062 | no implementation yet |
| M9 Assurance | BLOCKED BY M2G | ADR-0063 | no implementation yet |

## Forced AI-agent architecture decision
CAPITAL-AI adopts a provider-neutral Agent Control Plane with four planes: Research & Evidence, Agent Execution, Control, Production. ChatGPT and Claude are controlled execution clients; Google AI Studio/Gemini is a development/prototype profile; NotebookLM is research/evidence only. No provider is a trust root. See `AI_AGENT_PLATFORM_COMPARISON_DECISION.md` and ESS-0019.

## Existing enterprise workstreams preserved
R-001 No-Demo-Data/scoring provenance remains technically complete; R-002 runtime artifact immutability remains complete; R-003 durable Stripe inbox remains complete; R-004 PDF-credit ledger and R-101 outbox/lease retain their production-handoff evidence requirements; ADR-0014 decomposition continues as an independent architecture stream but must not bypass the M2 documentation-first gate when touching AI-Agent DevelopmentChain controls.

## Protected invariants
- no synthetic/demo financial scores in production;
- fail-closed IAM/auth/runtime-secret semantics;
- CoinMarketCap remains decommissioned;
- Kraken public REST only;
- protected `main` + stable `build-and-test` required check;
- no production Stripe/Supabase/Render mutation from development/documentation branches;
- agent-generated code receives no trust advantage over human-generated code;
- M3–M9 implementation cannot start before M2G Documentation Freeze.

## Next action
Review and merge documentation-only PR #192. After merge, update this baseline to the PR #192 merge SHA and mark M2G COMPLETE. Only then may M3 begin.