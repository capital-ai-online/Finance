# AI Agent Incident Response

Triggers include unauthorized tool calls, secret exposure, prompt/tool injection, unexpected production mutation, audit gaps, compromised connector/MCP server and provider behavior drift.

Response: kill agent mutation -> preserve read-only diagnostics -> revoke/rotate credentials -> freeze branch/deploy -> collect correlated evidence -> assess blast radius -> rollback -> post-incident review -> update policy/tests.

Break-glass is time-limited, attributable and disabled by default. Every use requires retrospective review.