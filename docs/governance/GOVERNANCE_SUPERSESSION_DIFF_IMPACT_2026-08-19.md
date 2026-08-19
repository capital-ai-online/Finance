# Governance Supersession Diff & Impact — Historical Package

**Document ID:** `GOV-SUPERSESSION-IMPACT-2026-08-19`  
**Lifecycle:** `HISTORICAL / SUPERSEDED / NON-AUTHORIZING`  
**Original baseline:** `main@345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`  
**Current replacement:** `docs/governance/control-plane/GOVERNANCE_CONTROL_PLANE_DIFF_IMPACT_2026-08-19.md`  
**Current decision:** `ADR-0095` / `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`

## Historical purpose

This package originally covered the narrower conflict around the retired PR-body checkbox / Files-Viewed / `💪` / `okay` ritual and the interpretation of `PROPOSED` documents as normative authority.

It is retained as historical evidence of the earlier governance-hardening step. It is **not the current Owner-review package** for Governance Control Plane consolidation and MUST NOT be used to infer the current M10 enforcement state.

## Historical authority comparison

At the time of the original package, the following observations were recorded:

| Artifact | Historical observation |
|---|---|
| Accepted ADR-0069 Owner addendum | checkbox/emoji ritual retired; Human Merge remained |
| Human Owner PR Approval Policy | aligned to the retired ritual at that time |
| Development Chain policy | aligned to pre-/future-M10 transition language at that time |
| `AGENTS.md` | still contained stale Viewed/current-head wording in one section |
| Governance Library report | dated snapshot exposed retired ritual too strongly for current use |
| main-production expected policy | contained historical promotion residue |
| Proposed ADR-0039 | design input only, not sole Accepted authority |

These observations are historical and have since been incorporated or superseded by the Governance Control Plane work.

## Historical semantic diff

The package distinguished the retired legacy flow:

```text
PR → Owner body checkboxes → all files Viewed → current-head review → expensive CI → Human Merge
```

from the then-planned/transition flow. Since then, M10 was implemented and historically verified, and PR #445 subsequently suspended M10 PR-CI enforcement. Therefore this older package is no longer a reliable current-state description.

## Current interpretation

Use the current Governance Control Plane sources instead:

- `/AGENTS.md`;
- `docs/governance/authority-registry.json`;
- `docs/governance/control-catalog.json`;
- `docs/architecture/ROADMAP.md`;
- `docs/governance/control-plane/GOVERNANCE_CONTROL_PLANE_DIFF_IMPACT_2026-08-19.md`.

Current relevant state:

```text
normal PR technical CI
→ M10 passkey enforcement SUSPENDED / OFF
→ Human/Owner merge decision
→ Human Merge
```

Historical M10 evidence remains retained but cannot reactivate the control by citation or recency.

## Evidence preservation

No historical evidence is deleted by this reclassification. This file remains available to explain the earlier normalization step, while its normative role is explicitly retired.