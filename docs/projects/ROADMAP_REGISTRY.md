# CAPITAL-AI Roadmap Registry — Single-Source Execution Model

**Document role:** repository-wide roadmap-role registry / non-authorizing organizational projection  
**Status:** `ACTIVE — CANONICAL ROADMAP ROLE REGISTRY`  
**Correlation baseline:** `main@315056a50dc6f779c178c4ff6d06074353d1972a`  
**Correlation date:** `2026-09-01`  
**Trust root:** `/AGENTS.md`  
**Current DevelopmentChain status authority:** `docs/architecture/ROADMAP.md` (`AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`)  
**Project execution model:** `docs/projects/README.md` + `docs/projects/PROJECT_EXECUTION_MODEL.md`

## Purpose

This registry removes roadmap-status ambiguity without deleting technical detail or historical evidence.

The repository uses three deliberately separate concepts:

1. **Authority** — `/AGENTS.md`, applicable law/contracts, accepted ADR/ESS/AUTH/CTRL identities, registered technical authorities and provider-enforced controls determine what is allowed or required.
2. **Project execution status** — exactly one `docs/projects/<project>/ROADMAP.md` is the organizational execution/status source for each canonical project.
3. **Detail / program / historical roadmaps** — may contain architecture, workstream, migration, module, security, compliance or historical evidence, but do not become a competing organizational project-status source.

This registry does **not** supersede a bounded technical authority merely because its filename contains `ROADMAP`. In particular, `SC-MD-SPT-0001` retains its technical financial-value-chain role, and `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` remains the repository DevelopmentChain current-state authority.

## Mandatory single-source rules

- For a canonical project, organizational project status, backlog ownership, next project-local work and project completion are read from that project's `docs/projects/<project>/ROADMAP.md`.
- A secondary roadmap may remain canonical for a **bounded technical/domain role**, but its project/program status is subordinate to the owning project roadmap and current applicable Authority.
- Cross-project portfolio documents are navigation/synthesis only. They MUST derive status from project roadmaps and MUST NOT maintain an independent competing status table as truth.
- Historical/completed/superseded roadmaps remain discoverable as evidence. Historical status MUST NOT silently regain current authority.
- Exact `main@<sha>` values inside roadmaps are correlation observations. They do not become permanent authority and must not be interpreted as a requirement to remain on that SHA.
- Where a current registered Authority conflicts with any roadmap projection, the Authority wins according to `/AGENTS.md` and the Governance Control Plane.
- Open-writer ownership is preserved. A portfolio consolidation MUST NOT modify a roadmap path concurrently owned by another active PR/work claim merely to obtain formatting symmetry.

## Canonical project execution/status sources

| Project | Project folder | PVC relationship | Sole organizational project execution/status roadmap |
|---|---|---|---|
| `CAPITAL-AI-CLIENT` | `docs/projects/agent-client/` | `PVC-01` Primary Owner | `docs/projects/agent-client/ROADMAP.md` |
| `CAPITAL-AI-OPS` | `docs/projects/operations/` | `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18` Primary Owner | `docs/projects/operations/ROADMAP.md` |
| `CAPITAL-AI-DOC` | `docs/projects/documentary/` | `PVC-03` Primary Owner | `docs/projects/documentary/ROADMAP.md` |
| `CAPITAL-AI-GOV` | `docs/projects/governance/` | `PVC-05` Primary Owner + cross-cutting Governance | `docs/projects/governance/ROADMAP.md` |
| `CAPITAL-AI-DATA` | `docs/projects/data/` | `PVC-09..PVC-11` Primary Owner | `docs/projects/data/ROADMAP.md` |
| `CAPITAL-AI-FINTECH` | `docs/projects/fintech/` | `PVC-12..PVC-17` Primary Owner | `docs/projects/fintech/ROADMAP.md` |
| `CAPITAL-AI-QM` | `docs/projects/quality-management/` | cross-cutting; no productive PVC | `docs/projects/quality-management/ROADMAP.md` |
| `CAPITAL-AI-SEC` | `docs/projects/security/` | cross-cutting; no productive PVC | `docs/projects/security/ROADMAP.md` |
| `CAPITAL-AI-COMP` | `docs/projects/compliance/` | cross-cutting; no productive PVC | `docs/projects/compliance/ROADMAP.md` |
| `CAPITAL-AI-FE` | `docs/projects/frontend/` | cross-cutting presentation; no productive PVC | `docs/projects/frontend/ROADMAP.md` |
| `CAPITAL-AI-SEO` | `docs/projects/seo/` | cross-cutting SEO/marketing; no productive PVC | `docs/projects/seo/ROADMAP.md` |
| `CAPITAL-AI-SOCIAL` | `docs/projects/social-media/` | cross-cutting distribution; no productive PVC | `docs/projects/social-media/ROADMAP.md` |

The status value inside the project roadmap remains authoritative for the project's **organizational execution projection** even when it is `PROPOSED`, `PARTIAL`, `BLOCKED` or otherwise not active. This registry does not promote a project lifecycle by itself. For example, `CAPITAL-AI-QM` remains subject to the lifecycle of proposed `ADR-0103` until that Authority is accepted by the required Human process.

## Correlation of the 28 currently relevant roadmaps

| # | Roadmap | Bounded role after correlation | Organizational status source | Disposition |
|---:|---|---|---|---|
| 1 | `docs/projects/agent-client/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole CLIENT project-status source** |
| 2 | `docs/projects/operations/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole OPS project-status source**; DevelopmentChain global status still resolves through `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS` |
| 3 | `docs/projects/documentary/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole DOC project-status source**; active writer PR #679 preserved |
| 4 | `docs/projects/governance/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole GOV project-status source** |
| 5 | `docs/projects/data/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole DATA project-status source**; existing `PROPOSED`/candidate state is not silently promoted |
| 6 | `docs/projects/fintech/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole FINTECH project-status source** |
| 7 | `docs/projects/quality-management/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole QM project-status source**; lifecycle remains gated by proposed ADR-0103 |
| 8 | `docs/projects/security/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole SEC project-status source** |
| 9 | `docs/projects/compliance/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole COMP project-status source** |
| 10 | `docs/projects/frontend/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole FE project-status source** |
| 11 | `docs/projects/seo/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole SEO project-status source** |
| 12 | `docs/projects/social-media/ROADMAP.md` | `PROJECT_EXECUTION_STATUS` | itself | **RETAIN — sole SOCIAL project-status source** |
| 13 | `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` | `CROSS_PROJECT_INDEX` | the 12 project roadmaps + applicable Authorities | **REWRITE — navigation/synthesis only; independent portfolio status truth removed** |
| 14 | `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` | `PROGRAM_DETAIL` | OPS roadmap for project execution; GOV roadmap/controls for policy; `docs/architecture/ROADMAP.md` for DevelopmentChain current state | **RETAIN — non-authorizing integrated projection** |
| 15 | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` | `HISTORICAL_IMPLEMENTATION_DETAIL` | `docs/architecture/ROADMAP.md` for current DevelopmentChain state; OPS roadmap for project execution | **RETAIN AS EVIDENCE — no independent current execution status** |
| 16 | `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` | `PROGRAM_DETAIL` | OPS project roadmap subject to Governance/Systemadmin Authorities | **RETAIN — bounded Systemadmin detail** |
| 17 | `docs/roadmaps/VALUE_CHAIN_COVERAGE_AND_HARDENING_ROADMAP_2026-08-30.md` | `CROSS_PROJECT_COORDINATION` | affected target project roadmap(s) | **RETAIN — coverage/gap evidence; work remains target-owner status** |
| 18 | `docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md` | `SECURITY_DOMAIN_DETAIL` | `docs/projects/security/ROADMAP.md` | **RETAIN — detailed Security requirements/findings/verification** |
| 19 | `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` | `SECURITY_WORKSTREAM_DETAIL` | `docs/projects/security/ROADMAP.md` plus affected Primary Owner roadmap for remediation | **RETAIN — workstream/finding evidence** |
| 20 | `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` (`SC-MD-SPT-0001`) | `TECHNICAL_FINANCIAL_VALUE_CHAIN_AUTHORITY` | DATA/FINTECH/other owning project roadmaps for organizational work only | **RETAIN TECHNICAL AUTHORITY — not demoted** |
| 21 | `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` | `FINTECH_MODULE_DETAIL` | `docs/projects/fintech/ROADMAP.md` | **RETAIN — module implementation detail** |
| 22 | `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` | `SEO_DOMAIN_PROGRAM_DETAIL` | `docs/projects/seo/ROADMAP.md` | **RETAIN — SEO/Google-Marketing detail; no second project status** |
| 23 | `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md` | `DOCUMENTARY_TECHNICAL_DETAIL` | `docs/projects/documentary/ROADMAP.md` | **RETAIN — technical Documentary detail; active writer PR #679 preserved** |
| 24 | `docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md` | `COMPLIANCE_ASSESSMENT_DETAIL` | `docs/projects/compliance/ROADMAP.md` | **RETAIN — assessment/finding detail; no second COMP project status** |
| 25 | `docs/frontend/FRONTEND_ROADMAP.md` | `FRONTEND_MIGRATION_DETAIL` | `docs/projects/frontend/ROADMAP.md` | **RETAIN — migration/UX sequence; `FRONTEND_ARCH.md` remains architecture authority** |
| 26 | `docs/social-media/CAPITAL-AI-SOCIAL/ROADMAP.md` | `SOCIAL_DOMAIN_DETAIL` | `docs/projects/social-media/ROADMAP.md` | **RETAIN — channel/domain detail; no publication authority created** |
| 27 | `docs/roadmaps/DSGVO_REMEDIATION_2026-08-19.md` | `HISTORICAL_REMEDIATION_WITH_RESIDUALS` | `docs/projects/compliance/ROADMAP.md` for Compliance coordination plus affected Primary Owner roadmap(s) | **RETAIN AS EVIDENCE — PR #414 is merged; remaining residuals must be revalidated/routed rather than treating the old branch roadmap as current project truth** |
| 28 | `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` | `MERGED_GOVERNANCE_CONTEXT` | `docs/projects/governance/ROADMAP.md` for project execution and current Governance registries/controls for Authority | **RETAIN — stable Authority/context references preserved; stale post-merge project status does not override current registries** |

## Current-state authorities and bounded sources outside the 28-roadmap portfolio

These sources are intentionally **not** converted into project roadmaps:

| Source | Role |
|---|---|
| `/AGENTS.md` | repository trust root / instruction entrypoint |
| `docs/architecture/ROADMAP.md` (`AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`) | authoritative DevelopmentChain current-state index |
| `docs/governance/authority-registry.json` | stable authority identity/lifecycle registry |
| `docs/governance/control-catalog.json` | machine-readable control catalog |
| `docs/adr/registry.json` | ADR lifecycle/identity registry |
| `docs/projects/PROJECT_VALUE_CHAIN.md` | organizational PVC ownership/routing model |

A project roadmap must consume these sources where applicable; it cannot override them by changing a roadmap status label.

## Resolved conflicts

### Portfolio master versus current DevelopmentChain Authority

The predecessor `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` stated its own Authority ordering and described the Integrated/DevelopmentChain roadmaps as execution authorities. That is incompatible with the newer `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`, which classifies the old DevelopmentChain roadmap as historical and the Integrated roadmap as non-authorizing.

Resolution: the master file is reduced to a cross-project navigation/index role. Current DevelopmentChain state is read from `docs/architecture/ROADMAP.md`.

### Domain-canonical versus project-canonical wording

Security, Compliance, Frontend, SEO, Social, Financial Value Chain and Documentary may legitimately use `canonical` for a **bounded domain/technical role**. That wording no longer means they are a second organizational project-status source.

Resolution: this registry qualifies their role and points organizational execution status to the owning `docs/projects/<project>/ROADMAP.md`.

### Stale baseline SHAs

Many roadmaps contain historical `main@<sha>` correlation snapshots.

Resolution: retain them as audit evidence. Do not mass-rewrite them to the latest SHA unless the roadmap's substantive state is actually revalidated. A stale SHA alone is not treated as a status defect or Authority.

## Concurrent-writer correlation

At the start of this consolidation, PR #679 (`CAPITAL-AI-DOC / WP-DOC-05 Mermaid Projection`) is the only open PR and writes:

- `docs/projects/documentary/ROADMAP.md`;
- `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`;
- additional Documentary code/evidence paths.

Therefore this consolidation **does not mutate those two roadmap paths**. Their current roles already match the target model, and the registry records the classification without violating writer ownership.

## Definition of Done

The roadmap single-source model is complete when:

1. this registry is present on `main`;
2. `ROADMAP_CONSOLIDATION_MASTER_INDEX.md` is a derived navigation/index rather than competing status truth;
3. all 28 relevant roadmap paths have exactly one role classification here;
4. each of the 12 canonical projects has exactly one organizational project execution/status roadmap;
5. bounded technical Authorities remain intact;
6. historical evidence remains discoverable through Git history and retained roadmap files;
7. future roadmap creation/update checks this registry before introducing a new independent status source.
