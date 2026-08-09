import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Award, Compass, Layers, Orbit, Percent, RefreshCw, TrendingUp } from 'lucide-react';
import { AssetLogo } from './AssetLogo';

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
type AssetRow = { symbol: string; name: string; type: AssetType; score: number | null; status: string; providers: string[] };
type CatalogAsset = { symbol?: string; name?: string; type?: AssetType };

interface UniverseBestWorstProps { onSelectAsset?: (symbol: string) => void; }

const GROUPS = [
  { id: 'crypto', name: 'Crypto Cosmos', type: 'crypto' as const, icon: Orbit, description: 'Digitale Leitwährungen & Token' },
  { id: 'stock', name: 'Stock Galaxy', type: 'stock' as const, icon: TrendingUp, description: 'Aktien & Bluechips' },
  { id: 'index', name: 'Index World', type: 'index' as const, icon: Compass, description: 'Globale Indizes' },
  { id: 'forex', name: 'Forex Nebula', type: 'forex' as const, icon: Compass, description: 'Globale Währungspaare' },
  { id: 'commodity', name: 'Commodity Nebula', type: 'commodity' as const, icon: Layers, description: 'Edelmetalle & Ressourcen' },
  { id: 'bond', name: 'Bond Horizon', type: 'bond' as const, icon: Percent, description: 'Staatsanleihen & Sovereign-Benchmarks' },
];

function finiteScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Number((value <= 10 ? value * 10 : value).toFixed(1));
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 6500): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function UniverseBestWorst({ onSelectAsset }: UniverseBestWorstProps) {
  const [catalog, setCatalog] = useState<CatalogAsset[]>([]);
  const [scores, setScores] = useState<Record<string, AssetRow>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCatalog() {
    setCatalogLoading(true);
    setError(null);
    try {
      const body = await fetchJson('/api/registry/assets', undefined, 3500);
      if (!Array.isArray(body)) throw new Error('Ungültiger Asset-Katalog');
      setCatalog(body.filter((item: any) => typeof item?.symbol === 'string' && typeof item?.name === 'string' && typeof item?.type === 'string'));
    } catch (err: any) {
      setError(err?.message || 'Asset-Katalog konnte nicht geladen werden.');
    } finally {
      setCatalogLoading(false);
    }
  }

  async function refreshScores(sourceCatalog: CatalogAsset[]) {
    setScoreLoading(true);
    const candidates = GROUPS.flatMap(group => sourceCatalog.filter(asset => asset.type === group.type).slice(0, 8));
    const crypto = candidates.filter(asset => asset.type === 'crypto');
    const traditional = candidates.filter(asset => asset.type !== 'crypto');
    const next: Record<string, AssetRow> = {};

    await Promise.allSettled(crypto.map(async asset => {
      const body = await fetchJson('/api/crypto/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: asset.symbol, asset_name: asset.name }),
      });
      const score = finiteScore(body?.final_score);
      if (body?.status === 'READY' && score !== null && asset.symbol && asset.name) {
        next[asset.symbol] = { symbol: asset.symbol, name: asset.name, type: 'crypto', score, status: 'READY', providers: body?.integrity?.providers ?? [] };
      }
    }));

    if (traditional.length) {
      try {
        const symbols = traditional.map(asset => asset.symbol).filter(Boolean).join(',');
        const body = await fetchJson(`/api/registry/assets/verified-scores?symbols=${encodeURIComponent(symbols)}`, undefined, 7500);
        for (const row of body?.results ?? []) {
          const asset = traditional.find(item => item.symbol === row?.symbol);
          const score = finiteScore(row?.score);
          if (asset?.symbol && asset.name && asset.type && row?.status === 'READY' && score !== null) {
            next[asset.symbol] = { symbol: asset.symbol, name: asset.name, type: asset.type, score, status: 'READY', providers: Array.isArray(row?.providers) ? row.providers : [] };
          }
        }
      } catch {
        // Progressive rendering: traditional provider timeout must never block the page shell.
      }
    }

    setScores(next);
    setScoreLoading(false);
  }

  useEffect(() => { void loadCatalog(); }, []);
  useEffect(() => { if (catalog.length) void refreshScores(catalog); }, [catalog]);

  const grouped = useMemo(() => GROUPS.map(group => {
    const rows = Object.values(scores).filter(row => row.type === group.type && row.status === 'READY' && row.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return { ...group, best: rows.slice(0, 3), worst: rows.length >= 6 ? rows.slice(-3).reverse() : rows.slice(3, 6).reverse() };
  }), [scores]);

  if (error) return <div className="rounded-2xl border border-red-500/20 bg-neutral-950/60 p-6 text-center"><AlertTriangle className="mx-auto text-red-400" size={30} /><p className="mt-3 text-sm font-bold text-white">Ladefehler</p><p className="mt-1 text-xs text-white/50">{error}</p></div>;

  return (
    <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden" id="universe-scoring-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5 mb-6">
        <div><div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/25 uppercase">CAPITAL-AI QUANT-SYSTEM</span><span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase flex items-center gap-1"><Activity size={10} /> Progressive Scoring</span></div><h2 className="text-lg font-black font-display text-white uppercase tracking-wider flex items-center gap-2"><Award className="text-purple-400" size={18} /> Universum Best- & Worst-Assets</h2><p className="text-xs text-white/50 mt-1 max-w-2xl">Die Oberfläche wird sofort aus dem Asset-Katalog aufgebaut. Verifizierte Scores werden danach zeitlich begrenzt nachgeladen; ein langsamer Provider blockiert die Grafik nicht mehr.</p></div>
        <button onClick={() => void refreshScores(catalog)} disabled={!catalog.length || scoreLoading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 disabled:opacity-40"><RefreshCw size={13} className={scoreLoading ? 'animate-spin' : ''} /> Aktualisieren</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {grouped.map(group => { const Icon = group.icon; return <div key={group.id} className="rounded-xl border border-white/10 bg-black/30 p-4 min-h-72"><div className="flex items-center gap-3 border-b border-white/10 pb-3"><div className="p-2 rounded-lg bg-white/5"><Icon size={16} /></div><div><h3 className="text-xs font-black uppercase text-white">{group.name}</h3><p className="text-[10px] text-white/40">{group.description}</p></div></div><div className="mt-4 space-y-4"><AssetBlock title="Top 3 Best" rows={group.best} tone="best" onSelectAsset={onSelectAsset} pending={scoreLoading} /><AssetBlock title="Top 3 Worst" rows={group.worst} tone="worst" onSelectAsset={onSelectAsset} pending={scoreLoading} /></div></div>; })}
      </div>
      {catalogLoading && <div className="mt-4 text-[10px] font-mono text-white/35">Asset-Katalog wird geladen…</div>}
    </div>
  );
}

function AssetBlock({ title, rows, tone, onSelectAsset, pending }: { title: string; rows: AssetRow[]; tone: 'best' | 'worst'; onSelectAsset?: (symbol: string) => void; pending: boolean }) {
  return <div><div className={`mb-2 text-[9px] font-mono font-black uppercase ${tone === 'best' ? 'text-emerald-400' : 'text-rose-400'}`}>{title}</div><div className="space-y-1.5">{rows.length ? rows.map(row => <button type="button" key={row.symbol} onClick={() => onSelectAsset?.(row.symbol)} className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-left hover:bg-white/5"><div className="flex items-center gap-2 min-w-0"><AssetLogo symbol={row.symbol} size="xs" /><div className="min-w-0"><div className="text-[11px] font-bold text-white">{row.symbol}</div><div className="truncate text-[9px] text-white/35">{row.name}</div></div></div><div className={`rounded px-1.5 py-0.5 text-[10px] font-black font-mono ${tone === 'best' ? 'bg-emerald-400 text-black' : 'bg-rose-500 text-white'}`}>{row.score?.toFixed(1) ?? '—'}</div></button>) : <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[9px] text-white/35">{pending ? 'Verifizierte Scores werden nachgeladen…' : 'Keine verifizierten Scores verfügbar'}</div>}</div></div>;
}
