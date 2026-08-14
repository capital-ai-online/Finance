import { CircuitBreaker } from './CircuitBreaker';
import { ProviderRegistry } from './ProviderRegistry';
import { RateLimitBudget } from './RateLimitBudget';
import type { MarketDataProvider, SnapshotRequest } from './contracts';

export type ProviderSkipReason = 'circuit_open' | 'rate_limit_budget_exhausted';

export interface ProviderSkip {
  providerId: string;
  reason: ProviderSkipReason;
}

export interface ProviderRoute {
  providers: MarketDataProvider[];
  skipped: ProviderSkip[];
}

export class ProviderRouter {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly rateLimitBudget: RateLimitBudget,
    private readonly circuitBreaker: CircuitBreaker,
  ) {}

  route(request: SnapshotRequest): ProviderRoute {
    const providers: MarketDataProvider[] = [];
    const skipped: ProviderSkip[] = [];
    for (const provider of this.registry.candidates(request)) {
      const providerId = provider.descriptor.id;
      if (!this.circuitBreaker.allow(providerId)) {
        skipped.push({ providerId, reason: 'circuit_open' });
        continue;
      }
      if (!this.rateLimitBudget.tryConsume(providerId, 'snapshot').allowed) {
        skipped.push({ providerId, reason: 'rate_limit_budget_exhausted' });
        continue;
      }
      providers.push(provider);
    }
    return { providers, skipped };
  }

  recordSuccess(providerId: string): void {
    this.circuitBreaker.success(providerId);
  }

  recordFailure(providerId: string): void {
    this.circuitBreaker.failure(providerId);
  }
}
