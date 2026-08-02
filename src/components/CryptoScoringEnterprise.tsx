import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { assetRegistry } from '../lib/assetRegistry';

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
    reason: typeof integrity?.reason === 'string'
      ? integrity.reason
      : typeof body?.error === 'string'
        ? body.error
        : null,
  };
}

function buildTraditionalView(body: any, symbol: string, assetName: string, assetType: AssetType): EnterpriseViewModel {
  const provenance = Array.isArray(body?.provenance) ? body.provenance : [];
  const factorNames = strings(body?.usedFactors);
  const factors = factorNames.map((name) => {
    const entry = provenance.find((item: any) => item?.field === name || item?.factor === name);
    return { name, score: finite(entry?.value) ?? finite(entry?.normalizedValue) ?? 0 };
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
    coverage: factorNames.length > 0
      ? factorNames.length / Math.max(factorNames.length + strings(body?.missingFactors).length, 1)
      : null,
    dataQuality: body?.status === 'READY' ? 'verified' : null,
    featureVersion: typeof body?.lineage?.featureVersion === 'string' ? body.lineage.featureVersion : null,
    scoringVersion: typeof body?.lineage?.scoringVersion === 'string' ? body.lineage.scoringVersion : null,
    reason: typeof body?.reason === 'string' ? body.reason : null,
  };
}

export function CryptoScoringEnterprise({
  selectedSymbol,
  onSelectSymbol,
  timeframe,
  onChangeTimeframe,
}: CryptoScoringEnterpriseProps) {
  const symbol = selectedSymbol.toUpperCase().trim();
  const [result, setResult] = useState<EnterpriseViewModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const assets = useMemo(() => assetRegistry.getAssets(), []);
  const selectedAsset = useMemo(() => assets.find((asset) => asset.symbol === symbol), [assets, symbol]);
  const selectableAssets = useMemo(
    () => assets.filter((asset) => ['crypto', 'stock', 'forex', 'index'].includes(asset.type)).slice(0, 36),
    [assets],
  );

  async function loadEvaluation() {
    setLoading(true);
    setRequestError(null);
    setResult(null);

    try {
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

      setResult({
        status: 'SCORE_NOT_COMPUTABLE',
        symbol,
        assetName,
        assetType,
        score: null,
        rankScore: null,
        decision: null,
        decisionName: null,
        riskLevel: null,
        reasoning: [],
        alerts: [],
        factors: [],
        providers: [],
        evidenceIds: [],
        provenance: [],
        coverage: null,
        dataQuality: null,
        featureVersion: null,
        scoringVersion: null,
        reason: 'Für diese Assetklasse ist noch kein produktiver, provenance-backed Scoring-Contract freigeschaltet.',
      });
    } catch (error: any) {
      setRequestError(error?.message || 'Enterprise-Bewertung konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvaluation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const ready = result?.status === 'READY' && result.score !== null;
  const coveragePct = result?.coverage === null || result?.coverage === undefined
    ? null
    : Math.round(result.coverage * 100);

  return (
    <section className="bg-neutral-950/60 border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 blur-[110px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={symbol} size={48} />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-purple-500/15 text-purple-300 border border-purple-500/25 uppercase">
                Enterprise Multi-Factor Scoring
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest uppercase border ${
                ready
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                  : 'bg-amber-500/10 text-amber-200 border-amber-500/25'
              }`}>
                {result?.status ?? (loading ? 'LOADING' : 'DATA_UNAVAILABLE')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">
              {selectedAsset?.name ?? symbol} <span className="text-white/45">({symbol})</span>
            </h2>
            <p className="text-xs text-white/45 mt-1 font-mono">
              Verifizierte Provider-Evidence · Data Quality · Scoring Lineage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadEvaluation()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Neu prüfen
        </button>
      </div>

      <div className="relative z-10 space-y-3">
        <div className="flex flex-wrap gap-2">
          {selectableAssets.map((asset) => (
            <button
              type="button"
              key={asset.symbol}
              onClick={() => onSelectSymbol?.(asset.symbol)}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] font-mono font-bold transition-all ${
                asset.symbol === symbol
                  ? 'border-aif-gold-DEFAULT/60 bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT'
                  : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white'
              }`}
            >
              {asset.symbol}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => onChangeTimeframe?.(item.value)}
              className={`rounded-md px-2 py-1 text-[9px] font-mono border transition-all ${
                timeframe === item.value
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-white/5 text-white/35 hover:text-white/60'
              }`}
              title="Zeitrahmen bleibt UI-Kontext; der verifizierte Scoring-Contract erzeugt keine Browser-Skalierung."
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {requestError && (
        <div className="relative z-10 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-300" size={20} />
          <div>
            <p className="text-sm font-bold text-red-100">DATA_UNAVAILABLE</p>
            <p className="text-xs text-red-100/70 mt-1">{requestError}</p>
          </div>
        </div>
      )}

      {!requestError && !loading && result && !ready && (
        <div className="relative z-10 rounded-xl border border-amber-500/25 bg-amber-500/10 p-5 flex gap-3">
          <ShieldCheck className="shrink-0 text-amber-200" size={20} />
          <div>
            <p className="text-sm font-bold text-amber-100">{result.status}</p>
            <p className="text-xs text-amber-100/70 mt-1">
              {result.reason ?? 'Für dieses Asset ist derzeit keine ausreichend vollständige verifizierte Evidence verfügbar.'}
            </p>
          </div>
        </div>
      )}

      {ready && result && (
        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1 space-y-4">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/55 font-mono">Verifizierter Gesamt-Score</p>
                  <p className="mt-2 text-5xl font-black text-emerald-100 font-mono">{result.score?.toFixed(1)}</p>
                  <p className="mt-1 text-[10px] text-emerald-100/50 font-mono">0–100 · Evidence-gated</p>
                </div>
                <TrendingUp className="text-emerald-300/70" size={34} />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3"><span className="text-white/45">Decision</span><span className="text-white font-bold text-right">{result.decisionName ?? result.decision ?? '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-white/45">Risk Level</span><span className="text-white font-bold">{result.riskLevel ?? '—'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-white/45">Coverage</span><span className="text-white font-mono">{coveragePct === null ? '—' : `${coveragePct}%`}</span></div>
              <div className="flex justify-between gap-3"><span className="text-white/45">Data Quality</span><span className="text-white font-mono">{result.dataQuality ?? 'verified'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-white/45">Rank Score</span><span className="text-white font-mono">{result.rankScore?.toFixed(1) ?? '—'}</span></div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={15} className="text-aif-gold-DEFAULT" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Multi-Faktor Bewertung</h3>
              </div>
              {result.factors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.factors.map((factor) => (
                    <div key={factor.name} className="rounded-lg border border-white/5 bg-white/[0.025] px-3 py-2 flex items-center justify-between gap-3">
                      <span className="text-[10px] text-white/55 font-mono uppercase truncate">{factor.name.replaceAll('_', ' ')}</span>
                      <span className="text-xs text-white font-black font-mono">{factor.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40">Keine separaten Faktorwerte im aktuellen Contract ausgegeben.</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Database size={14} className="text-cyan-300" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Evidence & Provider</h3>
                </div>
                <div className="space-y-2 text-[10px] font-mono">
                  <p><span className="text-white/40">Provider:</span> <span className="text-white/80">{result.providers.join(', ') || '—'}</span></p>
                  <p><span className="text-white/40">Evidence IDs:</span> <span className="text-white/80">{result.evidenceIds.length}</span></p>
                  <p><span className="text-white/40">Feature:</span> <span className="text-white/80">{result.featureVersion ?? '—'}</span></p>
                  <p><span className="text-white/40">Scoring:</span> <span className="text-white/80">{result.scoringVersion ?? '—'}</span></p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Bewertungsbegründung</h3>
                </div>
                {result.reasoning.length > 0 ? (
                  <div className="space-y-1.5">
                    {result.reasoning.slice(0, 5).map((reason, index) => (
                      <p key={`${reason}-${index}`} className="text-[10px] leading-relaxed text-white/60">• {reason}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-white/40">Keine zusätzliche Begründung ausgegeben.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[10px] font-mono text-white/40">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck size={12} /> Keine synthetischen Browser-Fallbacks</span>
        <span className="inline-flex items-center gap-1.5"><Database size={12} /> Provider-Provenance erforderlich</span>
        <span className="inline-flex items-center gap-1.5"><Activity size={12} /> Multi-Provider Runtime aktiv</span>
      </div>
    </section>
  );
}
