# Observability & Audit Design Specification
## OpenTelemetry-Inspired JSONL Audit Tracing

The platform features a highly specialized, lightweight, OpenTelemetry-inspired **Observability** framework. Its goal is to provide transaction trace tracking, latency profiling, and audit logging to verify regulatory and operational SLAs.

---

## 1. Trace Span Architecture

Every transactional operation or agent execution step is bounded by a **Telemetry Span**. 

Spans capture:
- **`id`**: A unique tracking identifier.
- **`correlationId`**: The global workflow-tracking identifier, linking distributed agent operations.
- **`name`**: The operational step name (e.g., `execute_trade`, `calculate_portfolio_risk`).
- **`durationMs`**: Detailed millisecond latency tracking.
- **`metadata`**: A dynamic map capturing payload structures, input parameters, or intermediate calculation results.
- **`timestamp`**: Absolute high-precision ISO date strings.

---

## 2. Immutable JSONL File Logging

To comply with regulatory standards requiring audit record preservation, the Observability system persists every closed span to **Line-Delimited JSON (JSONL)** audit logs:

- Logs are written to `/logs/audit/audit_trail_<correlationId>.jsonl`.
- Each line in the file is a standalone, self-contained JSON object representing a completed transaction step.
- This format allows for efficient, stream-based log parsers and ingestion into enterprise systems (e.g., Datadog, AWS CloudWatch, Splunk).

### Example JSONL Log File Content
```json
{"id":"span_q8d3js1k9","correlationId":"corr_987654321","name":"agent.router.started","durationMs":45,"timestamp":"2026-07-06T06:50:00.120Z"}
{"id":"span_b3m9s2n8x","correlationId":"corr_987654321","name":"agent.risk.started","durationMs":120,"metadata":{"beta":1.15,"var":12.5},"timestamp":"2026-07-06T06:50:00.315Z"}
{"id":"span_k8f3s9v2q","correlationId":"corr_987654321","name":"execute_trade","durationMs":450,"metadata":{"action":"BUY","symbol":"BTC","amount":1000},"timestamp":"2026-07-06T06:50:00.950Z"}
```

---

## 3. Fail-Silent Resilience

FinTech platforms must survive physical infrastructure degradation. The Observability framework uses a **Fail-Silent** architecture to handle write errors:

- **Directory Creation**: On startup, it attempts to write to the configured production audit directory (`/logs/audit`).
- **Fallback Directory**: If the environment uses read-only filesystems or restricted containers, the system catches file errors and re-routes log appending to `/tmp`.
- **Silent Exception Swallowing**: If writing fails completely, the engine records spans in memory, logging warnings in the developer console while ensuring the primary transaction completes successfully.

---

## 4. Integration with Regulatory Compliance

The generated `.jsonl` audit trails act as legal documentation. They provide regulators with:
- **Verification of pre-trade risk checks**: Proving that a risk calculation occurred *before* the trade order was dispatched.
- **Proof of policy execution**: Recording the rules evaluated by the OPA Engine and verifying the credentials of the authorizing user.
- **Microsecond trace maps**: Demonstrating exactly how much latency was introduced by AI models versus the core system infrastructure.
