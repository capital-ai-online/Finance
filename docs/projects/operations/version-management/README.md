# Version Management — PVC-06

**Owner:** `CAPITAL-AI-OPS`

`package.json#version` remains the sole platform-version authority. `src/platform/VersionManager/**` remains a read-only compatibility namespace. Platform-version transitions occur only through the existing Release Version Gate.

## Current Security work

`S1-R2-03` requires convergence of `.nvmrc`, package engine policy and remaining control-plane Node references on the approved Node 24.20.0 identity, with exact-candidate verification.

This project subdomain creates no second version source or mutation path.
