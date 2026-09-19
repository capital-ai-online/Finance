export const CRYPTO_PATTERN_TROOPER_UI_VERSION =
  'frontend.crypto-pattern-trooper/0.1.0' as const;

export type CryptoPatternTrooperDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type CryptoPatternTrooperStatus = 'READY' | 'NOT_COMPUTABLE';

export interface CryptoPatternTrooperContributionInput {
  readonly feature: string;
  readonly observedValue: number | boolean | null;
  readonly condition: string;
  readonly met: boolean;
  readonly contribution: number;
}

export interface CryptoPatternResearchProjectionInput {
  readonly status: CryptoPatternTrooperStatus;
  readonly patternId: string | null;
  readonly timeframe: string | null;
  readonly direction: CryptoPatternTrooperDirection | null;
  readonly referenceScore: number | null;
  readonly referenceThreshold: number;
  readonly referenceThresholdMet: boolean;
  readonly contributions: readonly CryptoPatternTrooperContributionInput[];
  readonly missingConfirmationFields: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly canonicalScoreImpact: 'NONE';
  readonly authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE';
}

export interface CryptoPatternTrooperConfirmationView {
  readonly feature: string;
  readonly label: string;
  readonly observedValue: number | boolean | null;
  readonly condition: string;
  readonly state: 'CONFIRMED' | 'NOT_CONFIRMED';
  readonly contribution: number;
}

export interface CryptoPatternTrooperTimeframeLane {
  readonly timeframe: '4h' | '1d';
  readonly state: 'ACTIVE' | 'REFERENCE';
}

export interface CryptoPatternTrooperViewModel {
  readonly uiVersion: typeof CRYPTO_PATTERN_TROOPER_UI_VERSION;
  readonly status: CryptoPatternTrooperStatus;
  readonly patternId: string | null;
  readonly patternLabel: string;
  readonly timeframe: string | null;
  readonly direction: CryptoPatternTrooperDirection | null;
  readonly referenceScore: number | null;
  readonly referenceThreshold: number | null;
  readonly referenceThresholdMet: boolean;
  readonly confirmations: readonly CryptoPatternTrooperConfirmationView[];
  readonly missingConfirmationFields: readonly string[];
  readonly evidenceCount: number;
  readonly timeframeLanes: readonly CryptoPatternTrooperTimeframeLane[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly canonicalScoreImpact: 'NONE';
  readonly authority: 'RESEARCH';
  readonly reason: string;
}

const PATTERN_LABELS: Readonly<Record<string, string>> = Object.freeze({
  'inverse-head-and-shoulders': 'Inverse Head & Shoulders',
  'head-and-shoulders': 'Head & Shoulders',
  'double-bottom': 'Double Bottom',
});

const FEATURE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  volumeBreakoutRatio: 'Volume Breakout',
  rsi14CrossAbove50: 'RSI 14 > 50',
  rsi14CrossBelow50: 'RSI 14 < 50',
  priceNearMajorSupport: 'Major Support',
  volumeSecondLowLower: 'Second-Low Volume',
  macdHistogramTurnPositive: 'MACD Histogram',
});

function displayPattern(patternId: string | null): string {
  if (!patternId) return 'Altcoin Pattern Research';
  return PATTERN_LABELS[patternId] ?? patternId
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function displayFeature(feature: string): string {
  const normalized = feature.trim();
  if (!normalized) return 'Unknown confirmation';
  return FEATURE_LABELS[normalized] ?? normalized
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => value.trim()).filter(Boolean))]);
}

function validateProjection(input: CryptoPatternResearchProjectionInput): void {
  if (
    input.scoreEligible !== false
    || input.executionEligible !== false
    || input.canonicalScoreImpact !== 'NONE'
    || input.authority !== 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE'
  ) {
    throw new Error('CRYPTO_PATTERN_TROOPER_AUTHORITY_MISMATCH');
  }

  if (
    !Number.isFinite(input.referenceThreshold)
    || input.referenceThreshold < 0
    || input.referenceThreshold > 100
  ) {
    throw new Error('CRYPTO_PATTERN_TROOPER_INVALID_REFERENCE_THRESHOLD');
  }

  if (input.status === 'READY') {
    if (
      !input.patternId
      || !input.timeframe
      || !input.direction
      || input.referenceScore === null
      || !Number.isFinite(input.referenceScore)
      || input.referenceScore < 0
      || input.referenceScore > 100
    ) {
      throw new Error('CRYPTO_PATTERN_TROOPER_READY_SHAPE_INVALID');
    }
  } else if (input.referenceScore !== null) {
    throw new Error('CRYPTO_PATTERN_TROOPER_NOT_COMPUTABLE_SCORE_FORBIDDEN');
  }

  for (const contribution of input.contributions) {
    if (
      !contribution.feature.trim()
      || !contribution.condition.trim()
      || !Number.isFinite(contribution.contribution)
      || contribution.contribution < 0
    ) {
      throw new Error('CRYPTO_PATTERN_TROOPER_CONFIRMATION_INVALID');
    }
  }
}

function buildTimeframeLanes(timeframe: string | null): readonly CryptoPatternTrooperTimeframeLane[] {
  return Object.freeze([
    Object.freeze({ timeframe: '4h' as const, state: timeframe === '4h' ? 'ACTIVE' as const : 'REFERENCE' as const }),
    Object.freeze({ timeframe: '1d' as const, state: timeframe === '1d' ? 'ACTIVE' as const : 'REFERENCE' as const }),
  ]);
}

function emptyViewModel(): CryptoPatternTrooperViewModel {
  return Object.freeze({
    uiVersion: CRYPTO_PATTERN_TROOPER_UI_VERSION,
    status: 'NOT_COMPUTABLE' as const,
    patternId: null,
    patternLabel: 'Altcoin Pattern Research',
    timeframe: null,
    direction: null,
    referenceScore: null,
    referenceThreshold: null,
    referenceThresholdMet: false,
    confirmations: Object.freeze([]),
    missingConfirmationFields: Object.freeze([]),
    evidenceCount: 0,
    timeframeLanes: buildTimeframeLanes(null),
    scoreEligible: false as const,
    executionEligible: false as const,
    canonicalScoreImpact: 'NONE' as const,
    authority: 'RESEARCH' as const,
    reason: 'FINTECH Pattern-Research-Evidence ist noch nicht an diese Präsentationsfläche gebunden.',
  });
}

/**
 * Pure presentation projection. It accepts already-authorized FINTECH research output and never
 * calculates a pattern score, threshold, evidence state or execution decision in the browser.
 */
export function buildCryptoPatternTrooperViewModel(
  input?: CryptoPatternResearchProjectionInput | null,
): CryptoPatternTrooperViewModel {
  if (!input) return emptyViewModel();
  validateProjection(input);

  const confirmations = input.contributions.map((contribution) => Object.freeze({
    feature: contribution.feature,
    label: displayFeature(contribution.feature),
    observedValue: contribution.observedValue,
    condition: contribution.condition,
    state: contribution.met ? 'CONFIRMED' as const : 'NOT_CONFIRMED' as const,
    contribution: contribution.contribution,
  }));

  const evidenceRefs = uniqueStrings(input.evidenceRefs);
  const missingConfirmationFields = uniqueStrings(input.missingConfirmationFields);

  return Object.freeze({
    uiVersion: CRYPTO_PATTERN_TROOPER_UI_VERSION,
    status: input.status,
    patternId: input.patternId,
    patternLabel: displayPattern(input.patternId),
    timeframe: input.timeframe,
    direction: input.direction,
    referenceScore: input.referenceScore,
    referenceThreshold: input.referenceThreshold,
    referenceThresholdMet: input.referenceThresholdMet,
    confirmations: Object.freeze(confirmations),
    missingConfirmationFields,
    evidenceCount: evidenceRefs.length,
    timeframeLanes: buildTimeframeLanes(input.timeframe),
    scoreEligible: false as const,
    executionEligible: false as const,
    canonicalScoreImpact: 'NONE' as const,
    authority: 'RESEARCH' as const,
    reason: input.status === 'READY'
      ? 'FINTECH Research-Projektion vorhanden. Der angezeigte Wert ist kein Canonical Score und keine Trade-Freigabe.'
      : 'FINTECH Research-Projektion ist NOT_COMPUTABLE; Frontend erzeugt keinen Ersatzwert.',
  });
}
