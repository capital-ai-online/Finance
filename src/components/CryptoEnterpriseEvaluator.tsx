import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Activity, Database, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { assetRegistry } from '../lib/assetRegistry';
import { EnterpriseAnalysisPanels } from './EnterpriseAnalysisPanels';
import type { CanonicalScoreResult, ScoringIntegrityMetadata } from '../types/scoringIntegrity';

interface CryptoEnterpriseEvaluatorProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  subscriptionTier?: string;
  onUpgradeClick?: () => void;
}

type ScoreApiResponse = CanonicalScoreResult & {
  symbol?: string;
  asset_name?: string;
  classification?: { category_main?: string; category_sub?: string };
  error?: string;
  decision?: string;
  decisionName?: string;
  risk_level?: string;
  reasoning?: string[] | string;
  scores?: Record<string, number>;
  provenance?: Array<{ provider?: string; field?: string; evidenceId?: string }>;
};

function reasoningList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

export function CryptoEnterpriseEvaluator({ selectedSymbol, onSelectSymbol }: CryptoEnterpriseEvaluatorProps) {
  const symbol = selectedSymbol.toUpperCase().trim();
  const [result, setResult] = useState<ScoreApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const assets = useMemo(() => assetRegistry.getAssets().filter((asset) => asset.type === 'crypto'), []);
  const selectedAsset = useMemo(() => assets.find((asset) => asset.symbol === symbol), [assets, symbol]);

  async function loadScore() {
    setLoading(true);
    setRequestError(null);
    setResult(null);
    try {
      const response = await fetch('/api/crypto/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, asset_name: selectedAsset?.name ?? symbol }),
      });
      const body = await response.json().catch(() => null);
      if (!body || typeof body !== 'object') throw new Error('Ungültige Antwort des Scoring-Endpunkts.');
      setResult(body as ScoreApiResponse);
    } catch (error: any) {
      setRequestError(error?.message || 'Scoring-Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const isReady = result?.status === 'READY' && typeof result.final_score === 'number';
  const integrity: ScoringIntegrityMetadata | undefined = result?.integrity;
  const providers = integrity?.providers ?? [];
  const evidenceIds = Array.isArray(integrity?.evidence)
    ? integrity.evidence.map((item: any) => item?.evidenceId).filter((item: unknown): item is string => typeof item === 'string')
    : [];
  const reasoning = reasoningList(result?.reasoning);
  const score = typeof result?.final_score === 'number' ? result.final_score : null;
  const circumference = 2 * Math.PI * 48;
  const dash = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100 * circumference;

  return (
    <section className="space-y-6 rounded-2xl border border-white/10 bg-black/20 p-5 overflow-hidden relative">
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={symbol} size={40} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Enterprise Evaluation Cockpit</p>
            <h2 className="text-xl font-semibold text-white">{selectedAsset?.name ?? symbol} ({symbol})</h2>
            <p className="text-[10px] text-white/35 mt-1">Grafische Analyseebene · read-only gegenüber kanonischem Scoring</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadScore()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 disabled:opacity-50">
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Neu prüfen
        </button>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
        {assets.map((asset) => (
          <button type="button" key={asset.symbol} onClick={() => onSelectSymbol(asset.symbol)} className={`rounded-md border px-2.5 py-1.5 text-xs ${asset.symbol === symbol ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 text-white/60 hover:border-white/25'}`}>{asset.symbol}</button>
        ))}
      </div>

      {requestError && <div className="relative z-10 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">DATA_UNAVAILABLE</p><p className="mt-1 text-red-100/80">{requestError}</p></div></div>}

      {!requestError && !loading && !isReady && <div className="relative z-10 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" /><div><p className="font-semibold text-amber-100">{result?.status ?? 'SCORE_NOT_COMPUTABLE'}</p><p className="mt-1 text-sm text-amber-100/80">Für dieses Asset liegt derzeit keine ausreichend vollständige und nachweisbare Datenbasis vor. Fehlende Finanzwerte bleiben bewusst nicht verfügbar.</p>{integrity?.reason && <p className="mt-3 text-xs text-amber-100/70">Grund: {integrity.reason}</p>}</div></div></div>}

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex items-center justify-center min-h-64">
          <div className="relative w-44 h-44">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} className="text-emerald-400" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Activity size={18} className="text-emerald-300 mb-1" />
              <div className="text-4xl font-black font-mono text-white">{score?.toFixed(1) ?? '—'}</div>
              <div className="text-[9px] uppercase tracking-widest text-white/35">Canonical Score</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-black/25 p-5"><div className="flex items-center gap-2 text-xs uppercase font-black text-cyan-300"><Database size={14} /> Evidence Coverage</div><div className="mt-3 text-3xl font-black text-white">{Math.round((integrity?.coverage ?? 0) * 100)}%</div><p className="mt-2 text-[10px] text-white/40">{providers.length} Provider · {evidenceIds.length} Evidence IDs</p></div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-5"><div className="flex items-center gap-2 text-xs uppercase font-black text-purple-300"><Sparkles size={14} /> Decision</div><div className="mt-3 text-xl font-black text-white">{result?.decisionName ?? result?.decision ?? '—'}</div><p className="mt-2 text-[10px] text-white/40">Risk: {result?.risk_level ?? '—'}</p></div>
          <div className="sm:col-span-2 rounded-xl border border-white/10 bg-black/25 p-5"><div className="text-xs uppercase font-black text-white mb-3">Scoring Lineage</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-white/50"><div>Data Quality: <span className="text-white">{integrity?.dataQuality ?? '—'}</span></div><div>Feature: <span className="text-white">{integrity?.featureVersion ?? '—'}</span></div><div>Scoring: <span className="text-white">{integrity?.scoringVersion ?? '—'}</span></div><div>Status: <span className="text-white">{result?.status ?? '—'}</span></div></div></div>
        </div>
      </div>

      <div className="relative z-10">
        <EnterpriseAnalysisPanels
          symbol={symbol}
          assetType="crypto"
          canonicalScore={score}
          coverage={integrity?.coverage ?? null}
          providers={providers}
          evidenceIds={evidenceIds}
          reasoning={reasoning}
          decision={result?.decisionName ?? result?.decision ?? null}
          riskLevel={result?.risk_level ?? null}
        />
      </div>

      <p className="relative z-10 text-xs leading-relaxed text-white/40">Verifizierte Server-Provider und Provenance-Contracts sind aktiv. Ordertiefe, Arbitrage, Pattern, Setup, Intelligent Feed und AI-Kurzanalyse bleiben strikt read-only und verändern weder den kanonischen Score noch Ranking oder Scoring-Lineage.</p>
    </section>
  );
}
