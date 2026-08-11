# AI Agent Platform Comparison and Forced Decision

Date: 2026-08-11

## Current external patterns

OpenAI Apps SDK is MCP-based and the 2026 Agents SDK emphasizes controlled sandboxes and separation of agent harness from compute. Anthropic Claude Code uses explicit permission modes/tool allow-deny rules, MCP and documented LLM-gateway patterns for centralized auth, usage, budgets and audit. Gemini function calling explicitly leaves execution to the application, and Google offers managed agents in secure Linux sandboxes. NotebookLM is a source-grounded research assistant; enterprise offerings add IAM/VPC-SC/data protections but it is not an execution-control plane.

## CAPITAL-AI comparison

| Surface | Strength | Correct role | Must not become |
|---|---|---|---|
| ChatGPT | connectors/MCP/Apps, agent harness | research + controlled execution client | repository/platform trust root |
| Claude Code | code-native permissions/MCP/gateway | controlled execution client | bypass-permission production admin |
| Google AI Studio/Gemini | rapid prototyping, function calling, managed agents | development/prototype execution profile | canonical production authority |
| NotebookLM | source grounding/citations | research/evidence plane | mutation agent |

## Forced decision

CAPITAL-AI SHALL use a provider-neutral Agent Control Plane and explicit plane separation. Provider choice becomes an interchangeable profile decision. Authorization, risk, audit, provenance and deployment remain CAPITAL-AI-owned contracts.

This supersedes any workflow assumption that Google AI Studio, Claude or ChatGPT is itself the development/production trust boundary.

## Research basis
Official OpenAI Apps SDK and Agents SDK documentation; Anthropic Claude Code security/IAM/MCP/LLM-gateway documentation; Google Gemini function calling, managed agents and AI Studio build documentation; Google NotebookLM/Enterprise privacy and IAM documentation; NIST SSDF/SP 800-218A, SLSA/OpenSSF and OpenTelemetry/W3C Trace Context standards.