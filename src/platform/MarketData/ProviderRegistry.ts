import type { MarketDataProvider, MarketDataProviderDescriptor, SnapshotRequest } from './contracts';

export class ProviderRegistry {
  private readonly providers = new Map<string, MarketDataProvider>();

  register(provider: MarketDataProvider): void {
    const id = provider.descriptor.id.trim();
    if (!id) throw new Error('Market data provider id is required.');
    if (this.providers.has(id)) throw new Error(`Market data provider '${id}' is already registered.`);
    this.providers.set(id, provider);
  }

  get(id: string): MarketDataProvider | undefined {
    return this.providers.get(id);
  }

  descriptors(): MarketDataProviderDescriptor[] {
    return [...this.providers.values()].map(provider => ({ ...provider.descriptor }));
  }

  candidates(request: SnapshotRequest): MarketDataProvider[] {
    const allowed = request.allowedProviderIds ? new Set(request.allowedProviderIds) : null;
    return [...this.providers.values()]
      .filter(provider => provider.descriptor.enabled)
      .filter(provider => request.includeShadow === true || provider.descriptor.role !== 'shadow')
      .filter(provider => !allowed || allowed.has(provider.descriptor.id))
      .filter(provider => provider.descriptor.assetClasses.includes(request.assetClass))
      .filter(provider => provider.descriptor.capabilities.includes('snapshot'))
      .sort((a, b) => a.descriptor.priority - b.descriptor.priority || a.descriptor.id.localeCompare(b.descriptor.id));
  }
}
