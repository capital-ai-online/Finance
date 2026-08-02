export const HORIZON_VALIDATION_EVIDENCE_VERSION = 'horizon-validation-evidence/1.0.0' as const;

export interface VerifiedHistoricalPricePoint {
  observedAt: string;
  price: number;
  provider: string;
  evidenceId: string;
}

export type HorizonEvidenceStatus = 'READY' | 'NO_VERIFIED_POINT_IN_WINDOW' | 'INVALID_INPUT';

export interface HorizonValidationEvidence {
  contractVersion: typeof HORIZON_VALIDATION_EVIDENCE_VERSION;
  status: HorizonEvidenceStatus;
  targetAt: string | null;
  selected: VerifiedHistoricalPricePoint | null;
  distanceMs: number | null;
  maxDistanceMs: number;
  interpolationAllowed: false;
  syntheticEvidenceAllowed: false;
  reason: string;
}

export function selectHorizonValidationEvidence(input: {
  snapshotDate: string;
  horizonDays: number;
  points: VerifiedHistoricalPricePoint[];
  maxDistanceMs?: number;
}): HorizonValidationEvidence {
  const maxDistanceMs = input.maxDistanceMs ?? 36 * 60 * 60 * 1000;
  const snapshotMs = Date.parse(input.snapshotDate);
  if (!Number.isFinite(snapshotMs) || !Number.isFinite(input.horizonDays) || input.horizonDays < 1) {
    return {
      contractVersion: HORIZON_VALIDATION_EVIDENCE_VERSION,
      status: 'INVALID_INPUT',
      targetAt: null,
      selected: null,
      distanceMs: null,
      maxDistanceMs,
      interpolationAllowed: false,
      syntheticEvidenceAllowed: false,
      reason: 'Snapshot date or horizon is invalid.',
    };
  }

  const targetMs = snapshotMs + input.horizonDays * 24 * 60 * 60 * 1000;
  const targetAt = new Date(targetMs).toISOString();
  const candidates = input.points
    .filter(point => Number.isFinite(point.price) && point.price > 0 && Boolean(point.provider) && Boolean(point.evidenceId))
    .map(point => ({ point, observedMs: Date.parse(point.observedAt) }))
    .filter(item => Number.isFinite(item.observedMs))
    .map(item => ({ ...item, distanceMs: Math.abs(item.observedMs - targetMs) }))
    .filter(item => item.distanceMs <= maxDistanceMs)
    .sort((a, b) => a.distanceMs - b.distanceMs || a.observedMs - b.observedMs);

  const best = candidates[0];
  if (!best) {
    return {
      contractVersion: HORIZON_VALIDATION_EVIDENCE_VERSION,
      status: 'NO_VERIFIED_POINT_IN_WINDOW',
      targetAt,
      selected: null,
      distanceMs: null,
      maxDistanceMs,
      interpolationAllowed: false,
      syntheticEvidenceAllowed: false,
      reason: 'No verified historical price observation exists inside the allowed target window.',
    };
  }

  return {
    contractVersion: HORIZON_VALIDATION_EVIDENCE_VERSION,
    status: 'READY',
    targetAt,
    selected: { ...best.point },
    distanceMs: best.distanceMs,
    maxDistanceMs,
    interpolationAllowed: false,
    syntheticEvidenceAllowed: false,
    reason: 'Nearest verified historical observation inside the configured horizon window selected.',
  };
}
