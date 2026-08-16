export interface RateLimitBudgetOptions {
  /** Default capacity when no per-provider override exists. */
  capacity?: number;
  /** Default window when no per-provider override exists. */
  windowMs?: number;
  nowMs?: () => number;
  /**
   * SC-4: optional per-provider capacity/window overrides (from ProviderMatrix).
   * Key = providerId (not provider:capability).
   */
  perProvider?: Record<string, { capacity: number; windowMs: number }>;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
}

interface WindowState {
  startedAtMs: number;
  consumed: number;
}

export class RateLimitBudget {
  private readonly states = new Map<string, WindowState>();
  private readonly capacity: number;
  private readonly windowMs: number;
  private readonly nowMs: () => number;
  private readonly perProvider: Record<string, { capacity: number; windowMs: number }>;

  constructor(options: RateLimitBudgetOptions = {}) {
    this.capacity = Math.max(1, Math.floor(options.capacity ?? 60));
    this.windowMs = Math.max(1, Math.floor(options.windowMs ?? 60_000));
    this.nowMs = options.nowMs ?? Date.now;
    this.perProvider = options.perProvider ?? {};
  }

  private policyFor(providerId: string): { capacity: number; windowMs: number } {
    const override = this.perProvider[providerId];
    if (override) {
      return {
        capacity: Math.max(1, Math.floor(override.capacity)),
        windowMs: Math.max(1, Math.floor(override.windowMs)),
      };
    }
    return { capacity: this.capacity, windowMs: this.windowMs };
  }

  tryConsume(providerId: string, capability = 'snapshot'): RateLimitDecision {
    const key = `${providerId}:${capability}`;
    const now = this.nowMs();
    const policy = this.policyFor(providerId);
    let state = this.states.get(key);
    if (!state || now - state.startedAtMs >= policy.windowMs) {
      state = { startedAtMs: now, consumed: 0 };
      this.states.set(key, state);
    }
    if (state.consumed >= policy.capacity) {
      return { allowed: false, remaining: 0, resetAtMs: state.startedAtMs + policy.windowMs };
    }
    state.consumed += 1;
    return {
      allowed: true,
      remaining: policy.capacity - state.consumed,
      resetAtMs: state.startedAtMs + policy.windowMs,
    };
  }
}
