# EventMesh — PVC-18

**Owner:** `CAPITAL-AI-OPS`  
**Runtime component:** `src/platform/EventMesh/**`

EventMesh remains cross-cutting transport/validation/routing infrastructure. Public interfaces and dependency direction remain intact. No second event bus is created and no project document grants EventMesh decision, release or deployment authority.

OPS operational work includes replay/idempotency/reliability evidence and service-health handling while reusing the existing component and contracts.
