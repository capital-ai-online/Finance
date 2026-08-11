# AI Agent Telemetry Model

Use W3C Trace Context and OpenTelemetry-compatible spans across AI client -> Control Plane -> tool -> GitHub/CI -> deployment -> runtime.

Operational telemetry may be sampled. Security audit evidence MUST NOT depend on sampled spans. Correlation IDs are shared, stores/retention are separate.

Core span attributes mirror the audit schema but contain only redacted operational values. Provider-specific tracing may enrich but never replace the canonical trace.