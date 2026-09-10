export const TELEMETRY_SCHEMA_VERSION = '1.1.0' as const;

/**
 * Kanonische operative Stufen der CAPITAL-AI FinTech-Wertschöpfungskette.
 * Audit-Evidence bleibt bewusst eine separate Authority und wird nur referenziert.
 */
export type FinTechValueChainStage =
  | 'request-intake'
  | 'identity-access'
  | 'entitlement-usage'
  | 'orchestration'
  | 'market-data-provider'
  | 'data-validation'
  | 'scoring-analysis'
  | 'explainability'
  | 'billing'
  | 'output-delivery'
  | 'deployment-runtime';

export type TelemetrySignal = 'log' | 'metric' | 'trace';
export type TelemetrySeverity = 'info' | 'warn' | 'error';
export type TelemetryOutcome = 'success' | 'failure' | 'degraded' | 'denied' | 'unknown';
export type TelemetryEdgeTrust = 'trusted-cloudflare-render' | 'untrusted' | 'not-render';

export interface TelemetryContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  traceFlags?: string;
  edgeRayId?: string;
  edgeTrust?: TelemetryEdgeTrust;
  service: string;
  environment: string;
  version?: string;
  commitSha?: string;
}

export interface TelemetryRecord {
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  timestamp: string;
  signal: TelemetrySignal;
  severity: TelemetrySeverity;
  stage: FinTechValueChainStage;
  eventName: string;
  outcome: TelemetryOutcome;
  durationMs?: number;
  provider?: string;
  assetClass?: string;
  context: TelemetryContext;
  attributes?: Record<string, unknown>;
  /** Nur Referenz: revisionsrelevante Audit-Evidence wird nicht als Operational Telemetry gespeichert. */
  auditReference?: string;
}

export interface CreateTelemetryRecordInput extends Omit<TelemetryRecord, 'schemaVersion' | 'timestamp'> {
  timestamp?: string;
}

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/;

export function createTelemetryRecord(input: CreateTelemetryRecordInput): TelemetryRecord {
  if (!EVENT_NAME_PATTERN.test(input.eventName)) {
    throw new Error(`Invalid telemetry event name: ${input.eventName}`);
  }
  if (!input.context.service.trim()) throw new Error('Telemetry service is required');
  if (!input.context.environment.trim()) throw new Error('Telemetry environment is required');
  if (input.durationMs !== undefined && (!Number.isFinite(input.durationMs) || input.durationMs < 0)) {
    throw new Error('Telemetry durationMs must be a non-negative finite number');
  }

  return Object.freeze({
    ...input,
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    timestamp: input.timestamp ?? new Date().toISOString(),
    context: Object.freeze({ ...input.context }),
    attributes: input.attributes ? Object.freeze({ ...input.attributes }) : undefined,
  });
}

export const CRITICAL_VALUE_CHAIN_EVENTS = Object.freeze({
  requestCompleted: 'request.completed',
  identityDecision: 'identity.decision',
  entitlementDecision: 'entitlement.decision',
  orchestrationCompleted: 'orchestration.completed',
  providerRequestCompleted: 'provider.request.completed',
  dataValidationCompleted: 'data.validation.completed',
  scoringCompleted: 'scoring.completed',
  explainabilityCompleted: 'explainability.completed',
  billingOperationCompleted: 'billing.operation.completed',
  outputDelivered: 'output.delivered',
  deploymentRuntimeReady: 'deployment.runtime.ready',
} as const);
