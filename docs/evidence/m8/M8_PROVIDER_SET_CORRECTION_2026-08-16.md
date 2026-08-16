# M8 Provider Set Correction — Owner 2026-08-16

**Document ID:** M8-PROVIDER-SET-CORRECTION-2026-08-16  
**Status:** ACTIVE EVIDENCE  
**Authority:** Human/Owner decision (SvenKulessa)

## Decision

Google AI Studio is **not** part of the CAPITAL-AI DEVELOPMENT Chain or AI value chain.

**Canonical active providers:**

1. ChatGPT (`chatgpt-github-connector`)
2. Claude (`claude-code-cli`)
3. Grok (`grok-xai-connector`)

**Retired aliases (DENY / RETIRED in control plane):**

- `google-ai-studio`
- `notebooklm`
- `gemini`

## Code impact

- `src/platform/Security/providerProfile.ts` — registry reduced to three canonical profiles; `RETIRED_PROVIDER_ALIASES`; `evaluateProviderCutoverReadiness` returns `RETIRED` for retired aliases; `getCanonicalValueChainProviderInventory`.
- `src/platform/Supervisor/agentProviderObservation.ts` — ESS-0002 chain observation of the three providers.
- `src/platform/Supervisor/supervisor.ts` — `getSupervisorStatus()` includes `agentProviderChain` and lightweight `findings`.
- `docs/architecture/ai-agent/AI_AGENT_PROVIDER_PROFILE_CONTRACT.md` — contract updated.

## Documentation hygiene

Historical M8 evidence files that still mention Google AI Studio / NotebookLM as active profiles are **not rewritten**. They remain append-only historical evidence. This note supersedes their provider-set assumptions for all forward work.

Historical value-chain diagrams in `docs/architecture/AI_VALUE_CHAIN_VALIDATION.md` (ARCH-CHAIN-0001) that list "Google AI Studio" as Stage 1 are superseded for operational authority by this Owner decision and the provider profile contract. A follow-up doc revision may restate the normative chain as ChatGPT → Claude → Grok → Documentary → Supervisor → … without rewriting past findings.

## Verification

- Unit tests: `tests/unit/providerProfile.test.ts` (canonical three + retired DENY/RETIRED).
- Supervisor status exposes `agentProviderChain.expectedProviders === [chatgpt, claude, grok]`.

## Related

- ADR-0062, ESS-0019, ESS-0002
- REPORT-SVC-AI-VC-0001 (update in same change set where applicable)
