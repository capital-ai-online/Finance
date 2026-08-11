# AI Agent Trust Boundaries

TB1 Human <-> AI client: user intent is authenticated but natural-language content is not authorization policy.
TB2 AI client <-> Control Plane: requests require attributable identity, capability and risk evaluation.
TB3 Control Plane <-> tool/connector: connector holds credentials; model receives minimum results.
TB4 Repository branch <-> protected main: PR/CI/ruleset boundary.
TB5 CI <-> artifact/deployment: verified SHA and provenance boundary.
TB6 Deployment <-> runtime/data/billing: production credential and environment boundary.
TB7 External/retrieved content <-> agent: always untrusted; cannot grant capability.
TB8 Telemetry exporter <-> audit store: redaction and retention boundary.