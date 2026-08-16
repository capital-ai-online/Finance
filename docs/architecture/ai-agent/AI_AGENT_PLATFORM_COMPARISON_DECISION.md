# AI Agent Platform Comparison and Forced Decision

Date: 2026-08-11  
Updated: 2026-08-16 (Owner provider-set correction)

## Current external patterns

OpenAI Apps SDK is MCP-based and the Agents SDK emphasizes controlled sandboxes and separation of agent harness from compute. Anthropic Claude Code uses explicit permission modes/tool allow-deny rules, MCP and documented LLM-gateway patterns for centralized auth, usage, budgets and audit. xAI Grok operates via GitHub connector / SuperGrok session with host-side grants. Historical Google AI Studio/Gemini and NotebookLM surfaces are **retired** from the CAPITAL-AI active value chain (Owner 2026-08-16).

## CAPITAL-AI comparison

| Surface | Strength | Correct role | Must not become |
|---|---|---|---|
| ChatGPT | connectors/MCP/Apps, agent harness | research + controlled execution client | repository/platform trust root |
| Claude Code | code-native permissions/MCP/gateway | controlled execution client | bypass-permission production admin |
| Grok (xAI) | GitHub MCP / Grok Chat connector | research + controlled execution client | repository/platform trust root |
| Google AI Studio/Gemini | (historical) rapid prototyping | **RETIRED** — not in active value chain | canonical production authority |
| NotebookLM | (historical) source grounding | **RETIRED** — not in active value chain | mutation agent |

## Forced decision

CAPITAL-AI SHALL use a provider-neutral Agent Control Plane and explicit plane separation. Provider choice becomes an interchangeable profile decision among **ChatGPT, Claude and Grok**. Authorization, risk, audit, provenance and deployment remain CAPITAL-AI-owned contracts.

This supersedes any workflow assumption that Google AI Studio, Claude, ChatGPT or Grok is itself the development/production trust boundary.

## Research basis
Official OpenAI Apps SDK and Agents SDK documentation; Anthropic Claude Code security/IAM/MCP/LLM-gateway documentation; xAI Grok connector patterns; NIST SSDF/SP 800-218A, SLSA/OpenSSF and OpenTelemetry/W3C Trace Context standards.
