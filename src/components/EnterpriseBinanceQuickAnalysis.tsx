import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Loader2, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

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
 * ADR-0038-Nachtrag: Enterprise-Scorer-Variante der Binance-Kurzanalyse. Im Unterschied zum
 * Landing-Widget (LandingBinanceQuickAnalysis.tsx) gibt es kein eigenes Symbol-Suchfeld - das
 * Symbol kommt ausschliesslich aus der bereits im Enterprise Scorer getroffenen Asset-Auswahl,
 * damit dieselbe Suche nicht zweimal bedient werden muss.
 */
export function EnterpriseBinanceQuickAnalysis({ symbol }: EnterpriseBinanceQuickAnalysisProps) {
  const [result, setResult] = useState<QuickAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upper = symbol.toUpperCase().trim();

  // Vorheriges Ergebnis gehoert zu einem anderen Asset - beim Assetwechsel nicht stehen lassen.
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [upper]);

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
    <section
      aria-labelledby="enterprise-binance-quick-analysis-title"
      className="mb-5 w-full rounded-2xl border border-cyan-400/20 bg-black/45 p-4 text-left shadow-[0_0_30px_rgba(13,221,221,0.08)] backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#0DDDDD]">
            <Activity className="h-3.5 w-3.5" />
            Live Market Intelligence
          </div>
          <h2 id="enterprise-binance-quick-analysis-title" className="mt-1 text-sm font-black text-white">
            AI Kurzanalyse mit Binance Spot · {upper || '—'}
          </h2>
          <p className="mt-1 text-[10px] leading-relaxed text-white/45">
            Reale öffentliche Spot-Marktdaten zum aktuell gewählten Asset. Keine Demo-Daten und keine Anlageberatung.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[8px] font-mono uppercase tracking-wider text-white/45">
            Binance
          </span>
          <button
            type="button"
            onClick={() => void runAnalysis()}
            disabled={loading || !upper}
            className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-xl bg-[#0DDDDD] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles size={12} /> Analysieren</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[10px] text-rose-300">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result && !error && (
        <div className="mt-4 min-h-16 rounded-xl border border-white/5 bg-black/25 p-4 text-[11px] leading-relaxed text-white/45">
          Die Kurzanalyse wird nur auf Anforderung ausgeführt und lädt dann reale Binance-Spot-Marktdaten zu {upper || 'diesem Asset'}.
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <span className="block text-[8px] font-mono uppercase tracking-wider text-white/35">Preis</span>
              <strong className="mt-1 block text-xs text-white">{formatPrice(result.marketData.lastPrice)} USDT</strong>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <span className="block text-[8px] font-mono uppercase tracking-wider text-white/35">24h</span>
              <strong className={`mt-1 flex items-center gap-1 text-xs ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <ChangeIcon className="h-3 w-3" />
                {change >= 0 ? '+' : ''}{change.toFixed(2)} %
              </strong>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <span className="block text-[8px] font-mono uppercase tracking-wider text-white/35">24h Range</span>
              <strong className="mt-1 block text-[10px] text-white/80">
                {formatPrice(result.marketData.low24h)} – {formatPrice(result.marketData.high24h)}
              </strong>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <span className="block text-[8px] font-mono uppercase tracking-wider text-white/35">Quote Vol.</span>
              <strong className="mt-1 block text-xs text-white">{formatCompact(result.marketData.quoteVolume24h)}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-aif-gold-DEFAULT/20 bg-aif-gold-DEFAULT/[0.04] p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-aif-gold-DEFAULT">CAPITAL-AI Einschätzung</span>
              <span className="text-[8px] font-mono text-white/30">{result.marketData.symbol}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-white/75">{result.analysis}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[8px] font-mono uppercase tracking-wider text-white/30">
            <span>Quelle: {result.marketData.source}</span>
            <span>{new Date(result.marketData.asOf).toLocaleString('de-DE')}</span>
          </div>
        </div>
      )}
    </section>
  );
}
