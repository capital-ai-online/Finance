# ESS-0019 — Universal AI Agent Control Plane

Status: PROPOSED
Version: 1.0.0
Date: 2026-08-11
Owner: Platform Director
Scope: CAPITAL-AI DevelopmentChain M2–M9

## 1. Purpose

ESS-0019 defines the provider-neutral control plane for every AI application, coding agent, research assistant or model that can observe, propose or execute work against CAPITAL-AI.

The controlling invariant is:

`AI product != trust root`.

ChatGPT, Claude, Google AI Studio/Gemini, NotebookLM and future providers are execution or research profiles. Authorization, policy, audit, evidence and production mutation authority remain inside CAPITAL-AI governance.

## 2. Plane separation

CAPITAL-AI separates four planes:

1. **Research & Evidence Plane** — read-only source-grounded analysis, repository/document research and evidence production.
2. **Agent Execution Plane** — planning, file/tool operations and bounded changes inside an isolated workspace/branch.
3. **Control Plane** — identity, capability grants, risk classification, policy decisions, approvals, step-up, kill switch and audit correlation.
4. **Production Plane** — protected deployment/runtime/data/billing mutations requiring explicit production authority.

No provider may bypass the Control Plane to reach the Production Plane.

## 3. Provider profiles

- **ChatGPT**: execution/research client through GitHub/connectors/MCP/Apps or agent harnesses; never receives implicit Owner authority.
- **Claude / Claude Code**: execution client with permission-scoped tools/MCP; plan/read modes are preferred before write; bypass-permissions modes are prohibited for CAPITAL-AI production work.
- **Google AI Studio / Gemini**: development and prototyping profile; function calls remain application-executed and therefore MUST pass through CAPITAL-AI authorization before side effects. Managed agent sandboxes may be used only as isolated execution environments.
- **NotebookLM**: Research & Evidence Plane only. It may ground analysis in approved sources, but MUST NOT receive repository, infrastructure, billing or database mutation capabilities.

## 4. Capability model

Canonical capabilities:

`READ -> ANALYZE -> PLAN -> BRANCH -> COMMIT -> PR -> CI_REQUEST -> DEPLOY_REQUEST -> PRODUCTION_MUTATION`

Capabilities are granted to attributable principals, not model brands.

Default policy is deny-by-default. A higher capability never follows automatically from possession of a lower capability.

## 5. Risk classes

- LOW — documentation, formatting, non-executable metadata.
- MEDIUM — isolated frontend/business logic with bounded blast radius.
- HIGH — IAM, auth, financial scoring, CI/CD, dependencies, security controls.
- CRITICAL — secrets, production DB/RLS, billing, deployment, Owner IAM, break-glass.

HIGH and CRITICAL actions require independent policy evaluation and human/step-up approval where defined by the related ADRs.

## 6. Execution contract

Every command/action MUST be attributable through:

`human_actor -> app/client -> agent/session -> request -> capability -> policy decision -> tool execution -> repository/resource result -> evidence`.

The minimum correlation set is defined by ADR-0059 and the audit schema under `docs/architecture/ai-agent/`.

## 7. Security invariants

- No raw long-lived provider or infrastructure secret is exposed to a model when a connector/tool can hold it.
- Read-only evidence gathering is separated from mutation authority.
- Tool inputs and retrieved content are untrusted data and cannot elevate capability.
- Agent self-approval is forbidden for HIGH/CRITICAL changes.
- Production mutation is impossible from NotebookLM and from development-only profiles.
- Production changes require rollback and postcondition evidence.
- Security audit evidence is not sampled away with normal telemetry.

## 8. Observability and audit

OpenTelemetry/W3C Trace Context is the preferred cross-provider correlation mechanism. Operational telemetry and security audit evidence are separate retention classes. Redaction occurs before export.

## 9. Supply chain

Agent-generated code is not trusted by origin. It passes the same branch, PR, CI, SBOM, provenance, review and deployment gates as human-authored changes.

## 10. Documentation-first gate

M3–M9 implementation work is frozen until:

- ESS-0019 is merged;
- related ADRs are merged;
- trust/threat/IAM/audit/telemetry/supply-chain/deployment/cutover/assurance documents are merged;
- `AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md` is complete;
- `AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md` reaches `IMPLEMENTATION READY`;
- `docs/architecture/ROADMAP.md` records `M2G DOCUMENTATION FREEZE = COMPLETE`.

## 11. Related authorities

- ESS-0006 Security & Compliance
- ESS-0008 AI Agent Framework
- ESS-0011 Enterprise Traceability
- ESS-0012 Documentation Governance
- ESS-0018 Agentic Supabase Tool Governance
- ADR-0050 Agent Tool & Capability IAM Foundation
- ADR-0051 Capability Grant Approval Workflow
- ADR-0056 Observability & Telemetry Baseline
- ADR-0057..ADR-0063 created for this DevelopmentChain
