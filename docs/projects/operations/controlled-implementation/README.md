# Controlled Implementation — PVC-02

**Owner:** `CAPITAL-AI-OPS`  
**Policy owner:** `CAPITAL-AI-GOV`

OPS owns execution coordination of current-main/open-PR correlation, scope/claim/branch handling, bounded implementation flow, available low-cost pre-PR validation and exact-candidate handoff to the Owner PR-creation gate.

It does not own every productive source change. The affected Primary Owner remains responsible for domain code, while OPS owns the recurring controlled-execution lifecycle.

## Current Security work

- `S1-R2-05` server-owned Stripe redirect boundary.
- `S1-R2-06` parent protected-capability inventory and server-enforcement coordination.

Security defines threat/control and negative-test expectations; OPS returns implementation/evidence for independent Security verification.
