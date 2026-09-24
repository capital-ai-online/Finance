export interface RateLimitBudgetOptions {
  /** Maximum burst, also the number of tokens refilled during windowMs. */
  capacity?: number;
  windowMs?: number;
  nowMs?: () => number;
  perProvider?: Record<string, { capacity: number; windowMs: number }>;
  maxBuckets?: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  /** Earliest instant at which another token will be available. */
  resetAtMs: number;
}

interface BucketState { tokens: number; lastRefillMs: number }

/** Process-local provider quota. This is not an edge WAF or a shared multi-instance abuse control. */
export class RateLimitBudget {
  private readonly states = new Map<string, BucketState>();
  private readonly capacity: number;
  private readonly windowMs: number;
  private readonly nowMs: () => number;
  private readonly perProvider: Record<string, { capacity: number; windowMs: number }>;
  private readonly maxBuckets: number;

  constructor(options: RateLimitBudgetOptions = {}) {
    this.capacity = RateLimitBudget.positiveInteger(options.capacity ?? 60);
    this.windowMs = RateLimitBudget.positiveInteger(options.windowMs ?? 60_000);
    this.maxBuckets = RateLimitBudget.positiveInteger(options.maxBuckets ?? 5_000);
    this.nowMs = options.nowMs ?? Date.now;
    this.perProvider = options.perProvider ?? {};
    for (const policy of Object.values(this.perProvider)) {
      RateLimitBudget.positiveInteger(policy.capacity);
      RateLimitBudget.positiveInteger(policy.windowMs);
    }
  }

  private static positiveInteger(value: number): number {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid provider rate-limit policy.');
    return value;
  }

  tryConsume(providerId: string, capability = 'snapshot'): RateLimitDecision {
    if (!providerId.trim() || !capability.trim()) throw new Error('Provider and capability are required.');
    const now = this.nowMs();
    if (!Number.isFinite(now)) throw new Error('Invalid rate-limit clock.');
    const key = JSON.stringify([providerId, capability]);
    const policy = Object.hasOwn(this.perProvider, providerId)
      ? this.perProvider[providerId] : { capacity: this.capacity, windowMs: this.windowMs };
    const previous = this.states.get(key);
    const effectiveNow = Math.max(now, previous?.lastRefillMs ?? now);
    const elapsed = previous ? effectiveNow - previous.lastRefillMs : 0;
    const tokens = Math.min(policy.capacity,
      (previous?.tokens ?? policy.capacity) + elapsed * policy.capacity / policy.windowMs);
    const allowed = tokens >= 1;
    const remainingTokens = allowed ? tokens - 1 : tokens;
    if (!previous && this.states.size >= this.maxBuckets) {
      const oldest = this.states.keys().next().value;
      if (oldest !== undefined) this.states.delete(oldest);
    }
    this.states.delete(key);
    this.states.set(key, { tokens: remainingTokens, lastRefillMs: effectiveNow });
    return {
      allowed,
      remaining: Math.floor(remainingTokens),
      resetAtMs: allowed && remainingTokens >= 1
        ? effectiveNow : effectiveNow + Math.ceil((1 - remainingTokens) * policy.windowMs / policy.capacity),
    };
  }
}
