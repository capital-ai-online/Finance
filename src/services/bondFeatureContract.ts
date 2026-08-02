export const BOND_FEATURE_CONTRACT_VERSION = 'bond-features/1.0.0';

export type BondEvidenceStatus =
  | 'READY_FOR_MODEL_VALIDATION'
  | 'BOND_EVIDENCE_INCOMPLETE'
  | 'STALE_EVIDENCE'
  | 'SOURCE_CONFLICT';

export interface BondInstrumentIdentity {
  providerSymbol: string;
  isin?: string;
  currency: string;
  maturityDate: string;
  couponRatePct: number;
}

export interface BondFeatureEvidence {
  field: string;
  provider: string;
  evidenceId: string;
  observedAt: string;
  retrievedAt: string;
  value: number | string;
  unit: string;
}

export interface BondFeatureCandidate {
  identity: BondInstrumentIdentity;
  priceHistoryPoints: number;
  yieldHistoryPoints: number;
  modifiedDuration?: number;
  yieldToMaturityPct?: number;
  treasury2yPct?: number;
  treasury10yPct?: number;
  evidence: BondFeatureEvidence[];
  sourceConflict?: boolean;
}

export interface BondFeatureValidationResult {
  version: typeof BOND_FEATURE_CONTRACT_VERSION;
  status: BondEvidenceStatus;
  missingFields: string[];
  evidenceIds: string[];
  reason: string;
  scoringEnabled: false;
}

const MAX_EVIDENCE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function validIsoDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function validateBondFeatureCandidate(
  candidate: BondFeatureCandidate,
  nowMs = Date.now(),
): BondFeatureValidationResult {
  const missingFields: string[] = [];
  const identity = candidate.identity;

  if (!identity.providerSymbol?.trim()) missingFields.push('identity.providerSymbol');
  if (!identity.currency?.trim()) missingFields.push('identity.currency');
  if (!validIsoDate(identity.maturityDate)) missingFields.push('identity.maturityDate');
  if (!Number.isFinite(identity.couponRatePct) || identity.couponRatePct < 0) missingFields.push('identity.couponRatePct');
  if (candidate.priceHistoryPoints < 20) missingFields.push('priceHistoryPoints>=20');
  if (candidate.yieldHistoryPoints < 20) missingFields.push('yieldHistoryPoints>=20');
  if (!Number.isFinite(candidate.modifiedDuration) || (candidate.modifiedDuration ?? 0) <= 0) missingFields.push('modifiedDuration');
  if (!Number.isFinite(candidate.yieldToMaturityPct)) missingFields.push('yieldToMaturityPct');
  if (!Number.isFinite(candidate.treasury2yPct)) missingFields.push('treasury2yPct');
  if (!Number.isFinite(candidate.treasury10yPct)) missingFields.push('treasury10yPct');

  const evidenceIds = candidate.evidence
    .map(item => item.evidenceId?.trim())
    .filter((id): id is string => Boolean(id));

  if (candidate.evidence.length === 0 || evidenceIds.length !== candidate.evidence.length) {
    missingFields.push('completeEvidenceIds');
  }

  if (candidate.sourceConflict) {
    return {
      version: BOND_FEATURE_CONTRACT_VERSION,
      status: 'SOURCE_CONFLICT',
      missingFields,
      evidenceIds,
      reason: 'Mindestens ein kritisches Bond-Feld weist einen Provider-Konflikt auf.',
      scoringEnabled: false,
    };
  }

  if (missingFields.length > 0) {
    return {
      version: BOND_FEATURE_CONTRACT_VERSION,
      status: 'BOND_EVIDENCE_INCOMPLETE',
      missingFields,
      evidenceIds,
      reason: 'Bond-Faktorcontract ist unvollständig; produktives Bond-Scoring bleibt gesperrt.',
      scoringEnabled: false,
    };
  }

  const stale = candidate.evidence.some(item => {
    const observed = Date.parse(item.observedAt);
    const retrieved = Date.parse(item.retrievedAt);
    return !Number.isFinite(observed)
      || !Number.isFinite(retrieved)
      || nowMs - Math.max(observed, retrieved) > MAX_EVIDENCE_AGE_MS;
  });

  if (stale) {
    return {
      version: BOND_FEATURE_CONTRACT_VERSION,
      status: 'STALE_EVIDENCE',
      missingFields: [],
      evidenceIds,
      reason: 'Mindestens ein erforderliches Bond-Evidence-Feld ist älter als die zulässige Evidence-Frist.',
      scoringEnabled: false,
    };
  }

  return {
    version: BOND_FEATURE_CONTRACT_VERSION,
    status: 'READY_FOR_MODEL_VALIDATION',
    missingFields: [],
    evidenceIds,
    reason: 'Feature-Evidence erfüllt den Contract; Bond-Scoring bleibt bis Golden-Dataset-/Modellvalidierung weiterhin deaktiviert.',
    scoringEnabled: false,
  };
}
