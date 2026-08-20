import {
  PATTERN_CATALOG,
  PATTERN_VALIDATION_RESEARCH_DEFAULTS,
  type MarketRegime,
  type PatternReliabilityKey,
  type CryptoAnalysisProfileId,
} from '../../../CryptoModuleContracts';

export const PATTERN_RELIABILITY_REGISTRY_VERSION =
  'fintech-core.crypto/pattern-reliability-registry/0.1.0' as const;

export type PatternReliabilityValidationStatus =
  | 'VALIDATED'
  | 'REJECTED'
  | 'INSUFFICIENT_DATA';

export interface PatternReliabilityMetrics {
  readonly occurrences: number;
  /** 0..1 descriptive statistic; never sufficient by itself for validation. */
  readonly winRate: number;
  readonly averageWinPct: number;
  readonly averageLossPct: number;
  readonly expectancy: number;
  readonly profitFactor: number;
  readonly maxDrawdownPct: number;
  readonly netPnlAfterCosts: number;
  readonly sharpe: number;
  readonly trainWindowDays: number;
  readonly validationWindowDays: number;
  readonly walkForward: boolean;
  readonly includesFees: boolean;
  readonly includesSlippage: boolean;
  readonly includesFunding: boolean;
}

export interface PatternReliabilityRecord {
  readonly registryVersion: typeof PATTERN_RELIABILITY_REGISTRY_VERSION;
  readonly key: PatternReliabilityKey;
  readonly metrics: PatternReliabilityMetrics;
  readonly status: PatternReliabilityValidationStatus;
  readonly reasons: readonly string[];
  readonly evidenceRefs: readonly string[];
  readonly validatedAt: string;
  readonly authority: 'RESEARCH_VALIDATION_NOT_PRODUCTION_POLICY';
}

export type PatternReliabilityResolution =
  | { readonly status: 'RESOLVED'; readonly record: PatternReliabilityRecord }
  | { readonly status: 'NOT_AVAILABLE'; readonly key: PatternReliabilityKey; readonly reason: string };

const CATALOG_PATTERN_IDS = new Set(PATTERN_CATALOG.map(pattern => pattern.id));
const VALID_REGIMES: ReadonlySet<MarketRegime> = new Set([
  'BULL',
  'BEAR',
  'RANGE',
  'HIGH_VOLATILITY',
  'STRESS',
  'UNKNOWN',
]);

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) throw new Error(`[PatternReliability] ${name} must be finite.`);
}

function validateKey(key: PatternReliabilityKey): void {
  if (!key.assetId.trim()) throw new Error('[PatternReliability] assetId is required.');
  if (!key.timeframe.trim()) throw new Error('[PatternReliability] timeframe is required.');
  if (!key.validationVersion.trim()) throw new Error('[PatternReliability] validationVersion is required.');
  if (!CATALOG_PATTERN_IDS.has(key.patternId)) {
    throw new Error(`[PatternReliability] unknown patternId: ${key.patternId}.`);
  }
  if (!VALID_REGIMES.has(key.marketRegime)) {
    throw new Error(`[PatternReliability] unsupported market regime: ${key.marketRegime}.`);
  }
}

function validateMetrics(metrics: PatternReliabilityMetrics): void {
  for (const [name, value] of [
    ['occurrences', metrics.occurrences],
    ['winRate', metrics.winRate],
    ['averageWinPct', metrics.averageWinPct],
    ['averageLossPct', metrics.averageLossPct],
    ['expectancy', metrics.expectancy],
    ['profitFactor', metrics.profitFactor],
    ['maxDrawdownPct', metrics.maxDrawdownPct],
    ['netPnlAfterCosts', metrics.netPnlAfterCosts],
    ['sharpe', metrics.sharpe],
    ['trainWindowDays', metrics.trainWindowDays],
    ['validationWindowDays', metrics.validationWindowDays],
  ] as const) assertFinite(name, value);

  if (!Number.isInteger(metrics.occurrences) || metrics.occurrences < 0) {
    throw new Error('[PatternReliability] occurrences must be a non-negative integer.');
  }
  if (metrics.winRate < 0 || metrics.winRate > 1) {
    throw new Error('[PatternReliability] winRate must be within 0..1.');
  }
  if (metrics.profitFactor < 0) throw new Error('[PatternReliability] profitFactor cannot be negative.');
  if (metrics.maxDrawdownPct < 0 || metrics.maxDrawdownPct > 100) {
    throw new Error('[PatternReliability] maxDrawdownPct must be within 0..100.');
  }
  if (!Number.isInteger(metrics.trainWindowDays) || metrics.trainWindowDays < 0) {
    throw new Error('[PatternReliability] trainWindowDays must be a non-negative integer.');
  }
  if (!Number.isInteger(metrics.validationWindowDays) || metrics.validationWindowDays < 0) {
    throw new Error('[PatternReliability] validationWindowDays must be a non-negative integer.');
  }
}

/**
 * Evaluates the Owner-source defaults as research-validation policy only. These thresholds do not
 * authorize a trade, change a canonical score or become production risk limits.
 */
export function evaluatePatternReliability(
  key: PatternReliabilityKey,
  metrics: PatternReliabilityMetrics,
): Pick<PatternReliabilityRecord, 'status' | 'reasons'> {
  validateKey(key);
  validateMetrics(metrics);

  const reasons: string[] = [];
  const defaults = PATTERN_VALIDATION_RESEARCH_DEFAULTS;
  const researchRegimeSupported = defaults.regimeSplit.includes(
    key.marketRegime as (typeof defaults.regimeSplit)[number],
  );

  if (metrics.occurrences < defaults.minimumOccurrences) {
    reasons.push(`occurrences ${metrics.occurrences} < research minimum ${defaults.minimumOccurrences}`);
  }
  if (metrics.trainWindowDays < defaults.trainWindowDays) {
    reasons.push(`train window ${metrics.trainWindowDays}d < research minimum ${defaults.trainWindowDays}d`);
  }
  if (metrics.validationWindowDays < defaults.validationWindowDays) {
    reasons.push(`validation window ${metrics.validationWindowDays}d < research minimum ${defaults.validationWindowDays}d`);
  }
  if (defaults.walkForward && !metrics.walkForward) reasons.push('walk-forward validation missing');
  if (defaults.includeFees && !metrics.includesFees) reasons.push('fees not included');
  if (defaults.includeSlippage && !metrics.includesSlippage) reasons.push('slippage not included');
  if (defaults.includeFunding && !metrics.includesFunding) reasons.push('funding not included');
  if (!researchRegimeSupported) reasons.push(`market regime ${key.marketRegime} is outside the source research validation split`);

  if (reasons.length > 0) {
    return Object.freeze({ status: 'INSUFFICIENT_DATA' as const, reasons: Object.freeze(reasons) });
  }

  const rejectionReasons: string[] = [];
  if (metrics.sharpe < defaults.rejectIf.sharpeBelow) {
    rejectionReasons.push(`sharpe ${metrics.sharpe} < ${defaults.rejectIf.sharpeBelow}`);
  }
  if (metrics.expectancy < defaults.rejectIf.expectancyBelow) {
    rejectionReasons.push(`expectancy ${metrics.expectancy} < ${defaults.rejectIf.expectancyBelow}`);
  }
  if (metrics.maxDrawdownPct > defaults.rejectIf.maxDrawdownAbovePct) {
    rejectionReasons.push(`max drawdown ${metrics.maxDrawdownPct}% > ${defaults.rejectIf.maxDrawdownAbovePct}%`);
  }

  if (rejectionReasons.length > 0) {
    return Object.freeze({ status: 'REJECTED' as const, reasons: Object.freeze(rejectionReasons) });
  }

  return Object.freeze({ status: 'VALIDATED' as const, reasons: Object.freeze([]) });
}

function keyId(key: PatternReliabilityKey): string {
  validateKey(key);
  return [
    key.assetId,
    key.profileId,
    key.timeframe,
    key.marketRegime,
    key.patternId,
    key.validationVersion,
  ].map(part => encodeURIComponent(part)).join('|');
}

export function createPatternReliabilityRecord(input: Readonly<{
  key: PatternReliabilityKey;
  metrics: PatternReliabilityMetrics;
  evidenceRefs: readonly string[];
  validatedAt: string;
}>): PatternReliabilityRecord {
  if (input.evidenceRefs.length === 0) {
    throw new Error('[PatternReliability] at least one evidence reference is required.');
  }
  if (!Number.isFinite(Date.parse(input.validatedAt))) {
    throw new Error('[PatternReliability] validatedAt must be a valid timestamp.');
  }
  const evaluated = evaluatePatternReliability(input.key, input.metrics);
  return Object.freeze({
    registryVersion: PATTERN_RELIABILITY_REGISTRY_VERSION,
    key: Object.freeze({ ...input.key }),
    metrics: Object.freeze({ ...input.metrics }),
    status: evaluated.status,
    reasons: evaluated.reasons,
    evidenceRefs: Object.freeze([...input.evidenceRefs]),
    validatedAt: input.validatedAt,
    authority: 'RESEARCH_VALIDATION_NOT_PRODUCTION_POLICY',
  });
}

/**
 * Immutable, exact-key research reliability registry. There is deliberately no global, cross-asset,
 * cross-timeframe or cross-regime fallback because that would turn literature/general statistics
 * into asset-specific evidence.
 */
export class PatternReliabilityRegistry {
  private readonly records: ReadonlyMap<string, PatternReliabilityRecord>;

  constructor(records: readonly PatternReliabilityRecord[] = []) {
    const index = new Map<string, PatternReliabilityRecord>();
    for (const record of records) {
      const id = keyId(record.key);
      if (index.has(id)) throw new Error(`[PatternReliabilityRegistry] duplicate key: ${id}.`);
      index.set(id, record);
    }
    this.records = index;
  }

  resolve(key: PatternReliabilityKey): PatternReliabilityResolution {
    const record = this.records.get(keyId(key));
    if (!record) {
      return Object.freeze({
        status: 'NOT_AVAILABLE' as const,
        key: Object.freeze({ ...key }),
        reason: 'No exact asset/profile/timeframe/regime/pattern/validation reliability record exists.',
      });
    }
    return Object.freeze({ status: 'RESOLVED' as const, record });
  }

  list(): readonly PatternReliabilityRecord[] {
    return Object.freeze([...this.records.values()]);
  }
}

export function createPatternReliabilityKey(input: Readonly<{
  assetId: string;
  profileId: CryptoAnalysisProfileId;
  timeframe: string;
  marketRegime: MarketRegime;
  patternId: string;
  validationVersion: string;
}>): PatternReliabilityKey {
  const key: PatternReliabilityKey = Object.freeze({ ...input });
  validateKey(key);
  return key;
}
