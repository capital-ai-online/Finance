export interface RateLimitBudgetOptions {
  capacity?: number;
  windowMs?: number;
  nowMs?: () => number;
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

  constructor(options: RateLimitBudgetOptions = {}) {
    this.capacity = Math.max(1, Math.floor(options.capacity ?? 60));
    this.windowMs = Math.max(1, Math.floor(options.windowMs ?? 60_000));
    this.nowMs = options.nowMs ?? Date.now;
  }

  tryConsume(providerId: string, capability = 'snapshot'): RateLimitDecision {
    const key = `${providerId}:${capability}`;
    const now = this.nowMs();
    let state = this.states.get(key);
    if (!state || now - state.startedAtMs >= this.windowMs) {
      state = { startedAtMs: now, consumed: 0 };
      this.states.set(key, state);
    }
    if (state.consumed >= this.capacity) {
      return { allowed: false, remaining: 0, resetAtMs: state.startedAtMs + this.windowMs };
    }
    state.consumed += 1;
    return {
      allowed: true,
      remaining: this.capacity - state.consumed,
      resetAtMs: state.startedAtMs + this.windowMs,
    };
  }
}
