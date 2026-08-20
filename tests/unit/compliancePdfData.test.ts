import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  UNAVAILABLE_VALUE,
  formatCurrencyMetric,
  formatFixedMetric,
  formatPercentMetric,
  formatRiskMetric,
  formatSignedPercentMetric,
  getBestAndWorstScoredAssets,
  getComplianceStatus,
  type ComplianceRegistryAsset,
} from '../../src/components/compliancePdfData';

function asset(overrides: Partial<ComplianceRegistryAsset> = {}): ComplianceRegistryAsset {
  return {
    symbol: 'TEST',
    name: 'Test Asset',
    type: 'crypto',
    marketDataStatus: 'DATA_UNAVAILABLE',
    scoreStatus: 'SCORE_NOT_COMPUTABLE',
    price: null,
    change24h: null,
    expectedReturn: null,
    volatility: null,
    risk: null,
    marketCap: null,
    volume24h: null,
    score: null,
    pattern: null,
    ...overrides,
  };
}

describe('Compliance PDF data formatting', () => {
  it('renders unavailable catalog metrics without fabricating zero values', () => {
    expect(formatFixedMetric(null, 1)).toBe(UNAVAILABLE_VALUE);
    expect(formatCurrencyMetric(null)).toBe(UNAVAILABLE_VALUE);
    expect(formatPercentMetric(null)).toBe(UNAVAILABLE_VALUE);
    expect(formatSignedPercentMetric(null)).toBe(UNAVAILABLE_VALUE);
    expect(formatRiskMetric(null)).toBe(UNAVAILABLE_VALUE);
  });

  it('formats finite verified values normally', () => {
    expect(formatFixedMetric(8.94, 1)).toBe('8.9');
    expect(formatCurrencyMetric(1234.5)).toContain('1.234,50');
    expect(formatPercentMetric(3.1415, 2)).toBe('3.14%');
    expect(formatSignedPercentMetric(1.2, 2)).toBe('+1.20%');
    expect(formatSignedPercentMetric(-1.2, 2)).toBe('-1.20%');
    expect(formatRiskMetric('Medium')).toBe('MEDIUM');
  });

  it('excludes unverified scores from best/worst ranking', () => {
    const assets = [
      asset({ symbol: 'NULL', score: null }),
      asset({ symbol: 'A', score: 8.2 }),
      asset({ symbol: 'B', score: 4.1 }),
      asset({ symbol: 'C', score: Number.NaN }),
    ];

    const result = getBestAndWorstScoredAssets(assets, 'crypto');

    expect(result.best.map(item => item.symbol)).toEqual(['A', 'B']);
    expect(result.worst.map(item => item.symbol)).toEqual(['B', 'A']);
    expect(result.best.some(item => item.symbol === 'NULL')).toBe(false);
    expect(result.best.some(item => item.symbol === 'C')).toBe(false);
  });

  it('uses explicit fail-closed status fields instead of undefined legacy status', () => {
    expect(getComplianceStatus(asset())).toBe('SCORE_NOT_COMPUTABLE');
    expect(getComplianceStatus(asset({ scoreStatus: null }))).toBe('DATA_UNAVAILABLE');
    expect(getComplianceStatus(asset({ status: 'READY' }))).toBe('READY');
  });

  it('keeps the exporter off direct nullable numeric/string method calls', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/components/ComplianceExporter.tsx'),
      'utf8',
    );

    expect(source).not.toContain('asset.score.toFixed');
    expect(source).not.toContain('selectedAsset.score.toFixed');
    expect(source).not.toContain('selectedAsset.change24h.toFixed');
    expect(source).not.toContain('selectedAsset.drift.toFixed');
    expect(source).not.toContain('selectedAsset.risk.toUpperCase');
    expect(source).toContain('formatFixedMetric(selectedAsset.score, 1)');
    expect(source).toContain('formatCurrencyMetric(selectedAsset.price)');
    expect(source).toContain('getComplianceStatus(selectedAsset)');
  });
});
