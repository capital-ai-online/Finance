# CAPITAL-AI Governance Control Plane

**Authority ID:** `AUTH-GOV-CONTROL-PLANE`  
**Version:** `1.1.0`  
**Date:** `2026-08-19`

This directory documents the repository-wide Governance Control Plane. It does not replace domain ADR/ESS content; it defines how authorities, controls, versions, evidence and agent instructions are resolved consistently.

## Canonical roles

- `/AGENTS.md` — sole repository-wide AI-agent trust root and instruction surface.
- `docs/governance/authority-registry.json` — stable authority identities and current locations.
- `docs/governance/control-catalog.json` — operative machine-readable governance controls.
- `docs/adr/registry.json` — ADR identity/version/date/lifecycle/supersession and parallel namespace reservations.
- `.ai/registry/ess-registry.json` — ESS allocation registry.
- `docs/governance/document-registry.json` — documentary inventory; not a higher policy authority.
- `scripts/governance/validateGovernanceControlPlane.mjs` — deterministic repository validator.
- `src/platform/Governance/` — global Governance component boundary and reusable contracts.

Repository-level provider instruction mirrors such as `CLAUDE.md` or `.github/copilot-instructions.md` are intentionally absent. Provider tooling cannot create a second repository instruction hierarchy.

## Authority and evidence separation

Authority decides what is permitted or required. Evidence records what happened. A report, build log, test result, PR body, reaction, label or historical document cannot manufacture authority.

Stable identities are path-independent. Paths, display numbers and titles may change under controlled migration without changing stable identity.

## ADR lifecycle and parallel writers

All formal ADRs live under `docs/adr/`. New/migrated ADRs are registered with stable `authorityId`, unique active display ID, semantic version, date and lifecycle. Open Pull Requests allocating the same ADR namespace are treated as shared semantic writers and reserved/correlated before another allocation.

For the same `authorityId`, the newer effective semantic version/date may supersede an older one. Between different authorities, recency alone is non-authorizing: explicit supersession and Owner-visible impact analysis are required.

## Documentation boundary

`src/platform/Documentary/Governance` is documentation-domain governance only. Cross-cutting authority/control resolution belongs to `src/platform/Governance`. Fully replaced current governance/roadmap material moves to `docs/archive/governance/superseded/` rather than remaining as a parallel current source.

## Validation boundary

The structural validator checks stable-ID uniqueness, active ADR/ESS namespace collisions, parallel ADR reservations, registry targets, legacy redirects, current M10 suspension state and the absence of repository provider instruction mirrors.

Validation is technical evidence only. It does not authorize a Pull Request, Human Merge or production mutation.

## M10 state

M10 Passkey PR-CI enforcement remains `SUSPENDED / OFF`. Reactivation is blocked until the documented Governance/Documentary/README/router/versioning correlations are reconciled, structural/hosted validation passes and a new explicit Human/Owner decision is made.

## Standards posture

`STANDARDS_CROSSWALK.md` maps CAPITAL-AI controls to ISO/IEC 42001:2023, final NIST SSDF v1.1 and final SP 800-218A. It is a benchmark/gap-mapping layer, not a second policy hierarchy. Draft SSDF v1.2 material is monitored as research input only. Alignment does not constitute certification or a legal-compliance claim.
