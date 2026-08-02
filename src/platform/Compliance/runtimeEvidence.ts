import { getProviderHealth, type ProviderHealthRecord } from '../Supervisor/providerHealth';
import type { Finding, ScannerResult, Severity } from './types';

const SEVERITY_WEIGHT: Record<Severity, number> = { CRITICAL: 40, HIGH: 25, MEDIUM: 12, LOW: 5 };

function findingForProvider(record: ProviderHealthRecord, sequence: number): Finding | null {
  if (record.state === 'healthy') return null;
  const severity: Severity = record.state === 'unavailable' ? 'HIGH' : 'MEDIUM';
  return {
    id: `FND-RUNTIME-${sequence}`,
    title: `${record.provider} ${record.capability}: ${record.state}`,
    severity,
    description: `Zur Laufzeit beobachteter Providerzustand ${record.state}. Letzte Beobachtung: ${record.lastObservedAt}. Consecutive Failures: ${record.consecutiveFailures}. Cache-Modus: ${record.cacheMode ?? 'n/a'}.`,
    complianceReference: 'ADR-0012 / Operational Resilience / Evidence-based controls',
    risk: record.state === 'unavailable'
      ? 'Finanzielle Daten- oder Scoring-Funktionen können fail-closed nicht verfügbar sein.'
      : 'Degraded/Last-Known-Good-Betrieb kann Datenaktualität und Servicequalität reduzieren.',
  };
}

/**
 * Converts actually observed runtime provider health into auditable compliance evidence.
 * Returns null when no provider has been observed; absence of runtime evidence is not treated
 * as success and no artificial finding/score is generated for a provider that never ran.
 */
export function buildRuntimeEvidenceScanner(records: ProviderHealthRecord[] = getProviderHealth()): ScannerResult | null {
  if (records.length === 0) return null;
  const started = Date.now();
  const findings = records
    .map((record, index) => findingForProvider(record, index + 1))
    .filter((finding): finding is Finding => finding !== null);
  const penalty = findings.reduce((sum, finding) => sum + SEVERITY_WEIGHT[finding.severity], 0);
  const complianceScore = Math.max(0, 100 - penalty);
  const riskScore = Math.min(100, penalty);
  const healthy = records.filter(record => record.state === 'healthy').length;
  const degraded = records.filter(record => record.state === 'degraded').length;
  const unavailable = records.filter(record => record.state === 'unavailable').length;

  return {
    id: 'RUNTIME-01',
    name: 'Runtime Provider Resilience Evidence',
    type: 'DATA',
    version: '1.0.0',
    complianceScore,
    confidenceScore: 100,
    evidence: `${records.length} tatsächlich beobachtete Provider-Capabilities: ${healthy} healthy, ${degraded} degraded, ${unavailable} unavailable.`,
    findings,
    riskScore,
    executionTimeMs: Math.max(0, Date.now() - started),
    isoControls: ['A.8.6 Capacity management', 'A.8.16 Monitoring activities'],
  };
}
