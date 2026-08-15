import type { HistoryRequest, MarketDataHistoryProvider, MarketDataProviderDescriptor } from './contracts';

export class HistoryProviderRegistry {
  private readonly providers = new Map<string, MarketDataHistoryProvider>();

  register(provider: MarketDataHistoryProvider): void {
    const id = provider.descriptor.id.trim();
    if (!id) throw new Error('Market data history provider id is required.');
    if (this.providers.has(id)) throw new Error(`Market data history provider '${id}' is already registered.`);
    this.providers.set(id, provider);
  }

  descriptors(): MarketDataProviderDescriptor[] {
    return [...this.providers.values()].map(provider => ({ ...provider.descriptor }));
  }

  candidates(request: HistoryRequest): MarketDataHistoryProvider[] {
    const allowed = request.allowedProviderIds ? new Set(request.allowedProviderIds) : null;
    return [...this.providers.values()]
      .filter(provider => provider.descriptor.enabled)
      .filter(provider => request.includeShadow === true || provider.descriptor.role !== 'shadow')
      .filter(provider => !allowed || allowed.has(provider.descriptor.id))
      .filter(provider => provider.descriptor.assetClasses.includes(request.assetClass))
      .filter(provider => provider.descriptor.capabilities.includes('history'))
      .sort((a, b) => a.descriptor.priority - b.descriptor.priority || a.descriptor.id.localeCompare(b.descriptor.id));
  }
}
