# ADR-0059 — Agent Execution Audit and OpenTelemetry Correlation

Status: PROPOSED
Date: 2026-08-11

## Decision
Every AI-assisted command is correlated end-to-end with request_id, trace_id and attributable actor/agent identity. OpenTelemetry and W3C Trace Context are the preferred neutral correlation standards. Security audit evidence is a separate durability/retention class from sampled operational telemetry.

Minimum audit fields: human_actor_id, app_id, agent_id, provider/model metadata, intent, scope, capability, risk_class, policy_id/version, authorization decision, approval/step-up reference, tool/command, repository/branch/commit/PR, CI run, artifact digest, deployment/runtime identity, result/error, rollback reference and timestamps.

## Security
Redaction occurs before export. Secrets/tokens/full prompts/full diffs are prohibited by default.

## Migration
Extend ADR-0056 O1 baseline during M5; do not create a parallel telemetry stack.

## Verification
Traceability tests must reconstruct an authorized change from request through runtime verification without exposing secrets.