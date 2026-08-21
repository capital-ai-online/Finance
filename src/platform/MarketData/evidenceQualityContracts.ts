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

export function isAdmissibleMarketEvidence(
  evidence: MarketEvidenceQualityRecord,
): evidence is MarketEvidenceQualityRecord & {
  readonly qualityStatus: 'VERIFIED';
  readonly observedAt: string;
  readonly evidenceRef: string;
} {
  return evidence.qualityStatus === 'VERIFIED'
    && Boolean(evidence.observedAt)
    && Boolean(evidence.evidenceRef)
    && Boolean(evidence.providerId)
    && Boolean(evidence.capability)
    && Boolean(evidence.field);
}

export function assertMarketEvidenceContract(record: MarketEvidenceQualityRecord): void {
  if (record.contractVersion !== MARKET_EVIDENCE_DQ_CONTRACT_VERSION) {
    throw new Error('MARKET_EVIDENCE_DQ_CONTRACT_VERSION_MISMATCH');
  }
  if (!record.assetId || !record.providerId || !record.capability || !record.field || !record.retrievedAt) {
    throw new Error('MARKET_EVIDENCE_DQ_REQUIRED_FIELD_MISSING');
  }
  if (record.qualityStatus === 'VERIFIED' && (!record.observedAt || !record.evidenceRef)) {
    throw new Error('MARKET_EVIDENCE_DQ_VERIFIED_REQUIRES_PROVENANCE');
  }
}
