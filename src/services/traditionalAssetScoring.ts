/**
 * Real market-data scoring for stocks, forex and indices.
 * Missing factors are excluded and weights renormalized; no factor value is invented.
 */

import {
  scoreTrend,
  scoreMomentum,
  scoreBreakout,
  scoreVolatility,
  computeReturnStats,
  computeRsi,
  renormalizeAndScore,
  clamp,
} from './realMarketSignals';
import { assetRegistry } from '../lib/assetRegistry';
import { recordProviderHealth } from '../platform/Supervisor/providerHealth';
import {
  buildTraditionalScoringLineage,
  type FinancialFieldProvenance,
  type TraditionalScoringLineage,
} from '../types/financialProvenance';

export const STOCK_SCORING_WEIGHTS = {
  trend: 0.18,
  momentum: 0.14,
  breakout_quality: 0.10,
  volatility_quality: 0.10,
  relative_strength: 0.13,
  value: 0.15,
  dividend: 0.08,
  quality: 0.12,
} as const;

export const FX_SCORING_WEIGHTS = {
  trend: 0.30,
  momentum: 0.25,
  breakout_quality: 0.15,
  volatility_quality: 0.15,
  relative_strength: 0.15,
} as const;

export interface TraditionalAssetScoringInputs {
  symbol: string;
  assetType: 'stock' | 'forex' | 'index';
  trend?: number;
  momentum?: number;
  breakout_quality?: number;
  volatility_quality?: number;
  relative_strength?: number;
  value?: number;
  dividend?: number;
  quality?: number;
  provenance?: FinancialFieldProvenance[];
}

export interface TraditionalAssetScoringResult {
  score: number;
  usedFactors: string[];
  missingFactors: string[];
  reasoning: string[];
  provenance: FinancialFieldProvenance[];
  lineage: TraditionalScoringLineage;
}

export function scoreValue(peRatio: number): number {
  return clamp(100 - (peRatio / 40) * 100);
}

export function scoreDividend(dividendYieldPct: number): number {
  return clamp((dividendYieldPct / 6) * 100);
}

export function scoreQuality(profitMarginPct: number): number {
  return clamp((profitMarginPct / 25) * 100);
}

export interface FundamentalsInput {
  peRatio?: number;
  dividendYieldPct?: number;
  profitMarginPct?: number;
  provenance?: FinancialFieldProvenance[];
}

export function computeTechnicalFactorsFromCloses(closes: number[]): Partial<TraditionalAssetScoringInputs> {
  const factors: Partial<TraditionalAssetScoringInputs> = {};
  const stats = computeReturnStats(closes);
  if (stats) {
    factors.trend = scoreTrend(stats.last, stats.sma) / 100;
    factors.momentum = scoreMomentum(stats.rocPct) / 100;
    factors.breakout_quality = scoreBreakout(stats.last, stats.high, stats.low) / 100;
    factors.volatility_quality = (100 - scoreVolatility(stats.dailyStdevPct)) / 100;
  }
  const rsi = computeRsi(closes);
  if (rsi !== undefined) factors.relative_strength = rsi / 100;
  return factors;
}

function technicalProvenance(
  symbol: string,
  provider: 'Stooq' | 'FMP',
  sourcePath: string,
  factors: Partial<TraditionalAssetScoringInputs>,
): FinancialFieldProvenance[] {
  const retrievedAt = new Date().toISOString();
  const fields = ['trend', 'momentum', 'breakout_quality', 'volatility_quality', 'relative_strength'] as const;
  return fields
    .filter(field => typeof factors[field] === 'number')
    .map(field => ({
      field,
      provider,
      sourcePath,
      retrievedAt,
      value: factors[field],
      unit: 'normalized-0-1',
      derivedFrom: ['close-history'],
    }));
}

function findRawProvenance(provenance: FinancialFieldProvenance[] | undefined, field: string) {
  return provenance?.find(item => item.field === field);
}

function derivedFundamentalProvenance(
  field: 'value' | 'dividend' | 'quality',
  rawField: 'peRatio' | 'dividendYieldPct' | 'profitMarginPct',
  value: number,
  fundamentals?: FundamentalsInput,
): FinancialFieldProvenance | undefined {
  const raw = findRawProvenance(fundamentals?.provenance, rawField);
  if (!raw) return undefined;
  return {
    field,
    provider: raw.provider,
    sourcePath: raw.sourcePath,
    retrievedAt: raw.retrievedAt,
    observedAt: raw.observedAt,
    unit: 'normalized-0-1',
    value,
    derivedFrom: [rawField],
  };
}

export async function generateTraditionalAssetInputs(
  symbol: string,
  assetType: 'stock' | 'forex',
  fundamentals?: FundamentalsInput,
): Promise<TraditionalAssetScoringInputs> {
  const s = symbol.toUpperCase().trim();
  const inputs: TraditionalAssetScoringInputs = { symbol: s, assetType, provenance: [] };

  try {
    const history = await assetRegistry.getHistory(s, 30);
    if (history.source === 'live') {
      const technical = computeTechnicalFactorsFromCloses(history.points.map(point => point.close));
      Object.assign(inputs, technical);
      inputs.provenance!.push(...technicalProvenance(
        s,
        'Stooq',
        `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`,
        technical,
      ));
      recordProviderHealth({
        provider: 'Stooq', capability: `${assetType}-history`, state: 'healthy', cacheMode: 'live',
        message: `${history.points.length} verified history points used for ${s}.`,
      });
    } else {
      recordProviderHealth({
        provider: 'Stooq', capability: `${assetType}-history`, state: 'degraded', cacheMode: 'simulated-rejected',
        message: `No verified Stooq history available for ${s}; simulated history was rejected for scoring.`,
      });
    }
  } catch (error) {
    recordProviderHealth({
      provider: 'Stooq', capability: `${assetType}-history`, state: 'unavailable',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (assetType === 'stock' && fundamentals) {
    if (fundamentals.peRatio !== undefined) {
      inputs.value = scoreValue(fundamentals.peRatio) / 100;
      const provenance = derivedFundamentalProvenance('value', 'peRatio', inputs.value, fundamentals);
      if (provenance) inputs.provenance!.push(provenance);
    }
    if (fundamentals.dividendYieldPct !== undefined) {
      inputs.dividend = scoreDividend(fundamentals.dividendYieldPct) / 100;
      const provenance = derivedFundamentalProvenance('dividend', 'dividendYieldPct', inputs.dividend, fundamentals);
      if (provenance) inputs.provenance!.push(provenance);
    }
    if (fundamentals.profitMarginPct !== undefined) {
      inputs.quality = scoreQuality(fundamentals.profitMarginPct) / 100;
      const provenance = derivedFundamentalProvenance('quality', 'profitMarginPct', inputs.quality, fundamentals);
      if (provenance) inputs.provenance!.push(provenance);
    }
  }

  return inputs;
}

export function generateTraditionalAssetInputsFromCloses(
  symbol: string,
  assetType: 'index',
  closes: number[],
): TraditionalAssetScoringInputs {
  const s = symbol.toUpperCase().trim();
  const inputs: TraditionalAssetScoringInputs = { symbol: s, assetType, provenance: [] };
  if (closes.length >= 2) {
    const technical = computeTechnicalFactorsFromCloses(closes);
    Object.assign(inputs, technical);
    inputs.provenance!.push(...technicalProvenance(
      s,
      'FMP',
      `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${encodeURIComponent(s)}`,
      technical,
    ));
  }
  return inputs;
}

export class TraditionalAssetScoringService {
  public static scoreTraditionalAsset(inputs: TraditionalAssetScoringInputs): TraditionalAssetScoringResult {
    const weights = inputs.assetType === 'stock' ? STOCK_SCORING_WEIGHTS : FX_SCORING_WEIGHTS;
    const values: Record<string, number | undefined> = {
      trend: inputs.trend !== undefined ? inputs.trend * 100 : undefined,
      momentum: inputs.momentum !== undefined ? inputs.momentum * 100 : undefined,
      breakout_quality: inputs.breakout_quality !== undefined ? inputs.breakout_quality * 100 : undefined,
      volatility_quality: inputs.volatility_quality !== undefined ? inputs.volatility_quality * 100 : undefined,
      relative_strength: inputs.relative_strength !== undefined ? inputs.relative_strength * 100 : undefined,
    };
    if (inputs.assetType === 'stock') {
      values.value = inputs.value !== undefined ? inputs.value * 100 : undefined;
      values.dividend = inputs.dividend !== undefined ? inputs.dividend * 100 : undefined;
      values.quality = inputs.quality !== undefined ? inputs.quality * 100 : undefined;
    }

    const { score, usedFactors, missingFactors } = renormalizeAndScore(values, weights, new Set());
    const provenance = (inputs.provenance ?? []).filter(item => usedFactors.includes(item.field));
    const reasoning: string[] = [];
    if (usedFactors.length === 0) {
      reasoning.push('Keine verifizierte Kurshistorie/Fundamentaldaten verfügbar; keine belegten Faktoren für das Scoring.');
    } else {
      if ((inputs.trend ?? 0) > 0.7) reasoning.push('Starker technischer Aufwärtstrend aus verifizierter Kurshistorie.');
      if (inputs.assetType === 'stock' && (inputs.value ?? 0) > 0.7) reasoning.push('Günstige KGV-basierte Bewertung aus Alpha-Vantage-Daten.');
      if (missingFactors.length > 0) reasoning.push(`Nicht belegte Faktoren ausgeschlossen: ${missingFactors.join(', ')}.`);
    }

    return {
      score: Number(score.toFixed(1)),
      usedFactors,
      missingFactors,
      reasoning,
      provenance,
      lineage: buildTraditionalScoringLineage({
        assetId: inputs.symbol,
        assetClass: inputs.assetType,
        usedFactors,
        provenance,
      }),
    };
  }
}
