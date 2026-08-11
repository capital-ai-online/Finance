# AI Agent IAM Model

Principals: human actor, AI application/client, agent/session, service/tool identity, CI/release identity and break-glass identity.

Authorization is capability-based and contextual: principal + environment + resource + action + risk + policy version + approval state.

Existing CAPITAL-AI IAM/step-up and ADR-0050/0051 grants remain authoritative implementation foundations. Provider accounts are authentication inputs, not application roles. Raw infrastructure credentials stay behind tools/connectors whenever possible.