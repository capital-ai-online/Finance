# CAPITAL-AI Legacy Documentation Consolidation

Date: 2026-08-09
Status: Migration inventory
Scope: `docs/` root-level documentation versus current Enterprise Documentation Architecture

## Purpose

This document classifies legacy and historical documentation in `docs/` and defines how its still-valid information is incorporated into the current CAPITAL-AI documentation architecture. It does not establish new architectural authority. Canonical authority remains with the applicable ESS, ADR, architecture, contracts, traceability and production-evidence documents.

## Canonical documentation hierarchy

1. Enterprise contracts and ESS specifications under `.ai/skills/` and `.ai/registry/`
2. Architecture Decision Records under `docs/adr/`
3. Current architecture specifications under `docs/architecture/`
4. Domain-specific implementation documentation under dedicated `docs/<domain>/` directories
5. Evidence, audit and production-state reports as dated evidence
6. Legacy root-level documents only as migration sources until consolidated

The Documentation Governance authority is ESS-0012. Traceability authority is ESS-0011. Documentary Engine authority is ESS-0010. Architecture decisions remain under `docs/adr/`.

## Findings

### Confirmed legacy state

The following root-level documents carry explicit CAPITAL-AI specification versions 0.5.4 or otherwise describe obsolete blueprint/implementation state:

- `docs/Documentary.md`
- `docs/Orchestrator.md`
- `docs/Scoring-Model.md`
- `docs/Classification-Agent.md`
- `docs/Fundamentals-Agent.md`
- `docs/Risk-Agent.md`

`docs/API.md` identifies itself as version 0.6.0 and remains useful as domain API documentation, but must be treated as implementation documentation rather than architecture authority.

### Documentary.md

Legacy claims include Documentary still being in `Blueprint`, ADR support, CI integration and documentation linting being unimplemented. These statements are superseded by ESS-0010/ESS-0011/ESS-0012 and the existing ADR/traceability/governance architecture.

Integration target:
- Documentary responsibility -> `.ai/skills/ESS-0010-Documentary-Engine.md`
- Traceability -> `.ai/skills/ESS-0011-Enterprise-Traceability.md`
- Governance validation -> `.ai/skills/ESS-0012-Documentation-Governance.md`
- Architectural decisions -> `docs/adr/`

Disposition: historical source; no longer canonical.

### Orchestrator.md

The document describes only `RawMaterialsOrchestrator` while naming it the platform `Master Orchestrator`. This is narrower than the current multi-asset architecture and therefore misleading as a platform-level architecture document.

Integration target:
- Raw-material-specific mechanics -> domain implementation documentation
- Cross-asset orchestration -> `docs/architecture/ORCHESTRATORS_AND_SCORING_ENGINES.md`
- Screening/scoring authority -> `docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md`

Disposition: preserve domain-specific evidence only; platform-level claims are superseded.

### Scoring-Model.md

The raw-material scoring formula remains useful as implementation evidence, but the document is explicitly tied to specification version 0.5.4 and is not the canonical multi-asset scoring architecture.

Integration target:
- Formula-specific raw-material implementation -> domain scoring documentation
- Enterprise scoring topology/governance -> `docs/architecture/ENTERPRISE_SCREENING_SCORING_MASTER_ARCHITECTURE.md`
- Relevant scoring ADRs -> `docs/adr/`

Disposition: implementation reference, not architecture authority.

### Classification-Agent.md / Fundamentals-Agent.md / Risk-Agent.md

These documents are explicit 0.5.4 snapshots and contain provider/model-specific implementation assertions. Such details are volatile and must not define Enterprise architecture unless independently evidenced by current code and architecture contracts.

Integration target:
- Agent framework -> `.ai/skills/ESS-0008-AI-Agent-Framework.md`
- Raw-material agent behavior -> domain implementation documentation
- Provider/model decisions -> applicable ADR or provider architecture document

Disposition: historical implementation snapshots until code-evidence revalidation.

### ARCHITECTURE_REVIEW.md

This file contains broad platform assertions and measured KPI values without embedded evidence provenance. It also mixes target architecture, implementation claims and future roadmap. It therefore must not serve as canonical architecture state.

Integration target:
- Valid architecture principles -> current `docs/architecture/` specifications after evidence validation
- Decisions -> ADRs
- Measurements -> dated evidence/audit reports
- Future work -> roadmap/backlog

Disposition: non-canonical historical review.

### Security, compliance and privacy reports

Root-level reports such as `SECURITY_AUDIT.md`, `COMPLIANCE_REPORT.md`, `DATENSCHUTZ_PROTOKOLL.md` and similar audit/review documents are evidence snapshots, not evergreen architecture specifications.

Integration target:
- Stable rules -> ESS-0006 Security & Compliance and relevant ADRs
- Current architectural controls -> dedicated security/compliance architecture documentation
- Historical observations -> retain as dated evidence with explicit snapshot status

Disposition: evidence classification required; never silently interpreted as current state.

### Production deployment documentation

`PRODUCTION_DEPLOYMENT_GUIDE.md` is operational documentation. Render-specific architectural decisions belong in current Render ADRs and production architecture documents, including ADR-0037 where applicable.

Disposition: operational guide may remain, but architectural assertions must defer to ADR/architecture authority.

## Required migration rules

All root-level documentation is now subject to the following rules:

1. A root-level file cannot override an ESS, ADR, current architecture specification, contract, registry or traceability record.
2. Documents with explicit old platform versions are classified as historical unless revalidated against current code.
3. Audit/review files represent point-in-time evidence and must include an evidence date/status.
4. Provider/model names are implementation evidence, not durable architecture unless governed by an ADR or current provider contract.
5. Duplicate architectural statements must be replaced by cross-references to the canonical document.
6. Architecture claims without code, ADR, ESS, test or production evidence must be labelled target/proposal rather than implemented state.
7. Root-level documents should progressively migrate into dedicated architecture, domain, operations, security/compliance, evidence or archive locations.
8. Deletion of a legacy document is allowed only after its still-valid content is traceably mapped to a canonical destination.

## Initial migration map

| Legacy document | Classification | Canonical integration |
|---|---|---|
| `Documentary.md` | Superseded blueprint | ESS-0010, ESS-0011, ESS-0012 |
| `Orchestrator.md` | Raw-material implementation snapshot | ORCHESTRATORS_AND_SCORING_ENGINES + screening/scoring master architecture |
| `Scoring-Model.md` | Raw-material implementation reference | screening/scoring master architecture + scoring ADRs |
| `Classification-Agent.md` | Legacy agent snapshot | ESS-0008 + raw-material domain docs |
| `Fundamentals-Agent.md` | Legacy agent snapshot | ESS-0008 + raw-material domain docs |
| `Risk-Agent.md` | Legacy agent snapshot | ESS-0008 + raw-material domain docs |
| `ARCHITECTURE_REVIEW.md` | Mixed historical review | architecture specs + ADRs + evidence reports |
| `API.md` | Domain implementation documentation | API/domain documentation; non-authoritative for architecture |
| `SECURITY_AUDIT.md` | Evidence snapshot | ESS-0006 + security architecture + dated evidence |
| `COMPLIANCE_REPORT.md` | Evidence snapshot | ESS-0006 + compliance architecture + dated evidence |
| `DATENSCHUTZ_PROTOKOLL.md` | Evidence/operational record | privacy/security governance + dated evidence |
| `PRODUCTION_DEPLOYMENT_GUIDE.md` | Operational guide | Render/production ADRs and architecture |

## Next consolidation phase

The next phase should migrate content file-by-file, preserving evidence and Git history. It should add explicit canonical-status metadata, remove duplicate architecture claims, create missing domain destinations where required, and only then archive or remove superseded root-level documents.

No architectural decision is introduced by this inventory; it documents consolidation under the already-existing Documentation Governance architecture.