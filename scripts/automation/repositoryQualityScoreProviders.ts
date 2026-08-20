import type {
  QualityCoverageSnapshot,
  QualityScoreMeasurement,
} from '../../src/platform/Quality/Contracts/QualityCenterContract';
import { runAllScanners } from '../../src/platform/Compliance/scanners';
import type { ScannerResult } from '../../src/platform/Compliance/types';

export const QUALITY_SCORE_PROVIDER_VERSION = 'repository-quality-score-providers/1.0.0' as const;

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

export function createTestCoverageScoreMeasurement(
  coverage: QualityCoverageSnapshot,
): QualityScoreMeasurement {
  return Object.freeze({
    axis: 'test' as const,
    value: coverage.testAreaCoveragePercent,
    source: `${coverage.schemaVersion}:mandatory-test-area-coverage`,
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 12', 'ESS-0005', 'ESS-0011']),
  });
}

export function createSecurityScoreMeasurement(
  scannerResults: readonly ScannerResult[] = runAllScanners(),
): QualityScoreMeasurement | null {
  // Reuses the established SecurityComplianceAuditor aggregation semantics from
  // src/platform/Compliance/store.ts: arithmetic mean of SECURITY scanner complianceScore values.
  const score = average(
    scannerResults
      .filter((scanner) => scanner.type === 'SECURITY')
      .map((scanner) => scanner.complianceScore),
  );
  if (score === null) return null;

  return Object.freeze({
    axis: 'security' as const,
    value: score,
    source: 'ADR-0012:SecurityComplianceAuditor/SECURITY-scanner-mean',
    authorityRefs: Object.freeze(['ESS-0001-CONTRACTS Chapter 11', 'ESS-0006', 'ADR-0012']),
  });
}

export function collectDefaultQualityScoreMeasurements(
  coverage: QualityCoverageSnapshot,
  scannerResults?: readonly ScannerResult[],
): readonly QualityScoreMeasurement[] {
  const measurements: QualityScoreMeasurement[] = [createTestCoverageScoreMeasurement(coverage)];
  const security = createSecurityScoreMeasurement(scannerResults);
  if (security) measurements.push(security);
  return Object.freeze(measurements);
}
