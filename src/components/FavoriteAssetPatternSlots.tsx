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
// Default fuer neue Nutzer:innen ohne gespeicherte Slots: Slot 1 vorbelegt mit BTC (demselben
// Default-Symbol wie der Enterprise Universum Scorer, siehe Dashboard.tsx `selectedSymbol`),
// Slot 2/3 bewusst leer.
const DEFAULT_SLOTS: Array<string | null> = ['BTC', null, null];

function loadSlots(): Array<string | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SLOTS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_SLOTS];
    return Array.from({ length: SLOT_COUNT }, (_, index) => (typeof parsed[index] === 'string' ? parsed[index] : null));
  } catch {
    return [...DEFAULT_SLOTS];
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
  bullish: { text: 'text-score-best', bg: 'bg-score-best/10', border: 'border-score-best/25', Icon: TrendingUp },
  bearish: { text: 'text-score-worst', bg: 'bg-score-worst/10', border: 'border-score-worst/25', Icon: TrendingDown },
  neutral: { text: 'text-score-warning', bg: 'bg-score-warning/10', border: 'border-score-warning/25', Icon: Minus },
};

function PatternBadgeList({ patterns }: { patterns: DetectedPattern[] }) {
  // Missing pattern evidence is intentionally not rendered. A textual badge
  // would be a placeholder and could be mistaken for an analytical result.
  if (patterns.length === 0) return null;
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
      <div className="rounded-xl border border-dashed border-border bg-background/20 p-4 space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-text-secondary"><Star size={13} /> Slot leer</div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Krypto-Asset zuweisen…"
            className="w-full rounded-lg border border-border bg-background/40 py-2 pl-8 pr-2 text-xs text-text-primary outline-none focus:border-brand-primary/50"
          />
        </div>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              type="button"
              key={item.symbol}
              onClick={() => onAssign(item.symbol)}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface/30 px-2 py-1.5 text-left text-xs text-text-primary/70 hover:border-brand-primary/30 hover:text-text-primary"
            >
              <AssetLogo symbol={item.symbol} size="xs" /> {item.symbol} <span className="text-text-secondary">· {item.name}</span>
            </button>
          ))}
          {suggestions.length === 0 && <p className="px-1 text-[10px] text-text-secondary">Kein Krypto-Asset gefunden.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background/25 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => onSelectSymbol?.(symbol)} className="flex items-center gap-2 text-left">
          <AssetLogo symbol={symbol} size="sm" />
          <div>
            <div className="text-sm font-bold text-text-primary">{symbol}</div>
            <div className="text-[9px] text-text-secondary font-mono">{asset?.name ?? symbol}</div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => void loadPatterns()} disabled={loading} className="rounded-md border border-border bg-surface/50 p-1.5 disabled:opacity-40" title="Muster neu prüfen">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button type="button" onClick={onClear} className="rounded-md border border-border bg-surface/50 p-1.5" title="Slot leeren">
            <X size={12} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-score-warning/20 bg-score-warning/5 p-2.5 text-[10px] text-score-warning">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div>
            <div className="mb-1 text-[9px] font-mono font-black uppercase tracking-widest text-brand-cyan">1H Chart</div>
            {loading ? <p className="text-[10px] text-text-secondary">Lädt Kerzen…</p> : <PatternBadgeList patterns={patterns1h} />}
          </div>
          <div>
            <div className="mb-1 text-[9px] font-mono font-black uppercase tracking-widest text-brand-accent">4H Chart</div>
            {loading ? <p className="text-[10px] text-text-secondary">Lädt Kerzen…</p> : <PatternBadgeList patterns={patterns4h} />}
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
    <section id="favoriten-slots" className="scroll-mt-24 rounded-2xl border border-border bg-surface/60 p-5 sm:p-6 backdrop-blur-xl space-y-4">
      <div>
        <div className="flex items-center gap-2 text-sm font-black uppercase text-text-primary"><Star size={16} className="text-brand-primary" /> Favoriten-Slots · Live-Pattern 1H/4H</div>
        <p className="mt-1 text-[10px] font-mono text-text-secondary">3 fest zugeordnete Slots. Candlestick-Formationen werden live aus echten 1H-/4H-Kerzen (Binance) berechnet — read-only, kein Einfluss auf den kanonischen Score.</p>
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
