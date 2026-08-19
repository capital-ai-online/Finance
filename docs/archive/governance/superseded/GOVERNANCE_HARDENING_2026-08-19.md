# Governance Hardening Roadmap — Historical Snapshot

**Document ID:** `GOV-HARDENING-ROADMAP-2026-08-19`  
**Lifecycle:** `HISTORICAL / SUPERSEDED / NON-AUTHORIZING`  
**Original baseline:** `main@345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Historical branch:** `agent/governance-authority-regulatory-hardening`  
**Current replacement:** `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md` / `AUTH-GOV-CONTROL-PLANE-ROADMAP`

## Purpose

This archived roadmap records the earlier governance-hardening workstream. It MUST NOT be used to infer current M10 state, current ADR namespace, current repository-wide governance authority, or current branch/PR status.

## Historical work packages

| WP | Scope | Historical state |
|---|---|---|
| GH-1 | Authority / supersession | implemented on historical branch |
| GH-2 | Regulatory crosswalk | implemented on historical branch |
| GH-3 | AI evaluation evidence | historical implementation; production state separate |
| GH-4 | M10 boundary | historical state; superseded by current M10 suspension |

## Preserved design intent

- law and binding obligations outrank repository policy;
- Accepted Owner decisions and ADRs are not superseded by document recency alone;
- Proposed/Draft material is design input, not automatic authority;
- semantic supersession/archive requires Owner-visible diff and impact analysis;
- AI agents do not self-merge;
- historical M10 material does not create current authorization state.

## Historical namespace finding

The workstream identified the then-open privacy remediation using `ADR-0085` while that display number was already occupied by the ESS namespace cleanup decision. The current Governance Control Plane resolves this class of collision through stable `AUTH-*` identities, the central ADR registry and open-PR namespace correlation.

## Current source

For current governance execution use:

- `/AGENTS.md`;
- `docs/governance/authority-registry.json`;
- `docs/governance/control-catalog.json`;
- `docs/adr/registry.json`;
- `docs/roadmaps/GOVERNANCE_CONTROL_PLANE_CONSOLIDATION_2026-08-19.md`.
