export type FinancialAssetClass = 'stock' | 'forex' | 'index';

export interface FinancialFieldProvenance {
  field: string;
  provider: 'Stooq' | 'AlphaVantage' | 'FMP';
  sourcePath: string;
  retrievedAt: string;
  observedAt?: string;
  unit?: string;
  value?: number;
  derivedFrom?: string[];
}

export interface TraditionalScoringLineage {
  assetId: string;
  assetClass: FinancialAssetClass;
  providers: string[];
  features: string[];
  provenanceFields: string[];
  evidenceIds: string[];
  featureVersion: string;
  scoringVersion: string;
  generatedAt: string;
}

export const TRADITIONAL_FEATURE_VERSION = 'traditional-features/2.0.0';
export const TRADITIONAL_SCORING_VERSION = 'traditional-scoring/2.0.0';

export function buildFinancialEvidenceId(assetId: string, provenance: FinancialFieldProvenance): string {
  const source = provenance.provider.toLowerCase();
  const field = provenance.field.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `financial:${source}:${assetId.toUpperCase()}:${field}`;
}

export function buildTraditionalScoringLineage(input: {
  assetId: string;
  assetClass: FinancialAssetClass;
  usedFactors: string[];
  provenance: FinancialFieldProvenance[];
}): TraditionalScoringLineage {
  const relevant = input.provenance.filter(item =>
    input.usedFactors.includes(item.field) ||
    (item.derivedFrom ?? []).some(parent => input.usedFactors.includes(parent))
  );
  const providers = [...new Set(relevant.map(item => item.provider))].sort();
  return {
    assetId: input.assetId.toUpperCase(),
    assetClass: input.assetClass,
    providers,
    features: [...input.usedFactors].sort(),
    provenanceFields: [...new Set(relevant.map(item => item.field))].sort(),
    evidenceIds: relevant.map(item => buildFinancialEvidenceId(input.assetId, item)),
    featureVersion: TRADITIONAL_FEATURE_VERSION,
    scoringVersion: TRADITIONAL_SCORING_VERSION,
    generatedAt: new Date().toISOString(),
  };
}
