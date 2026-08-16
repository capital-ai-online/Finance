# M8 / Value Chain — Provider Set Correction (ChatGPT, Claude, Grok)

**Document ID:** M8-PROVIDER-SET-CORRECTION-2026-08-16  
**Status:** OWNER DECISION IMPLEMENTED  
**Date:** 2026-08-16  
**Authority:** Owner instruction; ADR-0062; AI_AGENT_PROVIDER_PROFILE_CONTRACT; ROADMAP-INTEGRATED-DC-SA-0001  

## Decision

Google AI Studio is **not** part of the CAPITAL-AI DEVELOPMENT Chain or AI value chain.  
Canonical agent providers:

1. **ChatGPT** (`chatgpt-github-connector`)
2. **Claude** (`claude-code-cli`)
3. **Grok** (`grok-xai-connector`)

NotebookLM and Gemini remain non-chain / retired aliases.

## Code changes

- `src/platform/Security/providerProfile.ts` — active registry = three canonical providers; `RETIRED_PROVIDER_ALIASES`; `getCanonicalValueChainProviderInventory()`
- Tests updated accordingly
- Supervisor observes the canonical chain via `agentProviderObservation.ts`

## Historical evidence

Earlier M8 evidence files that still mention Google AI Studio / NotebookLM as profiles remain valid as **historical snapshots**. They are not rewritten; this document supersedes the active provider set.

## Governance

Model/provider identity still grants **no** authority. Capability policy remains external to the model.
