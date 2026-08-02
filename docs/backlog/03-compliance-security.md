# 🛡️ Compliance, Security & Data Privacy Backlog

Track security updates, audits, and compliance regulations.

## 📋 Open Items

### 1. PII Masking on Diagnostic Logs
- **Description**: Automatically mask user emails, full IP addresses, and authentication tokens before printing server-side diagnostics.
- **Priority**: High
- **Status**: Completed (Active regex filtering applied to telemetry outputs).

### 2. DSGVO / GDPR Portability Archiver
- **Description**: Permit users to download a standard JSON archive of their logs and portfolio backtests.
- **Priority**: Medium
- **Status**: Completed

### 3. Persistent fabricated audit-trail write in `AuditLogs.tsx` (AUD5-F-001)
- **Description**: `src/components/AuditLogs.tsx:215-216` still writes `Math.random()`-generated `dataQualityScore`/`finalScore` to a persistent file via `server/orchestrator.ts:114-163`, indistinguishable from a real audit record after being written. See `docs/architecture/ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md` Kapitel 5 (AUD5-F-001) for full detail — this is the second consecutive audit naming it unfixed.
- **Priority**: Critical
- **Status**: Open
