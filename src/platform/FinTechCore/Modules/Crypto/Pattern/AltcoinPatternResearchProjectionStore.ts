import {
  ALTCOIN_PATTERN_RESEARCH_VIEW_TIMEFRAMES,
  type AltcoinPatternResearchViewProjection,
  type AltcoinPatternResearchViewTimeframe,
} from './AltcoinPatternResearchViewContract';

export const ALTCOIN_PATTERN_RESEARCH_PROJECTION_STORE_VERSION =
  'fintech-core.crypto/altcoin-pattern-research-projection-store/1.0.0' as const;

function key(assetId: string, timeframe: AltcoinPatternResearchViewTimeframe): string {
  return assetId + '::' + timeframe;
}

/**
 * Bounded in-memory read model for the latest already-attested FINTECH pattern research projection.
 *
 * This store is not a detector, evidence source, scoring registry or persistence authority. It is
 * populated only by server-side FINTECH orchestration after an assessment has already been produced.
 */
export class AltcoinPatternResearchProjectionStore {
  private readonly entries = new Map<string, AltcoinPatternResearchViewProjection>();

  constructor(private readonly maxEntries = 256) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 2) {
      throw new Error('ALTCOIN_PATTERN_VIEW_STORE_INVALID_CAPACITY');
    }
  }

  publish(projection: AltcoinPatternResearchViewProjection): void {
    const projectionKey = key(projection.assetId, projection.timeframe);
    this.entries.delete(projectionKey);
    this.entries.set(projectionKey, projection);

    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (!oldest) break;
      this.entries.delete(oldest);
    }
  }

  read(
    assetId: string,
    timeframe: AltcoinPatternResearchViewTimeframe,
  ): AltcoinPatternResearchViewProjection | null {
    return this.entries.get(key(assetId, timeframe)) ?? null;
  }

  readLanes(assetId: string): Readonly<Record<AltcoinPatternResearchViewTimeframe, AltcoinPatternResearchViewProjection | null>> {
    return Object.freeze({
      '4h': this.read(assetId, '4h'),
      '1d': this.read(assetId, '1d'),
    });
  }

  clear(): void {
    this.entries.clear();
  }

  supportedTimeframes(): readonly AltcoinPatternResearchViewTimeframe[] {
    return ALTCOIN_PATTERN_RESEARCH_VIEW_TIMEFRAMES;
  }
}

export const altcoinPatternResearchProjectionStore =
  new AltcoinPatternResearchProjectionStore();
