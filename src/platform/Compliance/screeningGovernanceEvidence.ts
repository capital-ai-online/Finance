import { getLatestScoreConfidenceEvidence } from '../../services/scoreConfidenceEvidence';
import { getMarketDataProviderTelemetry } from '../../services/marketDataProviderRouter';
import { buildScreeningSlaReport } from '../../services/screeningSla';
import type { Finding, ScannerResult, Severity } from './types';

const SEVERITY_WEIGHT: Record<Severity, number> = { CRITICAL: 40, HIGH: 25, MEDIUM: 12, LOW: 5 };

export function buildScreeningGovernanceEvidenceScanner(): ScannerResult | null {
  const confidence = getLatestScoreConfidenceEvidence();
  const sla = buildScreeningSlaReport(getMarketDataProviderTelemetry());

  if (!confidence && sla.state === 'NO_RUNTIME_EVIDENCE') return null;

  const findings: Finding[] = [];
  if (sla.state === 'UNAVAILABLE') {
    findings.push({
      id: 'FND-SCREENING-GOV-SLA-01',
      title: 'Screening provider SLA unavailable',
      severity: 'HIGH',
      description: 'Observed market-data provider telemetry indicates an unavailable screening SLA state.',
      complianceReference: 'ADR-0028 / Operational resilience / screening-sla/1.0.0',
      risk: 'Screening requests may fail closed or return insufficient evidence until providers recover.',
    });
  } else if (sla.state === 'DEGRADED') {
    findings.push({
      id: 'FND-SCREENING-GOV-SLA-02',
      title: 'Screening provider SLA degraded',
      severity: 'MEDIUM',
      description: 'Observed market-data provider telemetry indicates degraded latency, failures or cooldown state.',
      complianceReference: 'ADR-0028 / Operational resilience / screening-sla/1.0.0',
      risk: 'Screening freshness or completion latency may be reduced.',
    });
  }

  if (confidence && confidence.state === 'INSUFFICIENT_DATA') {
    findings.push({
      id: 'FND-SCREENING-GOV-CONFIDENCE-01',
      title: 'Score confidence has insufficient validation evidence',
      severity: 'MEDIUM',
      description: `Latest empirical score validation contains ${confidence.sampleSize} observations and does not meet the calibration threshold.`,
      complianceReference: 'ADR-0028 / score-confidence-evidence/1.0.0',
      risk: 'A calibrated empirical confidence value is not yet available; no default confidence may be assumed.',
    });
  }

  const penalty = findings.reduce((sum, finding) => sum + SEVERITY_WEIGHT[finding.severity], 0);
  const evidenceParts = [
    `screeningSla=${sla.state}`,
    `providersObserved=${sla.providersObserved}`,
    confidence
      ? `confidenceState=${confidence.state};sampleSize=${confidence.sampleSize};confidencePct=${confidence.confidencePct ?? 'null'}`
      : 'confidenceEvidence=not-observed',
  ];

  return {
    id: 'RUNTIME-SCREENING-GOV-01',
    name: 'Runtime Screening Governance Evidence',
    type: 'DATA',
    version: '1.0.0',
    complianceScore: Math.max(0, 100 - penalty),
    confidenceScore: confidence?.state === 'CALIBRATED' ? 100 : 70,
    evidence: evidenceParts.join('; '),
    findings,
    riskScore: Math.min(100, penalty),
    executionTimeMs: 0,
    isoControls: ['A.8.6 Capacity management', 'A.8.16 Monitoring activities'],
  };
}
