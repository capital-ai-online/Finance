import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Search, Star, TrendingDown, TrendingUp, Minus, X } from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { assetRegistry } from '../lib/assetRegistry';
import { detectActivePatterns, type DetectedPattern, type OhlcCandle } from '../services/candlestickPatterns';

// 3 persistente Favoriten-Slots mit live aus echten Binance-1H-/4H-Kerzen berechneten
// Candlestick-Formationen (candlestickPatterns.ts). Read-only Analyse-Layer, kein Einfluss auf
// den kanonischen Score/Screening-Contract - dieselbe Architektur-Trennung wie
// EnterpriseAnalysisPanels (Ordertiefe/Arbitrage), die ebenfalls direkt browserseitig gegen
// Binance liest. Auf Krypto beschraenkt, weil nur dafuer eine echte Intraday-Kline-Quelle mit
// belastbarem Symbol-Mapping (`${symbol}USDT`) existiert - fuer andere Assetklassen wird nichts
// simuliert.

const STORAGE_KEY = 'capital_ai_favorite_pattern_slots_v1';
const SLOT_COUNT = 3;

function loadSlots(): Array<string | null> {
  const empty = Array.from({ length: SLOT_COUNT }, () => null);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return empty;
    return empty.map((_, index) => (typeof parsed[index] === 'string' ? parsed[index] : null));
  } catch {
    return empty;
  }
}

async function fetchBinanceKlines(symbol: string, interval: '1h' | '4h', limit = 30): Promise<OhlcCandle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(`${symbol}USDT`)}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Binance lieferte keine Kline-Liste.');
  return data
    .map((row: unknown): OhlcCandle | null => {
      if (!Array.isArray(row)) return null;
      const candle = { time: Number(row[0]), open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]) };
      return Object.values(candle).every((value) => Number.isFinite(value)) ? candle : null;
    })
    .filter((candle): candle is OhlcCandle => candle !== null);
}

const BIAS_STYLE: Record<DetectedPattern['bias'], { text: string; bg: string; border: string; Icon: typeof TrendingUp }> = {
  bullish: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', Icon: TrendingUp },
  bearish: { text: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/25', Icon: TrendingDown },
  neutral: { text: 'text-amber-200', bg: 'bg-amber-500/10', border: 'border-amber-500/25', Icon: Minus },
};

function PatternBadgeList({ patterns }: { patterns: DetectedPattern[] }) {
  if (patterns.length === 0) return <p className="text-[10px] text-white/35">Kein aktives Muster erkannt.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {patterns.map((pattern) => {
        const style = BIAS_STYLE[pattern.bias];
        return (
          <span key={pattern.name} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-mono font-bold ${style.text} ${style.bg} ${style.border}`}>
            <style.Icon size={10} /> {pattern.name}
          </span>
        );
      })}
    </div>
  );
}

interface SlotCardProps {
  symbol: string | null;
  cryptoAssets: ReturnType<typeof assetRegistry.getAssets>;
  onAssign: (symbol: string) => void;
  onClear: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

function SlotCard({ symbol, cryptoAssets, onAssign, onClear, onSelectSymbol }: SlotCardProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patterns1h, setPatterns1h] = useState<DetectedPattern[]>([]);
  const [patterns4h, setPatterns4h] = useState<DetectedPattern[]>([]);

  const asset = useMemo(() => (symbol ? cryptoAssets.find((item) => item.symbol === symbol) : undefined), [symbol, cryptoAssets]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cryptoAssets.filter((item) => !q || item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)).slice(0, 8);
  }, [cryptoAssets, query]);

  async function loadPatterns() {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    const [h1, h4] = await Promise.allSettled([fetchBinanceKlines(symbol, '1h'), fetchBinanceKlines(symbol, '4h')]);
    setPatterns1h(h1.status === 'fulfilled' ? detectActivePatterns(h1.value) : []);
    setPatterns4h(h4.status === 'fulfilled' ? detectActivePatterns(h4.value) : []);
    if (h1.status === 'rejected' && h4.status === 'rejected') {
      setError('Keine browserseitig abrufbare Binance-Kline-Evidence verfügbar.');
    }
    setLoading(false);
  }

  useEffect(() => {
    setPatterns1h([]);
    setPatterns4h([]);
    setError(null);
    if (symbol) void loadPatterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  if (!symbol) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-white/40"><Star size={13} /> Slot leer</div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Krypto-Asset zuweisen…"
            className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-8 pr-2 text-xs text-white outline-none focus:border-aif-gold-DEFAULT/50"
          />
        </div>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              type="button"
              key={item.symbol}
              onClick={() => onAssign(item.symbol)}
              className="flex w-full items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5 text-left text-xs text-white/70 hover:border-aif-gold-DEFAULT/30 hover:text-white"
            >
              <AssetLogo symbol={item.symbol} size="xs" /> {item.symbol} <span className="text-white/35">· {item.name}</span>
            </button>
          ))}
          {suggestions.length === 0 && <p className="px-1 text-[10px] text-white/30">Kein Krypto-Asset gefunden.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => onSelectSymbol?.(symbol)} className="flex items-center gap-2 text-left">
          <AssetLogo symbol={symbol} size="sm" />
          <div>
            <div className="text-sm font-bold text-white">{symbol}</div>
            <div className="text-[9px] text-white/40 font-mono">{asset?.name ?? symbol}</div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void loadPatterns()} disabled={loading} className="rounded-md border border-white/10 bg-white/5 p-1.5 disabled:opacity-40" title="Muster neu prüfen">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button type="button" onClick={onClear} className="rounded-md border border-white/10 bg-white/5 p-1.5" title="Slot leeren">
            <X size={12} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] text-amber-100/70">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div>
            <div className="mb-1 text-[9px] font-mono font-black uppercase tracking-widest text-cyan-300">1H Chart</div>
            {loading ? <p className="text-[10px] text-white/35">Lädt Kerzen…</p> : <PatternBadgeList patterns={patterns1h} />}
          </div>
          <div>
            <div className="mb-1 text-[9px] font-mono font-black uppercase tracking-widest text-purple-300">4H Chart</div>
            {loading ? <p className="text-[10px] text-white/35">Lädt Kerzen…</p> : <PatternBadgeList patterns={patterns4h} />}
          </div>
        </div>
      )}
    </div>
  );
}

export function FavoriteAssetPatternSlots({ onSelectSymbol }: { onSelectSymbol?: (symbol: string) => void }) {
  const [slots, setSlots] = useState<Array<string | null>>(loadSlots);
  const cryptoAssets = useMemo(() => assetRegistry.getAssets().filter((asset) => asset.type === 'crypto'), []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    } catch {
      // localStorage kann in restriktiven Browser-Kontexten fehlschlagen - Slots bleiben dann nur fuer die Session bestehen.
    }
  }, [slots]);

  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-950/60 p-5 sm:p-6 backdrop-blur-xl space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-black uppercase text-white"><Star size={16} className="text-aif-gold-DEFAULT" /> Favoriten-Slots · Live-Pattern 1H/4H</div>
        <p className="mt-1 text-[10px] font-mono text-white/40">3 fest zugeordnete Slots. Candlestick-Formationen werden live aus echten 1H-/4H-Kerzen (Binance) berechnet — read-only, kein Einfluss auf den kanonischen Score.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {slots.map((symbol, index) => (
          <SlotCard
            key={index}
            symbol={symbol}
            cryptoAssets={cryptoAssets}
            onAssign={(nextSymbol) => setSlots((prev) => prev.map((value, slotIndex) => (slotIndex === index ? nextSymbol : value)))}
            onClear={() => setSlots((prev) => prev.map((value, slotIndex) => (slotIndex === index ? null : value)))}
            onSelectSymbol={onSelectSymbol}
          />
        ))}
      </div>
    </section>
  );
}
