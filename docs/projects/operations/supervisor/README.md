# Supervisor — PVC-04

**Owner:** `CAPITAL-AI-OPS`  
**Runtime component:** `src/platform/Supervisor/**`

The Supervisor observes, evaluates and escalates. It may execute only explicitly approved bounded recovery. It may not make protected Governance, Release, Production or business decisions.

## Current Security work

`S1-R2-04` requires fatal uncaught errors to make readiness unhealthy, stop new work, perform bounded safe cleanup and exit non-zero. Closure evidence includes negative child-process behavior plus `PVC-08` post-deploy supervisor recovery evidence.

No second Supervisor implementation is introduced by the project folder.
