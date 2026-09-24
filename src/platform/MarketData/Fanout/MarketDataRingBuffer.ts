import { MARKET_DATA_FANOUT_RING_SIZE, type MarketDataFanoutTick } from './contracts';

export class MarketDataRingBuffer {
  private readonly topics = new Map<string, MarketDataFanoutTick[]>();

  constructor(private readonly capacity = MARKET_DATA_FANOUT_RING_SIZE) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('MARKET_DATA_RING_BUFFER_INVALID_CAPACITY');
    }
  }

  append(tick: MarketDataFanoutTick): void {
    const current = this.topics.get(tick.topic) ?? [];
    current.push({ ...tick });
    if (current.length > this.capacity) current.splice(0, current.length - this.capacity);
    this.topics.set(tick.topic, current);
  }

  replace(topic: string, ticks: readonly MarketDataFanoutTick[]): void {
    const bounded = ticks
      .filter(tick => tick.topic === topic)
      .slice(-this.capacity)
      .map(tick => ({ ...tick }));
    if (bounded.length === 0) {
      this.topics.delete(topic);
      return;
    }
    this.topics.set(topic, bounded);
  }

  recent(topic: string, limit = this.capacity): MarketDataFanoutTick[] {
    const bounded = Math.max(0, Math.min(this.capacity, Math.floor(limit)));
    if (bounded === 0) return [];
    const values = this.topics.get(topic) ?? [];
    return values.slice(-bounded).map(tick => ({ ...tick }));
  }

  size(topic: string): number {
    return this.topics.get(topic)?.length ?? 0;
  }

  clear(topic?: string): void {
    if (topic) this.topics.delete(topic);
    else this.topics.clear();
  }
}
