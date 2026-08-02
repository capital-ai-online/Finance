# ⚙️ Core System & Infrastructure Backlog

Track core engine improvements, model router latencies, and server-side configurations.

## 📋 Open Items

### 1. Model Router Latency Checks
- **Description**: Ensure the auto-routing layer selects model endpoints with response latencies under 200ms.
- **Priority**: High
- **Status**: Completed (Active telemetry monitoring visible in Orchestrator Panel).

### 2. Multi-Agent Memory Refinement
- **Description**: Standardize session context caching for parallel commodity classification requests.
- **Priority**: Medium
- **Status**: Planned

### 3. ADR numbering CI uniqueness gate (AUD5-F-002)
- **Description**: No CI step prevents duplicate `ADR-NNNN` filename numbers across `docs/adr/`; the same collision has now recurred three times (most recently `ADR-0028`). See `docs/architecture/ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md` Kapitel 5/10.1 (AUD5-F-002, Q2).
- **Priority**: High
- **Status**: Open

### 4. Production bundle code-splitting (D3)
- **Description**: `vite.config.ts` has no `manualChunks`/`chunkSizeWarningLimit`; production build still emits a single ~2.48 MB JS chunk. Carried across two audit cycles now — see `docs/architecture/ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md` Kapitel 10.2 (D3).
- **Priority**: Medium
- **Status**: Open
