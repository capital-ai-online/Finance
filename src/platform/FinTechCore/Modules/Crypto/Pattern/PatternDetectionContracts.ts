import type {
  MarketRegime,
  PatternEvidence,
} from '../../../CryptoModuleContracts';

export const PATTERN_DETECTION_CONTRACT_VERSION =
  'fintech-core.crypto/pattern-detection/0.1.0' as const;

export interface PatternOhlcvBar {
  readonly observedAt: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number | null;
  readonly evidenceRefs: readonly string[];
}

export interface PatternDetectionRequest {
  readonly contractVersion: typeof PATTERN_DETECTION_CONTRACT_VERSION;
  readonly assetId: string;
  readonly timeframe: string;
  readonly marketRegime: MarketRegime;
  /** Normalized 0..1 evidence quality supplied by the governed data-quality layer. */
  readonly dataQuality: number;
  readonly bars: readonly PatternOhlcvBar[];
  readonly evidenceRefs: readonly string[];
}

export interface PatternDetectorDescriptor {
  readonly detectorId: string;
  readonly detectorVersion: string;
  readonly supportedPatternIds: readonly string[];
  readonly dependency?: string;
  readonly researchOnly: true;
}

export interface PatternDetectionResult {
  readonly contractVersion: typeof PATTERN_DETECTION_CONTRACT_VERSION;
  readonly detector: PatternDetectorDescriptor;
  readonly assetId: string;
  readonly timeframe: string;
  readonly marketRegime: MarketRegime;
  readonly patterns: readonly PatternEvidence[];
  readonly evidenceRefs: readonly string[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
}

/**
 * Detector SPI only. FT-2C intentionally does not bind TA-Lib or another detector implementation.
 * A detector recognizes geometry; context, reliability, scoring and financial decisions remain
 * separate governed layers.
 */
export interface PatternDetector {
  readonly descriptor: PatternDetectorDescriptor;
  detect(request: PatternDetectionRequest): PatternDetectionResult;
}

export function validatePatternDetectionRequest(request: PatternDetectionRequest): void {
  if (!request.assetId.trim()) throw new Error('[PatternDetection] assetId is required.');
  if (!request.timeframe.trim()) throw new Error('[PatternDetection] timeframe is required.');
  if (!Number.isFinite(request.dataQuality) || request.dataQuality < 0 || request.dataQuality > 1) {
    throw new Error('[PatternDetection] dataQuality must be finite within 0..1.');
  }
  if (request.bars.length === 0) throw new Error('[PatternDetection] at least one OHLCV bar is required.');

  let previousTimestamp = Number.NEGATIVE_INFINITY;
  for (const bar of request.bars) {
    const timestamp = Date.parse(bar.observedAt);
    if (!Number.isFinite(timestamp) || timestamp <= previousTimestamp) {
      throw new Error('[PatternDetection] OHLCV bars must have valid, strictly increasing observedAt timestamps.');
    }
    previousTimestamp = timestamp;

    for (const [field, value] of [
      ['open', bar.open],
      ['high', bar.high],
      ['low', bar.low],
      ['close', bar.close],
    ] as const) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`[PatternDetection] ${field} must be finite and positive.`);
      }
    }
    if (bar.high < Math.max(bar.open, bar.close, bar.low) || bar.low > Math.min(bar.open, bar.close, bar.high)) {
      throw new Error('[PatternDetection] OHLC geometry is inconsistent.');
    }
    if (bar.volume !== null && (!Number.isFinite(bar.volume) || bar.volume < 0)) {
      throw new Error('[PatternDetection] volume must be null or finite and non-negative.');
    }
    if (bar.evidenceRefs.length === 0) {
      throw new Error('[PatternDetection] every OHLCV bar requires at least one evidence reference.');
    }
  }
}
