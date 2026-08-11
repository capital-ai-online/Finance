# ADR-0057 — Provider-Neutral Agent Control Plane and Plane Separation

Status: PROPOSED
Date: 2026-08-11

## Context
CAPITAL-AI is operated through multiple AI surfaces (ChatGPT, Claude Code, Google AI Studio/Gemini and source-grounded research tools such as NotebookLM). Direct provider-specific privilege creates inconsistent authorization, audit and rollback semantics.

## Decision
Adopt a provider-neutral Agent Control Plane as the only trust root for AI-assisted execution. Separate Research & Evidence, Agent Execution, Control and Production planes. Provider products are profiles/clients, never authority sources.

NotebookLM is restricted to the Research & Evidence Plane. Google AI Studio is a development/prototyping profile. ChatGPT and Claude may be execution clients only through capability-gated tools/connectors.

## Alternatives rejected
- Provider-specific direct admin access: rejected for privilege drift and audit fragmentation.
- Single-provider lock-in: rejected for resilience and portability.
- Model-prompt-only policy: rejected because prompts are not enforceable authorization controls.

## Security
Deny-by-default, least privilege, no implicit privilege inheritance, no AI self-approval for HIGH/CRITICAL actions.

## Consequences
Requires common identity/capability/audit contracts and provider adapters. Enables future provider replacement without rewriting production authorization.

## Migration
Document-first M2; implementation only after Documentation Freeze.

## Rollback
Revert control-plane adoption before cutover; existing provider profiles remain read-only/isolated until M8.

## Verification
ESS-0019 plus traceability matrix must map every provider surface to one plane and capability set.