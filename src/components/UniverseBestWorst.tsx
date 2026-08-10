import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Award, Clock, Compass, Layers, Orbit, Percent, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';
import { AssetLogo } from './AssetLogo';

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
type AssetRow = {
  symbol: string;
  name: string;
  type: AssetType;
  score: number | null;
  status: string;
  providers: string[];
  reasoning: string[];
  reason?: string;
};
type CatalogAsset = { symbol?: string; name?: string; type?: AssetType; origin?: string };

interface UniverseBestWorstProps { onSelectAsset?: (symbol: string) => void; }

const RANKING_CANDIDATE_LIMIT = 24;

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

function reasoningList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 3);
}

function selectRankingCandidates(sourceCatalog: CatalogAsset[], type: AssetType): CatalogAsset[] {
  return sourceCatalog
    .filter(asset => asset.type === type && asset.symbol && asset.name)
    .sort((a, b) => {
      const aRank = a.origin === 'legacy-registry' ? 0 : 1;
      const bRank = b.origin === 'legacy-registry' ? 0 : 1;
      if (aRank !== bRank) return aRank - bRank;
      return String(a.symbol).localeCompare(String(b.symbol));
    })
    .slice(0, RANKING_CANDIDATE_LIMIT);
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

async function fetchJsonWithStatus(url: string, init?: RequestInit, timeoutMs = 6500): Promise<{ ok: boolean; status: number; body: any }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

function relativeTime(date: Date | null): string {
  if (!date) return 'noch nie';
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return 'gerade eben';
  if (seconds < 60) return `vor ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `vor ${minutes}min`;
  const hours = Math.round(minutes / 60);
  return `vor ${hours}h`;
}

export function UniverseBestWorst({ onSelectAsset }: UniverseBestWorstProps) {
  const [catalog, setCatalog] = useState<CatalogAsset[]>([]);
  const [scores, setScores] = useState<Record<string, AssetRow>>({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, forceTick] = useState(0);

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
    const candidates = GROUPS.flatMap(group => selectRankingCandidates(sourceCatalog, group.type));
    const crypto = candidates.filter(asset => asset.type === 'crypto');
    const traditional = candidates.filter(asset => asset.type !== 'crypto');
    const next: Record<string, AssetRow> = {};

    await Promise.allSettled(crypto.map(async asset => {
      if (!asset.symbol || !asset.name) return;
      try {
        const result = await fetchJsonWithStatus('/api/crypto/score', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: asset.symbol, asset_name: asset.name }),
        });
        const score = finiteScore(result.body?.final_score);
        next[asset.symbol] = {
          symbol: asset.symbol,
          name: asset.name,
          type: 'crypto',
          score: result.body?.status === 'READY' ? score : null,
          status: result.body?.status || (result.ok ? 'SCORE_NOT_COMPUTABLE' : `HTTP_${result.status}`),
          providers: Array.isArray(result.body?.integrity?.providers) ? result.body.integrity.providers : [],
          reasoning: reasoningList(result.body?.reasoning),
          reason: typeof result.body?.reason === 'string' ? result.body.reason : undefined,
        };
      } catch (err: any) {
        next[asset.symbol] = {
          symbol: asset.symbol,
          name: asset.name,
          type: 'crypto',
          score: null,
          status: err?.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
          providers: [],
          reasoning: [],
          reason: err?.message || 'Crypto-Scoring konnte nicht geladen werden.',
        };
      }
    }));

    if (traditional.length) {
      try {
        const symbols = traditional.map(asset => asset.symbol).filter(Boolean).join(',');
        const body = await fetchJson(`/api/registry/assets/verified-scores?symbols=${encodeURIComponent(symbols)}`, undefined, 12000);
        const seen = new Set<string>();
        for (const row of body?.results ?? []) {
          const asset = traditional.find(item => item.symbol === row?.symbol);
          if (!asset?.symbol || !asset.name || !asset.type) continue;
          seen.add(asset.symbol);
          const score = finiteScore(row?.score);
          next[asset.symbol] = {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            score: row?.status === 'READY' ? score : null,
            status: typeof row?.status === 'string' ? row.status : 'SCORE_NOT_COMPUTABLE',
            providers: Array.isArray(row?.providers) ? row.providers : [],
            reasoning: reasoningList(row?.reasoning),
            reason: typeof row?.reason === 'string' ? row.reason : undefined,
          };
        }
        for (const asset of traditional) {
          if (!asset.symbol || !asset.name || !asset.type || seen.has(asset.symbol)) continue;
          next[asset.symbol] = {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            score: null,
            status: 'SCORE_NOT_COMPUTABLE',
            providers: [],
            reasoning: [],
            reason: 'Kein Ergebnis im verifizierten Batch-Scoring zurückgegeben.',
          };
        }
      } catch (err: any) {
        for (const asset of traditional) {
          if (!asset.symbol || !asset.name || !asset.type) continue;
          next[asset.symbol] = {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            score: null,
            status: err?.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
            providers: [],
            reasoning: [],
            reason: err?.message || 'Verifiziertes Batch-Scoring konnte nicht geladen werden.',
          };
        }
      }
    }

    setScores(next);
    setScoreLoading(false);
    setLastUpdated(new Date());
  }

  useEffect(() => { void loadCatalog(); }, []);
  useEffect(() => { if (catalog.length) void refreshScores(catalog); }, [catalog]);

  useEffect(() => {
    const interval = setInterval(() => forceTick(tick => tick + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const grouped = useMemo(() => GROUPS.map(group => {
    const candidates = selectRankingCandidates(catalog, group.type);
    const allRows = Object.values(scores).filter(row => row.type === group.type);
    const readyRows = allRows
      .filter(row => row.status === 'READY' && row.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const unavailable = allRows.filter(row => row.status !== 'READY' || row.score === null);
    return {
      ...group,
      best: readyRows.slice(0, 3),
      worst: readyRows.length >= 6 ? readyRows.slice(-3).reverse() : readyRows.slice(3, 6).reverse(),
      readyCount: readyRows.length,
      candidatesInGroup: candidates.length,
      unavailable,
      coverage: candidates.length ? Math.round((readyRows.length / candidates.length) * 100) : 0,
    };
  }), [scores, catalog]);

  const totalReady = grouped.reduce((sum, group) => sum + group.readyCount, 0);
  const totalCandidates = grouped.reduce((sum, group) => sum + group.candidatesInGroup, 0);
  const totalCoverage = totalCandidates ? Math.round((totalReady / totalCandidates) * 100) : 0;

  if (error) return <div className="rounded-2xl border border-red-500/20 bg-neutral-950/60 p-6 text-center"><AlertTriangle className="mx-auto text-red-400" size={30} /><p className="mt-3 text-sm font-bold text-white">Ladefehler</p><p className="mt-1 text-xs text-white/50">{error}</p></div>;

  return (
    <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden" id="universe-scoring-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/25 uppercase">CAPITAL-AI QUANT-SYSTEM</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase flex items-center gap-1"><Activity size={10} /> Progressive Scoring</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-white/5 text-white/60 border border-white/10 uppercase flex items-center gap-1"><ShieldCheck size={10} /> {totalReady}/{totalCandidates || '–'} verifiziert · {totalCoverage}% Coverage</span>
          </div>
          <h2 className="text-lg font-black font-display text-white uppercase tracking-wider flex items-center gap-2"><Award className="text-purple-400" size={18} /> Universe TOP Rankings</h2>
          <p className="text-xs text-white/50 mt-1 max-w-2xl">Bis zu {RANKING_CANDIDATE_LIMIT} priorisierte Kandidaten je Assetklasse werden evidence-basiert ausgewertet. Fehlende Scores bleiben sichtbar und werden nie durch Ersatzwerte ersetzt.</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5">
          <button onClick={() => void refreshScores(catalog)} disabled={!catalog.length || scoreLoading} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 disabled:opacity-40 hover:bg-white/10 transition-colors"><RefreshCw size={13} className={scoreLoading ? 'animate-spin' : ''} /> Aktualisieren</button>
          <span className="text-[9px] font-mono text-white/35 flex items-center gap-1"><Clock size={10} /> {scoreLoading ? 'lädt…' : `Stand: ${relativeTime(lastUpdated)}`}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {grouped.map(group => {
          const Icon = group.icon;
          return (
            <div key={group.id} className="rounded-xl border border-white/10 bg-black/30 p-4 min-h-72 flex flex-col">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="p-2 rounded-lg bg-white/5"><Icon size={16} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-black uppercase text-white">{group.name}</h3>
                  <p className="text-[10px] text-white/40">{group.description}</p>
                </div>
                <span className="shrink-0 text-[9px] font-mono font-bold text-white/40 bg-white/5 rounded px-1.5 py-0.5">{group.readyCount}/{group.candidatesInGroup || '–'} · {group.coverage}%</span>
              </div>
              <div className="mt-4 space-y-4 flex-1">
                <AssetBlock title="Top 3 Best" rows={group.best} tone="best" onSelectAsset={onSelectAsset} pending={scoreLoading} />
                <AssetBlock title="Top 3 Worst" rows={group.worst} tone="worst" onSelectAsset={onSelectAsset} pending={scoreLoading} />
                <UnavailableBlock rows={group.unavailable} pending={scoreLoading} />
              </div>
            </div>
          );
        })}
      </div>
      {catalogLoading && <div className="mt-4 text-[10px] font-mono text-white/35">Asset-Katalog wird geladen…</div>}
    </div>
  );
}

function AssetBlock({ title, rows, tone, onSelectAsset, pending }: { title: string; rows: AssetRow[]; tone: 'best' | 'worst'; onSelectAsset?: (symbol: string) => void; pending: boolean }) {
  return (
    <div>
      <div className={`mb-2 text-[9px] font-mono font-black uppercase ${tone === 'best' ? 'text-emerald-400' : 'text-rose-400'}`}>{title}</div>
      <div className="space-y-1.5">
        {rows.length
          ? rows.map(row => <AssetRowItem key={row.symbol} row={row} tone={tone} onSelectAsset={onSelectAsset} />)
          : <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[9px] text-white/35">{pending ? 'Verifizierte Scores werden nachgeladen…' : 'Nicht genügend READY-Scores für dieses Ranking'}</div>}
      </div>
    </div>
  );
}

function UnavailableBlock({ rows, pending }: { rows: AssetRow[]; pending: boolean }) {
  if (pending || rows.length === 0) return null;
  return (
    <div>
      <div className="mb-2 text-[9px] font-mono font-black uppercase text-amber-400">Nicht berechenbar · {rows.length}</div>
      <div className="space-y-1.5">
        {rows.slice(0, 4).map(row => (
          <div key={row.symbol} className="rounded-lg border border-amber-500/10 bg-amber-500/[0.03] px-2 py-1.5" title={row.reason}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-white/70">{row.symbol}</span>
              <span className="text-[8px] font-mono text-amber-300/70">{row.status}</span>
            </div>
            {row.reason && <div className="mt-0.5 truncate text-[8px] text-white/30">{row.reason}</div>}
          </div>
        ))}
        {rows.length > 4 && <div className="text-[8px] font-mono text-white/25">+ {rows.length - 4} weitere nicht berechenbare Assets</div>}
      </div>
    </div>
  );
}

function AssetRowItem({ row, tone, onSelectAsset }: { row: AssetRow; tone: 'best' | 'worst'; onSelectAsset?: (symbol: string) => void }) {
  const score = row.score ?? 0;
  const gaugeColor = tone === 'best' ? 'bg-emerald-400' : 'bg-rose-500';
  const reasoning = row.reasoning[0];
  return (
    <button
      type="button"
      onClick={() => onSelectAsset?.(row.symbol)}
      title={row.reasoning.join(' ') || undefined}
      className="w-full relative overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] p-2 pb-2.5 text-left hover:bg-white/5 transition-colors group"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AssetLogo symbol={row.symbol} size="xs" />
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white">{row.symbol}</div>
            <div className="truncate text-[9px] text-white/35">{row.name}</div>
          </div>
        </div>
        <div className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black font-mono ${tone === 'best' ? 'bg-emerald-400 text-black' : 'bg-rose-500 text-white'}`}>{row.score?.toFixed(1) ?? '—'}</div>
      </div>
      {reasoning && <div className="mt-1 truncate text-[9px] text-white/30 italic">{reasoning}</div>}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="h-1 flex-1 rounded-full bg-white/5 overflow-hidden"><div className={`h-full rounded-full ${gaugeColor} opacity-70 group-hover:opacity-100 transition-opacity`} style={{ width: `${Math.min(100, Math.max(2, score))}%` }} /></div>
        {row.providers.length > 0 && <span className="shrink-0 text-[8px] font-mono text-white/25">{row.providers.length} Quelle{row.providers.length === 1 ? '' : 'n'}</span>}
      </div>
    </button>
  );
}
