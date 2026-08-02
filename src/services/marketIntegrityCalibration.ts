import {
  getMarketIntegrityObservations,
  type MarketIntegrityObservation,
} from '../platform/Supervisor/marketIntegrityRuntime';

export const MARKET_INTEGRITY_CALIBRATION_VERSION = 'market-integrity-calibration/1.0.0';
export const MIN_RUNTIME_CALIBRATION_SAMPLE = 50;

export interface MarketIntegrityCapabilityCalibration {
  capability: MarketIntegrityObservation['capability'];
  observations: number;
  consistent: number;
  degraded: number;
  conflict: number;
  insufficient: number;
  consistencyRate: number | null;
  conflictRate: number | null;
  providerSets: Array<{ providers: string[]; observations: number }>;
}

export interface MarketIntegrityCalibrationReport {
  contractVersion: typeof MARKET_INTEGRITY_CALIBRATION_VERSION;
  status: 'NO_RUNTIME_EVIDENCE' | 'COLLECTING' | 'READY_FOR_MANUAL_REVIEW';
  observations: number;
  minimumSample: number;
  capabilities: MarketIntegrityCapabilityCalibration[];
  hardGateEnabled: false;
  hardGateRecommended: false;
  reason: string;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

export function buildMarketIntegrityCalibrationReport(
  records: MarketIntegrityObservation[] = getMarketIntegrityObservations(),
  minimumSample = MIN_RUNTIME_CALIBRATION_SAMPLE,
): MarketIntegrityCalibrationReport {
  const capabilities: MarketIntegrityObservation['capability'][] = [
    'spot-consensus',
    'snapshot-consensus',
    'snapshot-integrity',
  ];

  const results = capabilities.map((capability) => {
    const rows = records.filter((record) => record.capability === capability);
    const providerSetCounts = new Map<string, number>();
    for (const row of rows) {
      const providers = [...new Set(row.providers)].sort();
      const key = providers.join('|') || 'NO_PROVIDER';
      providerSetCounts.set(key, (providerSetCounts.get(key) ?? 0) + 1);
    }

    const consistent = rows.filter((row) => row.state === 'consistent').length;
    const degraded = rows.filter((row) => row.state === 'degraded').length;
    const conflict = rows.filter((row) => row.state === 'conflict').length;
    const insufficient = rows.filter((row) => row.state === 'insufficient').length;

    return {
      capability,
      observations: rows.length,
      consistent,
      degraded,
      conflict,
      insufficient,
      consistencyRate: ratio(consistent, rows.length),
      conflictRate: ratio(conflict, rows.length),
      providerSets: [...providerSetCounts.entries()]
        .map(([key, observations]) => ({
          providers: key === 'NO_PROVIDER' ? [] : key.split('|'),
          observations,
        }))
        .sort((a, b) => b.observations - a.observations),
    } satisfies MarketIntegrityCapabilityCalibration;
  });

  if (records.length === 0) {
    return {
      contractVersion: MARKET_INTEGRITY_CALIBRATION_VERSION,
      status: 'NO_RUNTIME_EVIDENCE',
      observations: 0,
      minimumSample,
      capabilities: results,
      hardGateEnabled: false,
      hardGateRecommended: false,
      reason: 'Keine Runtime-Market-Integrity-Beobachtungen vorhanden. Es wird keine Schwelle erfunden.',
    };
  }

  if (records.length < minimumSample) {
    return {
      contractVersion: MARKET_INTEGRITY_CALIBRATION_VERSION,
      status: 'COLLECTING',
      observations: records.length,
      minimumSample,
      capabilities: results,
      hardGateEnabled: false,
      hardGateRecommended: false,
      reason: `Kalibrierungsstichprobe ${records.length}/${minimumSample}. Quorum-/Integrity-Gates bleiben observation-only.`,
    };
  }

  return {
    contractVersion: MARKET_INTEGRITY_CALIBRATION_VERSION,
    status: 'READY_FOR_MANUAL_REVIEW',
    observations: records.length,
    minimumSample,
    capabilities: results,
    hardGateEnabled: false,
    hardGateRecommended: false,
    reason: 'Mindeststichprobe erreicht. Eine Aktivierung harter Scoring-/Ranking-Gates erfordert weiterhin reviewed Schwellenanalyse und ADR/Regression-Validierung.',
  };
}
