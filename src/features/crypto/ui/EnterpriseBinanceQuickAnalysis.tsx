import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Loader2, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { AuthorityBadge, FreshnessBadge, ResearchOnlyBanner } from '../../../shared/ui';
import { EnterpriseAsset4hChart } from './EnterpriseAsset4hChart';
import { useEnterpriseScorerPresentationMode } from './EnterpriseScorerPresentationContext';

type QuickAnalysisResponse = {
  marketData: {
    source: string;
    symbol: string;
    lastPrice: number;
    change24hPercent: number;
    high24h: number;
    low24h: number;
    quoteVolume24h: number;
    asOf: string;
  };
  analysis: string;
  provider: string;
};

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1000) return value.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  if (value >= 1) return value.toLocaleString('de-DE', { maximumFractionDigits: 4 });
  return value.toLocaleString('de-DE', { maximumFractionDigits: 8 });
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('de-DE', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

export interface EnterpriseBinanceQuickAnalysisProps {
  /** Aktuell im Enterprise Scorer ausgewaehltes Asset-Symbol (z.B. BTC). */
  symbol: string;
}

/**
 * Canonical crypto feature-slice implementation of the Enterprise Binance quick analysis.
 * The selected symbol comes only from the Enterprise Scorer. The verified 4h chart below the
 * analysis consumes MarketDataHistoryGateway and is deliberately separated from scoring.
 *
 * ADR-0038 keeps this analysis endpoint in the authenticated Enterprise context. When the same
 * canonical scorer is projected as the public landing preview, the presentation context omits
 * this authenticated sub-surface rather than changing or duplicating the endpoint contract.
 */
export function EnterpriseBinanceQuickAnalysis({ symbol }: EnterpriseBinanceQuickAnalysisProps) {
  const presentationMode = useEnterpriseScorerPresentationMode();
  const [result, setResult] = useState<QuickAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upper = symbol.toUpperCase().trim();

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [upper]);

  if (presentationMode === 'public-preview') {
    return null;
  }

  const runAnalysis = async () => {
    if (!upper) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/registry/assets/${encodeURIComponent(upper)}/quick-analysis`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Kurzanalyse konnte nicht geladen werden.');
      }
      setResult(payload as QuickAnalysisResponse);
    } catch (err: any) {
      setResult(null);
      setError(err?.message || 'Kurzanalyse konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  const change = result?.marketData.change24hPercent ?? 0;
  const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-4">
      <section
        aria-labelledby="enterprise-binance-quick-analysis-title"
        className="w-full rounded-2xl border border-brand-cyan/20 bg-surface/45 p-4 text-left backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-cyan">
              <Activity className="h-3.5 w-3.5" />
              Live Market Intelligence
            </div>
            <h2 id="enterprise-binance-quick-analysis-title" className="mt-1 text-sm font-black text-text-primary">
              AI Kurzanalyse mit Binance Spot · {upper || '—'}
            </h2>
            <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">
              Reale öffentliche Spot-Marktdaten zum aktuell gewählten Asset. Keine Demo-Daten und keine Anlageberatung.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <AuthorityBadge authority="RESEARCH" label="AI Research" />
            <AuthorityBadge authority="MARKET_DATA" label="Spot Input" />
            <span className="rounded-full border border-border bg-surface px-2 py-1 text-[8px] font-mono uppercase tracking-wider text-text-secondary">
              Binance
            </span>
            <button
              type="button"
              onClick={() => void runAnalysis()}
              disabled={loading || !upper}
              className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-xl bg-brand-cyan px-3 py-2 text-[10px] font-black uppercase tracking-wider text-background transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles size={12} /> Analysieren</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-status-reject/20 bg-status-reject/10 p-3 text-[10px] text-status-reject">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!result && !error && (
          <div className="mt-4 min-h-16 rounded-xl border border-border bg-background/25 p-4 text-[11px] leading-relaxed text-text-secondary">
            Die Kurzanalyse wird nur auf Anforderung ausgeführt und lädt dann reale Binance-Spot-Marktdaten zu {upper || 'diesem Asset'}.
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <AuthorityBadge authority="MARKET_DATA" />
              <FreshnessBadge observedAt={result.marketData.asOf} label="Spot-Zeitstempel" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface/60 p-2.5">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-text-secondary">Preis</span>
                <strong className="mt-1 block text-xs text-text-primary">{formatPrice(result.marketData.lastPrice)} USDT</strong>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-2.5">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-text-secondary">24h</span>
                <strong className={`mt-1 flex items-center gap-1 text-xs ${change >= 0 ? 'text-score-best' : 'text-score-worst'}`}>
                  <ChangeIcon className="h-3 w-3" />
                  {change >= 0 ? '+' : ''}{change.toFixed(2)} %
                </strong>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-2.5">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-text-secondary">24h Range</span>
                <strong className="mt-1 block text-[10px] text-text-primary">
                  {formatPrice(result.marketData.low24h)} – {formatPrice(result.marketData.high24h)}
                </strong>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-2.5">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-text-secondary">Quote Vol.</span>
                <strong className="mt-1 block text-xs text-text-primary">{formatCompact(result.marketData.quoteVolume24h)}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/[0.04] p-3">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-accent">CAPITAL-AI Einschätzung</span>
                <div className="flex flex-wrap items-center gap-2">
                  <AuthorityBadge authority="RESEARCH" label="Research Output" />
                  <span className="text-[8px] font-mono text-text-secondary">{result.marketData.symbol}</span>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-text-primary/75">{result.analysis}</p>
              <ResearchOnlyBanner modelLabel={result.provider} className="mt-3" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[8px] font-mono uppercase tracking-wider text-text-secondary">
              <span>Quelle: {result.marketData.source}</span>
              <FreshnessBadge observedAt={result.marketData.asOf} label="As of" />
            </div>
          </div>
        )}
      </section>

      <EnterpriseAsset4hChart symbol={upper} />
    </div>
  );
}
