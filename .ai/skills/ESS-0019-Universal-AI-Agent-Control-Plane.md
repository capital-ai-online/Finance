# ESS-0019 — Universal AI Agent Control Plane

Status: ACCEPTED (provider-set clarified 2026-08-16)
Version: 1.1.0
Date: 2026-08-11
Owner: Platform Director
Scope: CAPITAL-AI DevelopmentChain M2–M9

## 1. Purpose

ESS-0019 defines the provider-neutral control plane for every AI application, coding agent, research assistant or model that can observe, propose or execute work against CAPITAL-AI.

The controlling invariant is:

`AI product != trust root`.

**Canonical active providers (Owner 2026-08-16):** ChatGPT, Claude and Grok are execution or research profiles. **Google AI Studio, NotebookLM and Gemini are not part of the active DEVELOPMENT Chain or AI value chain** (retired aliases). Authorization, policy, audit, evidence and production mutation authority remain inside CAPITAL-AI governance.

## 2. Plane separation

CAPITAL-AI separates four planes:

1. **Research & Evidence Plane** — read-only source-grounded analysis, repository/document research and evidence production.
2. **Agent Execution Plane** — planning, file/tool operations and bounded changes inside an isolated workspace/branch.
3. **Control Plane** — identity, capability grants, risk classification, policy decisions, approvals, step-up, kill switch and audit correlation.
4. **Production Plane** — protected deployment/runtime/data/billing mutations requiring explicit production authority.

No provider may bypass the Control Plane to reach the Production Plane.

## 3. Provider profiles

- **ChatGPT** (`chatgpt-github-connector`): execution/research client through GitHub/connectors/MCP/Apps; never receives implicit Owner authority.
- **Claude / Claude Code** (`claude-code-cli`): execution client with permission-scoped tools/MCP; plan/read modes preferred before write; bypass-permissions modes prohibited for CAPITAL-AI production work.
- **Grok** (`grok-xai-connector`): research + controlled execution client via GitHub MCP / Grok Chat connector; same control-plane policy as ChatGPT/Claude; model name never elevates authority.
- **Google AI Studio / Gemini / NotebookLM**: **RETIRED** — not registered as active value-chain profiles; control plane returns DENY/RETIRED.

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
- Production mutation is impossible from retired profiles and from research-only ceilings.
- Production changes require rollback and postcondition evidence.
- Security audit evidence is not sampled away with normal telemetry.

## 8. Observability and audit

OpenTelemetry/W3C Trace Context is the preferred cross-provider correlation mechanism. Operational telemetry and security audit evidence are separate retention classes. Redaction occurs before export.

Supervisor observes the agent provider chain (ChatGPT/Claude/Grok) via `observeAgentProviderChain` (ESS-0002).

## 9. Supply chain

Agent-generated code is not trusted by origin. It passes the same branch, PR, CI, SBOM, provenance, review and deployment gates as human-authored changes.

## 10. Related authorities

- ESS-0002 Supervisor, ESS-0006 Security & Compliance, ESS-0008 AI Agent Framework
- ADR-0050, ADR-0051, ADR-0056, ADR-0057..ADR-0063
- `docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md`
- `docs/architecture/ai-agent/AI_AGENT_PROVIDER_PROFILE_CONTRACT.md`
