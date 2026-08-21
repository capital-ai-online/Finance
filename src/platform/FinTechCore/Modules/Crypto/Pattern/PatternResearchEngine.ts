import type { CryptoAnalysisProfileId, PatternEvidence } from '../../../CryptoModuleContracts';
import {
  PATTERN_DETECTION_CONTRACT_VERSION,
  validatePatternDetectionRequest,
  type PatternDetectionRequest,
  type PatternDetectionResult,
  type PatternDetector,
} from './PatternDetectionContracts';
import { PatternReliabilityRegistry } from './PatternReliabilityRegistry';
import {
  resolvePatternSignal,
  type PatternSignalResolution,
} from './PatternSignalResolver';

export const PATTERN_RESEARCH_ENGINE_VERSION =
  'fintech-core.crypto/pattern-research-engine/0.1.0' as const;

export interface PatternResearchAnalysis {
  readonly engineVersion: typeof PATTERN_RESEARCH_ENGINE_VERSION;
  readonly assetId: string;
  readonly profileId: CryptoAnalysisProfileId;
  readonly detections: readonly PatternDetectionResult[];
  readonly resolution: PatternSignalResolution;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly authority: 'RESEARCH_CONTEXT_ONLY';
}

function validateDetectionResult(
  detector: PatternDetector,
  request: PatternDetectionRequest,
  result: PatternDetectionResult,
): void {
  if (result.contractVersion !== PATTERN_DETECTION_CONTRACT_VERSION) {
    throw new Error(`[PatternResearchEngine] detector returned unsupported contract version ${result.contractVersion}.`);
  }
  if (result.detector.detectorId !== detector.descriptor.detectorId
    || result.detector.detectorVersion !== detector.descriptor.detectorVersion) {
    throw new Error('[PatternResearchEngine] detector identity mismatch.');
  }
  if (result.detector.researchOnly !== true || result.scoreEligible !== false || result.executionEligible !== false) {
    throw new Error('[PatternResearchEngine] detector result violates the research-only authority boundary.');
  }
  if (result.assetId !== request.assetId
    || result.timeframe !== request.timeframe
    || result.marketRegime !== request.marketRegime) {
    throw new Error('[PatternResearchEngine] detector result does not match request identity/timeframe/regime.');
  }

  const supported = new Set(detector.descriptor.supportedPatternIds);
  for (const pattern of result.patterns) {
    if (pattern.assetId !== request.assetId
      || pattern.timeframe !== request.timeframe
      || pattern.marketRegime !== request.marketRegime) {
      throw new Error('[PatternResearchEngine] pattern evidence does not match its detection request.');
    }
    if (pattern.scoreEligible !== false) {
      throw new Error('[PatternResearchEngine] pattern evidence must remain scoreEligible=false.');
    }
    if (!supported.has(pattern.patternId)) {
      throw new Error(`[PatternResearchEngine] detector emitted undeclared pattern ${pattern.patternId}.`);
    }
  }
}

/**
 * Detector-agnostic research composition. The engine accepts already governed OHLCV evidence,
 * invokes an injected research detector for one or more timeframes and resolves the resulting
 * patterns against exact reliability records. It performs no market-data fetch, scoring or order
 * execution.
 */
export class PatternResearchEngine {
  constructor(
    private readonly detector: PatternDetector,
    private readonly reliabilityRegistry: PatternReliabilityRegistry,
  ) {
    if (detector.descriptor.researchOnly !== true) {
      throw new Error('[PatternResearchEngine] detector must be explicitly research-only.');
    }
    if (!detector.descriptor.detectorId.trim() || !detector.descriptor.detectorVersion.trim()) {
      throw new Error('[PatternResearchEngine] detector identity/version are required.');
    }
  }

  analyze(input: Readonly<{
    profileId: CryptoAnalysisProfileId;
    requests: readonly PatternDetectionRequest[];
  }>): PatternResearchAnalysis {
    if (input.requests.length === 0) {
      throw new Error('[PatternResearchEngine] at least one timeframe request is required.');
    }

    const assetId = input.requests[0].assetId;
    if (input.requests.some(request => request.assetId !== assetId)) {
      throw new Error('[PatternResearchEngine] one analysis may contain only one assetId.');
    }

    const detections: PatternDetectionResult[] = [];
    const patterns: PatternEvidence[] = [];

    for (const request of input.requests) {
      validatePatternDetectionRequest(request);
      const result = this.detector.detect(request);
      validateDetectionResult(this.detector, request, result);
      detections.push(result);
      patterns.push(...result.patterns);
    }

    const resolution = resolvePatternSignal({
      profileId: input.profileId,
      evidence: patterns,
      reliabilityRegistry: this.reliabilityRegistry,
    });

    return Object.freeze({
      engineVersion: PATTERN_RESEARCH_ENGINE_VERSION,
      assetId,
      profileId: input.profileId,
      detections: Object.freeze(detections),
      resolution,
      scoreEligible: false as const,
      executionEligible: false as const,
      authority: 'RESEARCH_CONTEXT_ONLY' as const,
    });
  }
}
