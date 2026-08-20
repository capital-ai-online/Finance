export type ComplianceAssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

export interface ComplianceRegistryAsset {
  symbol: string;
  name: string;
  type: ComplianceAssetType;
  marketDataStatus?: string | null;
  scoreStatus?: string | null;
  price: number | null;
  change24h: number | null;
  expectedReturn: number | null;
  volatility: number | null;
  risk: 'High' | 'Medium' | 'Low' | string | null;
  marketCap: number | null;
  volume24h: number | null;
  score: number | null;
  pattern: string | null;
  observedAt?: string | null;
  // Legacy clients used these fields before the registry catalog became fail-closed.
  // They remain optional only so the PDF can render old responses safely during rollout.
  drift?: number | null;
  status?: string | null;
}

export const UNAVAILABLE_VALUE = 'Nicht verfügbar';

export function isFiniteMetric(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatFixedMetric(value: unknown, digits = 2): string {
  return isFiniteMetric(value) ? value.toFixed(digits) : UNAVAILABLE_VALUE;
}

export function formatCurrencyMetric(value: unknown): string {
  return isFiniteMetric(value)
    ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    : UNAVAILABLE_VALUE;
}

export function formatPercentMetric(value: unknown, digits = 2): string {
  return isFiniteMetric(value) ? `${value.toFixed(digits)}%` : UNAVAILABLE_VALUE;
}

export function formatSignedPercentMetric(value: unknown, digits = 2): string {
  if (!isFiniteMetric(value)) return UNAVAILABLE_VALUE;
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

export function formatTextMetric(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : UNAVAILABLE_VALUE;
}

export function formatRiskMetric(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().toUpperCase()
    : UNAVAILABLE_VALUE;
}

export function getComplianceStatus(asset: ComplianceRegistryAsset): string {
  return formatTextMetric(asset.status ?? asset.scoreStatus ?? asset.marketDataStatus);
}

export function getBestAndWorstScoredAssets(
  assets: ComplianceRegistryAsset[],
  type: ComplianceAssetType,
): { best: ComplianceRegistryAsset[]; worst: ComplianceRegistryAsset[] } {
  const scored = assets
    .filter(asset => asset.type === type && isFiniteMetric(asset.score))
    .sort((a, b) => (b.score as number) - (a.score as number));

  if (scored.length === 0) return { best: [], worst: [] };

  return {
    best: scored.slice(0, 2),
    worst: scored.slice(-2).reverse(),
  };
}
