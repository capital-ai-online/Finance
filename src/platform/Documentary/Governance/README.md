# Documentation Governance Validator

**Domain:** Documentary  
**Authority:** `ESS-0012 — Documentation Governance`  
**Global governance dependency:** `src/platform/Governance` / `/AGENTS.md`  
**Version:** `1.1.0`  
**Status:** specified; documentation-domain implementation may be added incrementally

## Purpose

The Documentation Governance Validator belongs to the Documentary domain. It validates **documentary structure and metadata** and produces findings. It does not define repository-wide authorization, agent authority, merge policy, production mutation authority or global governance precedence.

The repository-wide governance control plane is `src/platform/Governance`, resolved from `/AGENTS.md`, `docs/governance/authority-registry.json` and `docs/governance/control-catalog.json`.

## Responsibilities

Documentation Governance may validate:

- canonical document placement and root-Markdown allowlists;
- document registry structure, paths and metadata;
- required document version/language/lifecycle metadata;
- documentary references to ESS/ADR/contract identities;
- documentation completeness and structural consistency;
- documentation-related traceability findings;
- documentary version projection and hygiene.

It may emit findings/reports and expose reusable validation services to Documentary workflows.

## Explicit non-responsibilities

Documentation Governance MUST NOT:

- define or supersede the repository-wide agent trust root;
- create a second authority registry or control catalog;
- decide Human/Owner authorization or merge eligibility;
- reinterpret an ADR/ESS lifecycle contrary to `src/platform/Governance` resolution;
- authorize production, IAM, billing, secret or external provider mutations;
- duplicate global workflow/CI/deployment policy;
- treat documentation recency alone as authority.

## Boundary with the global Governance component

```text
src/platform/Governance
  -> stable authority/control/evidence contracts
  -> global structural governance validation
  -> authority resolution

src/platform/Documentary/Governance
  -> document hygiene
  -> metadata and registry validation
  -> documentary consistency findings
```

Documentation Governance consumes global stable identities; it does not own them.

## Canonical inputs

- `ESS-0012 — Documentation Governance`
- `ESS-0012-CONTRACTS`
- `docs/governance/document-registry.json`
- `docs/governance/DOCUMENTATION_HYGIENE_POLICY.md`
- global governance contracts from `src/platform/Governance`

## Implementation guidance

The reusable hygiene logic proposed in parked PR #439 is compatible with this domain **only after** it is adapted to this boundary. Its useful validation implementation should be reused rather than recreated, but it must not become a competing repository-wide governance control plane.

## Decision model

This component detects and reports documentary findings. Global authority resolution and protected-action decisions remain outside Documentary and are resolved through the Governance Control Plane and Human/Owner gates.