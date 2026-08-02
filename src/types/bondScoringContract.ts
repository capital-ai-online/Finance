export const BOND_FEATURE_CONTRACT_VERSION = 'bond-features/1.0.0';
export const BOND_SCORING_CONTRACT_VERSION = 'bond-scoring/locked-1.0.0';

export type BondEvidenceStatus =
  | 'READY_FOR_MODEL_VALIDATION'
  | 'BOND_EVIDENCE_INCOMPLETE'
  | 'SOURCE_UNAVAILABLE'
  | 'SOURCE_CONFLICT'
  | 'STALE_EVIDENCE';

export interface BondInstrumentIdentity {
  providerSymbol: string;
  isin?: string;
  issuer: string;
  currency: string;
  maturityDate: string;
  couponRatePct: number;
}

export interface BondMarketEvidence {
  priceHistoryEvidenceIds: string[];
  yieldHistoryEvidenceIds: string[];
  observedAt: string;
  providers: string[];
}

export interface BondRateCurveEvidence {
  seriesIds: string[];
  evidenceIds: string[];
  observedAt: string;
  providers: string[];
}

export interface BondFeatureInputs {
  instrument: BondInstrumentIdentity;
  market: BondMarketEvidence;
  curve: BondRateCurveEvidence;
  modifiedDuration?: number;
  yieldToMaturityPct?: number;
  currentPrice?: number;
  faceValue?: number;
}

export interface BondEvidenceGateResult {
  status: BondEvidenceStatus;
  ready: boolean;
  missing: string[];
  evidenceIds: string[];
  providers: string[];
  featureVersion: string;
  scoringVersion: string;
  score: null;
  reason: string;
}

function validIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value) && Number.isFinite(Date.parse(value));
}

function positive(value: number | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Evidence gate only. This function NEVER emits a bond score.
 * It defines the minimum contract that must be satisfied before a future model may enter
 * validation against a real, reviewed golden dataset.
 */
export function evaluateBondEvidenceGate(input: BondFeatureInputs): BondEvidenceGateResult {
  const missing: string[] = [];
  const instrument = input.instrument;

  if (!instrument.providerSymbol?.trim()) missing.push('instrument.providerSymbol');
  if (!instrument.issuer?.trim()) missing.push('instrument.issuer');
  if (!/^[A-Z]{3}$/.test(instrument.currency)) missing.push('instrument.currency');
  if (!validIsoDate(instrument.maturityDate)) missing.push('instrument.maturityDate');
  if (!Number.isFinite(instrument.couponRatePct) || instrument.couponRatePct < 0) missing.push('instrument.couponRatePct');

  if (input.market.priceHistoryEvidenceIds.length < 1) missing.push('market.priceHistoryEvidenceIds');
  if (input.market.yieldHistoryEvidenceIds.length < 1) missing.push('market.yieldHistoryEvidenceIds');
  if (!validIsoDate(input.market.observedAt)) missing.push('market.observedAt');
  if (input.market.providers.length < 1) missing.push('market.providers');

  if (input.curve.seriesIds.length < 2) missing.push('curve.seriesIds');
  if (input.curve.evidenceIds.length < 2) missing.push('curve.evidenceIds');
  if (!validIsoDate(input.curve.observedAt)) missing.push('curve.observedAt');
  if (input.curve.providers.length < 1) missing.push('curve.providers');

  if (!positive(input.modifiedDuration)) missing.push('modifiedDuration');
  if (!positive(input.yieldToMaturityPct)) missing.push('yieldToMaturityPct');
  if (!positive(input.currentPrice)) missing.push('currentPrice');
  if (!positive(input.faceValue)) missing.push('faceValue');

  const evidenceIds = [...new Set([
    ...input.market.priceHistoryEvidenceIds,
    ...input.market.yieldHistoryEvidenceIds,
    ...input.curve.evidenceIds,
  ])];
  const providers = [...new Set([...input.market.providers, ...input.curve.providers])].sort();

  if (missing.length > 0) {
    return {
      status: 'BOND_EVIDENCE_INCOMPLETE',
      ready: false,
      missing,
      evidenceIds,
      providers,
      featureVersion: BOND_FEATURE_CONTRACT_VERSION,
      scoringVersion: BOND_SCORING_CONTRACT_VERSION,
      score: null,
      reason: 'Bond Scoring bleibt gesperrt, weil Pflicht-Evidence oder Pflicht-Faktoren fehlen.',
    };
  }

  return {
    status: 'READY_FOR_MODEL_VALIDATION',
    ready: true,
    missing: [],
    evidenceIds,
    providers,
    featureVersion: BOND_FEATURE_CONTRACT_VERSION,
    scoringVersion: BOND_SCORING_CONTRACT_VERSION,
    score: null,
    reason: 'Evidence Contract vollständig. Ein numerischer Score bleibt bis zur Modell-/Golden-Dataset-Validierung gesperrt.',
  };
}
