export type MarketIntegrityState = 'consistent' | 'degraded' | 'conflict' | 'insufficient';

export interface MarketIntegrityObservation {
  id: string;
  symbol: string;
  capability: 'spot-consensus' | 'snapshot-consensus' | 'snapshot-integrity';
  state: MarketIntegrityState;
  correlationId: string;
  observedAt: string;
  providers: string[];
  evidenceIds: string[];
  message?: string;
}

const MAX_OBSERVATIONS = 200;
const observations: MarketIntegrityObservation[] = [];

export function recordMarketIntegrityObservation(input: Omit<MarketIntegrityObservation, 'id' | 'observedAt'> & { observedAt?: string }): MarketIntegrityObservation {
  const observedAt = input.observedAt ?? new Date().toISOString();
  const record: MarketIntegrityObservation = {
    id: `market-integrity:${input.capability}:${input.symbol}:${observedAt}:${input.correlationId}`,
    symbol: input.symbol,
    capability: input.capability,
    state: input.state,
    correlationId: input.correlationId,
    observedAt,
    providers: [...new Set(input.providers)].sort(),
    evidenceIds: [...new Set(input.evidenceIds)].sort(),
    message: input.message,
  };
  observations.push(record);
  if (observations.length > MAX_OBSERVATIONS) observations.splice(0, observations.length - MAX_OBSERVATIONS);
  return { ...record, providers: [...record.providers], evidenceIds: [...record.evidenceIds] };
}

export function getMarketIntegrityObservations(): MarketIntegrityObservation[] {
  return observations.map(item => ({ ...item, providers: [...item.providers], evidenceIds: [...item.evidenceIds] }));
}

export function resetMarketIntegrityObservations(): void {
  observations.length = 0;
}
