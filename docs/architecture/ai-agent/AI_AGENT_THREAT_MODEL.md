# AI Agent Threat Model

Primary threats: prompt/tool injection; confused deputy; capability escalation; secret exfiltration; malicious MCP/tool server; poisoned repository/retrieval content; unauthorized production mutation; replay/idempotency failure; CI/supply-chain compromise; audit tampering; model/provider outage or behavior drift; cross-agent race/branch conflicts.

Required mitigations: deny-by-default capabilities, explicit schemas, trusted tool registry, branch isolation, protected main, human gates for HIGH/CRITICAL, redaction, immutable audit evidence, idempotency, SHA-pinned actions, SBOM/provenance, kill switch, time-limited break-glass and negative tests.

Residual model risk is never accepted as authorization evidence.