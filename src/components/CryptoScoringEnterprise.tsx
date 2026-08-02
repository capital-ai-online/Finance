import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Database, RefreshCw, Search, ShieldCheck, TrendingUp } from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { assetRegistry } from '../lib/assetRegistry';
import { EnterpriseAnalysisPanels } from './EnterpriseAnalysisPanels';

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

type EnterpriseViewModel = {
  status: string;
  symbol: string;
  assetName: string;
  assetType: AssetType;
  score: number | null;
  rankScore: number | null;
  decision: string | null;
  decisionName: string | null;
  riskLevel: string | null;
  reasoning: string[];
  alerts: string[];
  factors: Array<{ name: string; score: number }>;
  providers: string[];
  evidenceIds: string[];
  provenance: ProvenanceEntry[];
  coverage: number | null;
  dataQuality: string | null;
  featureVersion: string | null;
  scoringVersion: string | null;
  reason: string | null;
};

const TIMEFRAMES = [
  { value: '1m', label: '1 Min' },
  { value: '5m', label: '5 Min' },
  { value: '15m', label: '15 Min' },
  { value: '30m', label: '30 Min' },
  { value: '1std', label: '1 Std' },
  { value: '4std', label: '4 Std' },
  { value: '1 tag', label: '1 Tag' },
  { value: '1 woche', label: '1 Woche' },
];

const TYPE_LABEL: Record<AssetType, string> = {
  crypto: 'Krypto', stock: 'Aktien', forex: 'Forex', commodity: 'Rohstoffe', index: 'Indizes', bond: 'Anleihen',
};

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

function extractFactors(scores: unknown): Array<{ name: string; score: number }> {
  if (!scores || typeof scores !== 'object') return [];
  return Object.entries(scores as Record<string, unknown>)
    .map(([name, value]) => ({ name, score: finite(value) }))
    .filter((item): item is { name: string; score: number } => item.score !== null)
    .sort((a, b) => b.score - a.score);
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
    decision: typeof body?.decision === 'string' ? body.decision : null,
    decisionName: typeof body?.decisionName === 'string' ? body.decisionName : null,
    riskLevel: typeof body?.risk_level === 'string' ? body.risk_level : null,
    reasoning: normalizeReasoning(body?.reasoning),
    alerts: normalizeReasoning(body?.alerts),
    factors: extractFactors(body?.scores),
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
    decision: null,
    decisionName: null,
    riskLevel: null,
    reasoning: normalizeReasoning(body?.reasoning),
    alerts: [],
    factors,
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
    decision: null, decisionName: null, riskLevel: null, reasoning: [], alerts: [], factors: [], providers: [],
    evidenceIds: [], provenance: [], coverage: null, dataQuality: null, featureVersion: null, scoringVersion: null, reason,
  };
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

  return (
    <section className="bg-neutral-950/60 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[110px] rounded-full pointer-events-none" />

      <div className="relative z-20 flex flex-col xl:flex-row xl:items-start justify-between gap-5 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={symbol} size={48} />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-purple-500/15 text-purple-300 border border-purple-500/25 uppercase">Enterprise Multi-Asset Scorer</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest uppercase border ${ready ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-amber-500/10 text-amber-200 border-amber-500/25'}`}>{result?.status ?? (loading ? 'LOADING' : 'DATA_UNAVAILABLE')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">{selectedAsset?.name ?? symbol} <span className="text-white/45">({symbol})</span></h2>
            <p className="text-xs text-white/45 mt-1 font-mono">Alle Assetklassen durchsuchbar · Scoring bleibt evidence-gated</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadEvaluation()} disabled={loading} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-white/80 hover:bg-white/10 disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Neu prüfen</button>
      </div>

      <div className="relative z-30 rounded-2xl border border-aif-gold-DEFAULT/20 bg-black/35 p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-aif-gold-DEFAULT"><Search size={14} /> Asset-Suche</div>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              value={searchValue}
              onChange={(event) => { setSearchValue(event.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Symbol oder Asset suchen: BTC, AAPL, EURUSD, Gold, Bond …"
              className="w-full rounded-xl border border-white/10 bg-black/50 pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-aif-gold-DEFAULT/50"
            />
            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/15 bg-neutral-950 shadow-2xl z-50">
                {searchResults.length === 0 ? <div className="p-4 text-xs text-white/40">Kein Asset gefunden.</div> : searchResults.map((asset) => (
                  <button
                    type="button"
                    key={`${asset.type}-${asset.symbol}`}
                    onClick={() => { onSelectSymbol?.(asset.symbol); setSearchValue(''); setSearchOpen(false); }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 text-left"
                  >
                    <div className="flex items-center gap-3"><AssetLogo symbol={asset.symbol} size="xs" /><div><div className="text-xs font-bold text-white">{asset.symbol} · {asset.name}</div><div className="text-[10px] text-white/40">{TYPE_LABEL[asset.type as AssetType]}</div></div></div>
                    <span className="text-[9px] font-mono uppercase text-white/30">auswählen</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'crypto', 'stock', 'forex', 'index', 'commodity', 'bond'] as const).map((type) => (
              <button key={type} type="button" onClick={() => { setAssetTypeFilter(type); setSearchOpen(true); }} className={`rounded-lg border px-2.5 py-2 text-[10px] font-bold ${assetTypeFilter === type ? 'border-aif-gold-DEFAULT/50 bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT' : 'border-white/10 text-white/45 hover:text-white'}`}>{type === 'all' ? 'Alle' : TYPE_LABEL[type]}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-1.5">{TIMEFRAMES.map((item) => <button type="button" key={item.value} onClick={() => onChangeTimeframe?.(item.value)} className={`rounded-md px-2 py-1 text-[9px] font-mono border transition-all ${timeframe === item.value ? 'border-white/30 bg-white/10 text-white' : 'border-white/5 text-white/35 hover:text-white/60'}`} title="Zeitrahmen ist Analysekontext und verändert keinen kanonischen Score im Browser.">{item.label}</button>)}</div>

      {requestError && <div className="relative z-10 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4"><AlertTriangle className="mt-0.5 shrink-0 text-red-300" size={20} /><div><p className="text-sm font-bold text-red-100">DATA_UNAVAILABLE</p><p className="text-xs text-red-100/70 mt-1">{requestError}</p></div></div>}

      {!requestError && !loading && result && !ready && <div className="relative z-10 rounded-xl border border-amber-500/25 bg-amber-500/10 p-5 flex gap-3"><ShieldCheck className="shrink-0 text-amber-200" size={20} /><div><p className="text-sm font-bold text-amber-100">{result.status}</p><p className="text-xs text-amber-100/70 mt-1">{result.reason ?? 'Für dieses Asset ist derzeit keine ausreichend vollständige verifizierte Evidence verfügbar.'}</p></div></div>}

      {result && (
        <div className="relative z-10 space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="space-y-4">
              <div className={`rounded-xl border p-5 ${ready ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-white/10 bg-black/25'}`}>
                <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-mono">Kanonischer Gesamt-Score</p><p className="mt-2 text-5xl font-black text-white font-mono">{result.score?.toFixed(1) ?? '—'}</p><p className="mt-1 text-[10px] text-white/40 font-mono">Read-only · Backend Contract</p></div><TrendingUp className="text-emerald-300/70" size={34} /></div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs space-y-2"><div><span className="text-white/40">Coverage:</span> <span className="text-white">{coveragePct === null ? '—' : `${coveragePct}%`}</span></div><div><span className="text-white/40">Data Quality:</span> <span className="text-white">{result.dataQuality ?? '—'}</span></div><div><span className="text-white/40">Decision:</span> <span className="text-white">{result.decisionName ?? result.decision ?? '—'}</span></div><div><span className="text-white/40">Risk:</span> <span className="text-white">{result.riskLevel ?? '—'}</span></div></div>
            </div>

            <div className="xl:col-span-2 rounded-xl border border-white/10 bg-black/25 p-5">
              <div className="flex items-center gap-2 mb-4 text-sm font-black uppercase text-white"><Database size={15} className="text-cyan-300" /> Multi-Faktor Bewertung</div>
              {result.factors.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{result.factors.slice(0, 12).map((factor) => <div key={factor.name} className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-mono text-white/55 break-all">{factor.name}</span><span className="text-xs font-bold text-white">{factor.score.toFixed(2)}</span></div><div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-white/25" style={{ width: `${Math.max(2, Math.min(100, factor.score <= 1 ? factor.score * 100 : factor.score))}%` }} /></div></div>)}</div> : <div className="text-xs text-white/40">Keine verifizierten Faktorwerte verfügbar.</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-xl border border-white/10 bg-black/25 p-5"><h3 className="text-xs font-black uppercase text-white mb-3">Reasoning</h3>{result.reasoning.length ? <div className="space-y-2">{result.reasoning.slice(0, 8).map((text, index) => <div key={index} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-white/60">{text}</div>)}</div> : <p className="text-xs text-white/40">Keine verifizierte Begründung verfügbar.</p>}</div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-5"><h3 className="text-xs font-black uppercase text-white mb-3">Provider & Evidence</h3><div className="flex flex-wrap gap-2 mb-4">{result.providers.length ? result.providers.map((provider) => <span key={provider} className="rounded-md border border-cyan-500/15 bg-cyan-500/5 px-2 py-1 text-[10px] font-mono text-cyan-200">{provider}</span>) : <span className="text-xs text-white/40">Keine Provider-Evidence.</span>}</div><div className="text-[10px] font-mono text-white/35 space-y-1"><div>Evidence IDs: {result.evidenceIds.length}</div><div>Feature: {result.featureVersion ?? '—'}</div><div>Scoring: {result.scoringVersion ?? '—'}</div></div></div>
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
        </div>
      )}
    </section>
  );
}
