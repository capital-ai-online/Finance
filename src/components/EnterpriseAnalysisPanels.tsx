import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Database, Gauge, Layers3, Network, RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

type Level = { price: number; quantity: number };
type VenueBook = {
  provider: 'Binance' | 'Kraken';
  bids: Level[];
  asks: Level[];
  bestBid: number | null;
  bestAsk: number | null;
  spreadBps: number | null;
  observedAt: string;
};

export interface EnterpriseAnalysisPanelsProps {
  symbol: string;
  assetType: AssetType;
  canonicalScore: number | null;
  coverage?: number | null;
  providers?: string[];
  evidenceIds?: string[];
  reasoning?: string[];
  decision?: string | null;
  riskLevel?: string | null;
}

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function levels(rows: unknown, limit = 8): Level[] {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, limit).map((row) => {
    if (!Array.isArray(row)) return null;
    const price = finite(row[0]);
    const quantity = finite(row[1]);
    return price !== null && quantity !== null ? { price, quantity } : null;
  }).filter((row): row is Level => row !== null);
}

function spreadBps(bid: number | null, ask: number | null): number | null {
  if (bid === null || ask === null) return null;
  const mid = (bid + ask) / 2;
  return mid > 0 ? Number((((ask - bid) / mid) * 10_000).toFixed(2)) : null;
}

async function jsonWithTimeout(url: string, timeoutMs = 3500): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function binanceBook(symbol: string): Promise<VenueBook> {
  const observedAt = new Date().toISOString();
  const body = await jsonWithTimeout(`https://api.binance.com/api/v3/depth?symbol=${encodeURIComponent(`${symbol}USDT`)}&limit=10`);
  const bids = levels(body?.bids);
  const asks = levels(body?.asks);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  return { provider: 'Binance', bids, asks, bestBid, bestAsk, spreadBps: spreadBps(bestBid, bestAsk), observedAt };
}

async function krakenBook(symbol: string): Promise<VenueBook> {
  const pair = symbol === 'BTC' ? 'XBTUSD' : `${symbol}USD`;
  const observedAt = new Date().toISOString();
  const body = await jsonWithTimeout(`https://api.kraken.com/0/public/Depth?pair=${encodeURIComponent(pair)}&count=10`);
  if (Array.isArray(body?.error) && body.error.length > 0) throw new Error(body.error.join(', '));
  const first = body?.result && typeof body.result === 'object' ? Object.values(body.result)[0] as any : null;
  const bids = levels(first?.bids);
  const asks = levels(first?.asks);
  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  return { provider: 'Kraken', bids, asks, bestBid, bestAsk, spreadBps: spreadBps(bestBid, bestAsk), observedAt };
}

function formatPrice(value: number | null): string {
  if (value === null) return '—';
  return value >= 1000 ? value.toLocaleString('de-DE', { maximumFractionDigits: 2 }) : value.toLocaleString('de-DE', { maximumFractionDigits: 6 });
}

type LadderRow = { price: number; quantity: number; venue: string; cumulative: number };

const VENUE_DOT_COLOR: Record<string, string> = {
  Binance: '#fbbf24',
  Kraken: '#c084fc',
};

function buildLadder(books: VenueBook[], side: 'bids' | 'asks', limit = 7): LadderRow[] {
  const merged = books.flatMap((book) => book[side].map((level) => ({ price: level.price, quantity: level.quantity, venue: book.provider })));
  merged.sort((a, b) => (side === 'asks' ? a.price - b.price : b.price - a.price));
  let running = 0;
  return merged.slice(0, limit).map((row) => {
    running += row.quantity;
    return { ...row, cumulative: running };
  });
}

export function EnterpriseAnalysisPanels({
  symbol,
  assetType,
  canonicalScore,
  coverage = null,
  providers = [],
  evidenceIds = [],
  reasoning = [],
  decision = null,
  riskLevel = null,
}: EnterpriseAnalysisPanelsProps) {
  const [books, setBooks] = useState<VenueBook[]>([]);
  const [microLoading, setMicroLoading] = useState(false);
  const [microError, setMicroError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const upper = symbol.toUpperCase().trim();

  async function loadMicrostructure() {
    if (assetType !== 'crypto') {
      setBooks([]);
      setMicroError(null);
      return;
    }
    setMicroLoading(true);
    setMicroError(null);
    const settled = await Promise.allSettled([binanceBook(upper), krakenBook(upper)]);
    const next = settled.flatMap(item => item.status === 'fulfilled' ? [item.value] : []);
    setBooks(next);
    if (next.length === 0) setMicroError('Keine browserseitig abrufbare Venue-Orderbuch-Evidence verfügbar.');
    setMicroLoading(false);
  }

  useEffect(() => {
    void loadMicrostructure();
    setAiText('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upper, assetType]);

  const arbitrage = useMemo(() => {
    if (books.length < 2) return null;
    const buy = [...books].filter(v => v.bestAsk !== null).sort((a, b) => (a.bestAsk ?? Infinity) - (b.bestAsk ?? Infinity))[0];
    const sell = [...books].filter(v => v.bestBid !== null).sort((a, b) => (b.bestBid ?? 0) - (a.bestBid ?? 0))[0];
    if (!buy || !sell || buy.bestAsk === null || sell.bestBid === null) return null;
    return {
      buyVenue: buy.provider,
      sellVenue: sell.provider,
      buyPrice: buy.bestAsk,
      sellPrice: sell.bestBid,
      grossSpreadBps: Number((((sell.bestBid - buy.bestAsk) / buy.bestAsk) * 10_000).toFixed(2)),
    };
  }, [books]);

  const setupConfidence = useMemo(() => {
    const cov = typeof coverage === 'number' ? Math.max(0, Math.min(1, coverage)) : 0;
    const providerFactor = Math.min(providers.length / 3, 1);
    const evidenceFactor = Math.min(evidenceIds.length / 5, 1);
    return Math.round((cov * 0.6 + providerFactor * 0.2 + evidenceFactor * 0.2) * 100);
  }, [coverage, providers.length, evidenceIds.length]);

  const pattern = useMemo(() => {
    const text = reasoning.join(' ').toLowerCase();
    if (/breakout|ausbruch/.test(text)) return 'Breakout-Evidence';
    if (/momentum|trend/.test(text)) return 'Momentum-/Trend-Evidence';
    if (/mean reversion|reversion|überverkauft|oversold/.test(text)) return 'Mean-Reversion-Evidence';
    if (/volatil/.test(text)) return 'Volatilitäts-Regime';
    return 'Kein verifiziertes Pattern ableitbar';
  }, [reasoning]);

  async function requestAiSummary() {
    setAiLoading(true);
    setAiText('');
    try {
      const message = [
        `Erstelle eine sehr kurze, nüchterne CAPITAL-AI Kurzanalyse für ${upper} (${assetType}).`,
        `Verifizierter kanonischer Score: ${canonicalScore ?? 'nicht verfügbar'}.`,
        `Decision: ${decision ?? 'nicht verfügbar'}. Risiko: ${riskLevel ?? 'nicht verfügbar'}.`,
        `Coverage: ${coverage ?? 'nicht verfügbar'}. Provider: ${providers.join(', ') || 'keine'}.`,
        `Reasoning: ${reasoning.slice(0, 5).join(' | ') || 'keines'}.`,
        'Nutze ausschließlich diese gelieferten Fakten. Erfinde keine Preise, Renditen, Pattern, Stop-Loss- oder Take-Profit-Werte. Maximal 4 Sätze.',
      ].join('\n');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: [] }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || 'AI-Analyse nicht verfügbar');
      setAiText(typeof body?.reply === 'string' ? body.reply : 'Keine AI-Antwort verfügbar.');
    } catch (error: any) {
      setAiText(`AI-Kurzanalyse derzeit nicht verfügbar: ${error?.message || 'unbekannter Fehler'}`);
    } finally {
      setAiLoading(false);
    }
  }

  const asksLadder = useMemo(() => buildLadder(books, 'asks'), [books]);
  const bidsLadder = useMemo(() => buildLadder(books, 'bids'), [books]);
  const ladderMaxCumulative = Math.max(1, ...asksLadder.map((row) => row.cumulative), ...bidsLadder.map((row) => row.cumulative));
  const combinedSpreadBps = spreadBps(bidsLadder[0]?.price ?? null, asksLadder[0]?.price ?? null);

  return (
    <div id="tiefenanalyse" className="scroll-mt-24 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300"><Search size={14} /> Pattern</div>
          <div className="mt-3 text-sm font-semibold text-white">{pattern}</div>
          <p className="mt-2 text-[10px] text-white/40">Nur aus vorhandener Scoring-Begründung abgeleitet; kein zusätzlicher Score-Input.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300"><Gauge size={14} /> Setup Confidence</div>
          <div className="mt-3 text-3xl font-black font-mono text-white">{setupConfidence}%</div>
          <p className="mt-2 text-[10px] text-white/40">Evidence-Coverage-Metrik, nicht der kanonische Trading-/Asset-Score.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300"><TrendingUp size={14} /> Trading Score</div>
          <div className="mt-3 text-3xl font-black font-mono text-white">{canonicalScore?.toFixed(1) ?? '—'}</div>
          <p className="mt-2 text-[10px] text-white/40">Read-only Spiegel des verifizierten kanonischen Scores. Keine Neuberechnung.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-300"><ShieldCheck size={14} /> Data Integrity</div>
          <div className="mt-3 text-sm font-semibold text-white">{providers.length} Provider · {evidenceIds.length} Evidence</div>
          <p className="mt-2 text-[10px] text-white/40">Presentation Layer ist strikt vom Scoring-Write-Path getrennt.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-white uppercase"><Layers3 size={16} className="text-cyan-300" /> Order-Tree · Market Depth</div>
              <p className="text-[10px] text-white/40 mt-1">Venue-übergreifende Orderbuch-Leiter (Binance + Kraken), read-only beobachtend, keine Veränderung des Scorings.</p>
            </div>
            <button onClick={() => void loadMicrostructure()} disabled={microLoading || assetType !== 'crypto'} className="p-2 rounded-lg border border-white/10 bg-white/5 disabled:opacity-30" title="Microstructure neu laden">
              <RefreshCw size={14} className={microLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {assetType !== 'crypto' ? (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-xs text-white/45">Der Order-Tree wird nur für Assetklassen angezeigt, für die eine echte Venue-Orderbuchquelle vorhanden ist. Für {assetType} wird nichts simuliert.</div>
          ) : microError ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-100/70">{microError}</div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <div>
                {[...asksLadder].reverse().map((row, index) => (
                  <div key={`ask-${index}`} className="relative flex items-center justify-between gap-3 border-b border-white/5 px-3 py-1.5 text-[10px] font-mono">
                    <div className="absolute inset-y-0 right-0 bg-rose-500/10" style={{ width: `${Math.max(4, (row.cumulative / ladderMaxCumulative) * 100)}%` }} />
                    <span className="relative flex items-center gap-1.5 text-rose-300"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: VENUE_DOT_COLOR[row.venue] ?? '#94a3b8' }} title={row.venue} />{formatPrice(row.price)}</span>
                    <span className="relative text-white/55">{row.quantity.toFixed(4)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 border-y border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/40">
                <span>Spread</span><span className="font-bold text-white">{combinedSpreadBps ?? '—'} bps</span>
              </div>
              <div>
                {bidsLadder.map((row, index) => (
                  <div key={`bid-${index}`} className="relative flex items-center justify-between gap-3 border-b border-white/5 last:border-0 px-3 py-1.5 text-[10px] font-mono">
                    <div className="absolute inset-y-0 left-0 bg-emerald-500/10" style={{ width: `${Math.max(4, (row.cumulative / ladderMaxCumulative) * 100)}%` }} />
                    <span className="relative flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: VENUE_DOT_COLOR[row.venue] ?? '#94a3b8' }} title={row.venue} />{formatPrice(row.price)}</span>
                    <span className="relative text-white/55">{row.quantity.toFixed(4)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-white/35">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: VENUE_DOT_COLOR.Binance }} /> Binance</span>
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: VENUE_DOT_COLOR.Kraken }} /> Kraken</span>
                <span className="ml-auto normal-case text-white/25">Balkenbreite = kumuliertes Volumen je Preisstufe</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-sm font-black text-white uppercase"><Network size={16} className="text-purple-300" /> Arbitrage Radar</div>
          <p className="text-[10px] text-white/40 mt-1">Brutto-Beobachtung; keine Ausführungsempfehlung.</p>
          {arbitrage ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3"><div className="text-[10px] text-white/40">Buy Venue</div><div className="font-bold text-white">{arbitrage.buyVenue} @ {formatPrice(arbitrage.buyPrice)}</div></div>
              <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3"><div className="text-[10px] text-white/40">Sell Venue</div><div className="font-bold text-white">{arbitrage.sellVenue} @ {formatPrice(arbitrage.sellPrice)}</div></div>
              <div className="rounded-xl bg-purple-500/5 border border-purple-500/15 p-3"><div className="text-[10px] text-purple-200/50">Gross Spread</div><div className="text-2xl font-black font-mono text-purple-200">{arbitrage.grossSpreadBps} bps</div></div>
              <p className="text-[10px] text-white/35">Gebühren, Slippage, Latenz und Transferzeit sind nicht eingerechnet. `executionEligible=false`.</p>
            </div>
          ) : <div className="mt-4 text-xs text-white/40">Mindestens zwei vergleichbare Venue-Books erforderlich.</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-sm font-black text-white uppercase"><Activity size={16} className="text-emerald-300" /> Intelligent Feed</div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><span className="text-white/45">Score:</span> <span className="text-white">{canonicalScore?.toFixed(1) ?? 'DATA_UNAVAILABLE'}</span></div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><span className="text-white/45">Decision:</span> <span className="text-white">{decision ?? 'nicht verfügbar'}</span></div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><span className="text-white/45">Risk:</span> <span className="text-white">{riskLevel ?? 'nicht verfügbar'}</span></div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><span className="text-white/45">Microstructure:</span> <span className="text-white">{assetType === 'crypto' ? `${books.length} Venue(s) beobachtet` : 'für diese Assetklasse nicht aktiviert'}</span></div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><span className="text-white/45">Pattern:</span> <span className="text-white">{pattern}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-purple-950/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-white uppercase"><Bot size={16} className="text-purple-300" /> AI Kurzanalyse</div>
            <button onClick={() => void requestAiSummary()} disabled={aiLoading} className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold text-purple-100 disabled:opacity-50"><Sparkles size={12} /> Analysieren</button>
          </div>
          <div className="mt-4 min-h-24 rounded-xl border border-white/5 bg-black/25 p-4 text-xs leading-relaxed text-white/65">
            {aiLoading ? <span className="inline-flex items-center gap-2"><RefreshCw size={13} className="animate-spin" /> Kurzanalyse wird aus verifizierten Scoring-Fakten erzeugt…</span> : aiText || 'Die AI-Kurzanalyse wird nur auf Anforderung ausgeführt und erhält ausschließlich die bereits verifizierten Scoring-Fakten.'}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3 text-[10px] text-cyan-100/55">
        <Database size={13} className="mt-0.5 shrink-0" />
        <span>Architektur-Isolation: Pattern, Setup Confidence, Ordertiefe, Arbitrage, Intelligent Feed und AI-Kurzanalyse sind read-only Analyse-/Presentation-Module. Sie schreiben weder in den kanonischen Score noch in Ranking, Scoring-Lineage oder Provider-Evidence zurück.</span>
      </div>
    </div>
  );
}
