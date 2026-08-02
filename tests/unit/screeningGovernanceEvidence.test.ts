import { beforeEach, describe, expect, it } from 'vitest';
import { buildScreeningGovernanceEvidenceScanner } from '../../src/platform/Compliance/screeningGovernanceEvidence';
import { resetMarketDataProviderTelemetry, recordMarketDataProviderOutcome } from '../../src/services/marketDataProviderRouter';
import { resetScoreConfidenceEvidence, recordScoreConfidenceEvidence } from '../../src/services/scoreConfidenceEvidence';

beforeEach(() => {
  resetMarketDataProviderTelemetry();
  resetScoreConfidenceEvidence();
});

describe('screening governance runtime evidence', () => {
  it('returns null when no runtime evidence exists', () => {
    expect(buildScreeningGovernanceEvidenceScanner()).toBeNull();
  });

  it('creates a MEDIUM finding for insufficient empirical confidence', () => {
    recordScoreConfidenceEvidence({
      horizonDays: 30,
      threshold: 6.5,
      calibration: {
        contractVersion: 'score-confidence-calibration/1.0.0',
        state: 'INSUFFICIENT_DATA',
        sampleSize: 3,
        confidencePct: null,
        methodology: 'empirical-hit-rate',
        scoreImpactEnabled: false,
        recommendationImpactEnabled: false,
        reasons: ['minimum-sample-not-met:3/30'],
      },
    });
    const scanner = buildScreeningGovernanceEvidenceScanner();
    expect(scanner?.findings.some(finding => finding.severity === 'MEDIUM')).toBe(true);
    expect(scanner?.evidence).toContain('confidencePct=null');
  });

  it('creates a HIGH finding when provider SLA is unavailable', () => {
    recordMarketDataProviderOutcome({ provider: 'TwelveData', success: false, nowMs: 1_000 });
    recordMarketDataProviderOutcome({ provider: 'TwelveData', success: false, nowMs: 2_000 });
    recordMarketDataProviderOutcome({ provider: 'TwelveData', success: false, nowMs: 3_000 });
    const scanner = buildScreeningGovernanceEvidenceScanner();
    expect(scanner?.findings.some(finding => finding.severity === 'HIGH')).toBe(true);
  });
});
