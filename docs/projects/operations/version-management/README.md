# Version Management — PVC-06

**Owner:** `CAPITAL-AI-OPS`

`package.json#version` remains the sole platform-version authority. `src/platform/VersionManager/**` remains a read-only compatibility namespace. Platform-version transitions occur only through the existing Release Version Gate.

## Current Security work

`S1-R2-03` requests convergence of `.nvmrc`, package engine policy and remaining control-plane Node references to Node `24.20.0` with exact-candidate verification.

Current-main re-correlation found an authority conflict: `docs/adr/ADR-0053-node24-lts-git255-toolchain.md` remains `Accepted` and explicitly selects Node `24.18.0` for Production, CI and local development, while the later `24.20.0` write-boundary supersession document remains proposed. OPS therefore classifies this package as **BLOCKED_BY_AUTHORITY_CONFLICT** and performs no Node baseline mutation until the applicable Governance/ADR authority is resolved.

Canonical evidence: [`../evidence/OPS_SECURITY_BACKLOG_RECORRELATION_2026-09-06.md`](../evidence/OPS_SECURITY_BACKLOG_RECORRELATION_2026-09-06.md).

This project subdomain creates no second version source or mutation path and does not supersede foreign Governance authority.
