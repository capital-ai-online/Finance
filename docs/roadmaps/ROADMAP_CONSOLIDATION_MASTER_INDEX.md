# CAPITAL-AI Roadmap Portfolio Index

**Document role:** `CROSS_PROJECT_INDEX` / derived navigation / non-authorizing  
**Status:** `ACTIVE — DERIVED PORTFOLIO INDEX`  
**Folder-to-PVC mapping:** `docs/projects/README.md` + `docs/projects/PROJECT_VALUE_CHAIN.md`  
**Trust root:** `/AGENTS.md`  
**DevelopmentChain current-state authority:** `docs/architecture/ROADMAP.md` (`AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`)  
**Predecessor snapshot:** repository history before the 2026-09-01 single-source consolidation; predecessor blob `7a2c7fd5997bb2406c12bfb0d55cba3ee2a3a2ee`

## Purpose

This file is a **derived portfolio navigation index**. It no longer maintains an independent status truth, Authority hierarchy, execution backlog or next-action table.

Organizational project execution/status is maintained exactly once per canonical project in `docs/projects/<project>/ROADMAP.md`. Detailed domain/program roadmaps remain available for bounded architecture, workstream, finding, migration or historical context. Technical and Governance Authority continues to resolve through `/AGENTS.md`, accepted ADR/ESS/AUTH/CTRL identities, current registries and specific registered authorities.

The withdrawn Roadmap Registry policy surface is not current. Folder-to-PVC ownership is defined only in [`docs/projects/README.md`](../projects/README.md) and [`docs/projects/PROJECT_VALUE_CHAIN.md`](../projects/PROJECT_VALUE_CHAIN.md).

## Canonical project execution roadmaps

| Project | PVC / relationship | Organizational project execution/status source |
|---|---|---|
| `CAPITAL-AI-CLIENT` | `PVC-01` | [`docs/projects/agent-client/ROADMAP.md`](../projects/agent-client/ROADMAP.md) |
| `CAPITAL-AI-OPS` | `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18` | [`docs/projects/operations/ROADMAP.md`](../projects/operations/ROADMAP.md) |
| `CAPITAL-AI-DOC` | `PVC-03` | [`docs/projects/documentary/ROADMAP.md`](../projects/documentary/ROADMAP.md) |
| `CAPITAL-AI-GOV` | `PVC-05` + cross-cutting Governance | [`docs/projects/governance/ROADMAP.md`](../projects/governance/ROADMAP.md) |
| `CAPITAL-AI-DATA` | `PVC-09..PVC-11` | [`docs/projects/data/ROADMAP.md`](../projects/data/ROADMAP.md) |
| `CAPITAL-AI-FINTECH` | `PVC-12..PVC-17` | [`docs/projects/fintech/ROADMAP.md`](../projects/fintech/ROADMAP.md) |
| `CAPITAL-AI-QM` | cross-cutting | [`docs/projects/quality-management/ROADMAP.md`](../projects/quality-management/ROADMAP.md) |
| `CAPITAL-AI-SEC` | cross-cutting | [`docs/projects/security/ROADMAP.md`](../projects/security/ROADMAP.md) |
| `CAPITAL-AI-COMP` | cross-cutting | [`docs/projects/compliance/ROADMAP.md`](../projects/compliance/ROADMAP.md) |
| `CAPITAL-AI-FE` | cross-cutting presentation | [`docs/projects/frontend/ROADMAP.md`](../projects/frontend/ROADMAP.md) |
| `CAPITAL-AI-SEO` | cross-cutting SEO/marketing | [`docs/projects/seo/ROADMAP.md`](../projects/seo/ROADMAP.md) |
| `CAPITAL-AI-SOCIAL` | cross-cutting distribution | [`docs/projects/social-media/ROADMAP.md`](../projects/social-media/ROADMAP.md) |

The project-roadmap status label is not automatically `ACTIVE`. Proposed or blocked project lifecycles remain proposed or blocked until their own Authority/gates change. In particular, `CAPITAL-AI-QM` remains subject to proposed ADR-0103.

## Current higher/bounded sources

| Source | Role |
|---|---|
| [`docs/architecture/ROADMAP.md`](../architecture/ROADMAP.md) | `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` — current DevelopmentChain status authority |
| [`docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`](./SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md) | `SC-MD-SPT-0001` — bounded technical financial value-chain authority |
| [`docs/projects/PROJECT_VALUE_CHAIN.md`](../projects/PROJECT_VALUE_CHAIN.md) | organizational PVC ownership/routing model |
| [`docs/projects/README.md`](../projects/README.md) | canonical folder-to-PVC mapping |
| [`docs/governance/authority-registry.json`](../governance/authority-registry.json) | stable Authority identities/lifecycle |
| [`docs/governance/control-catalog.json`](../governance/control-catalog.json) | canonical machine-readable control catalog |
| [`docs/adr/registry.json`](../adr/registry.json) | ADR lifecycle/identity registry |

## Detailed / program roadmaps

The following are retained as bounded detail, coordination or evidence sources. They **do not** constitute a second organizational project-status source:

- [`INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`](./INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md) — integrated Development/Systemadmin program detail; non-authorizing projection.
- [`DEVELOPMENT_CHAIN_ROADMAP.md`](./DEVELOPMENT_CHAIN_ROADMAP.md) — historical DevelopmentChain implementation detail; current state is `docs/architecture/ROADMAP.md`.
- [`SYSTEMADMIN_AGENT_ROADMAP.md`](./SYSTEMADMIN_AGENT_ROADMAP.md) — Systemadmin program detail under OPS/Governance boundaries.
- [`VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md`](./VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md) — cross-project coverage/gap coordination; target projects retain execution status.
- [`CAPITAL_AI_SECURITY_ROADMAP.md`](./CAPITAL_AI_SECURITY_ROADMAP.md) and [`S1_SECURITY_HARDENING_ROADMAP.md`](./S1_SECURITY_HARDENING_ROADMAP.md) — Security domain/workstream detail; project status is `docs/projects/security/ROADMAP.md`.
- [`FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md`](./FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md) — FinTech module detail; project status is `docs/projects/fintech/ROADMAP.md`.
- [`SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`](./SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md) — SEO/Google Marketing program detail; project status is `docs/projects/seo/ROADMAP.md`.
- [`docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`](../architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md) — Documentary technical detail; project status is `docs/projects/documentary/ROADMAP.md`.
- [`docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md`](../compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md) — Compliance assessment detail; project status is `docs/projects/compliance/ROADMAP.md`.
- [`docs/frontend/FRONTEND_ROADMAP.md`](../frontend/FRONTEND_ROADMAP.md) — Frontend migration/UX detail; project status is `docs/projects/frontend/ROADMAP.md` and architecture remains `FRONTEND_ARCH.md`.
- [`docs/social-media/CAPITAL-AI-SOCIAL/ROADMAP.md`](../social-media/CAPITAL-AI-SOCIAL/ROADMAP.md) — Social domain detail; project status is `docs/projects/social-media/ROADMAP.md`.

## Historical / merged remediation context

- [`DSGVO_REMEDIATION_2026-08-19.md`](./DSGVO_REMEDIATION_2026-08-19.md) is retained as implementation/remediation evidence. PR #414 is merged. Any residuals must be revalidated and routed through the current Compliance/Security/Primary-Owner project surfaces rather than treating the old branch roadmap as current portfolio truth.
- [`GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md`](./GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md) is retained as merged Governance consolidation context. Current Authority/lifecycle state is resolved from the current registries, Control Catalog, `/AGENTS.md` and specific accepted Authorities.
- `MARKETING_AGENT_ROADMAP.md` and `docs/seo/SEO_MANAGEMENT_ROADMAP.md` remain superseded by the consolidated SEO/Google-Marketing program and are not independently progressed.
- Historical AI-Agent, Vocabulary, branding and work-package roadmaps remain evidence only unless a current canonical project roadmap explicitly reopens a bounded work item.

## Portfolio reading order

For a new work item:

1. read `/AGENTS.md` and applicable current Authorities;
2. resolve the target project using `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`;
3. read the target `docs/projects/<project>/ROADMAP.md` for organizational execution status;
4. read any detail/technical roadmap required by that work item;
5. use this file only for navigation and cross-project orientation.

## Update rule

When a project changes status, update the owning project roadmap only. Update this portfolio index only when project routing or navigation changes. Do not duplicate fast-changing work-package status here.
