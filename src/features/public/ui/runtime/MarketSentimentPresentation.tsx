import React, { useMemo, useState } from 'react';
import { Activity, BarChart3, Database, ShieldCheck, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

export type MarketSentimentCategory = 'ALLE' | 'KRYPTO' | 'AKTIEN' | 'INDIZIES' | 'ROHSTOFFE' | 'FOREX';
export type MarketSentimentStatus = 'READY' | 'NOT_COMPUTABLE' | 'SOURCE_UNAVAILABLE' | 'STALE';

export interface MarketSentimentHistoryPoint {
  observedAt: string;
  score: number;
  label?: string;
}

export interface MarketSentimentDriver {
  title: string;
  description: string;
  direction?: 'up' | 'down' | 'neutral';
}

export interface MarketSentimentProjection {
  category: MarketSentimentCategory;
  status: MarketSentimentStatus;
  score: number | null;
  label: string | null;
  summary: string | null;
  history30d: MarketSentimentHistoryPoint[];
  drivers: MarketSentimentDriver[];
  modelVersion: string | null;
  evidenceIds: string[];
  observedAt: string | null;
}

interface MarketSentimentPresentationProps {
  projections?: Partial<Record<MarketSentimentCategory, MarketSentimentProjection>>;
  onExploreMarkets?: () => void;
}

const CATEGORIES: Array<{ id: MarketSentimentCategory; label: string }> = [
  { id: 'ALLE', label: 'Gesamtmarkt' },
  { id: 'KRYPTO', label: 'Krypto' },
  { id: 'AKTIEN', label: 'Aktien' },
  { id: 'INDIZIES', label: 'Indizes' },
  { id: 'ROHSTOFFE', label: 'Rohstoffe' },
  { id: 'FOREX', label: 'Forex' },
];

function clampScore(score: number | null): number | null {
  if (score === null || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

function formatObservedAt(value: string | null): string {
  if (!value || Number.isNaN(Date.parse(value))) return 'Keine FINTECH-Evidence verfügbar';
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function MarketSentimentPresentation({ projections = {}, onExploreMarkets }: MarketSentimentPresentationProps) {
  const [selectedCategory, setSelectedCategory] = useState<MarketSentimentCategory>('ALLE');
  const projection = projections[selectedCategory] ?? null;
  const score = clampScore(projection?.score ?? null);
  const history = useMemo(() => projection?.history30d ?? [], [projection]);
  const ready = projection?.status === 'READY' && score !== null;
  const needleRotation = ready ? -90 + (score ?? 0) * 1.8 : -90;

  return (
    <section
      id="market-sentiment-section"
      className="px-5 py-5"
      data-fintech-sentiment-consumer="crypto-sentiment-research/0.1.0"
      data-local-scoring="disabled"
    >
      <div className="overflow-hidden rounded-3xl border border-slate-800/90 bg-[#060c1d] shadow-[0_20px_55px_rgba(0,0,0,0.32)]">
        <div className="border-b border-slate-800/80 bg-[radial-gradient(circle_at_top_right,rgba(141,38,255,0.13),transparent_45%)] px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-400">
                <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                Market Sentiment
              </div>
              <h2 className="mt-1 text-lg font-black tracking-tight text-white">Fear &amp; Greed · FINTECH Research</h2>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-400">
                Neue grafische Radar-Fläche ohne lokale Score-Berechnung. Werte, Regime, Historie und Treiber dürfen ausschließlich aus der FINTECH-Evidence-Projektion kommen.
              </p>
            </div>
            <div className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider ${ready ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}`}>
              {ready ? 'FINTECH READY' : projection?.status ?? 'NOT_COMPUTABLE'}
            </div>
          </div>

          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-[10.5px] font-bold transition ${selectedCategory === category.id ? 'border-amber-400/35 bg-amber-400/10 text-amber-200' : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:text-white'}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-2xl border border-slate-800 bg-[#040816] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Sentiment Radar</div>
                <div className="mt-1 text-sm font-bold text-white">{projection?.label ?? 'Nicht berechenbar'}</div>
              </div>
              <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>

            <div className="relative mx-auto mt-3 aspect-[2/1] w-full max-w-[260px] overflow-hidden">
              <svg viewBox="0 0 240 125" className="h-full w-full" role="img" aria-label={ready ? `FINTECH Sentiment Score ${score}` : 'Kein FINTECH Sentiment Score verfügbar'}>
                <defs>
                  <linearGradient id="capital-ai-sentiment-gauge" x1="0" x2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="28%" stopColor="#f97316" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="72%" stopColor="#84cc16" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <filter id="capital-ai-sentiment-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <path d="M25 108 A95 95 0 0 1 215 108" fill="none" stroke="#111827" strokeWidth="22" strokeLinecap="round" />
                <path d="M25 108 A95 95 0 0 1 215 108" fill="none" stroke="url(#capital-ai-sentiment-gauge)" strokeWidth="16" strokeLinecap="round" opacity={ready ? 0.9 : 0.3} filter={ready ? 'url(#capital-ai-sentiment-glow)' : undefined} />
                <g transform={`translate(120 108) rotate(${needleRotation})`} opacity={ready ? 1 : 0.28}>
                  <line x1="0" y1="0" x2="76" y2="0" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="6" fill="#F9BF21" stroke="#fff" strokeWidth="2" />
                </g>
                <text x="120" y="94" textAnchor="middle" fill="white" fontSize="28" fontWeight="900">{ready ? Math.round(score ?? 0) : '—'}</text>
                <text x="120" y="113" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700">FINTECH EVIDENCE</text>
              </svg>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-2.5">
                <div className="text-slate-500">Modell</div>
                <div className="mt-1 truncate font-mono font-bold text-slate-200">{projection?.modelVersion ?? 'crypto-sentiment-research/0.1.0'}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/35 p-2.5">
                <div className="text-slate-500">Evidence</div>
                <div className="mt-1 font-mono font-bold text-slate-200">{projection?.evidenceIds.length ?? 0} Referenzen</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-800 bg-[#040816] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white"><BarChart3 className="h-4 w-4 text-[#8D26FF]" aria-hidden="true" />30-Tage-Verlauf</div>
                <div className="font-mono text-[9px] text-slate-500">{formatObservedAt(projection?.observedAt ?? null)}</div>
              </div>
              <div className="mt-3 h-28">
                {ready && history.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 6, right: 2, left: 2, bottom: 0 }}>
                      <defs><linearGradient id="capital-ai-sentiment-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8D26FF" stopOpacity={0.32}/><stop offset="100%" stopColor="#8D26FF" stopOpacity={0}/></linearGradient></defs>
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip contentStyle={{ background: '#091129', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }} />
                      <Area type="monotone" dataKey="score" stroke="#8D26FF" strokeWidth={2} fill="url(#capital-ai-sentiment-area)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/20 px-4 text-center text-[11px] leading-relaxed text-slate-500">
                    Keine lokale Historie. Die Sparkline wird erst mit attestierter FINTECH-Zeitreihe dargestellt.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#040816] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white"><Database className="h-4 w-4 text-amber-400" aria-hidden="true" />Treiber &amp; Provenienz</div>
              {projection?.drivers.length ? (
                <div className="mt-3 space-y-2">
                  {projection.drivers.slice(0, 5).map((driver) => (
                    <div key={`${driver.title}-${driver.description}`} className="rounded-xl border border-slate-800 bg-slate-950/25 p-2.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-200"><TrendingUp className="h-3 w-3 text-emerald-400" aria-hidden="true" />{driver.title}</div>
                      <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{driver.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Keine Design-Fixture-Treiber übernommen. Treibertexte erscheinen nur, wenn FINTECH sie mit Evidence bereitstellt.</p>
              )}
              {projection?.summary && <p className="mt-3 border-t border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-300">{projection.summary}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-800/80 px-4 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span>Darstellung ausschließlich · keine lokale Score-, Rating- oder Decision-Semantik.</span>
          {onExploreMarkets && <button type="button" onClick={onExploreMarkets} className="font-bold text-amber-300 hover:text-amber-200">Märkte ansehen →</button>}
        </div>
      </div>
    </section>
  );
}
