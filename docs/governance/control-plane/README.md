# CAPITAL-AI Governance Control Plane

**Authority ID:** `AUTH-GOV-CONTROL-PLANE`  
**Version:** `1.0.0`  
**Date:** `2026-08-19`

This directory documents the repository-wide governance control plane. It does not replace domain ADR/ESS content; it defines how authorities, controls, versions, evidence and agent instructions are resolved consistently.

## Canonical roles

- `/AGENTS.md` — single repository-wide AI-agent trust root.
- `docs/governance/authority-registry.json` — immutable stable authority identities and current locations.
- `docs/governance/control-catalog.json` — operative machine-readable governance controls.
- `docs/adr/registry.json` — ADR identity/version/date/lifecycle/supersession registry.
- `.ai/registry/ess-registry.json` — existing ESS allocation registry.
- `docs/governance/document-registry.json` — documentary inventory; not itself a higher policy authority.
- `scripts/governance/validateGovernanceControlPlane.mjs` — deterministic repository validator.
- `src/platform/Governance/` — global governance component boundary and reusable contracts.

## Authority and evidence separation

Authority decides what is permitted or required. Evidence records what happened. A report, build log, test result, PR body, reaction, label or historical document cannot manufacture authority.

Stable identities are path-independent. Paths, display numbers and titles may change under controlled migration without changing the stable identity.

## ADR lifecycle

All formal ADRs live under `docs/adr/`. New or migrated ADRs are registered in `docs/adr/registry.json` with stable `authorityId`, unique active display ID, semantic version, date and lifecycle.

For the same `authorityId`, a newer effective semantic version supersedes an older version; if the versions are equal, the later effective date wins. Between different authorities, recency alone does not supersede anything: an explicit `supersedes` edge and Owner-visible diff/impact package are required.

Historical records remain retained and non-authorizing after supersession.

## Documentation boundary

`src/platform/Documentary/Governance` remains documentation-domain governance only. It must not become the repository-wide authorization or control-plane implementation. Cross-cutting governance belongs to `src/platform/Governance`.

## Validation boundary

The standalone validator is designed to catch structural governance defects before a feature becomes merge-ready, including duplicate active ADR/ESS IDs, duplicate stable authority/control IDs, missing registry targets and competing provider/model policy mirrors.

Validation is technical evidence only. It does not authorize a Pull Request, Human Merge or production mutation.

## Standards posture

The control-plane structure is aligned to ISO/IEC 42001:2023 management-system concepts and NIST SSDF v1.1 / SP 800-218A secure-development practices. Alignment does not constitute certification or a legal-compliance claim.