import { getMarketIntegrityObservations, type MarketIntegrityObservation } from '../Supervisor/marketIntegrityRuntime';
import type { Finding, ScannerResult, Severity } from './types';

function severityFor(state: MarketIntegrityObservation['state']): Severity | null {
  if (state === 'consistent') return null;
  if (state === 'conflict') return 'HIGH';
  return 'MEDIUM';
}

export function buildMarketIntegrityEvidenceScanner(
  records: MarketIntegrityObservation[] = getMarketIntegrityObservations(),
): ScannerResult | null {
  if (records.length === 0) return null;
  const started = Date.now();
  const findings: Finding[] = [];

  for (const [index, record] of records.entries()) {
    const severity = severityFor(record.state);
    if (!severity) continue;
    findings.push({
      id: `FND-MARKET-INTEGRITY-${index + 1}`,
      title: `${record.symbol} ${record.capability}: ${record.state}`,
      severity,
      description: `Runtime market-data integrity observation at ${record.observedAt}. Providers: ${record.providers.join(', ') || 'none'}. Evidence count: ${record.evidenceIds.length}. ${record.message ?? ''}`.trim(),
      complianceReference: 'ADR-0021 / ADR-0023 / Data Integrity / Source Conflict Controls',
      risk: record.state === 'conflict'
        ? 'Conflicting financial evidence can invalidate canonical values and must remain fail-closed.'
        : 'Incomplete or degraded evidence reduces confidence and must not be represented as verified consensus.',
    });
  }

  const high = findings.filter(item => item.severity === 'HIGH').length;
  const medium = findings.filter(item => item.severity === 'MEDIUM').length;
  const penalty = Math.min(100, high * 25 + medium * 12);

  return {
    id: 'RUNTIME-MARKET-INTEGRITY-01',
    name: 'Runtime Market Data Integrity Evidence',
    type: 'DATA',
    version: '1.0.0',
    complianceScore: Math.max(0, 100 - penalty),
    confidenceScore: 100,
    evidence: `${records.length} observed market-integrity checks; ${high} conflicts and ${medium} degraded/insufficient observations.`,
    findings,
    riskScore: penalty,
    executionTimeMs: Math.max(0, Date.now() - started),
    isoControls: ['A.8.16 Monitoring activities', 'A.8.15 Logging'],
  };
}
