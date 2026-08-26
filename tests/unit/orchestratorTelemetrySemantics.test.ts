import { describe, expect, it } from 'vitest';
import {
  ORCHESTRATOR_PROHIBITED_TELEMETRY_CLAIMS,
  ORCHESTRATOR_TELEMETRY_CONTRACT,
} from '../../src/lib/orchestratorTelemetrySemantics';

describe('FO-04 orchestrator telemetry truth contract', () => {
  it('states the instrumentation coverage boundary explicitly', () => {
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.scope.description).toContain('ausschließlich Requests');
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.scope.description).toContain('Keine globale API-, WAF- oder DDoS-Abdeckung');
  });

  it('does not interpret processed requests as business success', () => {
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.metrics.totalProcessed.label).toBe('Abgewickelt');
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.metrics.totalProcessed.note).toContain('keine fachliche Erfolgsquote');
  });

  it('does not classify rate-limit rejections as detected attacks', () => {
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.metrics.rateLimitsHit.label).toBe('Rate-Limit-Ablehnungen');
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.metrics.rateLimitsHit.note).toContain('keine Bot-, Spam- oder Angriffsklassifikation');
  });

  it('documents the bounded recent-log window instead of claiming global throughput', () => {
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.metrics.recentEvents.note).toContain('50 Einträge');
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.metrics.recentEvents.note).toContain('kein globaler Requests-pro-Minute-Zähler');
  });

  it('represents model data as integration status, not health or latency telemetry', () => {
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.models.title).toBe('Modell-Integrationsstatus');
    expect(ORCHESTRATOR_TELEMETRY_CONTRACT.models.description).toContain('keine aktiven Health- oder Latenzprüfungen');
  });

  it('keeps known misleading legacy claims out of the canonical telemetry contract', () => {
    const canonicalCopy = JSON.stringify(ORCHESTRATOR_TELEMETRY_CONTRACT);
    for (const claim of ORCHESTRATOR_PROHIBITED_TELEMETRY_CLAIMS) {
      expect(canonicalCopy).not.toContain(claim);
    }
  });
});
