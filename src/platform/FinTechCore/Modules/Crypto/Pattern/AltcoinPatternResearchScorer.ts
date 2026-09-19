import type { PatternSignalResolution } from './PatternSignalResolver';

export const ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION =
  'fintech-core.crypto/altcoin-pattern-confirmation/0.1.0' as const;
export const ALTCOIN_PATTERN_REFERENCE_PROFILE_VERSION =
  'fintech-core.crypto/altcoin-pattern-reference-profile/0.1.0' as const;
export const ALTCOIN_PATTERN_RESEARCH_SCORER_VERSION =
  'fintech-core.crypto/altcoin-pattern-research-scorer/0.1.0' as const;

export type AltcoinPatternReferenceFeature =
  | 'volumeBreakoutRatio'
  | 'rsi14CrossAbove50'
  | 'rsi14CrossBelow50'
  | 'priceNearMajorSupport'
  | 'volumeSecondLowLower'
  | 'macdHistogramTurnPositive';

export interface AltcoinPatternReferenceBoost {
  readonly feature: AltcoinPatternReferenceFeature;
  readonly operator: 'GTE' | 'TRUE';
  readonly threshold?: number;
  readonly boost: number;
}

export interface AltcoinPatternReferenceConfig {
  readonly patternId: 'inverse-head-and-shoulders' | 'head-and-shoulders' | 'double-bottom';
  readonly referenceBaseScore: number;
  readonly timeframes: readonly ['4h', '1d'];
  readonly confirmationBoosts: readonly AltcoinPatternReferenceBoost[];
}

/**
 * Owner-provided reference-profile projection.
 *
 * IMPORTANT: referenceBaseScore values mirror the supplied reference document. They are not
 * asset-specific reliability evidence, are not canonical financial scores and must never replace
 * PatternReliabilityRegistry. Productive promotion requires governed validation/backtesting.
 */
export const ALTCOIN_PATTERN_REFERENCE_PROFILE = Object.freeze({
  profileVersion: ALTCOIN_PATTERN_REFERENCE_PROFILE_VERSION,
  targetUniverse: 'ALTCOIN',
  timeframes: Object.freeze(['4h', '1d'] as const),
  referenceThreshold: 75,
  scoredPatterns: Object.freeze<readonly AltcoinPatternReferenceConfig[]>([
    Object.freeze({
      patternId: 'inverse-head-and-shoulders',
      referenceBaseScore: 85,
      timeframes: Object.freeze(['4h', '1d'] as const),
      confirmationBoosts: Object.freeze([
        Object.freeze({ feature: 'volumeBreakoutRatio', operator: 'GTE', threshold: 1.3, boost: 10 }),
        Object.freeze({ feature: 'rsi14CrossAbove50', operator: 'TRUE', boost: 8 }),
        Object.freeze({ feature: 'priceNearMajorSupport', operator: 'TRUE', boost: 7 }),
      ]),
    }),
    Object.freeze({
      patternId: 'head-and-shoulders',
      referenceBaseScore: 82,
      timeframes: Object.freeze(['4h', '1d'] as const),
      confirmationBoosts: Object.freeze([
        Object.freeze({ feature: 'volumeBreakoutRatio', operator: 'GTE', threshold: 1.3, boost: 10 }),
        Object.freeze({ feature: 'rsi14CrossBelow50', operator: 'TRUE', boost: 8 }),
      ]),
    }),
    Object.freeze({
      patternId: 'double-bottom',
      referenceBaseScore: 82,
      timeframes: Object.freeze(['4h', '1d'] as const),
      confirmationBoosts: Object.freeze([
        Object.freeze({ feature: 'volumeSecondLowLower', operator: 'TRUE', boost: 6 }),
        Object.freeze({ feature: 'macdHistogramTurnPositive', operator: 'TRUE', boost: 7 }),
      ]),
    }),
  ]),
  /**
   * Mentioned in the source as useful pattern families, but no complete source scoring contract was
   * provided for them. They remain catalog-only until a governed formula/backtest exists.
   */
  catalogOnlyPatternIds: Object.freeze([
    'flag',
    'channel-breakout',
    'ascending-triangle',
    'descending-triangle',
    'pennant',
    'range-breakout',
    'volatility-squeeze',
  ] as const),
  authority: 'REFERENCE_RESEARCH_CONFIGURATION_ONLY',
  canonicalScoreImpact: 'NONE',
} as const);

export interface AltcoinPatternConfirmationEvidence {
  readonly contractVersion: typeof ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION;
  readonly patternId: string;
  readonly timeframe: string;
  readonly observedAt: string;
  readonly evidenceRefs: readonly string[];
  readonly volumeBreakoutRatio?: number;
  readonly rsi14CrossAbove50?: boolean;
  readonly rsi14CrossBelow50?: boolean;
  readonly priceNearMajorSupport?: boolean;
  readonly volumeSecondLowLower?: boolean;
  readonly macdHistogramTurnPositive?: boolean;
}

export interface AltcoinPatternResearchScoreRequest {
  readonly resolution: PatternSignalResolution;
  readonly confirmation: AltcoinPatternConfirmationEvidence;
}

export interface AltcoinPatternResearchContribution {
  readonly feature: AltcoinPatternReferenceFeature;
  readonly observedValue: number | boolean | null;
  readonly condition: string;
  readonly met: boolean;
  readonly contribution: number;
}

export interface AltcoinPatternResearchScoreAssessment {
  readonly scorerVersion: typeof ALTCOIN_PATTERN_RESEARCH_SCORER_VERSION;
  readonly profileVersion: typeof ALTCOIN_PATTERN_REFERENCE_PROFILE_VERSION;
  readonly status: 'READY' | 'NOT_COMPUTABLE';
  readonly patternId: string | null;
  readonly timeframe: string | null;
  readonly direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | null;
  readonly referenceBaseScore: number | null;
  readonly referenceScore: number | null;
  readonly referenceThreshold: number;
  readonly referenceThresholdMet: boolean;
  readonly contributions: readonly AltcoinPatternResearchContribution[];
  readonly missingConfirmationFields: readonly AltcoinPatternReferenceFeature[];
  readonly evidenceRefs: readonly string[];
  readonly reasons: readonly string[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly canonicalScoreImpact: 'NONE';
  readonly authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE';
}

function notComputable(
  reasons: readonly string[],
  patternId: string | null = null,
  timeframe: string | null = null,
): AltcoinPatternResearchScoreAssessment {
  return Object.freeze({
    scorerVersion: ALTCOIN_PATTERN_RESEARCH_SCORER_VERSION,
    profileVersion: ALTCOIN_PATTERN_REFERENCE_PROFILE_VERSION,
    status: 'NOT_COMPUTABLE' as const,
    patternId,
    timeframe,
    direction: null,
    referenceBaseScore: null,
    referenceScore: null,
    referenceThreshold: ALTCOIN_PATTERN_REFERENCE_PROFILE.referenceThreshold,
    referenceThresholdMet: false,
    contributions: Object.freeze([]),
    missingConfirmationFields: Object.freeze([]),
    evidenceRefs: Object.freeze([]),
    reasons: Object.freeze([...reasons]),
    scoreEligible: false as const,
    executionEligible: false as const,
    canonicalScoreImpact: 'NONE' as const,
    authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE' as const,
  });
}

function referenceConfig(patternId: string): AltcoinPatternReferenceConfig | null {
  return ALTCOIN_PATTERN_REFERENCE_PROFILE.scoredPatterns.find((pattern) => pattern.patternId === patternId) ?? null;
}

function observedFeature(
  confirmation: AltcoinPatternConfirmationEvidence,
  feature: AltcoinPatternReferenceFeature,
): number | boolean | undefined {
  switch (feature) {
    case 'volumeBreakoutRatio':
      return confirmation.volumeBreakoutRatio;
    case 'rsi14CrossAbove50':
      return confirmation.rsi14CrossAbove50;
    case 'rsi14CrossBelow50':
      return confirmation.rsi14CrossBelow50;
    case 'priceNearMajorSupport':
      return confirmation.priceNearMajorSupport;
    case 'volumeSecondLowLower':
      return confirmation.volumeSecondLowLower;
    case 'macdHistogramTurnPositive':
      return confirmation.macdHistogramTurnPositive;
  }
}

function conditionLabel(rule: AltcoinPatternReferenceBoost): string {
  return rule.operator === 'TRUE'
    ? 'true'
    : `>= ${rule.threshold ?? 'missing-threshold'}`;
}

function conditionMet(rule: AltcoinPatternReferenceBoost, value: number | boolean | undefined): boolean {
  if (value === undefined) return false;
  if (rule.operator === 'TRUE') return value === true;
  return typeof value === 'number'
    && Number.isFinite(value)
    && rule.threshold !== undefined
    && value >= rule.threshold;
}

/**
 * Applies only the source-defined altcoin reference formula after the existing PatternSignalResolver
 * has already produced exact, validated research context. It does not detect patterns, fetch market
 * data, create a canonical score, rank assets or authorize execution.
 */
export function evaluateAltcoinPatternResearchScore(
  input: AltcoinPatternResearchScoreRequest,
): AltcoinPatternResearchScoreAssessment {
  const { resolution, confirmation } = input;

  if (resolution.disposition !== 'SUPPORTED_CONTEXT' || !resolution.primary || !resolution.direction) {
    return notComputable([
      ...resolution.reasons,
      'Altcoin reference scoring requires PatternSignalResolver SUPPORTED_CONTEXT with a primary candidate.',
    ]);
  }

  const patternId = resolution.primary.evidence.patternId;
  const timeframe = resolution.primary.evidence.timeframe;
  const config = referenceConfig(patternId);

  if (!config) {
    return notComputable([
      `Pattern ${patternId} has no complete source-defined reference scoring formula; it remains catalog-only.`,
    ], patternId, timeframe);
  }

  if (!config.timeframes.includes(timeframe as '4h' | '1d')) {
    return notComputable([
      `Reference profile supports ${config.timeframes.join('/')} only; received ${timeframe}.`,
    ], patternId, timeframe);
  }

  if (confirmation.contractVersion !== ALTCOIN_PATTERN_CONFIRMATION_CONTRACT_VERSION) {
    return notComputable([
      `Unsupported confirmation contract: ${confirmation.contractVersion}.`,
    ], patternId, timeframe);
  }

  if (confirmation.patternId !== patternId || confirmation.timeframe !== timeframe) {
    return notComputable([
      'Confirmation evidence identity must match the resolver primary pattern and timeframe exactly.',
    ], patternId, timeframe);
  }

  if (!Number.isFinite(Date.parse(confirmation.observedAt)) || confirmation.evidenceRefs.length === 0) {
    return notComputable([
      'Confirmation evidence requires a valid observedAt timestamp and at least one evidence reference.',
    ], patternId, timeframe);
  }

  const contributions: AltcoinPatternResearchContribution[] = [];
  const missing: AltcoinPatternReferenceFeature[] = [];
  let boostTotal = 0;

  for (const rule of config.confirmationBoosts) {
    const value = observedFeature(confirmation, rule.feature);
    if (value === undefined) missing.push(rule.feature);
    const met = conditionMet(rule, value);
    const contribution = met ? rule.boost : 0;
    boostTotal += contribution;
    contributions.push(Object.freeze({
      feature: rule.feature,
      observedValue: value ?? null,
      condition: conditionLabel(rule),
      met,
      contribution,
    }));
  }

  const referenceScore = Math.min(100, config.referenceBaseScore + boostTotal);
  const evidenceRefs = [...new Set([
    ...resolution.primary.evidence.evidenceRefs,
    ...resolution.primary.reliability.evidenceRefs,
    ...confirmation.evidenceRefs,
  ])];

  return Object.freeze({
    scorerVersion: ALTCOIN_PATTERN_RESEARCH_SCORER_VERSION,
    profileVersion: ALTCOIN_PATTERN_REFERENCE_PROFILE_VERSION,
    status: 'READY' as const,
    patternId,
    timeframe,
    direction: resolution.direction,
    referenceBaseScore: config.referenceBaseScore,
    referenceScore,
    referenceThreshold: ALTCOIN_PATTERN_REFERENCE_PROFILE.referenceThreshold,
    referenceThresholdMet: referenceScore >= ALTCOIN_PATTERN_REFERENCE_PROFILE.referenceThreshold,
    contributions: Object.freeze(contributions),
    missingConfirmationFields: Object.freeze(missing),
    evidenceRefs: Object.freeze(evidenceRefs),
    reasons: Object.freeze([
      'Reference score mirrors the Owner-supplied altcoin pattern configuration for research comparison only.',
      'Exact PatternReliabilityRegistry validation remains mandatory upstream; literature/reference priors never replace asset-specific reliability evidence.',
      'Reference threshold status is not a trading signal, canonical score, ranking decision or execution authorization.',
    ]),
    scoreEligible: false as const,
    executionEligible: false as const,
    canonicalScoreImpact: 'NONE' as const,
    authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE' as const,
  });
}
