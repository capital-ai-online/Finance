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
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Database,
  Gauge,
  Layers3,
  Radar as RadarGlyph,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AssetLogo } from '../../../components/AssetLogo';
import {
  AuthorityBadge,
  EvidenceStateIndicator,
  FreshnessBadge,
  ResearchOnlyBanner,
  StatusBadge,
} from '../../../shared/ui';
import { assetRegistry } from '../../../lib/assetRegistry';
import { EnterpriseAnalysisPanels } from '../../../components/EnterpriseAnalysisPanels';
import { EnterpriseBinanceQuickAnalysis } from './EnterpriseBinanceQuickAnalysis';
import { createCryptoVisualizationMetric } from './cryptoVisualizationViewModel';
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
  observedAt: string | null;
  retrievedAt: string | null;
  modelId: string | null;
  modelVersion: string | null;
  modelAlias: string | null;
  modelLifecycle: string | null;
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
  crypto: 'Krypto',
  stock: 'Aktien',
  forex: 'Forex',
  commodity: 'Rohstoffe',
  index: 'Indizes',
  bond: 'Anleihen',
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
  Technisch: 'var(--color-factor-technical)',
  Risiko: 'var(--color-factor-risk)',
  Marktstruktur: 'var(--color-factor-market-structure)',
  Kontext: 'var(--color-factor-context)',
  Faktor: 'var(--color-factor-generic)',
};

const AGGREGATE_LABELS: Record<string, string> = {
  fundamentals: 'Fundamentaldaten',
  risk: 'Risiko-Score',
  liquidity: 'Liquidität',
  technicalStrength: 'Technische Stärke',
};

type DecisionStyle = { text: string; bg: string; border: string };

const DECISION_STYLE: Record<string, DecisionStyle> = {
  a_setup: { text: 'text-score-best', bg: 'bg-score-best/10', border: 'border-score-best/25' },
  tradeable_watch: { text: 'text-score-ranking', bg: 'bg-score-ranking/10', border: 'border-score-ranking/25' },
  speculative_watch: { text: 'text-score-warning', bg: 'bg-score-warning/10', border: 'border-score-warning/25' },
  observe: { text: 'text-score-warning', bg: 'bg-score-warning/10', border: 'border-score-warning/25' },
  high_risk_speculation: { text: 'text-score-worst', bg: 'bg-score-worst/10', border: 'border-score-worst/25' },
  reject: { text: 'text-score-worst', bg: 'bg-score-worst/10', border: 'border-score-worst/25' },
};

const NEUTRAL_DECISION_STYLE: DecisionStyle = {
  text: 'text-text-secondary',
  bg: 'bg-surface/70',
  border: 'border-border',
};

function decisionStyle(decision: string | null): DecisionStyle {
  const key = decision?.toLowerCase().trim();
  return key && DECISION_STYLE[key] ? DECISION_STYLE[key] : NEUTRAL_DECISION_STYLE;
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

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
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

function evidenceIdsFromIntegrity(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => item?.id ?? item?.evidenceId)
    .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0);
}

function buildCryptoView(body: any, symbol: string, assetName: string): EnterpriseViewModel {
  const integrity = body?.integrity ?? {};
  return {
    status: text(body?.status) ?? 'SCORE_NOT_COMPUTABLE',
    symbol,
    assetName,
    assetType: 'crypto',
    score: finite(body?.final_score),
    rankScore: finite(body?.rank_score),
    eligibleForTop10: body?.eligible_for_top10 === true,
    tradeSetup: isTradeSetup(body?.tradeSetup) ? body.tradeSetup : null,
    decision: text(body?.decision),
    decisionName: text(body?.decisionName),
    decisionDesc: text(body?.decisionDesc),
    riskLevel: text(body?.risk_level),
    reasoning: normalizeReasoning(body?.reasoning),
    alerts: normalizeReasoning(body?.alerts),
    factors: extractFactors(body?.scores),
    rawFactors: extractRawFactors(body?.inputs),
    providers: strings(integrity?.providers ?? body?.providers),
    evidenceIds: evidenceIdsFromIntegrity(integrity?.evidence).length > 0
      ? evidenceIdsFromIntegrity(integrity?.evidence)
      : strings(body?.evidenceIds),
    provenance: Array.isArray(body?.provenance) ? body.provenance : [],
    coverage: finite(integrity?.coverage),
    dataQuality: text(integrity?.dataQuality),
    featureVersion: text(integrity?.featureVersion),
    scoringVersion: text(integrity?.scoringVersion),
    observedAt: text(integrity?.observedAt),
    retrievedAt: text(integrity?.retrievedAt),
    modelId: text(integrity?.modelId),
    modelVersion: text(integrity?.modelVersion),
    modelAlias: text(integrity?.modelAlias),
    modelLifecycle: text(integrity?.modelLifecycle),
    reason: text(integrity?.reason) ?? text(body?.error),
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
    status: text(body?.status) ?? 'SCORE_NOT_COMPUTABLE',
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
    featureVersion: text(body?.lineage?.featureVersion),
    scoringVersion: text(body?.lineage?.scoringVersion),
    observedAt: text(body?.observedAt),
    retrievedAt: text(body?.retrievedAt),
    modelId: text(body?.lineage?.modelId),
    modelVersion: text(body?.lineage?.modelVersion),
    modelAlias: text(body?.lineage?.modelAlias),
    modelLifecycle: text(body?.lineage?.modelLifecycle),
    reason: text(body?.reason),
  };
}

function unavailable(symbol: string, assetName: string, assetType: AssetType, reason: string): EnterpriseViewModel {
  return {
    status: 'SCORE_NOT_COMPUTABLE',
    symbol,
    assetName,
    assetType,
    score: null,
    rankScore: null,
    eligibleForTop10: false,
    tradeSetup: null,
    decision: null,
    decisionName: null,
    decisionDesc: null,
    riskLevel: null,
    reasoning: [],
    alerts: [],
    factors: [],
    rawFactors: [],
    providers: [],
    evidenceIds: [],
    provenance: [],
    coverage: null,
    dataQuality: null,
    featureVersion: null,
    scoringVersion: null,
    observedAt: null,
    retrievedAt: null,
    modelId: null,
    modelVersion: null,
    modelAlias: null,
    modelLifecycle: null,
    reason,
  };
}

function ScoreGauge({ score }: { score: number | null }) {
  const value = Math.max(0, Math.min(100, score ?? 0));
  const data = [{ name: 'score', value }];
  return (
    <div className="relative mx-auto h-44 w-44 sm:h-48 sm:w-48" aria-label={score === null ? 'Kanonischer Score nicht verfügbar' : `Kanonischer Score ${score.toFixed(1)} von 100`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="100%" barSize={13} data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'var(--color-border)' }} fill="var(--color-brand-primary)" isAnimationActive animationDuration={900} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black font-mono text-text-primary tabular-nums">{score !== null ? score.toFixed(1) : '—'}</span>
        <span className="mt-1 text-[9px] font-mono uppercase tracking-widest text-text-secondary">von 100</span>
      </div>
    </div>
  );
}

function FactorRadar({ data }: { data: RadarFactor[] }) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-center text-xs text-text-secondary">Keine verifizierten Faktorwerte verfügbar.</div>;
  }
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis dataKey="label" stroke="var(--color-text-secondary)" fontSize={9} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="Faktor-Score" dataKey="value" stroke="var(--color-factor-technical)" fill="var(--color-factor-technical)" fillOpacity={0.18} strokeWidth={2} isAnimationActive animationDuration={900} />
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

  const allValues = [...markers.map((marker) => marker.value), setup.entryLow, setup.entryHigh, setup.referencePrice];
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
          const above = index % 2 === 0;
          const color = marker.kind === 'stop'
            ? 'text-score-worst border-score-worst/40 bg-score-worst/10'
            : 'text-score-best border-score-best/40 bg-score-best/10';
          return (
            <div key={marker.key} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${pos(marker.value)}%` }}>
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

  // Preserve the technical Bond type in registry/domain contracts, but exclude it
  // from the productive Frontend asset-selection surface.
  const registryAssets = useMemo(() => assetRegistry.getAssets(), []);
  const assets = useMemo(() => registryAssets.filter((asset) => asset.type !== 'bond'), [registryAssets]);
  const selectedAsset = useMemo(() => assets.find((asset) => asset.symbol.toUpperCase() === symbol), [assets, symbol]);
  const technicalSelectedAsset = useMemo(() => registryAssets.find((asset) => asset.symbol.toUpperCase() === symbol), [registryAssets, symbol]);
  const selectedTimeframe = TIMEFRAMES.find((item) => item.value === timeframe) ?? null;
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
      if (technicalSelectedAsset?.type === 'bond') {
        setResult(null);
        setRequestError('Dieses Asset ist in der produktiven Frontend-Auswahl deaktiviert.');
        return;
      }

      const assetType = (selectedAsset?.type ?? 'crypto') as AssetType;
      const assetName = selectedAsset?.name ?? symbol;

      if (assetType === 'crypto') {
        const response = await fetch('/api/crypto/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, asset_name: assetName }),
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
  const decisionTone = useMemo(() => decisionStyle(result?.decision ?? null), [result?.decision]);

  const canonicalMetric = useMemo(() => {
    if (!result) return null;
    return createCryptoVisualizationMetric({
      id: `canonical-score:${result.symbol}`,
      label: 'Canonical Score',
      value: result.score,
      authority: 'CANONICAL_SCORE',
      status: result.status,
      observedAt: result.observedAt,
      retrievedAt: result.retrievedAt,
      providers: result.providers,
      evidenceIds: result.evidenceIds,
      reason: result.reason,
    });
  }, [result]);

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

  const modelLabel = result?.modelId
    ? `${result.modelId}${result.modelVersion ? `@${result.modelVersion}` : ''}`
    : result?.scoringVersion ?? '—';

  return (
    <section id="enterprise-scorer" className="scroll-mt-24 space-y-8 overflow-hidden rounded-2xl border border-border bg-background/60 p-6 backdrop-blur-xl sm:p-8 relative">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-accent/5 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-cyan/[0.03] blur-[130px]" />

      <div className="relative z-30 space-y-4 rounded-2xl border border-brand-primary/20 bg-surface/45 p-5">
        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-brand-primary"><Search size={14} /> Asset-Suche</div>
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={searchValue}
              onChange={(event) => { setSearchValue(event.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Symbol oder Asset suchen: BTC, AAPL, EURUSD, Gold …"
              className="min-h-11 w-full rounded-xl border border-border bg-background/50 py-3 pl-9 pr-3 text-sm text-text-primary outline-none focus:border-brand-primary/50"
            />
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-background shadow-2xl">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-xs text-text-secondary">Kein Asset gefunden.</div>
                ) : searchResults.map((asset) => (
                  <button
                    type="button"
                    key={`${asset.type}-${asset.symbol}`}
                    onClick={() => { onSelectSymbol?.(asset.symbol); setSearchValue(''); setSearchOpen(false); }}
                    className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface"
                  >
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={asset.symbol} size="xs" />
                      <div>
                        <div className="text-xs font-bold text-text-primary">{asset.symbol} · {asset.name}</div>
                        <div className="text-[10px] text-text-secondary">{TYPE_LABEL[asset.type as AssetType]}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono uppercase text-text-secondary">auswählen</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'crypto', 'stock', 'forex', 'index', 'commodity'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setAssetTypeFilter(type); setSearchOpen(true); }}
                className={`min-h-11 rounded-lg border px-3 text-[10px] font-bold ${assetTypeFilter === type ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}
              >
                {type === 'all' ? 'Alle' : TYPE_LABEL[type]}
              </button>
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
                  className={`min-h-11 rounded-lg border px-3 text-[9px] font-mono transition-all ${active ? activeStyle : 'border-border text-text-secondary hover:border-brand-cyan/40 hover:text-text-primary'}`}
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

      <div className="relative z-20 flex flex-col justify-between gap-6 border-b border-border pb-6 xl:flex-row xl:items-start">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={symbol} size={48} />
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded border border-brand-primary/25 bg-gradient-to-r from-brand-primary/20 to-brand-accent/20 px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-widest text-brand-primary">
                <Sparkles size={10} /> Enterprise Universum Scorer
              </span>
              <StatusBadge status={result?.status ?? (loading ? 'LOADING' : 'DATA_UNAVAILABLE')} />
            </div>
            <h2 className="font-display text-xl font-black text-text-primary sm:text-2xl">{selectedAsset?.name ?? symbol} <span className="text-text-secondary">({symbol})</span></h2>
            <p className="mt-1 text-xs font-mono text-text-secondary">Canonical Score zuerst · Ranking, Research und Evidence als getrennte Linsen</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadEvaluation()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-bold text-text-primary hover:brightness-110 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Neu prüfen
        </button>
      </div>

      {requestError && (
        <div className="relative z-10 flex gap-3 rounded-xl border border-status-reject/30 bg-status-reject/10 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-status-reject" size={20} />
          <div><p className="text-sm font-bold text-status-reject">DATA_UNAVAILABLE</p><p className="mt-1 text-xs text-text-secondary">{requestError}</p></div>
        </div>
      )}

      {!requestError && !loading && result && !ready && (
        <div className="relative z-10 flex gap-3 rounded-xl border border-status-warning/25 bg-status-warning/10 p-5">
          <ShieldCheck className="shrink-0 text-status-warning" size={20} />
          <div><p className="text-sm font-bold text-status-warning">{result.status}</p><p className="mt-1 text-xs text-text-secondary">{result.reason ?? 'Für dieses Asset ist derzeit keine ausreichend vollständige verifizierte Evidence verfügbar.'}</p></div>
        </div>
      )}

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
            <div id="crypto-score-command-center" className="space-y-5 rounded-2xl border border-brand-primary/25 bg-surface/45 p-5 sm:p-6" aria-labelledby="crypto-score-command-center-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-brand-primary"><Gauge size={13} /> CV-1 · Score Command Center</div>
                  <h3 id="crypto-score-command-center-title" className="mt-1 font-display text-lg font-black text-text-primary">Canonical Score als führende Entscheidungsmetrik</h3>
                  <p className="mt-1 max-w-3xl text-[10px] leading-relaxed text-text-secondary">Ranking, Research und Evidence bleiben sichtbar, sind aber semantisch und visuell vom kanonischen Score getrennt. Die UI berechnet keine Modellwahl, Eligibility oder Score-Delta.</p>
                </div>
                <AuthorityBadge authority="CANONICAL_SCORE" label="Canonical Score" />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/[0.045] p-5 xl:col-span-5">
                  <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
                    <ScoreGauge score={canonicalMetric?.value as number | null} />
                    <div className="min-w-0 space-y-3">
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">Modell</div>
                        <div className="mt-1 break-all text-sm font-black text-text-primary">{modelLabel}</div>
                        <div className="mt-1 text-[9px] font-mono text-text-secondary">
                          {result.modelAlias ? `Alias ${result.modelAlias}` : 'Alias —'}{result.modelLifecycle ? ` · ${result.modelLifecycle}` : ''}
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-background/35 p-3 text-[10px] font-mono text-text-secondary">
                        <div className="flex items-center justify-between gap-3"><span>Score-Basis</span><strong className="text-right text-text-primary">{SCORE_TEMPORAL_BASIS.label}</strong></div>
                        <div className="mt-1 flex items-center justify-between gap-3"><span>Feature Contract</span><strong className="text-right text-text-primary">{result.featureVersion ?? '—'}</strong></div>
                        <div className="mt-1 flex items-center justify-between gap-3"><span>Scoring Contract</span><strong className="text-right text-text-primary">{result.scoringVersion ?? '—'}</strong></div>
                      </div>
                      {(result.decisionName || result.decision) && (
                        <div className={`rounded-xl border p-3 ${decisionTone.border} ${decisionTone.bg}`}>
                          <div className={`text-[9px] font-mono font-black uppercase tracking-wider ${decisionTone.text}`}>Backend Decision</div>
                          <div className="mt-1 text-sm font-black text-text-primary">{result.decisionName ?? result.decision}</div>
                          {result.decisionDesc && <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">{result.decisionDesc}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-score-ranking/20 bg-score-ranking/5 p-5 xl:col-span-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-wider text-score-ranking"><Award size={13} /> Ranking Score</div>
                  <div className="mt-4 text-4xl font-black font-mono tabular-nums text-text-primary">{result.rankScore !== null ? result.rankScore.toFixed(1) : '—'}</div>
                  <p className="mt-1 text-[9px] font-mono uppercase tracking-wider text-score-ranking">sekundäre Ranking Projection · kein kanonischer Score</p>
                  <div className="mt-4 rounded-xl border border-border bg-background/30 p-3 text-[10px] text-text-secondary">
                    <div className="flex items-center justify-between gap-2"><span>Top-10 Eligibility</span><strong className="text-text-primary">{result.eligibleForTop10 ? 'JA' : 'NEIN'}</strong></div>
                    <div className="mt-1 flex items-center justify-between gap-2"><span>Risk Level</span><strong className="text-text-primary">{result.riskLevel ?? '—'}</strong></div>
                  </div>
                </div>

                <div className="space-y-3 xl:col-span-4">
                  <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/[0.035] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] font-mono font-black uppercase tracking-wider text-brand-cyan">Technical / Canonical</div>
                      <AuthorityBadge authority="CANONICAL_SCORE" compact />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={result.status} />
                      <FreshnessBadge observedAt={result.observedAt} retrievedAt={result.retrievedAt} label="Score Evidence" />
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-text-secondary">{SCORE_TEMPORAL_BASIS.lookbackBars} × {SCORE_TEMPORAL_BASIS.barInterval.toUpperCase()} bleiben die produktive Crypto-Scorebasis.</p>
                  </div>

                  <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/[0.035] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] font-mono font-black uppercase tracking-wider text-brand-accent">Research Context</div>
                      <AuthorityBadge authority="RESEARCH" compact />
                    </div>
                    <p className="mt-2 text-[10px] leading-relaxed text-text-secondary">Sentiment, Momentum, Pattern und AI-Kurzanalyse bleiben getrennte Research-Linsen und verändern den Canonical Score nicht.</p>
                  </div>

                  <div className="rounded-xl border border-border bg-background/25 p-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-wider text-text-secondary"><Database size={13} className="text-brand-cyan" /> Evidence Health</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <EvidenceStateIndicator state={result.status} label={result.status} />
                      <FreshnessBadge observedAt={result.observedAt} retrievedAt={result.retrievedAt} label="Evidence Zeit" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-border bg-surface/60 p-2"><div className="text-lg font-black font-mono text-text-primary">{coveragePct === null ? '—' : `${coveragePct}%`}</div><div className="text-[8px] uppercase text-text-secondary">Coverage</div></div>
                      <div className="rounded-lg border border-border bg-surface/60 p-2"><div className="text-lg font-black font-mono text-text-primary">{result.providers.length}</div><div className="text-[8px] uppercase text-text-secondary">Provider</div></div>
                      <div className="rounded-lg border border-border bg-surface/60 p-2"><div className="text-lg font-black font-mono text-text-primary">{result.evidenceIds.length}</div><div className="text-[8px] uppercase text-text-secondary">Evidence</div></div>
                    </div>
                    <div className="mt-2 text-[9px] font-mono text-text-secondary">Data Quality: <span className="text-text-primary">{result.dataQuality ?? '—'}</span></div>
                  </div>
                </div>
              </div>

              {result.assetType === 'crypto' && (
                <ResearchOnlyBanner
                  title="Research-Linsen bleiben non-authorizing"
                  description="Sentiment, Momentum, Pattern, Regime und AI-Kurzanalyse dienen als Kontext. Sie verändern weder Canonical Score noch Execution-Eligibility."
                />
              )}
            </div>

            {result.assetType === 'crypto' && (
              <div className="relative z-20">
                <EnterpriseBinanceQuickAnalysis symbol={symbol} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div className="rounded-2xl border border-border bg-surface/35 p-6 xl:col-span-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-black uppercase text-text-primary"><RadarGlyph size={15} className="text-brand-cyan" /> Multi-Faktor Bewertungsmatrix</div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">{radarData.length} Kriterien</span>
                </div>
                <p className="mb-3 text-[10px] font-mono text-text-secondary">Verifizierte Faktorprojektion; CV-3 wird Hard Gates, Correlation Groups und Missing Evidence separat sichtbar machen.</p>
                <FactorRadar data={radarData} />
              </div>

              <div className="rounded-2xl border border-border bg-surface/35 p-5 xl:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-secondary"><Database size={13} className="text-brand-accent" /> Lineage & Evidence</div>
                <div className="space-y-2 text-[10px] font-mono">
                  <div className="flex items-start justify-between gap-3"><span className="text-text-secondary">Model</span><strong className="break-all text-right text-text-primary">{modelLabel}</strong></div>
                  <div className="flex items-start justify-between gap-3"><span className="text-text-secondary">Alias</span><strong className="text-right text-text-primary">{result.modelAlias ?? '—'}</strong></div>
                  <div className="flex items-start justify-between gap-3"><span className="text-text-secondary">Lifecycle</span><strong className="text-right text-text-primary">{result.modelLifecycle ?? '—'}</strong></div>
                  <div className="flex items-start justify-between gap-3"><span className="text-text-secondary">Feature</span><strong className="break-all text-right text-text-primary">{result.featureVersion ?? '—'}</strong></div>
                  <div className="flex items-start justify-between gap-3"><span className="text-text-secondary">Scoring</span><strong className="break-all text-right text-text-primary">{result.scoringVersion ?? '—'}</strong></div>
                  <div className="flex items-start justify-between gap-3"><span className="text-text-secondary">Provider</span><strong className="text-right text-text-primary">{result.providers.length}</strong></div>
                  <div className="flex items-start justify-between gap-3"><span className="text-text-secondary">Evidence IDs</span><strong className="text-right text-text-primary">{result.evidenceIds.length}</strong></div>
                </div>
              </div>
            </div>

            {result.assetType === 'crypto' && (
              <div id="trade-setup-grafik" className="scroll-mt-24 rounded-2xl border border-border bg-surface/35 p-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase text-text-primary"><Activity size={15} className="text-brand-primary" /> Trade-Setup Grafik</div>
                {result.tradeSetup ? (
                  <TradeSetupLadder setup={result.tradeSetup} />
                ) : (
                  <p className="mt-3 text-xs text-text-secondary">Kein Setup ableitbar — keine ausreichende verifizierte 30-Tage-Kurshistorie für {symbol} vorhanden.</p>
                )}
              </div>
            )}

            {aggregates.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {aggregates.map((factor) => (
                  <div key={factor.name} className="rounded-xl border border-border bg-surface/35 p-4">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-text-secondary">{AGGREGATE_LABELS[factor.name]}</div>
                    <div className="mt-2 text-2xl font-black font-mono text-text-primary">{factor.score.toFixed(0)}</div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full bg-brand-cyan transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, factor.score))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-2.5 rounded-xl border border-border bg-surface/35 p-5 text-xs">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-secondary"><Database size={13} className="text-brand-accent" /> Integrität & Coverage</div>
                <div className="flex items-center justify-between"><span className="text-text-secondary">Coverage</span><span className="font-bold text-text-primary">{coveragePct === null ? '—' : `${coveragePct}%`}</span></div>
                <div className="flex items-center justify-between"><span className="text-text-secondary">Data Quality</span><span className="font-bold text-text-primary">{result.dataQuality ?? '—'}</span></div>
                <div className="flex items-center justify-between"><span className="text-text-secondary">Risk Level</span><span className="font-bold text-text-primary">{result.riskLevel ?? '—'}</span></div>
              </div>

              <div className="rounded-xl border border-border bg-surface/35 p-5 xl:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-secondary"><Activity size={13} className="text-brand-cyan" /> Faktor-Detailwerte</div>
                {radarData.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {radarData.map((factor) => (
                      <div key={factor.key} className="rounded-lg border border-border bg-background/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 break-all text-[10px] font-mono text-text-secondary">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: FACTOR_CATEGORY_COLOR[factor.category] ?? 'var(--color-factor-generic)' }} />
                            {factor.label}
                          </span>
                          <span className="shrink-0 text-xs font-bold text-text-primary">{factor.value.toFixed(1)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, factor.value))}%`, backgroundColor: FACTOR_CATEGORY_COLOR[factor.category] ?? 'var(--color-factor-generic)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs text-text-secondary">Keine verifizierten Faktorwerte verfügbar.</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface/35 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-text-primary"><Layers3 size={14} className="text-brand-primary" /> Reasoning</h3>
                {result.reasoning.length ? (
                  <div className="space-y-2">{result.reasoning.slice(0, 8).map((entry, index) => <div key={index} className="rounded-lg border border-border bg-background/20 p-3 text-xs text-text-secondary">{entry}</div>)}</div>
                ) : <p className="text-xs text-text-secondary">Keine verifizierte Begründung verfügbar.</p>}
              </div>
              <div className="rounded-xl border border-border bg-surface/35 p-5">
                <h3 className="mb-3 text-xs font-black uppercase text-text-primary">Provider & Evidence</h3>
                <div className="mb-4 flex flex-wrap gap-2">
                  {result.providers.length ? result.providers.map((provider) => <span key={provider} className="rounded-md border border-brand-cyan/20 bg-brand-cyan/5 px-2 py-1 text-[10px] font-mono text-brand-cyan">{provider}</span>) : <span className="text-xs text-text-secondary">Keine Provider-Evidence.</span>}
                </div>
                <div className="space-y-1 text-[10px] font-mono text-text-secondary"><div>Evidence IDs: {result.evidenceIds.length}</div><div>Feature: {result.featureVersion ?? '—'}</div><div>Scoring: {result.scoringVersion ?? '—'}</div></div>
              </div>
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
