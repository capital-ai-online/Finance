import type { AltcoinPatternResearchScoreAssessment } from './AltcoinPatternResearchScorer';

export const ALTCOIN_PATTERN_RESEARCH_VIEW_CONTRACT_VERSION =
  'fintech-core.crypto/altcoin-pattern-research-view/1.0.0' as const;

export const ALTCOIN_PATTERN_RESEARCH_VIEW_TIMEFRAMES = Object.freeze(['4h', '1d'] as const);

export type AltcoinPatternResearchViewTimeframe =
  typeof ALTCOIN_PATTERN_RESEARCH_VIEW_TIMEFRAMES[number];

export interface AltcoinPatternResearchViewProjection {
  readonly contractVersion: typeof ALTCOIN_PATTERN_RESEARCH_VIEW_CONTRACT_VERSION;
  readonly assetId: string;
  readonly symbol: string;
  readonly timeframe: AltcoinPatternResearchViewTimeframe;
  readonly observedAt: string;
  readonly publishedAt: string;
  readonly correlationId: string;
  readonly assessment: AltcoinPatternResearchScoreAssessment;
  readonly evidenceRefs: readonly string[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly canonicalScoreImpact: 'NONE';
  readonly authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE';
}

export interface AltcoinPatternResearchViewEnvelope {
  readonly contractVersion: typeof ALTCOIN_PATTERN_RESEARCH_VIEW_CONTRACT_VERSION;
  readonly assetId: string;
  readonly symbol: string;
  readonly readCorrelationId: string;
  readonly availableTimeframes: readonly ['4h', '1d'];
  readonly lanes: Readonly<Record<AltcoinPatternResearchViewTimeframe, AltcoinPatternResearchViewProjection | null>>;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly canonicalScoreImpact: 'NONE';
  readonly authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE';
}

function normalizeSymbol(value: string): string {
  return value.toUpperCase().trim();
}

function isValidSymbol(value: string): boolean {
  return /^[A-Z0-9.=-]{1,20}$/.test(value);
}

function isValidTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function isViewTimeframe(value: unknown): value is AltcoinPatternResearchViewTimeframe {
  return value === '4h' || value === '1d';
}

function hasResearchAuthority(value: {
  scoreEligible?: unknown;
  executionEligible?: unknown;
  canonicalScoreImpact?: unknown;
  authority?: unknown;
}): boolean {
  return value.scoreEligible === false
    && value.executionEligible === false
    && value.canonicalScoreImpact === 'NONE'
    && value.authority === 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE';
}

function isAssessmentShape(value: unknown): value is AltcoinPatternResearchScoreAssessment {
  if (!value || typeof value !== 'object') return false;
  const assessment = value as Partial<AltcoinPatternResearchScoreAssessment>;
  if (!hasResearchAuthority(assessment)) return false;
  if (assessment.status !== 'READY' && assessment.status !== 'NOT_COMPUTABLE') return false;
  if (!Array.isArray(assessment.contributions)
    || !Array.isArray(assessment.missingConfirmationFields)
    || !Array.isArray(assessment.evidenceRefs)
    || !Array.isArray(assessment.reasons)) {
    return false;
  }
  if (typeof assessment.referenceThreshold !== 'number' || !Number.isFinite(assessment.referenceThreshold)) return false;
  if (typeof assessment.referenceThresholdMet !== 'boolean') return false;
  if (assessment.status === 'READY') {
    return typeof assessment.patternId === 'string'
      && assessment.patternId.length > 0
      && isViewTimeframe(assessment.timeframe)
      && (assessment.direction === 'BULLISH' || assessment.direction === 'BEARISH' || assessment.direction === 'NEUTRAL')
      && typeof assessment.referenceScore === 'number'
      && Number.isFinite(assessment.referenceScore)
      && assessment.referenceScore >= 0
      && assessment.referenceScore <= 100
      && assessment.evidenceRefs.length > 0;
  }
  return assessment.referenceScore === null;
}

function validateProjectionIdentity(input: Readonly<{
  assetId: string;
  symbol: string;
  timeframe: AltcoinPatternResearchViewTimeframe;
  observedAt: string;
  publishedAt: string;
  correlationId: string;
  assessment: AltcoinPatternResearchScoreAssessment;
}>): string {
  const symbol = normalizeSymbol(input.symbol);
  if (!isValidSymbol(symbol)) throw new Error('ALTCOIN_PATTERN_VIEW_INVALID_SYMBOL');
  if (input.assetId !== 'crypto:' + symbol) throw new Error('ALTCOIN_PATTERN_VIEW_ASSET_ID_MISMATCH');
  if (!isValidTimestamp(input.observedAt) || !isValidTimestamp(input.publishedAt)) {
    throw new Error('ALTCOIN_PATTERN_VIEW_INVALID_TIMESTAMP');
  }
  if (!input.correlationId.trim() || input.correlationId.length > 128) {
    throw new Error('ALTCOIN_PATTERN_VIEW_INVALID_CORRELATION_ID');
  }
  if (!hasResearchAuthority(input.assessment)) {
    throw new Error('ALTCOIN_PATTERN_VIEW_AUTHORITY_MISMATCH');
  }
  if (input.assessment.timeframe !== null && input.assessment.timeframe !== input.timeframe) {
    throw new Error('ALTCOIN_PATTERN_VIEW_TIMEFRAME_MISMATCH');
  }
  if (input.assessment.status === 'READY' && input.assessment.evidenceRefs.length === 0) {
    throw new Error('ALTCOIN_PATTERN_VIEW_READY_REQUIRES_EVIDENCE');
  }
  return symbol;
}

export function createAltcoinPatternResearchViewProjection(input: Readonly<{
  assetId: string;
  symbol: string;
  timeframe: AltcoinPatternResearchViewTimeframe;
  observedAt: string;
  publishedAt?: string;
  correlationId: string;
  assessment: AltcoinPatternResearchScoreAssessment;
}>): AltcoinPatternResearchViewProjection {
  const publishedAt = input.publishedAt ?? new Date().toISOString();
  const symbol = validateProjectionIdentity({ ...input, publishedAt });
  return Object.freeze({
    contractVersion: ALTCOIN_PATTERN_RESEARCH_VIEW_CONTRACT_VERSION,
    assetId: input.assetId,
    symbol,
    timeframe: input.timeframe,
    observedAt: input.observedAt,
    publishedAt,
    correlationId: input.correlationId.trim(),
    assessment: input.assessment,
    evidenceRefs: Object.freeze([...input.assessment.evidenceRefs]),
    scoreEligible: false as const,
    executionEligible: false as const,
    canonicalScoreImpact: 'NONE' as const,
    authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE' as const,
  });
}

export function buildAltcoinPatternResearchViewEnvelope(input: Readonly<{
  assetId: string;
  symbol: string;
  readCorrelationId: string;
  lanes: Readonly<Record<AltcoinPatternResearchViewTimeframe, AltcoinPatternResearchViewProjection | null>>;
}>): AltcoinPatternResearchViewEnvelope {
  const symbol = normalizeSymbol(input.symbol);
  if (!isValidSymbol(symbol) || input.assetId !== 'crypto:' + symbol) {
    throw new Error('ALTCOIN_PATTERN_VIEW_ENVELOPE_IDENTITY_INVALID');
  }
  if (!input.readCorrelationId.trim() || input.readCorrelationId.length > 128) {
    throw new Error('ALTCOIN_PATTERN_VIEW_INVALID_READ_CORRELATION_ID');
  }
  for (const timeframe of ALTCOIN_PATTERN_RESEARCH_VIEW_TIMEFRAMES) {
    const projection = input.lanes[timeframe];
    if (projection && (
      projection.assetId !== input.assetId
      || projection.symbol !== symbol
      || projection.timeframe !== timeframe
      || !hasResearchAuthority(projection)
    )) {
      throw new Error('ALTCOIN_PATTERN_VIEW_ENVELOPE_LANE_MISMATCH');
    }
  }
  return Object.freeze({
    contractVersion: ALTCOIN_PATTERN_RESEARCH_VIEW_CONTRACT_VERSION,
    assetId: input.assetId,
    symbol,
    readCorrelationId: input.readCorrelationId.trim(),
    availableTimeframes: ALTCOIN_PATTERN_RESEARCH_VIEW_TIMEFRAMES,
    lanes: Object.freeze({
      '4h': input.lanes['4h'],
      '1d': input.lanes['1d'],
    }),
    scoreEligible: false as const,
    executionEligible: false as const,
    canonicalScoreImpact: 'NONE' as const,
    authority: 'RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE' as const,
  });
}

export function isAltcoinPatternResearchViewEnvelope(
  value: unknown,
): value is AltcoinPatternResearchViewEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<AltcoinPatternResearchViewEnvelope>;
  if (envelope.contractVersion !== ALTCOIN_PATTERN_RESEARCH_VIEW_CONTRACT_VERSION
    || typeof envelope.assetId !== 'string'
    || typeof envelope.symbol !== 'string'
    || typeof envelope.readCorrelationId !== 'string'
    || !Array.isArray(envelope.availableTimeframes)
    || !envelope.lanes
    || !hasResearchAuthority(envelope)) {
    return false;
  }
  const symbol = normalizeSymbol(envelope.symbol);
  if (!isValidSymbol(symbol) || envelope.assetId !== 'crypto:' + symbol) return false;
  if (envelope.availableTimeframes.length !== 2
    || envelope.availableTimeframes[0] !== '4h'
    || envelope.availableTimeframes[1] !== '1d') {
    return false;
  }
  const lanes = envelope.lanes as Partial<Record<AltcoinPatternResearchViewTimeframe, unknown>>;
  for (const timeframe of ALTCOIN_PATTERN_RESEARCH_VIEW_TIMEFRAMES) {
    const projection = lanes[timeframe];
    if (projection === null) continue;
    if (!projection || typeof projection !== 'object') return false;
    const candidate = projection as Partial<AltcoinPatternResearchViewProjection>;
    if (candidate.contractVersion !== ALTCOIN_PATTERN_RESEARCH_VIEW_CONTRACT_VERSION
      || candidate.assetId !== envelope.assetId
      || candidate.symbol !== symbol
      || candidate.timeframe !== timeframe
      || typeof candidate.observedAt !== 'string'
      || !isValidTimestamp(candidate.observedAt)
      || typeof candidate.publishedAt !== 'string'
      || !isValidTimestamp(candidate.publishedAt)
      || typeof candidate.correlationId !== 'string'
      || !Array.isArray(candidate.evidenceRefs)
      || !hasResearchAuthority(candidate)
      || !isAssessmentShape(candidate.assessment)) {
      return false;
    }
  }
  return true;
}
