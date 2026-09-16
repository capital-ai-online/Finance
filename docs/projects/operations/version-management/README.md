# Version Management — PVC-06

**Owner:** `CAPITAL-AI-OPS`

`package.json#version` remains the sole platform-version authority. `src/platform/VersionManager/**` remains a read-only compatibility namespace. Platform-version transitions occur only through the existing Release Version Gate.

## Versioned Unit Inventory

`src/platform/Release/Services/versionedUnitInventory.ts` provides the read-only `versioned-unit-inventory/1.0.0` projection for the web application.

The inventory does not create a second version registry or mutation path. It resolves one effective version authority per discovered unit:

- repository/platform root → `package.json#version`;
- `src/platform/<component>/` with a valid `manifest.json#version` → that existing component authority;
- `src/platform/<component>/` without a component manifest → inherited `package.json#version`, explicitly ownership-unresolved rather than inventing a component authority;
- `src/features/*`, remaining direct `src/*` module roots and `server/` → inherited `package.json#version` plus exact Git `sourceCommit` provenance.

`ownerProject` / `primaryPVC` are consumed only when the existing component manifest exposes a canonical `CAPITAL-AI-*` owner or PVC metadata. Missing ownership metadata remains `unresolved`; path placement alone does not transfer Domain or PVC ownership.

The inventory is deterministic for one repository snapshot and Git SHA, reports `mutationPerformed=false`, rejects malformed component SemVer and duplicate Unit IDs, and can be rendered as JSON through:

```bash
npx tsx scripts/automation/validateVersionedUnitInventory.ts --json
```

This JSON is the intended OPS/PVC-06 handoff surface for Documentary. Documentary may consume it for documentation/report projection but must not mutate the platform/component versions or become a second Version Management authority.

## Current Security work

`S1-R2-03` requests convergence of `.nvmrc`, package engine policy and remaining control-plane Node references to Node `24.20.0` with exact-candidate verification.

Current-main re-correlation found an authority conflict: `docs/adr/ADR-0053-node24-lts-git255-toolchain.md` remains `Accepted` and explicitly selects Node `24.18.0` for Production, CI and local development, while the later `24.20.0` write-boundary supersession document remains proposed. OPS therefore classifies this package as **BLOCKED_BY_AUTHORITY_CONFLICT** and performs no Node baseline mutation until the applicable Governance/ADR authority is resolved.

Canonical evidence: [`../evidence/OPS_SECURITY_BACKLOG_RECORRELATION_2026-09-06.md`](../evidence/OPS_SECURITY_BACKLOG_RECORRELATION_2026-09-06.md).

This project subdomain creates no second version source or mutation path and does not supersede foreign Governance authority.
