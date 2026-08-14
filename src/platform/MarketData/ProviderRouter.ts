import { CircuitBreaker } from './CircuitBreaker';
import { ProviderRegistry } from './ProviderRegistry';
import { RateLimitBudget } from './RateLimitBudget';
import type { MarketDataProvider, SnapshotRequest } from './contracts';

export type ProviderSkipReason = 'circuit_open' | 'rate_limit_budget_exhausted';

export interface ProviderSkip {
  providerId: string;
  reason: ProviderSkipReason;
}

export class ProviderRouter {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly rateLimitBudget: RateLimitBudget,
    private readonly circuitBreaker: CircuitBreaker,
  ) {}

  candidates(request: SnapshotRequest): MarketDataProvider[] {
    return this.registry.candidates(request);
  }

  tryAcquire(providerId: string): ProviderSkipReason | null {
    if (!this.circuitBreaker.allow(providerId)) return 'circuit_open';
    if (!this.rateLimitBudget.tryConsume(providerId, 'snapshot').allowed) return 'rate_limit_budget_exhausted';
    return null;
  }

  recordSuccess(providerId: string): void {
    this.circuitBreaker.success(providerId);
  }

  recordFailure(providerId: string): void {
    this.circuitBreaker.failure(providerId);
  }
}
