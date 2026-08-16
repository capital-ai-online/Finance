# ADR-0057 — Provider-Neutral Agent Control Plane and Plane Separation

Status: ACCEPTED (provider-set clarified 2026-08-16)
Date: 2026-08-11

## Context
CAPITAL-AI is operated through multiple AI surfaces. Direct provider-specific privilege creates inconsistent authorization, audit and rollback semantics.

**Owner clarification 2026-08-16:** The active DEVELOPMENT Chain / AI value-chain agent providers are **ChatGPT, Claude and Grok**. Google AI Studio, NotebookLM and Gemini are **not** part of the active value chain (retired aliases in the control plane).

## Decision
Adopt a provider-neutral Agent Control Plane as the only trust root for AI-assisted execution. Separate Research & Evidence, Agent Execution, Control and Production planes. Provider products are profiles/clients, never authority sources.

Canonical profiles (registry):

- `chatgpt-github-connector` — Research + controlled Execution
- `claude-code-cli` — controlled Execution
- `grok-xai-connector` — Research + controlled Execution

Retired aliases resolve to DENY/RETIRED: `google-ai-studio`, `notebooklm`, `gemini`.

## Alternatives rejected
- Provider-specific direct admin access: rejected for privilege drift and audit fragmentation.
- Single-provider lock-in: rejected for resilience and portability.
- Model-prompt-only policy: rejected because prompts are not enforceable authorization controls.

## Security
Deny-by-default, least privilege, no implicit privilege inheritance, no AI self-approval for HIGH/CRITICAL actions.

## Consequences
Requires common identity/capability/audit contracts and provider adapters. Enables future provider replacement without rewriting production authorization.

## Migration
Document-first M2; implementation via M8 provider profiles. Provider-set correction evidence: `docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md`.

## Rollback
Revert control-plane adoption before cutover; existing provider profiles remain capability-gated until full M8 evidence.

## Verification
ESS-0019 plus traceability matrix must map every provider surface to one plane and capability set. Unit tests assert three canonical profiles and RETIRED for former Google surfaces.
