import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { assetRegistry } from '../lib/assetRegistry';
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
  classification?: {
    category_main?: string;
    category_sub?: string;
  };
  error?: string;
};

/**
 * Evidence-gated scoring UI.
 *
 * Financial values are rendered only when the server-side scoring contract returns verified
 * evidence. Missing or insufficient data stays explicit; the browser does not manufacture
 * score, expected-return, volatility or risk fallbacks.
 */
export function CryptoEnterpriseEvaluator({
  selectedSymbol,
  onSelectSymbol,
}: CryptoEnterpriseEvaluatorProps) {
  const symbol = selectedSymbol.toUpperCase().trim();
  const [result, setResult] = useState<ScoreApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const assets = useMemo(
    () => assetRegistry.getAssets().filter((asset) => asset.type === 'crypto'),
    [],
  );
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === symbol),
    [assets, symbol],
  );

  async function loadScore() {
    setLoading(true);
    setRequestError(null);
    setResult(null);
    try {
      const response = await fetch('/api/crypto/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          asset_name: selectedAsset?.name ?? symbol,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        throw new Error('Ungültige Antwort des Scoring-Endpunkts.');
      }
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

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={symbol} size={40} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Enterprise Asset Scoring</p>
            <h2 className="text-xl font-semibold text-white">{selectedAsset?.name ?? symbol} ({symbol})</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadScore()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 disabled:opacity-50"
        >
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Neu prüfen
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {assets.slice(0, 20).map((asset) => (
          <button
            type="button"
            key={asset.symbol}
            onClick={() => onSelectSymbol(asset.symbol)}
            className={`rounded-md border px-2.5 py-1.5 text-xs ${
              asset.symbol === symbol
                ? 'border-white/40 bg-white/10 text-white'
                : 'border-white/10 text-white/60 hover:border-white/25'
            }`}
          >
            {asset.symbol}
          </button>
        ))}
      </div>

      {requestError && (
        <div className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">DATA_UNAVAILABLE</p>
            <p className="mt-1 text-red-100/80">{requestError}</p>
          </div>
        </div>
      )}

      {!requestError && !loading && !isReady && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
            <div>
              <p className="font-semibold text-amber-100">
                {result?.status ?? 'SCORE_NOT_COMPUTABLE'}
              </p>
              <p className="mt-1 text-sm text-amber-100/80">
                Für dieses Asset liegt derzeit keine ausreichend vollständige und nachweisbare Datenbasis vor.
                CAPITAL-AI zeigt deshalb bewusst keinen Score, keine erwartete Rendite, keine Volatilität und
                keine Risikoklasse als Ersatzwert an.
              </p>
              {integrity?.reason && (
                <p className="mt-3 text-xs text-amber-100/70">Grund: {integrity.reason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isReady && result && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/60">Verifizierter Score</p>
            <p className="mt-2 text-4xl font-semibold text-emerald-100">{result.final_score?.toFixed(1)}</p>
            <p className="mt-1 text-xs text-emerald-100/60">0–100 · Status READY</p>
          </div>
          <div className="rounded-xl border border-white/10 p-5 text-sm text-white/70">
            <p><span className="text-white/45">Coverage:</span> {Math.round((integrity?.coverage ?? 0) * 100)}%</p>
            <p><span className="text-white/45">Data Quality:</span> {integrity?.dataQuality ?? 'unknown'}</p>
            <p><span className="text-white/45">Feature Version:</span> {integrity?.featureVersion ?? '—'}</p>
            <p><span className="text-white/45">Scoring Version:</span> {integrity?.scoringVersion ?? '—'}</p>
            <p><span className="text-white/45">Provider:</span> {integrity?.providers?.join(', ') || '—'}</p>
            <p><span className="text-white/45">Evidence:</span> {integrity?.evidence?.length ?? 0}</p>
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed text-white/40">
        Datenintegritätsmodus: Verifizierte Server-Provider und Provenance-Contracts werden aktiv genutzt.
        Erweiterte quantitative Ausgaben werden nur dort freigeschaltet, wo der jeweilige Datenvertrag
        ausreichend aktuelle und nachvollziehbare Evidence bestätigt.
      </p>
    </section>
  );
}
