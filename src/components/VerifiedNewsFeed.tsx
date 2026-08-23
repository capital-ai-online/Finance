import React, { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, Newspaper, RefreshCw, ShieldCheck } from 'lucide-react';

export interface VerifiedNewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentBasis: 'heuristic';
  time: string;
  source: string;
  evidenceRef: string;
  publishedAt: string;
  url: string;
  provider?: string;
  change24hPct?: number | null;
}

interface VerifiedNewsFeedProps {
  symbol?: string;
  source?: string;
  limit?: number;
  title?: string;
  compact?: boolean;
  className?: string;
}

function sentimentLabel(sentiment: VerifiedNewsItem['sentiment']): string {
  if (sentiment === 'positive') return 'Positiv · Heuristik';
  if (sentiment === 'negative') return 'Negativ · Heuristik';
  return 'Neutral · Heuristik';
}

function formatChange24h(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function VerifiedNewsFeed({
  symbol = '',
  source = '',
  limit = 7,
  title = 'AI Newsfeed Viewer',
  compact = false,
  className = '',
}: VerifiedNewsFeedProps) {
  const [items, setItems] = useState<VerifiedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setReason(null);
      try {
        const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(20, limit))) });
        if (symbol.trim()) params.set('symbol', symbol.trim().toUpperCase());
        if (source.trim()) params.set('source', source.trim().toLowerCase());
        const response = await fetch(`/api/news?${params.toString()}`, { signal: controller.signal });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.reason ?? `News-Evidence nicht verfügbar (HTTP ${response.status}).`);
        }
        if (!Array.isArray(body)) throw new Error('News-Evidence hat ein unerwartetes Schema.');
        if (!cancelled) {
          setItems(body as VerifiedNewsItem[]);
          const providerHeader = response.headers.get('x-capital-ai-news-provider');
          setActiveProvider(providerHeader ?? (body[0]?.provider ?? null));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!cancelled) {
          setItems([]);
          setReason(error instanceof Error ? error.message : String(error));
          setActiveProvider(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [symbol, source, limit, reloadKey]);

  return (
    <section className={`rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md ${compact ? 'p-4' : 'p-5 sm:p-6'} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <Newspaper className="h-5 w-5 text-aif-gold-DEFAULT" />
            <h3 className="font-bold">{title}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
            <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck className="h-3 w-3" /> Verifizierte externe Artikel</span>
            <span>· Open-Source REST · {activeProvider === 'free-crypto-news' ? 'Free Crypto News' : activeProvider === 'gdelt' ? 'GDELT' : 'News Evidence'}</span>
            {symbol && <span>· {symbol.toUpperCase()}</span>}
            {source && <span>· Quelle: {source}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey(value => value + 1)}
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/55 transition-colors hover:text-white"
          aria-label="Nachrichten aktualisieren"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {reason && (
        <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{reason}</span>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {loading && items.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs text-white/40">News-Evidence wird geladen …</div>
        )}
        {!loading && !reason && items.length === 0 && (
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs text-white/40">Keine verifizierten Artikel verfügbar. Es werden keine Ersatz-Schlagzeilen erzeugt.</div>
        )}
        {items.map(item => {
          const changeLabel = formatChange24h(item.change24hPct);
          return (
            <article key={item.id} className="rounded-xl border border-white/7 bg-white/[0.035] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wide text-white/35">{item.source} · {item.time}</div>
                  <h4 className="mt-1 text-sm font-semibold leading-snug text-white">{item.headline}</h4>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg border border-white/10 p-2 text-white/45 hover:text-aif-gold-DEFAULT"
                  aria-label="Originalquelle öffnen"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              {!compact && item.summary && <p className="mt-2 text-xs leading-relaxed text-white/55">{item.summary}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] text-white/35">
                <span className="rounded-full border border-white/10 px-2 py-1">{sentimentLabel(item.sentiment)}</span>
                {changeLabel && (
                  <span
                    className={`rounded-md border px-2 py-0.5 font-mono text-[10px] ${
                      (item.change24hPct ?? 0) > 0
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : (item.change24hPct ?? 0) < 0
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : 'border-white/10 text-white/50'
                    }`}
                  >
                    24h {changeLabel}
                  </span>
                )}
                <span className="truncate font-mono" title={item.evidenceRef}>Evidence: {item.evidenceRef}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
