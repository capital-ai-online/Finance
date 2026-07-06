# Data Flow Design Specification
## Ingress, Transformation, Persistence, and Storage Boundaries

This document specifies how transactional and operational data flows through the platform—from client submission to audit trail archival.

---

## 1. End-to-End Data Flow Pipeline

Data flows through four primary pipeline stages:

```
  [User UI] ────> [API Gateway] ────> [Event Bus] ────> [Platform Director]
                                                              │
                                                              ▼
 [Log File] <── [Observability] <── [Agent Network] <── [Master Supervisor]
```

1. **Ingress (Client Inputs)**:
   - User inputs trade metrics (e.g., symbol, weight, amount) through the dashboard UI.
   - The UI submits JSON payloads over HTTPS to `/api/workflow/initiate`.
2. **Interception & Context Enrichment**:
   - The API Gateway validates schemas and maps credentials to a `PolicyContext` (appending IP Address, User Roles, and `isSimulation` flags).
   - An event is dispatched, containing the raw payload and context headers.
3. **Decentralized Evaluation**:
   - The Platform Director parses the payload. If approved, the Master Supervisor schedules DAG tasks.
   - Agents read task payloads, process them (e.g., calculation of Beta), and emit outputs back to the Event Bus.
4. **Archival & Storage**:
   - Final outputs are logged as JSONL lines by the Observability module.
   - Traces are streamed to persistent directory structures on host disks.

---

## 2. Structural Data Transformations

Payload transformations occur at three major checkpoints:

```
Checkpoint 1: [Raw UI Payload]
              { symbol: "BTC", amount: "100" }
                           │
                           ▼ (Gateway appends context and converts inputs)
Checkpoint 2: [Enriched Event Payload]
              {
                payload: { symbol: "BTC", amount: 100 },
                context: { userId: "usr_12", role: "Trader" }
              }
                           │
                           ▼ (Agents enrich metadata)
Checkpoint 3: [Execution Receipt / Log Record]
              {
                id: "span_8321",
                correlationId: "corr_912",
                metadata: {
                  tradeSymbol: "BTC",
                  tradeAmount: 100,
                  computedBeta: 1.15,
                  complianceAuditPassed: true
                }
              }
```

---

## 3. Storage Boundaries & Memory Footprint

To ensure container stability in high-throughput environments, storage allocations are bounded:

- **Ephemeral In-Memory Event Bus**: The Event Bus maintains an in-memory history log of events. The buffer is capped at the most recent `100,000` events to prevent memory exhaustion (OutOfMemory) exceptions.
- **Filesystem Log Appender**: Telemetry span JSONL logs are stored in the host volume `/logs/audit/`. Logs are partitioned by day and rotated weekly via background system utilities to limit total disk footprint to under `10GB`.
- **System Buffer Failback**: If write access to the `/logs/audit/` folder fails, logs fall back to the `/tmp` volume, which clears automatically on container restarts.
