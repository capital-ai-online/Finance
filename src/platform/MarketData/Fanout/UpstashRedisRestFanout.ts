import {
  MARKET_DATA_FANOUT_RING_SIZE,
  isMarketDataFanoutTick,
  type MarketDataFanoutTick,
} from './contracts';

export interface UpstashRedisRestFanoutOptions {
  url: string;
  token: string;
  fetchImpl?: typeof fetch;
  ringSize?: number;
  ringTtlSeconds?: number;
  namespace?: string;
}

function assertUpstashUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname.toLowerCase().endsWith('.upstash.io')) {
    throw new Error('MARKET_DATA_FANOUT_UPSTASH_URL_NOT_ALLOWED');
  }
  return url;
}

function redisSafeTopic(topic: string): string {
  if (!/^market:[a-z]+:[A-Z0-9._:-]+$/.test(topic)) {
    throw new Error('MARKET_DATA_FANOUT_INVALID_TOPIC');
  }
  return topic;
}

export class UpstashRedisRestFanout {
  private readonly url: URL;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;
  private readonly ringSize: number;
  private readonly ringTtlSeconds: number;
  private readonly namespace: string;

  constructor(options: UpstashRedisRestFanoutOptions) {
    if (!options.token.trim()) throw new Error('MARKET_DATA_FANOUT_UPSTASH_TOKEN_REQUIRED');
    this.url = assertUpstashUrl(options.url);
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.ringSize = Math.max(1, Math.min(MARKET_DATA_FANOUT_RING_SIZE, Math.floor(options.ringSize ?? MARKET_DATA_FANOUT_RING_SIZE)));
    this.ringTtlSeconds = Math.max(60, Math.floor(options.ringTtlSeconds ?? 900));
    this.namespace = (options.namespace ?? 'capital-ai:market-data:v1').replace(/[^a-zA-Z0-9:_-]/g, '');
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: 'Bearer ' + this.token,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  private ringKey(topic: string): string {
    return this.namespace + ':ring:' + redisSafeTopic(topic);
  }

  private channel(topic: string): string {
    return this.namespace + ':pubsub:' + redisSafeTopic(topic);
  }

  async writeAndPublish(tick: MarketDataFanoutTick): Promise<void> {
    const payload = JSON.stringify(tick);
    const response = await this.fetchImpl(new URL('/pipeline', this.url), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify([
        ['LPUSH', this.ringKey(tick.topic), payload],
        ['LTRIM', this.ringKey(tick.topic), 0, this.ringSize - 1],
        ['EXPIRE', this.ringKey(tick.topic), this.ringTtlSeconds],
        ['PUBLISH', this.channel(tick.topic), payload],
      ]),
    });
    if (!response.ok) throw new Error('MARKET_DATA_FANOUT_REDIS_WRITE_FAILED:' + response.status);
    const results = await response.json() as Array<{ error?: string }>;
    if (!Array.isArray(results) || results.some(result => typeof result?.error === 'string')) {
      throw new Error('MARKET_DATA_FANOUT_REDIS_PIPELINE_FAILED');
    }
  }

  async loadRecent(topic: string, limit = this.ringSize): Promise<MarketDataFanoutTick[]> {
    const bounded = Math.max(0, Math.min(this.ringSize, Math.floor(limit)));
    if (bounded === 0) return [];
    const response = await this.fetchImpl(this.url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(['LRANGE', this.ringKey(topic), 0, bounded - 1]),
    });
    if (!response.ok) throw new Error('MARKET_DATA_FANOUT_REDIS_READ_FAILED:' + response.status);
    const body = await response.json() as { result?: unknown[]; error?: string };
    if (body.error) throw new Error('MARKET_DATA_FANOUT_REDIS_READ_COMMAND_FAILED');
    const values = Array.isArray(body.result) ? body.result : [];
    const ticks: MarketDataFanoutTick[] = [];
    for (const value of values) {
      if (typeof value !== 'string') continue;
      try {
        const parsed = JSON.parse(value) as unknown;
        if (isMarketDataFanoutTick(parsed) && parsed.topic === topic) ticks.push(parsed);
      } catch {
        // Unparseable remote cache entries are ignored; they never become market evidence.
      }
    }
    return ticks.reverse();
  }

  async subscribe(
    topic: string,
    onTick: (tick: MarketDataFanoutTick) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const channel = this.channel(topic);
    const endpoint = new URL('/subscribe/' + encodeURIComponent(channel), this.url);
    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: this.headers({ Accept: 'text/event-stream' }),
      signal,
    });
    if (!response.ok || !response.body) {
      throw new Error('MARKET_DATA_FANOUT_REDIS_SUBSCRIBE_FAILED:' + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    const marker = 'message,' + channel + ',';

    while (true) {
      const next = await reader.read();
      if (next.done) break;
      buffer += decoder.decode(next.value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';
      for (const event of events) {
        for (const line of event.split(/\r?\n/)) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trimStart();
          if (!data.startsWith(marker)) continue;
          try {
            const parsed = JSON.parse(data.slice(marker.length)) as unknown;
            if (isMarketDataFanoutTick(parsed) && parsed.topic === topic) onTick(parsed);
          } catch {
            // Malformed pub/sub payloads are untrusted input and are dropped.
          }
        }
      }
    }
  }
}
