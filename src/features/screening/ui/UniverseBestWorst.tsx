import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Award, Clock, Compass, Layers, Orbit, Percent, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react';
import { AssetLogo } from '../../../components/AssetLogo';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import { buildUniverseAvailabilityProjection } from '../../../services/universeAvailability';

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
type AssetRow = {
  symbol: string;
  name: string;
  type: AssetType;
  score: number | null;
  status: string;
  providers: string[];
  evidenceIds: string[];
  screeningEligible?: boolean;
  reasoning: string[];
  reason?: string;
};
type CatalogAsset = {
  symbol?: string;
  name?: string;
  type?: AssetType;
  subtype?: string;
  instrumentKind?: string;
  origin?: string;
};

interface UniverseBestWorstProps { onSelectAsset?: (symbol: string) => void; }

const RANKING_CANDIDATE_LIMIT = 24;
const VERIFIED_SCORE_BATCH_LIMIT = 50;

const ASSET_CLASS_STYLE: Record<AssetType, { text: string; border: string; bg: string; label: string }> = {
  crypto: { text: 'text-asset-crypto', border: 'border-asset-crypto/25', bg: 'bg-asset-crypto/[0.05]', label: 'Crypto' },
  stock: { text: 'text-asset-stock', border: 'border-asset-stock/25', bg: 'bg-asset-stock/[0.05]', label: 'Aktien' },
  index: { text: 'text-asset-index', border: 'border-asset-index/25', bg: 'bg-asset-index/[0.05]', label: 'Indizes' },
  forex: { text: 'text-asset-forex', border: 'border-asset-forex/25', bg: 'bg-asset-forex/[0.05]', label: 'Forex' },
  commodity: { text: 'text-asset-commodity', border: 'border-asset-commodity/25', bg: 'bg-asset-commodity/[0.05]', label: 'Rohstoffe' },
  bond: { text: 'text-asset-bond', border: 'border-asset-bond/25', bg: 'bg-asset-bond/[0.05]', label: 'Anleihen' },
};

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

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function evidenceIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => typeof item === 'string' ? item : item?.evidenceId ?? item?.id)
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
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

function chunkVerifiedScoreCandidates(candidates: CatalogAsset[]): CatalogAsset[][] {
  const chunks: CatalogAsset[][] = [];
  for (let index = 0; index < candidates.length; index += VERIFIED_SCORE_BATCH_LIMIT) {
    chunks.push(candidates.slice(index, index + VERIFIED_SCORE_BATCH_LIMIT));
  }
  return chunks;
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
        const status = typeof result.body?.status === 'string' ? result.body.status : (result.ok ? 'SCORE_NOT_COMPUTABLE' : `HTTP_${result.status}`);
        const providers = stringList(result.body?.integrity?.providers ?? result.body?.providers);
        const evidenceIds = evidenceIdList(result.body?.integrity?.evidence ?? result.body?.evidenceIds);
        next[asset.symbol] = {
          symbol: asset.symbol,
          name: asset.name,
          type: 'crypto',
          score: status === 'READY' ? score : null,
          status,
          providers,
          evidenceIds,
          screeningEligible: status === 'READY' && providers.length > 0 && evidenceIds.length > 0,
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
          evidenceIds: [],
          screeningEligible: false,
          reasoning: [],
          reason: err?.message || 'Crypto-Scoring konnte nicht geladen werden.',
        };
      }
    }));

    for (const batch of chunkVerifiedScoreCandidates(traditional)) {
      const seen = new Set<string>();
      try {
        const symbols = batch.map(asset => asset.symbol).filter(Boolean).join(',');
        const body = await fetchJson(`/api/registry/assets/verified-scores?symbols=${encodeURIComponent(symbols)}`, undefined, 12000);
        for (const row of body?.results ?? []) {
          const asset = batch.find(item => item.symbol === row?.symbol);
          if (!asset?.symbol || !asset.name || !asset.type) continue;
          seen.add(asset.symbol);
          const score = finiteScore(row?.score);
          next[asset.symbol] = {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            score: row?.status === 'READY' ? score : null,
            status: typeof row?.status === 'string' ? row.status : 'SCORE_NOT_COMPUTABLE',
            providers: stringList(row?.providers),
            evidenceIds: evidenceIdList(row?.evidenceIds),
            screeningEligible: row?.screeningEligibility?.eligible === true,
            reasoning: reasoningList(row?.reasoning),
            reason: typeof row?.reason === 'string' ? row.reason : undefined,
          };
        }
        for (const asset of batch) {
          if (!asset.symbol || !asset.name || !asset.type || seen.has(asset.symbol)) continue;
          next[asset.symbol] = {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            score: null,
            status: 'SCORE_NOT_COMPUTABLE',
            providers: [],
            evidenceIds: [],
            screeningEligible: false,
            reasoning: [],
            reason: 'Kein Ergebnis im verifizierten Batch-Scoring zurückgegeben.',
          };
        }
      } catch (err: any) {
        for (const asset of batch) {
          if (!asset.symbol || !asset.name || !asset.type) continue;
          next[asset.symbol] = {
            symbol: asset.symbol,
            name: asset.name,
            type: asset.type,
            score: null,
            status: err?.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
            providers: [],
            evidenceIds: [],
            screeningEligible: false,
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
    const projection = buildUniverseAvailabilityProjection(
      candidates,
      allRows.map(row => ({
        symbol: row.symbol,
        assetType: row.type,
        status: row.status,
        providers: row.providers,
        evidenceIds: row.evidenceIds,
        screeningEligible: row.screeningEligible,
      })),
    );
    const universe = projection.classes.find(entry => entry.assetClass === group.type);
    const universeSla = universe?.topLevel ?? null;
    const subcategories = universe?.subcategories ?? [];
    return {
      ...group,
      best: readyRows.slice(0, 3),
      worst: readyRows.length >= 6 ? readyRows.slice(-3).reverse() : readyRows.slice(3, 6).reverse(),
      readyCount: readyRows.length,
      candidatesInGroup: candidates.length,
      unavailable,
      coverage: candidates.length ? Math.round((readyRows.length / candidates.length) * 100) : 0,
      universeSla,
      universeSubcategories: subcategories,
      availableSubcategories: subcategories.filter(item => item.status === 'AVAILABLE').length,
    };
  }), [scores, catalog]);

  const totalReady = grouped.reduce((sum, group) => sum + group.readyCount, 0);
  const totalCandidates = grouped.reduce((sum, group) => sum + group.candidatesInGroup, 0);
  const totalCoverage = totalCandidates ? Math.round((totalReady / totalCandidates) * 100) : 0;
  const availableClasses = grouped.filter(group => group.universeSla?.status === 'AVAILABLE').length;

  if (error) return <div className="ui-panel text-center"><AlertTriangle className="mx-auto text-status-reject" size={30} /><p className="mt-3 text-sm font-bold text-text-primary">Ladefehler</p><p className="mt-1 text-xs text-text-secondary">{error}</p></div>;

  return (
    <div className="ui-panel relative overflow-hidden" id="universe-scoring-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border pb-6 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-status-ai/15 text-status-ai border border-status-ai/25 uppercase">CAPITAL-AI QUANT-SYSTEM</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/25 uppercase flex items-center gap-1"><Activity size={10} /> Progressive Scoring</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-surface text-text-secondary border border-border uppercase flex items-center gap-1"><ShieldCheck size={10} /> {totalReady}/{totalCandidates || '–'} verifiziert · {totalCoverage}% Coverage</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-surface text-text-secondary border border-border uppercase flex items-center gap-1"><ShieldCheck size={10} /> Universe SLA {availableClasses}/{GROUPS.length} Klassen</span>
          </div>
          <h2 className="text-lg font-black font-display text-text-primary uppercase tracking-wider flex items-center gap-2"><Award className="text-score-ranking" size={18} /> Universe TOP Rankings</h2>
          <p className="text-xs text-text-secondary mt-2 max-w-2xl leading-relaxed">Bis zu {RANKING_CANDIDATE_LIMIT} priorisierte Kandidaten je Assetklasse werden evidence-basiert ausgewertet. Der 24er-SLA zählt ausschließlich READY-Assets mit Provider- und Evidence-Nachweis; fehlende Werte werden nie aufgefüllt.</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <button onClick={() => void refreshScores(catalog)} disabled={!catalog.length || scoreLoading} className="ui-hit min-h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-xs text-text-secondary disabled:opacity-40 hover:brightness-110 transition-colors"><RefreshCw size={13} className={scoreLoading ? 'animate-spin' : ''} /> Aktualisieren</button>
          <span className="text-[9px] font-mono text-text-secondary flex items-center gap-1"><Clock size={10} /> {scoreLoading ? 'lädt…' : `Stand: ${relativeTime(lastUpdated)}`}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grouped.map(group => {
          const Icon = group.icon;
          const universeSla = group.universeSla;
          const visual = ASSET_CLASS_STYLE[group.type];
          return (
            <div key={group.id} className={`rounded-xl border bg-background/30 p-5 min-h-72 flex flex-col ${visual.border}`}>
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className={`p-2 rounded-lg border ${visual.bg} ${visual.border} ${visual.text}`}><Icon size={16} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-black uppercase text-text-primary">{group.name}</h3>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ${visual.bg} ${visual.border} ${visual.text}`}>{visual.label}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">{group.description}</p>
                  {group.universeSubcategories.length > 0 && <p className="text-[8px] font-mono text-text-secondary mt-1">Unterkategorien: {group.availableSubcategories}/{group.universeSubcategories.length} erfüllen das 24er-Ziel</p>}
                </div>
                <span className={`shrink-0 text-[9px] font-mono font-bold rounded border px-1.5 py-0.5 ${visual.bg} ${visual.border} ${visual.text}`} title={universeSla?.reason}>
                  {universeSla ? `${universeSla.availableCount}/${universeSla.targetCount} · ${universeSla.status}` : `${group.readyCount}/${group.candidatesInGroup || '–'}`}
                </span>
              </div>
              <div className="mt-5 space-y-5 flex-1">
                <AssetBlock title="Top 3 Best" rows={group.best} tone="best" onSelectAsset={onSelectAsset} pending={scoreLoading} />
                <AssetBlock title="Top 3 Worst" rows={group.worst} tone="worst" onSelectAsset={onSelectAsset} pending={scoreLoading} />
                <UnavailableBlock rows={group.unavailable} pending={scoreLoading} />
              </div>
            </div>
          );
        })}
      </div>
      {catalogLoading && <div className="mt-6 text-[10px] font-mono text-text-secondary">Asset-Katalog wird geladen…</div>}
    </div>
  );
}

function AssetBlock({ title, rows, tone, onSelectAsset, pending }: { title: string; rows: AssetRow[]; tone: 'best' | 'worst'; onSelectAsset?: (symbol: string) => void; pending: boolean }) {
  return (
    <div>
      <div className={`mb-2.5 text-[9px] font-mono font-black uppercase ${tone === 'best' ? 'text-score-best' : 'text-score-worst'}`}>{title}</div>
      <div className="space-y-2">
        {rows.length
          ? rows.map(row => <AssetRowItem key={row.symbol} row={row} tone={tone} onSelectAsset={onSelectAsset} />)
          : <div className="rounded-lg border border-border bg-surface/40 p-3 text-[9px] text-text-secondary">{pending ? 'Verifizierte Scores werden nachgeladen…' : 'Nicht genügend READY-Scores für dieses Ranking'}</div>}
      </div>
    </div>
  );
}

function UnavailableBlock({ rows, pending }: { rows: AssetRow[]; pending: boolean }) {
  if (pending || rows.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 text-[9px] font-mono font-black uppercase text-score-warning">Nicht berechenbar · {rows.length}</div>
      <div className="space-y-2">
        {rows.slice(0, 4).map(row => (
          <div key={row.symbol} className="rounded-lg border border-score-warning/10 bg-score-warning/[0.03] px-3 py-2" title={row.reason}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-text-primary/70">{row.symbol}</span>
              <StatusBadge status={row.status} />
            </div>
            {row.reason && <div className="mt-1 truncate text-[8px] text-text-secondary">{row.reason}</div>}
          </div>
        ))}
        {rows.length > 4 && <div className="text-[8px] font-mono text-text-secondary">+ {rows.length - 4} weitere nicht berechenbare Assets</div>}
      </div>
    </div>
  );
}

function AssetRowItem({ row, tone, onSelectAsset }: { row: AssetRow; tone: 'best' | 'worst'; onSelectAsset?: (symbol: string) => void }) {
  const score = row.score ?? 0;
  const gaugeColor = tone === 'best' ? 'bg-score-best' : 'bg-score-worst';
  const scoreBadge = tone === 'best' ? 'bg-score-best text-background' : 'bg-score-worst text-background';
  const reasoning = row.reasoning[0];
  const visual = ASSET_CLASS_STYLE[row.type];
  return (
    <button
      type="button"
      onClick={() => onSelectAsset?.(row.symbol)}
      title={row.reasoning.join(' ') || undefined}
      className={`w-full relative overflow-hidden rounded-lg border bg-surface/40 p-2.5 min-h-11 ui-hit text-left hover:brightness-110 transition-all group ${visual.border}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AssetLogo symbol={row.symbol} size="xs" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="text-[11px] font-bold text-text-primary">{row.symbol}</div>
              <span className={`h-1.5 w-1.5 rounded-full ${visual.bg} ${visual.text}`} aria-label={visual.label} />
            </div>
            <div className="truncate text-[9px] text-text-secondary">{row.name}</div>
          </div>
        </div>
        <div className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black font-mono ${scoreBadge}`}>{row.score?.toFixed(1) ?? '—'}</div>
      </div>
      {reasoning && <div className="mt-1 truncate text-[9px] text-text-secondary italic">{reasoning}</div>}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="h-1 flex-1 rounded-full bg-border overflow-hidden"><div className={`h-full rounded-full ${gaugeColor} opacity-70 group-hover:opacity-100 transition-opacity`} style={{ width: `${Math.min(100, Math.max(2, score))}%` }} /></div>
        {row.providers.length > 0 && <span className="shrink-0 text-[8px] font-mono text-text-secondary">{row.providers.length} Quelle{row.providers.length === 1 ? '' : 'n'}</span>}
      </div>
    </button>
  );
}
