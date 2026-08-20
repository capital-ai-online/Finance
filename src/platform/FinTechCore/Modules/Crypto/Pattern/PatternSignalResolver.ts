import {
  PATTERN_CATALOG,
  PATTERN_GROUP_BASE_WEIGHTS,
  type CryptoAnalysisProfileId,
  type PatternDirection,
  type PatternEvidence,
} from '../../../CryptoModuleContracts';
import {
  PatternReliabilityRegistry,
  createPatternReliabilityKey,
  type PatternReliabilityRecord,
} from './PatternReliabilityRegistry';

export const PATTERN_SIGNAL_RESOLVER_VERSION =
  'fintech-core.crypto/pattern-signal-resolver/0.1.0' as const;

export const PATTERN_SIGNAL_RESEARCH_DEFAULTS = Object.freeze({
  minimumDataQuality: 0.80,
  authority: 'RESEARCH_DEFAULT_NOT_PRODUCTION_POLICY',
} as const);

export type PatternResearchDisposition =
  | 'SUPPORTED_CONTEXT'
  | 'CONFLICTING_EVIDENCE'
  | 'NOT_COMPUTABLE';

export interface PatternRejectedEvidence {
  readonly patternId: string;
  readonly timeframe: string;
  readonly reason: string;
}

export interface PatternResolvedCandidate {
  readonly evidence: PatternEvidence;
  readonly reliability: PatternReliabilityRecord;
  readonly timeframeMinutes: number;
}

export interface PatternSignalResolution {
  readonly resolverVersion: typeof PATTERN_SIGNAL_RESOLVER_VERSION;
  readonly disposition: PatternResearchDisposition;
  readonly direction: PatternDirection | null;
  readonly primary: PatternResolvedCandidate | null;
  readonly supporting: readonly PatternResolvedCandidate[];
  readonly suppressed: readonly PatternResolvedCandidate[];
  readonly rejected: readonly PatternRejectedEvidence[];
  readonly reasons: readonly string[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly authority: 'RESEARCH_CONTEXT_ONLY';
}

const CATALOG_BY_ID = new Map(PATTERN_CATALOG.map(pattern => [pattern.id, pattern] as const));

function timeframeMinutes(timeframe: string): number | null {
  const match = /^(\d+)(m|h|d|w)$/i.exec(timeframe.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;
  const unit = match[2].toLowerCase();
  const multiplier = unit === 'm' ? 1 : unit === 'h' ? 60 : unit === 'd' ? 1_440 : 10_080;
  return amount * multiplier;
}

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function evidenceShapeReason(evidence: PatternEvidence): string | null {
  const catalog = CATALOG_BY_ID.get(evidence.patternId);
  if (!catalog) return `Unknown patternId ${evidence.patternId}.`;
  if (catalog.group !== evidence.group) {
    return `Pattern group mismatch: catalog=${catalog.group}, evidence=${evidence.group}.`;
  }
  if (evidence.baseWeight !== PATTERN_GROUP_BASE_WEIGHTS[evidence.group]) {
    return `Pattern baseWeight does not match the governed group start weight for ${evidence.group}.`;
  }
  if (evidence.evidenceRefs.length === 0) return 'Pattern evidence requires at least one evidence reference.';
  if (!Number.isFinite(Date.parse(evidence.observedAt))) return 'Pattern evidence observedAt is invalid.';
  if (!evidence.validationVersion.trim()) return 'Pattern evidence validationVersion is required.';
  if (!finite(evidence.dataQuality) || evidence.dataQuality < 0 || evidence.dataQuality > 1) {
    return 'Pattern dataQuality must be finite within 0..1.';
  }
  if (evidence.dataQuality < PATTERN_SIGNAL_RESEARCH_DEFAULTS.minimumDataQuality) {
    return `Pattern dataQuality ${evidence.dataQuality} is below the research minimum ${PATTERN_SIGNAL_RESEARCH_DEFAULTS.minimumDataQuality}.`;
  }
  for (const [name, value] of [
    ['patternQuality', evidence.patternQuality],
    ['contextScore', evidence.contextScore],
    ['volumeConfirmation', evidence.volumeConfirmation],
    ['breakoutScore', evidence.breakoutScore],
    ['retestScore', evidence.retestScore],
    ['timeframeConfirmation', evidence.timeframeConfirmation],
    ['marketRegimeScore', evidence.marketRegimeScore],
    ['historicalEdge', evidence.historicalEdge],
    ['assetReliability', evidence.assetReliability],
  ] as const) {
    if (!finite(value)) return `${name} must be finite.`;
  }
  return null;
}

/**
 * Source-priority vector. This is deliberately lexicographic, not a new weighted score:
 * higher timeframe > stronger structure group > breakout > volume > level/context > regime.
 * No buy/sell threshold or portfolio sizing is produced here.
 */
function precedenceVector(candidate: PatternResolvedCandidate): readonly number[] {
  const e = candidate.evidence;
  return Object.freeze([
    candidate.timeframeMinutes,
    PATTERN_GROUP_BASE_WEIGHTS[e.group],
    e.breakoutScore,
    e.volumeConfirmation,
    e.contextScore,
    e.marketRegimeScore,
  ]);
}

function compareVector(left: readonly number[], right: readonly number[]): number {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) return right[index] - left[index];
  }
  return right.length - left.length;
}

function samePrecedence(left: PatternResolvedCandidate, right: PatternResolvedCandidate): boolean {
  const a = precedenceVector(left);
  const b = precedenceVector(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function compareCandidates(left: PatternResolvedCandidate, right: PatternResolvedCandidate): number {
  const precedence = compareVector(precedenceVector(left), precedenceVector(right));
  if (precedence !== 0) return precedence;
  return left.evidence.patternId.localeCompare(right.evidence.patternId);
}

/**
 * Resolves validated pattern evidence into research context only.
 *
 * Exact asset/profile/timeframe/regime reliability is mandatory. Lower-priority contradictory
 * evidence is retained as suppressed context. Opposing directions with exactly equal governed
 * precedence remain an explicit conflict rather than being broken by an arbitrary formula.
 */
export function resolvePatternSignal(input: Readonly<{
  profileId: CryptoAnalysisProfileId;
  evidence: readonly PatternEvidence[];
  reliabilityRegistry: PatternReliabilityRegistry;
}>): PatternSignalResolution {
  const accepted: PatternResolvedCandidate[] = [];
  const rejected: PatternRejectedEvidence[] = [];

  for (const evidence of input.evidence) {
    const shapeReason = evidenceShapeReason(evidence);
    if (shapeReason) {
      rejected.push(Object.freeze({ patternId: evidence.patternId, timeframe: evidence.timeframe, reason: shapeReason }));
      continue;
    }

    const duration = timeframeMinutes(evidence.timeframe);
    if (duration === null) {
      rejected.push(Object.freeze({
        patternId: evidence.patternId,
        timeframe: evidence.timeframe,
        reason: 'Unsupported timeframe format; expected positive integer plus m/h/d/w.',
      }));
      continue;
    }

    const reliabilityKey = createPatternReliabilityKey({
      assetId: evidence.assetId,
      profileId: input.profileId,
      timeframe: evidence.timeframe,
      marketRegime: evidence.marketRegime,
      patternId: evidence.patternId,
      validationVersion: evidence.validationVersion,
    });
    const reliability = input.reliabilityRegistry.resolve(reliabilityKey);
    if (reliability.status !== 'RESOLVED') {
      rejected.push(Object.freeze({
        patternId: evidence.patternId,
        timeframe: evidence.timeframe,
        reason: reliability.reason,
      }));
      continue;
    }
    if (reliability.record.status !== 'VALIDATED') {
      rejected.push(Object.freeze({
        patternId: evidence.patternId,
        timeframe: evidence.timeframe,
        reason: `Exact reliability record is ${reliability.record.status}: ${reliability.record.reasons.join('; ') || 'not validated'}.`,
      }));
      continue;
    }

    accepted.push(Object.freeze({ evidence, reliability: reliability.record, timeframeMinutes: duration }));
  }

  if (accepted.length === 0) {
    return Object.freeze({
      resolverVersion: PATTERN_SIGNAL_RESOLVER_VERSION,
      disposition: 'NOT_COMPUTABLE' as const,
      direction: null,
      primary: null,
      supporting: Object.freeze([]),
      suppressed: Object.freeze([]),
      rejected: Object.freeze(rejected),
      reasons: Object.freeze(['No pattern has both valid evidence and exact validated reliability.']),
      scoreEligible: false as const,
      executionEligible: false as const,
      authority: 'RESEARCH_CONTEXT_ONLY' as const,
    });
  }

  const sorted = [...accepted].sort(compareCandidates);
  const primary = sorted[0];
  const equalPrecedence = sorted.filter(candidate => samePrecedence(candidate, primary));
  const opposingAtTop = equalPrecedence.filter(candidate =>
    candidate.evidence.direction !== primary.evidence.direction
    && candidate.evidence.direction !== 'NEUTRAL'
    && primary.evidence.direction !== 'NEUTRAL');

  if (opposingAtTop.length > 0) {
    return Object.freeze({
      resolverVersion: PATTERN_SIGNAL_RESOLVER_VERSION,
      disposition: 'CONFLICTING_EVIDENCE' as const,
      direction: null,
      primary: null,
      supporting: Object.freeze(equalPrecedence),
      suppressed: Object.freeze(sorted.filter(candidate => !equalPrecedence.includes(candidate))),
      rejected: Object.freeze(rejected),
      reasons: Object.freeze(['Opposing validated patterns have equal governed precedence; no direction is selected.']),
      scoreEligible: false as const,
      executionEligible: false as const,
      authority: 'RESEARCH_CONTEXT_ONLY' as const,
    });
  }

  const supporting = sorted.filter(candidate =>
    candidate !== primary
    && candidate.evidence.direction === primary.evidence.direction);
  const suppressed = sorted.filter(candidate =>
    candidate !== primary
    && candidate.evidence.direction !== primary.evidence.direction);

  return Object.freeze({
    resolverVersion: PATTERN_SIGNAL_RESOLVER_VERSION,
    disposition: 'SUPPORTED_CONTEXT' as const,
    direction: primary.evidence.direction,
    primary,
    supporting: Object.freeze(supporting),
    suppressed: Object.freeze(suppressed),
    rejected: Object.freeze(rejected),
    reasons: Object.freeze([
      'Direction is research context selected by governed lexicographic precedence; it is not a trade authorization or score.',
    ]),
    scoreEligible: false as const,
    executionEligible: false as const,
    authority: 'RESEARCH_CONTEXT_ONLY' as const,
  });
}
