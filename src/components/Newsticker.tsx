import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Info, Newspaper, ShieldCheck } from 'lucide-react';
import { AssetLogo } from './AssetLogo';

interface NewstickerProps {
  selectedSymbol: string;
  timeframe: string;
}

interface CatalogAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
}

interface NewsItem {
  id?: string;
  headline?: string;
  title?: string;
  summary?: string;
  description?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  time?: string;
  publishedAt?: string;
  source?: string;
}

interface EvidenceState {
  score: number | null;
  quote: number | null;
  quoteUnit: string | null;
  providers: string[];
  evidenceIds: string[];
  reason: string | null;
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function Newsticker({ selectedSymbol, timeframe }: NewstickerProps) {
  const [asset, setAsset] = useState<CatalogAsset | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [evidence, setEvidence] = useState<EvidenceState>({ score: null, quote: null, quoteUnit: null, providers: [], evidenceIds: [], reason: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const symbol = selectedSymbol.toUpperCase();
      try {
        const catalogResponse = await fetch('/api/registry/assets');
        const catalog = catalogResponse.ok ? await catalogResponse.json() : [];
        const found: CatalogAsset | null = Array.isArray(catalog)
          ? catalog.find((entry: CatalogAsset) => entry?.symbol?.toUpperCase() === symbol) ?? null
          : null;
        if (cancelled) return;
        setAsset(found ?? { symbol, name: symbol, type: 'crypto' });

        const current = found ?? { symbol, name: symbol, type: 'crypto' as const };
        let score: number | null = null;
        let quote: number | null = null;
        let quoteUnit: string | null = null;
        let providers: string[] = [];
        let evidenceIds: string[] = [];
        let reason: string | null = null;

        if (current.type === 'crypto') {
          const [scoreResponse, quoteResponse] = await Promise.all([
            fetch(`/api/crypto/score?symbol=${encodeURIComponent(symbol)}`),
            fetch(`/api/crypto/price-consensus/${encodeURIComponent(symbol)}`),
          ]);
          const scoreBody = await scoreResponse.json().catch(() => ({}));
          const quoteBody = await quoteResponse.json().catch(() => ({}));
          score = scoreBody?.status === 'READY' ? finite(scoreBody?.score) : null;
          quote = quoteBody?.status === 'CONSENSUS' ? finite(quoteBody?.canonicalValue) : null;
          quoteUnit = typeof quoteBody?.unit === 'string' ? quoteBody.unit : 'USD';
          providers = Array.isArray(scoreBody?.providers) ? scoreBody.providers : [];
          evidenceIds = Array.isArray(scoreBody?.evidenceIds) ? scoreBody.evidenceIds : [];
          reason = scoreBody?.status === 'READY' ? null : (scoreBody?.reason ?? 'Score-Evidence nicht verfügbar.');
        } else if (current.type === 'stock' || current.type === 'forex' || current.type === 'index') {
          const [contextResponse, quoteResponse] = await Promise.all([
            fetch(`/api/registry/assets/${encodeURIComponent(symbol)}/verified-context`),
            fetch(`/api/registry/assets/${encodeURIComponent(symbol)}/verified-quote`),
          ]);
          const contextBody = await contextResponse.json().catch(() => ({}));
          const quoteBody = await quoteResponse.json().catch(() => ({}));
          const scoreBody = contextBody?.score ?? contextBody;
          score = scoreBody?.status === 'READY' ? finite(scoreBody?.score) : null;
          quote = quoteBody?.status === 'READY' ? finite(quoteBody?.price) : null;
          quoteUnit = typeof quoteBody?.currency === 'string' ? quoteBody.currency : null;
          providers = Array.isArray(scoreBody?.providers) ? scoreBody.providers : [];
          evidenceIds = Array.isArray(scoreBody?.evidenceIds) ? scoreBody.evidenceIds : [];
          reason = scoreBody?.status === 'READY' ? null : (scoreBody?.reason ?? 'Score-Evidence nicht verfügbar.');
        } else {
          reason = 'Für diese Assetklasse ist noch kein freigegebener kanonischer Scoring-/Quote-Contract aktiv.';
        }

        if (!cancelled) setEvidence({ score, quote, quoteUnit, providers, evidenceIds, reason });

        const newsResponse = await fetch(`/api/news?symbol=${encodeURIComponent(symbol)}`);
        const newsBody = newsResponse.ok ? await newsResponse.json() : [];
        if (!cancelled) setNews(Array.isArray(newsBody) ? newsBody : Array.isArray(newsBody?.items) ? newsBody.items : []);
      } catch (error) {
        if (!cancelled) setEvidence((current) => ({ ...current, reason: error instanceof Error ? error.message : String(error) }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [selectedSymbol, timeframe]);

  const qualitativeSignal = useMemo(() => {
    if (evidence.score === null) return 'NICHT BERECHENBAR';
    if (evidence.score >= 90) return 'STRONG BUY';
    if (evidence.score >= 75) return 'BUY';
    if (evidence.score >= 55) return 'HOLD';
    return 'UNDERWEIGHT';
  }, [evidence.score]);

  if (loading) {
    return <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-[420px] flex items-center justify-center"><Activity className="w-8 h-8 text-aif-gold-DEFAULT animate-spin" /></div>;
  }

  const currentAsset = asset ?? { symbol: selectedSymbol.toUpperCase(), name: selectedSymbol.toUpperCase(), type: 'crypto' as const };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col h-full min-h-[460px]">
      <div className="flex justify-between items-start border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT"><Newspaper className="w-5 h-5" /></div>
          <div>
            <h3 className="text-base font-bold text-white">Realtime Intelligence Feed</h3>
            <p className="text-xs text-white/50 mt-1 flex items-center gap-1.5"><AssetLogo symbol={currentAsset.symbol} size="xs" /> {currentAsset.symbol} · {currentAsset.name} · {timeframe}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-white/40 uppercase">Verifizierte Quote</div>
          <div className="text-lg font-mono font-bold text-white">{evidence.quote === null ? '—' : `${evidence.quote.toLocaleString('de-DE', { maximumFractionDigits: 8 })} ${evidence.quoteUnit ?? ''}`}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10 mt-4">
        <div><span className="text-[10px] text-white/40 uppercase block mb-1">Qualitatives Signal</span><div className="text-sm font-black text-white">{qualitativeSignal}</div></div>
        <div><span className="text-[10px] text-white/40 uppercase block mb-1">Canonical Score</span><div className="text-2xl font-black font-mono text-white">{evidence.score === null ? '—' : evidence.score.toFixed(1)}</div></div>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 text-[10px] text-white/55">
        <div className="flex items-center gap-2 text-emerald-300"><ShieldCheck className="w-3.5 h-3.5" /><span>Evidence-backed · keine synthetischen Kurs-, Volumen- oder Momentumwerte</span></div>
        <div className="mt-1">Provider: {evidence.providers.length ? evidence.providers.join(', ') : '—'} · Evidence IDs: {evidence.evidenceIds.length}</div>
      </div>

      {evidence.reason && <div className="mt-3 flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200"><Info className="w-4 h-4 shrink-0" />{evidence.reason}</div>}

      <div className="space-y-3 pt-4 flex-1">
        <span className="text-[10px] text-white/40 uppercase tracking-widest">Verifizierte Nachrichten</span>
        {news.length === 0 ? (
          <div className="rounded-lg border border-white/5 bg-black/30 p-4 text-[11px] text-white/40">Keine verifizierten Nachrichten für dieses Asset verfügbar. Es werden keine System-Schlagzeilen erfunden.</div>
        ) : news.slice(0, 3).map((item, index) => (
          <div key={item.id ?? `${index}-${item.title ?? item.headline ?? 'news'}`} className="bg-black/40 border border-white/5 rounded-lg p-3">
            <h4 className="text-xs font-bold text-white">{item.headline ?? item.title ?? 'Nachricht'}</h4>
            <p className="text-[11px] text-white/55 mt-1">{item.summary ?? item.description ?? ''}</p>
            <div className="mt-2 text-[9px] text-white/30 font-mono">{item.source ?? 'News Provider'} · {item.time ?? item.publishedAt ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
