# Release Management — PVC-07

**Owner:** `CAPITAL-AI-OPS`  
**Runtime component:** `src/platform/Release/**`

OPS owns organizational Release execution while preserving the existing Release contracts, controlled Version Gate, release-candidate evidence, rollback semantics and hosted verification.

Release readiness/evidence does not authorize Production deployment. Production promotion remains a separate controlled transition into PVC-08.

No second Release architecture is created under `docs/projects/operations/`.
