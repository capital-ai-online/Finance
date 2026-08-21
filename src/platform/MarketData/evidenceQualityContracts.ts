export const MARKET_EVIDENCE_DQ_CONTRACT_VERSION = 'market-evidence-dq/1.0.0' as const;

export type MarketEvidenceQualityStatus =
  | 'VERIFIED'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'INVALID'
  | 'CONFLICTING'
  | 'NOT_APPLICABLE';

export interface MarketEvidenceFreshness {
  readonly ageMs: number | null;
  readonly maxAgeMs: number | null;
  readonly evaluatedAt: string;
}

/**
 * Asset-class-neutral evidence quality envelope.
 *
 * Identity and evidence stay deliberately separate: provider symbols belong to UAI/provider
 * mapping and are never accepted as evidence by this contract. Missing/stale/conflicting evidence
 * is preserved explicitly and must never be converted into zero, PASS, confidence or a score.
 */
export interface MarketEvidenceQualityRecord {
  readonly assetId: string;
  readonly providerId: string;
  readonly capability: string;
  readonly field: string;
  readonly observedAt: string | null;
  readonly retrievedAt: string;
  readonly freshness: MarketEvidenceFreshness;
  readonly contractVersion: typeof MARKET_EVIDENCE_DQ_CONTRACT_VERSION;
  readonly qualityStatus: MarketEvidenceQualityStatus;
  readonly evidenceRef: string | null;
}

function isIsoTimestamp(value: string | null): value is string {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function isFiniteNonNegative(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function hasAdmissibleFreshness(evidence: MarketEvidenceQualityRecord): boolean {
  return isFiniteNonNegative(evidence.freshness.ageMs)
    && isFiniteNonNegative(evidence.freshness.maxAgeMs)
    && evidence.freshness.ageMs <= evidence.freshness.maxAgeMs
    && isIsoTimestamp(evidence.freshness.evaluatedAt);
}

export function isAdmissibleMarketEvidence(
  evidence: MarketEvidenceQualityRecord,
): evidence is MarketEvidenceQualityRecord & {
  readonly qualityStatus: 'VERIFIED';
  readonly observedAt: string;
  readonly evidenceRef: string;
} {
  return evidence.qualityStatus === 'VERIFIED'
    && isIsoTimestamp(evidence.observedAt)
    && isIsoTimestamp(evidence.retrievedAt)
    && Boolean(evidence.evidenceRef?.trim())
    && Boolean(evidence.assetId.trim())
    && Boolean(evidence.providerId.trim())
    && Boolean(evidence.capability.trim())
    && Boolean(evidence.field.trim())
    && hasAdmissibleFreshness(evidence);
}

export function assertMarketEvidenceContract(record: MarketEvidenceQualityRecord): void {
  if (record.contractVersion !== MARKET_EVIDENCE_DQ_CONTRACT_VERSION) {
    throw new Error('MARKET_EVIDENCE_DQ_CONTRACT_VERSION_MISMATCH');
  }
  if (!record.assetId.trim() || !record.providerId.trim() || !record.capability.trim() || !record.field.trim()) {
    throw new Error('MARKET_EVIDENCE_DQ_REQUIRED_FIELD_MISSING');
  }
  if (!isIsoTimestamp(record.retrievedAt) || !isIsoTimestamp(record.freshness.evaluatedAt)) {
    throw new Error('MARKET_EVIDENCE_DQ_INVALID_TIMESTAMP');
  }
  if (
    (record.freshness.ageMs !== null && !isFiniteNonNegative(record.freshness.ageMs))
    || (record.freshness.maxAgeMs !== null && !isFiniteNonNegative(record.freshness.maxAgeMs))
  ) {
    throw new Error('MARKET_EVIDENCE_DQ_INVALID_FRESHNESS');
  }
  if (record.qualityStatus === 'VERIFIED') {
    if (!isIsoTimestamp(record.observedAt) || !record.evidenceRef?.trim()) {
      throw new Error('MARKET_EVIDENCE_DQ_VERIFIED_REQUIRES_PROVENANCE');
    }
    if (!hasAdmissibleFreshness(record)) {
      throw new Error('MARKET_EVIDENCE_DQ_VERIFIED_REQUIRES_FRESH_EVIDENCE');
    }
  }
}
