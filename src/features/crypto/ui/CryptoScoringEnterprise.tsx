import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  RadarChart,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Database,
  Gauge,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Radar as RadarGlyph,
  Layers3,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { AssetLogo } from '../../../components/AssetLogo';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import { assetRegistry } from '../../../lib/assetRegistry';
import { EnterpriseAnalysisPanels } from '../../../components/EnterpriseAnalysisPanels';
import { EnterpriseBinanceQuickAnalysis } from './EnterpriseBinanceQuickAnalysis';
import type { TradeSetupLevels } from '../../../services/tradeSetupLevels';

export interface CryptoScoringEnterpriseProps {
  selectedSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
  timeframe: string;
  onChangeTimeframe?: (timeframe: string) => void;
  userSession?: unknown;
  subscriptionTier?: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick?: () => void;
}

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

type ProvenanceEntry = {
  provider?: string;
  field?: string;
  sourcePath?: string;
  observedAt?: string;
  retrievedAt?: string;
  evidenceId?: string;
  value?: number;
  normalizedValue?: number;
};

type RadarFactor = { key: string; label: string; category: string; value: number };

type EnterpriseViewModel = {
  status: string;
  symbol: string;
  assetName: string;
  assetType: AssetType;
  score: number | null;
  rankScore: number | null;
  eligibleForTop10: boolean;
  tradeSetup: TradeSetupLevels | null;
  decision: string | null;
  decisionName: string | null;
  decisionDesc: string | null;
  riskLevel: string | null;
  reasoning: string[];
  alerts: string[];
  factors: Array<{ name: string; score: number }>;
  rawFactors: RadarFactor[];
  providers: string[];
  evidenceIds: string[];
  provenance: ProvenanceEntry[];
  coverage: number | null;
  dataQuality: string | null;
  featureVersion: string | null;
  scoringVersion: string | null;
  reason: string | null;
};

const SCORE_TEMPORAL_BASIS = {
  uiTimeframe: '1 tag',
  barInterval: '1d',
  lookbackBars: 30,
  label: '30 verifizierte 1D-Bars',
} as const;

const TIMEFRAMES = [
  { value: '1m', label: '1 Min', scoreBound: false },
  { value: '5m', label: '5 Min', scoreBound: false },
  { value: '15m', label: '15 Min', scoreBound: false },
  { value: '30m', label: '30 Min', scoreBound: false },
  { value: '1std', label: '1 Std', scoreBound: false },
  { value: '4std', label: '4 Std', scoreBound: false },
  { value: '1 tag', label: '1 Tag', scoreBound: true },
  { value: '1 woche', label: '1 Woche', scoreBound: false },
] as const;

const TYPE_LABEL: Record<AssetType, string> = {
  crypto: 'Krypto', stock: 'Aktien', forex: 'Forex', commodity: 'Rohstoffe', index: 'Indizes', bond: 'Anleihen',
};

const CRYPTO_FACTOR_META: Record<string, { label: string; category: string; invert?: boolean }> = {
  trend: { label: 'Trendstärke', category: 'Technisch' },
  momentum: { label: 'Momentum', category: 'Technisch' },
  breakout_quality: { label: 'Breakout-Qualität', category: 'Technisch' },
  relative_strength: { label: 'Relative Stärke (RSI)', category: 'Technisch' },
  volatility_quality: { label: 'Volatilitäts-Qualität', category: 'Risiko' },
  data_quality_risk: { label: 'Daten-Qualität', category: 'Risiko', invert: true },
  avg_daily_volume: { label: 'Liquidität', category: 'Marktstruktur' },
  supply_dynamics: { label: 'Tokenomics', category: 'Marktstruktur' },
  regime_bonus: { label: 'Markt-Regime', category: 'Kontext' },
};

const FACTOR_CATEGORY_COLOR: Record<string, string> = {
  'Technisch': 'var(--color-factor-technical)',
  'Risiko': 'var(--color-factor-risk)',
  'Marktstruktur': 'var(--color-factor-market-structure)',
  'Kontext': 'var(--color-factor-context)',
  'Faktor': 'var(--color-factor-generic)',
};

const AGGREGATE_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentaldaten',
  risk: 'Risiko-Score',
  liquidity: 'Liquidität',
  technicalStrength: 'Technische Stärke',
};

type TierStyle = { hex: string; text: string; bg: string; border: string; label: string };

const NEUTRAL_STYLE: TierStyle = {
  hex: 'var(--color-score-neutral)',
  text: 'text-score-neutral',
  bg: 'bg-score-neutral/5',
  border: 'border-score-neutral/15',
  label: 'Unbewertet',
};

const DECISION_STYLE: Record<string, TierStyle> = {
  a_setup: { hex: 'var(--color-score-best)', text: 'text-score-best', bg: 'bg-score-best/10', border: 'border-score-best/25', label: 'A-Setup' },
  tradeable_watch: { hex: 'var(--color-score-ranking)', text: 'text-score-ranking', bg: 'bg-score-ranking/10', border: 'border-score-ranking/25', label: 'Tradeable Watch' },
  speculative_watch: { hex: 'var(--color-score-warning)', text: 'text-score-warning', bg: 'bg-score-warning/10', border: 'border-score-warning/25', label: 'Speculative Watch' },
  observe: { hex: 'var(--color-score-warning)', text: 'text-score-warning', bg: 'bg-score-warning/10', border: 'border-score-warning/25', label: 'Observe' },
  high_risk_speculation: { hex: 'var(--color-score-worst)', text: 'text-score-worst', bg: 'bg-score-worst/10', border: 'border-score-worst/25', label: 'High-Risk Speculation' },
  reject: { hex: 'var(--color-score-worst)', text: 'text-score-worst', bg: 'bg-score-worst/10', border: 'border-score-worst/25', label: 'Reject' },
};

function scoreTier(score: number | null, decision: string | null): TierStyle {
  const key = decision?.toLowerCase().trim();
  if (key && DECISION_STYLE[key]) return DECISION_STYLE[key];
  if (score === null) return NEUTRAL_STYLE;
  if (score >= 80) return DECISION_STYLE.a_setup;
  if (score >= 65) return DECISION_STYLE.tradeable_watch;
  if (score >= 50) return DECISION_STYLE.speculative_watch;
  if (score >= 35) return DECISION_STYLE.observe;
  return DECISION_STYLE.reject;
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeReasoning(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function prettifyFactorName(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isTradeSetup(value: unknown): value is TradeSetupLevels {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const numericFields = ['referencePrice', 'entryLow', 'entryHigh', 'stopLoss1', 'stopLoss2', 'takeProfit1', 'takeProfit2', 'volatilityAbs', 'volatilityPct'];
  return (v.direction === 'long' || v.direction === 'short') && numericFields.every((field) => finite(v[field]) !== null);
}

function extractFactors(scores: unknown): Array<{ name: string; score: number }> {
  if (!scores || typeof scores !== 'object') return [];
  return Object.entries(scores as Record<string, unknown>)
    .map(([name, value]) => ({ name, score: finite(value) }))
    .filter((item): item is { name: string; score: number } => item.score !== null)
    .sort((a, b) => b.score - a.score);
}

function extractRawFactors(inputs: unknown): RadarFactor[] {
  if (!inputs || typeof inputs !== 'object') return [];
  return Object.entries(CRYPTO_FACTOR_META).flatMap(([key, meta]) => {
    const raw = finite((inputs as Record<string, unknown>)[key]);
    if (raw === null) return [];
    const pct = Math.max(0, Math.min(1, raw)) * 100;
    const value = meta.invert ? 100 - pct : pct;
    return [{ key, label: meta.label, category: meta.category, value: Number(value.toFixed(1)) }];
  });
}

function buildCryptoView(body: any, symbol: string, assetName: string): EnterpriseViewModel {
  const integrity = body?.integrity ?? {};
  return {
    status: typeof body?.status === 'string' ? body.status : 'SCORE_NOT_COMPUTABLE',
    symbol,
    assetName,
    assetType: 'crypto',
    score: finite(body?.final_score),
    rankScore: finite(body?.rank_score),
    eligibleForTop10: body?.eligible_for_top10 === true,
    tradeSetup: isTradeSetup(body?.tradeSetup) ? body.tradeSetup : null,
    decision: typeof body?.decision === 'string' ? body.decision : null,
    decisionName: typeof body?.decisionName === 'string' ? body.decisionName : null,
    decisionDesc: typeof body?.decisionDesc === 'string' ? body.decisionDesc : null,
    riskLevel: typeof body?.risk_level === 'string' ? body.risk_level : null,
    reasoning: normalizeReasoning(body?.reasoning),
    alerts: normalizeReasoning(body?.alerts),
    factors: extractFactors(body?.scores),
    rawFactors: extractRawFactors(body?.inputs),
    providers: strings(integrity?.providers ?? body?.providers),
    evidenceIds: Array.isArray(integrity?.evidence)
      ? integrity.evidence.map((item: any) => item?.evidenceId).filter((item: unknown): item is string => typeof item === 'string')
      : strings(body?.evidenceIds),
    provenance: Array.isArray(body?.provenance) ? body.provenance : [],
    coverage: finite(integrity?.coverage),
    dataQuality: typeof integrity?.dataQuality === 'string' ? integrity.dataQuality : null,
    featureVersion: typeof integrity?.featureVersion === 'string' ? integrity.featureVersion : null,
    scoringVersion: typeof integrity?.scoringVersion === 'string' ? integrity.scoringVersion : null,
    reason: typeof integrity?.reason === 'string' ? integrity.reason : typeof body?.error === 'string' ? body.error : null,
  };
}

function buildTraditionalView(body: any, symbol: string, assetName: string, assetType: AssetType): EnterpriseViewModel {
  const provenance: ProvenanceEntry[] = Array.isArray(body?.provenance) ? body.provenance : [];
  const factorNames = strings(body?.usedFactors);
  const factors = factorNames.flatMap((name) => {
    const entry = provenance.find((item) => item?.field === name);
    const score = finite(entry?.normalizedValue) ?? finite(entry?.value);
    return score === null ? [] : [{ name, score }];
  });
  return {
    status: typeof body?.status === 'string' ? body.status : 'SCORE_NOT_COMPUTABLE',
    symbol,
    assetName,
    assetType,
    score: finite(body?.score),
    rankScore: null,
    eligibleForTop10: false,
    tradeSetup: null,
    decision: null,
    decisionName: null,
    decisionDesc: null,
    riskLevel: null,
    reasoning: normalizeReasoning(body?.reasoning),
    alerts: [],
    factors,
    rawFactors: [],
    providers: strings(body?.providers),
    evidenceIds: strings(body?.evidenceIds),
    provenance,
    coverage: factorNames.length > 0 ? factorNames.length / Math.max(factorNames.length + strings(body?.missingFactors).length, 1) : null,
    dataQuality: body?.status === 'READY' ? 'verified' : null,
    featureVersion: typeof body?.lineage?.featureVersion === 'string' ? body.lineage.featureVersion : null,
    scoringVersion: typeof body?.lineage?.scoringVersion === 'string' ? body.lineage.scoringVersion : null,
    reason: typeof body?.reason === 'string' ? body.reason : null,
  };
}

function unavailable(symbol: string, assetName: string, assetType: AssetType, reason: string): EnterpriseViewModel {
  return {
    status: 'SCORE_NOT_COMPUTABLE', symbol, assetName, assetType, score: null, rankScore: null,
    eligibleForTop10: false, tradeSetup: null,
    decision: null, decisionName: null, decisionDesc: null, riskLevel: null, reasoning: [], alerts: [], factors: [],
    rawFactors: [], providers: [], evidenceIds: [], provenance: [], coverage: null, dataQuality: null,
    featureVersion: null, scoringVersion: null, reason,
  };
}

function ScoreGauge({ score, tier }: { score: number | null; tier: TierStyle }) {
  const value = Math.max(0, Math.min(100, score ?? 0));
  const data = [{ name: 'score', value }];
  return (
    <div className="relative mx-auto h-40 w-40 sm:h-44 sm:w-44">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="100%" barSize={12} data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'var(--color-border)' }} fill={tier.hex} isAnimationActive animationDuration={900} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black font-mono text-text-primary tabular-nums">{score !== null ? score.toFixed(1) : '—'}</span>
        <span className="mt-1 text-[9px] font-mono uppercase tracking-widest text-text-secondary">von 100</span>
      </div>
    </div>
  );
}

function FactorRadar({ data, tier }: { data: RadarFactor[]; tier: TierStyle }) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-center text-xs text-text-secondary">Keine verifizierten Faktorwerte verfügbar.</div>;
  }
  return (
    <div className="h-64 sm:h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis dataKey="label" stroke="var(--color-text-secondary)" fontSize={9} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Faktor-Score" dataKey="value" stroke={tier.hex} fill={tier.hex} fillOpacity={0.22} strokeWidth={2} isAnimationActive animationDuration={900} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 12 }}
            itemStyle={{ color: 'var(--color-text-primary)', fontSize: 11, fontFamily: 'monospace' }}
            labelStyle={{ color: 'var(--color-text-secondary)', fontSize: 10 }}
            formatter={(value: number) => [value.toFixed(1), 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatSetupPrice(value: number): string {
  return value >= 1000
    ? value.toLocaleString('de-DE', { maximumFractionDigits: 2 })
    : value.toLocaleString('de-DE', { maximumFractionDigits: value >= 1 ? 4 : 8 });
}

type SetupMarker = { key: string; label: string; value: number; kind: 'stop' | 'target' };

function TradeSetupLadder({ setup }: { setup: TradeSetupLevels }) {
  const long = setup.direction === 'long';
  const markers: SetupMarker[] = long
    ? [
      { key: 'sl2', label: 'SL2', value: setup.stopLoss2, kind: 'stop' },
      { key: 'sl1', label: 'SL1', value: setup.stopLoss1, kind: 'stop' },
      { key: 'tp1', label: 'TP1', value: setup.takeProfit1, kind: 'target' },
      { key: 'tp2', label: 'TP2', value: setup.takeProfit2, kind: 'target' },
    ]
    : [
      { key: 'tp2', label: 'TP2', value: setup.takeProfit2, kind: 'target' },
      { key: 'tp1', label: 'TP1', value: setup.takeProfit1, kind: 'target' },
      { key: 'sl1', label: 'SL1', value: setup.stopLoss1, kind: 'stop' },
      { key: 'sl2', label: 'SL2', value: setup.stopLoss2, kind: 'stop' },
    ];

  const allValues = [...markers.map((m) => m.value), setup.entryLow, setup.entryHigh, setup.referencePrice];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = Math.max(max - min, 1e-9);
  const pos = (value: number) => Math.max(2, Math.min(98, ((value - min) / span) * 100));

  const entryLowPos = pos(setup.entryLow);
  const entryHighPos = pos(setup.entryHigh);
  const refPos = pos(setup.referencePrice);

  return (
    <div className="space-y-5">
      <div className="relative h-24 sm:h-28">
        <div className={`absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r ${long ? 'from-score-worst/40 via-border to-score-best/40' : 'from-score-best/40 via-border to-score-worst/40'}`} />
        <div
          className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-full border border-brand-primary/50 bg-brand-primary/20"
          style={{ left: `${Math.min(entryLowPos, entryHighPos)}%`, width: `${Math.max(1.5, Math.abs(entryHighPos - entryLowPos))}%` }}
          title="Entry-Zone"
        />
        {markers.map((marker, index) => {
          const left = pos(marker.value);
          const above = index % 2 === 0;
          const color = marker.kind === 'stop'
            ? 'text-score-worst border-score-worst/40 bg-score-worst/10'
            : 'text-score-best border-score-best/40 bg-score-best/10';
          return (
            <div key={marker.key} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
              <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
              <div className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-bold ${color} ${above ? '-top-9' : 'top-4'}`}>
                {marker.label} · {formatSetupPrice(marker.value)}
              </div>
            </div>
          );
        })}
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${refPos}%` }}>
          <div className="absolute left-1/2 top-1/2 h-8 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary" />
          <div className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background/90 px-1.5 py-0.5 text-[9px] font-mono font-bold text-text-primary">
            Kurs · {formatSetupPrice(setup.referencePrice)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono text-text-secondary">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-bold uppercase ${long ? 'border-score-best/30 bg-score-best/10 text-score-best' : 'border-score-worst/30 bg-score-worst/10 text-score-worst'}`}>
          {long ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />} {long ? 'Long-Setup' : 'Short-Setup'}
        </span>
        <span>Entry-Zone: {formatSetupPrice(Math.min(setup.entryLow, setup.entryHigh))} – {formatSetupPrice(Math.max(setup.entryLow, setup.entryHigh))}</span>
        <span>Tagesvolatilität: {setup.volatilityPct.toFixed(2)}%</span>
      </div>
      <p className="text-[10px] leading-relaxed text-text-secondary">
        Rein technische Strukturableitung aus verifizierter 30-Tage-Kurshistorie (SMA/letzter Kurs für Richtung & Entry-Zone, 1×/2× Tagesvolatilität sowie 30-Tage-Hoch/-Tief für SL1/SL2 & TP1/TP2 — tradeSetupLevels.ts, {setup.methodology}). Keine Anlageberatung, keine Ausführungsgarantie; Gebühren, Slippage und Spread sind nicht eingerechnet.
      </p>
    </div>
  );
}

export function CryptoScoringEnterprise({ selectedSymbol, onSelectSymbol, timeframe, onChangeTimeframe }: CryptoScoringEnterpriseProps) {
  const symbol = selectedSymbol.toUpperCase().trim();
  const [result, setResult] = useState<EnterpriseViewModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState<'all' | AssetType>('all');
  const [searchOpen, setSearchOpen] = useState(false);

  const assets = useMemo(() => assetRegistry.getAssets(), []);
  const selectedAsset = useMemo(() => assets.find((asset) => asset.symbol.toUpperCase() === symbol), [assets, symbol]);
  const selectedTimeframe = TIMEFRAMES.find(item => item.value === timeframe) ?? null;
  const scoreTimeframeBound = selectedTimeframe?.scoreBound === true;

  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return assets
      .filter((asset) => assetTypeFilter === 'all' || asset.type === assetTypeFilter)
      .filter((asset) => !query || asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query) || asset.type.toLowerCase().includes(query))
      .slice(0, 40);
  }, [assets, searchValue, assetTypeFilter]);

  async function loadEvaluation() {
    setLoading(true);
    setRequestError(null);
    try {
      const assetType = (selectedAsset?.type ?? 'crypto') as AssetType;
      const assetName = selectedAsset?.name ?? symbol;

      if (assetType === 'crypto') {
        const response = await fetch('/api/crypto/score', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol, asset_name: assetName }),
        });
        const body = await response.json().catch(() => null);
        if (!body || typeof body !== 'object') throw new Error('Ungültige Antwort des Crypto-Scoring-Endpunkts.');
        setResult(buildCryptoView(body, symbol, assetName));
        return;
      }

      if (assetType === 'stock' || assetType === 'forex' || assetType === 'index') {
        const response = await fetch(`/api/registry/assets/${encodeURIComponent(symbol)}/verified-score`);
        const body = await response.json().catch(() => null);
        if (!body || typeof body !== 'object') throw new Error('Ungültige Antwort des verifizierten Scoring-Endpunkts.');
        setResult(buildTraditionalView(body, symbol, assetName, assetType));
        return;
      }

      setResult(unavailable(symbol, assetName, assetType, `Für ${TYPE_LABEL[assetType]} ist die Suche vollständig verfügbar, aber noch kein freigegebener provenance-backed kanonischer Scoring-Contract aktiv. Es werden keine Ersatzscores erzeugt.`));
    } catch (error: any) {
      setRequestError(error?.message || 'Enterprise-Bewertung konnte nicht geladen werden.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const ready = result?.status === 'READY' && result.score !== null;
  const coveragePct = result?.coverage === null || result?.coverage === undefined ? null : Math.round(result.coverage * 100);
  const tier = useMemo(() => scoreTier(result?.score ?? null, result?.decision ?? null), [result?.score, result?.decision]);

  const radarData = useMemo<RadarFactor[]>(() => {
    if (!result) return [];
    if (result.rawFactors.length > 0) return result.rawFactors;
    return result.factors
      .filter((factor) => factor.name !== 'final_score')
      .map((factor) => ({
        key: factor.name,
        label: prettifyFactorName(factor.name),
        category: 'Faktor',
        value: Number((factor.score <= 1 ? factor.score * 100 : Math.min(100, factor.score)).toFixed(1)),
      }));
  }, [result]);

  const aggregates = useMemo(() => {
    if (!result || result.assetType !== 'crypto') return [];
    return result.factors.filter((factor) => factor.name in AGGREGATE_LABELS);
  }, [result]);

  return (
    <section id="enterprise-scorer" className="scroll-mt-24 bg-background/60 border border-border rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden space-y-8">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-accent/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-cyan/[0.03] blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-30 rounded-2xl border border-brand-primary/20 bg-surface/45 p-5 space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-brand-primary"><Search size={14} /> Asset-Suche</div>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={searchValue}
              onChange={(event) => { setSearchValue(event.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Symbol oder Asset suchen: BTC, AAPL, EURUSD, Gold, Bond …"
              className="w-full rounded-xl border border-border bg-background/50 pl-9 pr-3 py-3 text-sm text-text-primary outline-none focus:border-brand-primary/50 min-h-11"
            />
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-background shadow-2xl z-50">
                {searchResults.length === 0 ? <div className="p-4 text-xs text-text-secondary">Kein Asset gefunden.</div> : searchResults.map((asset) => (
                  <button
                    type="button"
                    key={`${asset.type}-${asset.symbol}`}
                    onClick={() => { onSelectSymbol?.(asset.symbol); setSearchValue(''); setSearchOpen(false); }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-11 border-b border-border last:border-0 hover:bg-surface text-left"
                  >
                    <div className="flex items-center gap-3"><AssetLogo symbol={asset.symbol} size="xs" /><div><div className="text-xs font-bold text-text-primary">{asset.symbol} · {asset.name}</div><div className="text-[10px] text-text-secondary">{TYPE_LABEL[asset.type as AssetType]}</div></div></div>
                    <span className="text-[9px] font-mono uppercase text-text-secondary">auswählen</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'crypto', 'stock', 'forex', 'index', 'commodity', 'bond'] as const).map((type) => (
              <button key={type} type="button" onClick={() => { setAssetTypeFilter(type); setSearchOpen(true); }} className={`rounded-lg border px-3 min-h-11 text-[10px] font-bold ${assetTypeFilter === type ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}>{type === 'all' ? 'Alle' : TYPE_LABEL[type]}</button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="mb-2 flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest text-text-secondary">
            <Activity size={12} className="text-brand-cyan" /> Analyse-Zeitraum
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Analyse-Zeitraum des Enterprise Universum Scorers">
            {TIMEFRAMES.map((item) => {
              const active = timeframe === item.value;
              const activeStyle = item.scoreBound
                ? 'border-brand-cyan/60 bg-brand-cyan/10 text-brand-cyan'
                : 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary';
              return (
                <button
                  type="button"
                  key={item.value}
                  onClick={() => onChangeTimeframe?.(item.value)}
                  aria-pressed={active}
                  data-score-bound={item.scoreBound ? 'true' : 'false'}
                  className={`rounded-lg px-3 min-h-11 text-[9px] font-mono border transition-all ${active ? activeStyle : 'border-border text-text-secondary hover:border-brand-cyan/40 hover:text-text-primary'}`}
                  title={item.scoreBound
                    ? `Kanonische Score-Basis: ${SCORE_TEMPORAL_BASIS.label}.`
                    : `Analysekontext ${item.label}; der kanonische Crypto-Score bleibt auf ${SCORE_TEMPORAL_BASIS.label} gebunden.`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className={`mt-2 rounded-lg border px-3 py-2 text-[9px] font-mono ${scoreTimeframeBound ? 'border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan' : 'border-border bg-background/30 text-text-secondary'}`}>
            {scoreTimeframeBound
              ? `Score-Zeitbindung aktiv · ${SCORE_TEMPORAL_BASIS.label} · ${SCORE_TEMPORAL_BASIS.barInterval}`
              : `${selectedTimeframe?.label ?? timeframe} ist Analysekontext. Der produktive Crypto-Score bleibt auf ${SCORE_TEMPORAL_BASIS.label} gebunden; Intraday-Scores werden nicht synthetisiert.`}
          </div>
        </div>
      </div>

      <div className="relative z-20 flex flex-col xl:flex-row xl:items-start justify-between gap-6 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={symbol} size={48} />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 text-brand-primary border border-brand-primary/25 uppercase">
                <Sparkles size={10} /> Enterprise Universum Scorer
              </span>
              <StatusBadge status={result?.status ?? (loading ? 'LOADING' : 'DATA_UNAVAILABLE')} />
              {result?.decisionName && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest uppercase border ${tier.bg} ${tier.text} ${tier.border}`}>{result.decisionName}</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary font-display">{selectedAsset?.name ?? symbol} <span className="text-text-secondary">({symbol})</span></h2>
            <p className="text-xs text-text-secondary mt-1 font-mono">Multi-Faktor Institutional-Grade Scoring · alle Assetklassen durchsuchbar · evidence-gated</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadEvaluation()} disabled={loading} className="inline-flex items-center justify-center gap-2 px-4 min-h-11 rounded-xl border border-border bg-surface text-xs font-bold text-text-primary hover:brightness-110 disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Neu prüfen</button>
      </div>

      <div className="relative z-20">
        <EnterpriseBinanceQuickAnalysis symbol={symbol} />
      </div>

      {requestError && <div className="relative z-10 flex gap-3 rounded-xl border border-status-reject/30 bg-status-reject/10 p-4"><AlertTriangle className="mt-0.5 shrink-0 text-status-reject" size={20} /><div><p className="text-sm font-bold text-status-reject">DATA_UNAVAILABLE</p><p className="text-xs text-text-secondary mt-1">{requestError}</p></div></div>}

      {!requestError && !loading && result && !ready && <div className="relative z-10 rounded-xl border border-status-warning/25 bg-status-warning/10 p-5 flex gap-3"><ShieldCheck className="shrink-0 text-status-warning" size={20} /><div><p className="text-sm font-bold text-status-warning">{result.status}</p><p className="text-xs text-text-secondary mt-1">{result.reason ?? 'Für dieses Asset ist derzeit keine ausreichend vollständige verifizierte Evidence verfügbar.'}</p></div></div>}

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={`${result.symbol}-${result.status}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 space-y-8"
          >
            <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
              <div className={`xl:col-span-2 rounded-2xl border p-6 flex flex-col items-center justify-center gap-3 ${tier.border} ${tier.bg}`}>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-text-secondary font-mono"><Gauge size={13} /> Kanonischer Gesamt-Score</div>
                <ScoreGauge score={result.score} tier={tier} />
                <div className={`px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${tier.border} ${tier.bg} ${tier.text}`}>
                  <TrendingUp size={12} /> {result.decisionName ?? tier.label}
                </div>
                {result.decisionDesc && <p className="text-[10px] text-text-secondary text-center font-mono leading-relaxed">{result.decisionDesc}</p>}
                <p className="text-[9px] text-text-secondary font-mono">Read-only · Backend Contract</p>
              </div>

              <div className="xl:col-span-1 rounded-2xl border border-score-ranking/20 bg-score-ranking/5 p-5 flex flex-col items-center justify-center gap-2 text-center">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-score-ranking font-mono"><Award size={13} /> Intelligent Score</div>
                <div className="text-3xl font-black font-mono text-text-primary tabular-nums">{result.rankScore !== null ? result.rankScore.toFixed(1) : '—'}</div>
                {result.eligibleForTop10 && (
                  <span className="rounded-full border border-score-ranking/30 bg-score-ranking/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase text-score-ranking">Top-10 eligible</span>
                )}
                <p className="text-[9px] text-text-secondary font-mono leading-relaxed">Kompositscore aus Score, Datenqualität, Tier & Liquidität (ranking.service.ts)</p>
              </div>

              <div className="xl:col-span-3 rounded-2xl border border-border bg-surface/35 p-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm font-black uppercase text-text-primary"><RadarGlyph size={15} className="text-brand-cyan" /> Multi-Faktor Bewertungsmatrix</div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">{radarData.length} Kriterien</span>
                </div>
                <p className="text-[10px] text-text-secondary font-mono mb-3">State-of-the-Art institutionelles Faktormodell · dynamisch neugewichtet bei fehlenden Faktoren</p>
                <FactorRadar data={radarData} tier={tier} />
              </div>
            </div>

            {result.assetType === 'crypto' && (
              <div id="trade-setup-grafik" className="scroll-mt-24 rounded-2xl border border-border bg-surface/35 p-6">
                <div className="flex items-center gap-2 mb-2 text-sm font-black uppercase text-text-primary"><Activity size={15} className="text-brand-primary" /> Trade-Setup Grafik</div>
                {result.tradeSetup ? (
                  <TradeSetupLadder setup={result.tradeSetup} />
                ) : (
                  <p className="mt-3 text-xs text-text-secondary">Kein Setup ableitbar — keine ausreichende verifizierte 30-Tage-Kurshistorie für {symbol} vorhanden.</p>
                )}
              </div>
            )}

            {aggregates.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {aggregates.map((factor) => (
                  <div key={factor.name} className="rounded-xl border border-border bg-surface/35 p-4">
                    <div className="text-[9px] uppercase tracking-widest text-text-secondary font-mono">{AGGREGATE_LABELS[factor.name]}</div>
                    <div className="mt-2 text-2xl font-black font-mono text-text-primary">{factor.score.toFixed(0)}</div>
                    <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, factor.score))}%`, backgroundColor: tier.hex }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-surface/35 p-5 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-secondary mb-1"><Database size={13} className="text-brand-accent" /> Integrität & Coverage</div>
                <div className="flex items-center justify-between"><span className="text-text-secondary">Coverage</span> <span className="text-text-primary font-bold">{coveragePct === null ? '—' : `${coveragePct}%`}</span></div>
                <div className="flex items-center justify-between"><span className="text-text-secondary">Data Quality</span> <span className="text-text-primary font-bold">{result.dataQuality ?? '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-text-secondary">Risk Level</span> <span className="text-text-primary font-bold">{result.riskLevel ?? '—'}</span></div>
              </div>

              <div className="xl:col-span-2 rounded-xl border border-border bg-surface/35 p-5">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-wider text-text-secondary"><Activity size={13} className="text-brand-cyan" /> Faktor-Detailwerte</div>
                {radarData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {radarData.map((factor) => (
                      <div key={factor.key} className="rounded-lg border border-border bg-background/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-[10px] font-mono text-text-secondary break-all">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: FACTOR_CATEGORY_COLOR[factor.category] ?? 'var(--color-factor-generic)' }} />
                            {factor.label}
                          </span>
                          <span className="text-xs font-bold text-text-primary shrink-0">{factor.value.toFixed(1)}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, factor.value))}%`, backgroundColor: FACTOR_CATEGORY_COLOR[factor.category] ?? 'var(--color-factor-generic)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs text-text-secondary">Keine verifizierten Faktorwerte verfügbar.</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-surface/35 p-5"><h3 className="text-xs font-black uppercase text-text-primary mb-3 flex items-center gap-2"><Layers3 size={14} className="text-brand-primary" /> Reasoning</h3>{result.reasoning.length ? <div className="space-y-2">{result.reasoning.slice(0, 8).map((text, index) => <div key={index} className="rounded-lg border border-border bg-background/20 p-3 text-xs text-text-secondary">{text}</div>)}</div> : <p className="text-xs text-text-secondary">Keine verifizierte Begründung verfügbar.</p>}</div>
              <div className="rounded-xl border border-border bg-surface/35 p-5"><h3 className="text-xs font-black uppercase text-text-primary mb-3">Provider & Evidence</h3><div className="flex flex-wrap gap-2 mb-4">{result.providers.length ? result.providers.map((provider) => <span key={provider} className="rounded-md border border-brand-cyan/20 bg-brand-cyan/5 px-2 py-1 text-[10px] font-mono text-brand-cyan">{provider}</span>) : <span className="text-xs text-text-secondary">Keine Provider-Evidence.</span>}</div><div className="text-[10px] font-mono text-text-secondary space-y-1"><div>Evidence IDs: {result.evidenceIds.length}</div><div>Feature: {result.featureVersion ?? '—'}</div><div>Scoring: {result.scoringVersion ?? '—'}</div></div></div>
            </div>

            <EnterpriseAnalysisPanels
              symbol={symbol}
              assetType={result.assetType}
              canonicalScore={result.score}
              coverage={result.coverage}
              providers={result.providers}
              evidenceIds={result.evidenceIds}
              reasoning={result.reasoning}
              decision={result.decisionName ?? result.decision}
              riskLevel={result.riskLevel}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
