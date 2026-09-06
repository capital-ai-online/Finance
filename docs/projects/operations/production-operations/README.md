# Production Operations — PVC-08

**Owner:** `CAPITAL-AI-OPS`

Scope includes runtime readiness, health verification, post-deploy evidence, incident response, bounded rollback/recovery execution, reliability/capacity evidence and operational service ownership.

Production mutation remains separately protected and is never authorized by project/roadmap status.

## Current Security work

- `S1-R2-04`: post-deploy supervisor recovery evidence dependency.
- `S1-R2-07`: **IMPLEMENTED_BRANCH / EXECUTION_EVIDENCE_PENDING / SECURITY_UNVERIFIED** — Recovery objectives and the fail-closed recurring encrypted backup / isolated restore evidence harness are implemented on `agent/operations-recovery-rpo-rto-20260906`. Database RPO target is ≤24 h and isolated database-restore RTO target is ≤60 min; neither is represented as measured/operating until successful evidence runs exist. The harness now requires Auth recovery coverage (`auth.users`, `auth.identities`), compares recovery-critical Storage metadata, and fails closed if Supabase Storage binary objects appear before a separately authorized binary-backup path exists. Protected GitHub secret/variable configuration and any provider/Production mutation remain separate Human-gated actions.
- `S1-R2-09`: strict CSP promotion only after ADR-0040 compatibility/violation evidence.
- `S1-R2-10`: production proof that DEV billing simulation is unreachable.

Canonical recovery contract: `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`. Branch-local implementation evidence: `docs/projects/operations/evidence/OPS_08_SEC_07_RECOVERY_HARNESS_2026-09-06.md`.

Security independently verifies returned evidence. `EVIDENCE_READY` or successful OPS execution never implies Security `VERIFIED/CLOSED`.
