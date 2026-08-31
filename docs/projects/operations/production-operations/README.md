# Production Operations — PVC-08

**Owner:** `CAPITAL-AI-OPS`

Scope includes runtime readiness, health verification, post-deploy evidence, incident response, bounded rollback/recovery execution, reliability/capacity evidence and operational service ownership.

Production mutation remains separately protected and is never authorized by project/roadmap status.

## Current Security work

- `S1-R2-04`: post-deploy supervisor recovery evidence dependency.
- `S1-R2-07`: approved RPO/RTO plus recurring encrypted off-site backup and isolated measured restore.
- `S1-R2-09`: strict CSP promotion only after ADR-0040 compatibility/violation evidence.
- `S1-R2-10`: production proof that DEV billing simulation is unreachable.

Security independently verifies returned evidence.
