import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  Clock,
  Compass,
  Layers,
  Orbit,
  Percent,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Zap,
  MessageSquare,
  GitBranch,
} from 'lucide-react';
import { AssetLogo } from '../../../components/AssetLogo';
import { StatusBadge } from '../../../shared/ui/StatusBadge';
import { buildUniverseAvailabilityProjection } from '../../../services/universeAvailability';

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

type BackendRankingMeta = {
  authority: 'CrossAssetRanking';
  status: string;
  cohortKey: string | null;
  comparisonBasis: string | null;
  crossCohortOrder: false;
  rank: number | null;
  rankingValue: number | null;
  exclusionReason: string | null;
  exclusionDetail: string | null;
};

type AssetRow = {
  symbol: string;
  name: string;
  type: AssetType;
  assetId?: string;
  score: number | null;
  status: string;
  providers: string[];
  evidenceIds: string[];
  screeningEligible?: boolean;
  reasoning: string[];
  reason?: string;
  sentiment: number | null;
  sentimentLabel: string;
  momentum: number | null;
  momentumLabel: string;
  leadingPattern: string;
  patternDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | null;
  patternStrength: 'strong' | 'medium' | 'weak' | null;
  backendRanking: BackendRankingMeta | null;
};

type CatalogAsset = {
  symbol?: string;
  name?: string;
  type?: AssetType;
  subtype?: string;
  instrumentKind?: string;
  origin?: string;
};

interface RankingBoardProps {
  onSelectAsset?: (symbol: string) => void;
}

const RANKING_CANDIDATE_LIMIT = 24;
const VERIFIED_SCORE_BATCH_LIMIT = 50;

const ASSET_CLASS_STYLE: Record<
  AssetType,
  { text: string; border: string; bg: string; label: string }
> = {
  crypto: {
    text: 'text-asset-crypto',
    border: 'border-asset-crypto/25',
    bg: 'bg-asset-crypto/[0.05]',
    label: 'Crypto',
  },
  stock: {
    text: 'text-asset-stock',
    border: 'border-asset-stock/25',
    bg: 'bg-asset-stock/[0.05]',
    label: 'Aktien',
  },
  index: {
    text: 'text-asset-index',
    border: 'border-asset-index/25',
    bg: 'bg-asset-index/[0.05]',
    label: 'Indizes',
  },
  forex: {
    text: 'text-asset-forex',
    border: 'border-asset-forex/25',
    bg: 'bg-asset-forex/[0.05]',
    label: 'Forex',
  },
  commodity: {
    text: 'text-asset-commodity',
    border: 'border-asset-commodity/25',
    bg: 'bg-asset-commodity/[0.05]',
    label: 'Rohstoffe',
  },
  bond: {
    text: 'text-asset-bond',
    border: 'border-asset-bond/25',
    bg: 'bg-asset-bond/[0.05]',
    label: 'Anleihen',
  },
};

const GROUPS = [
  {
    id: 'crypto',
    name: 'Crypto Cosmos',
    type: 'crypto' as const,
    icon: Orbit,
    description: 'Digitale Leitwährungen & Token',
  },
  {
    id: 'stock',
    name: 'Stock Galaxy',
    type: 'stock' as const,
    icon: TrendingUp,
    description: 'Aktien & Bluechips',
  },
  {
    id: 'index',
    name: 'Index World',
    type: 'index' as const,
    icon: Compass,
    description: 'Globale Indizes',
  },
  {
    id: 'forex',
    name: 'Forex Nebula',
    type: 'forex' as const,
    icon: Compass,
    description: 'Globale Währungspaare',
  },
  {
    id: 'commodity',
    name: 'Commodity Nebula',
    type: 'commodity' as const,
    icon: Layers,
    description: 'Edelmetalle & Ressourcen',
  },
  {
    id: 'bond',
    name: 'Bond Horizon',
    type: 'bond' as const,
    icon: Percent,
    description: 'Staatsanleihen & Sovereign-Benchmarks',
  },
];

function finiteScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return Number((value <= 10 ? value * 10 : value).toFixed(1));
}

function finite0to100(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = value <= 1 && value >= 0 ? value * 100 : value;
  if (n < 0 || n > 100) return null;
  return Number(n.toFixed(1));
}

function finitePositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function evidenceIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => (typeof item === 'string' ? item : item?.evidenceId ?? item?.id))
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function reasoningList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 3);
}

function extractAttachedBackendRanking(value: any): BackendRankingMeta | null {
  if (!value || value.authority !== 'CrossAssetRanking' || value.crossCohortOrder !== false) {
    return null;
  }

  return {
    authority: 'CrossAssetRanking',
    status: typeof value.status === 'string' ? value.status : 'NO_RANKABLE_ASSETS',
    cohortKey: typeof value.cohortKey === 'string' && value.cohortKey.length > 0 ? value.cohortKey : null,
    comparisonBasis:
      typeof value.comparisonBasis === 'string' && value.comparisonBasis.length > 0
        ? value.comparisonBasis
        : null,
    crossCohortOrder: false,
    rank: finitePositiveInteger(value.rank),
    rankingValue: finiteNumber(value.rankingValue),
    exclusionReason: typeof value.exclusionReason === 'string' ? value.exclusionReason : null,
    exclusionDetail: typeof value.exclusionDetail === 'string' ? value.exclusionDetail : null,
  };
}

function buildBackendRankingLookup(projection: any): Map<string, BackendRankingMeta> {
  const lookup = new Map<string, BackendRankingMeta>();
  const result = projection?.result;
  if (projection?.authority !== 'CrossAssetRanking' || !result) return lookup;

  for (const cohort of Array.isArray(result.cohorts) ? result.cohorts : []) {
    if (cohort?.crossCohortOrder !== false || typeof cohort?.key !== 'string') continue;
    for (const entry of Array.isArray(cohort.entries) ? cohort.entries : []) {
      if (typeof entry?.assetId !== 'string') continue;
      lookup.set(entry.assetId, {
        authority: 'CrossAssetRanking',
        status: typeof result.status === 'string' ? result.status : 'READY',
        cohortKey: cohort.key,
        comparisonBasis: typeof cohort.comparisonBasis === 'string' ? cohort.comparisonBasis : null,
        crossCohortOrder: false,
        rank: finitePositiveInteger(entry.rank),
        rankingValue: finiteNumber(entry.rankingValue),
        exclusionReason: null,
        exclusionDetail: null,
      });
    }
  }

  for (const excluded of Array.isArray(result.excluded) ? result.excluded : []) {
    if (typeof excluded?.assetId !== 'string' || lookup.has(excluded.assetId)) continue;
    lookup.set(excluded.assetId, {
      authority: 'CrossAssetRanking',
      status: typeof result.status === 'string' ? result.status : 'NO_RANKABLE_ASSETS',
      cohortKey: null,
      comparisonBasis: null,
      crossCohortOrder: false,
      rank: null,
      rankingValue: null,
      exclusionReason: typeof excluded.reason === 'string' ? excluded.reason : null,
      exclusionDetail: typeof excluded.detail === 'string' ? excluded.detail : null,
    });
  }

  return lookup;
}

function extractSentiment(body: any): { score: number | null; label: string } {
  const raw =
    body?.sentiment?.score ??
    body?.sentiment_score ??
    body?.research?.sentiment?.score ??
    body?.factors?.sentiment ??
    null;
  const score = finite0to100(raw);
  if (score === null) return { score: null, label: '—' };
  if (score >= 65) return { score, label: 'Bullish' };
  if (score <= 35) return { score, label: 'Bearish' };
  return { score, label: 'Neutral' };
}

function extractMomentum(body: any): { score: number | null; label: string } {
  const raw =
    body?.momentum?.score ??
    body?.momentum_score ??
    body?.research?.momentum?.score ??
    body?.factors?.momentum ??
    null;
  const score = finite0to100(raw);
  if (score === null) return { score: null, label: '—' };
  if (score >= 65) return { score, label: 'Strong ↑' };
  if (score <= 35) return { score, label: 'Weak ↓' };
  return { score, label: 'Stable' };
}

function extractLeadingPattern(body: any): {
  name: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | null;
  strength: 'strong' | 'medium' | 'weak' | null;
} {
  const name =
    (typeof body?.pattern === 'string' && body.pattern) ||
    (typeof body?.leading_pattern === 'string' && body.leading_pattern) ||
    (typeof body?.leadingPattern === 'string' && body.leadingPattern) ||
    (typeof body?.dominant_pattern === 'string' && body.dominant_pattern) ||
    (typeof body?.research?.pattern?.direction === 'string' && body.research.pattern.direction) ||
    (typeof body?.pattern?.name === 'string' && body.pattern.name) ||
    null;

  if (!name || name === 'NO PATTERN' || name === 'NONE') {
    return { name: 'NO PATTERN', direction: null, strength: null };
  }

  const dirRaw = (
    body?.pattern_direction ||
    body?.patternDirection ||
    body?.research?.pattern?.direction ||
    body?.pattern?.direction ||
    ''
  )
    .toString()
    .toUpperCase();
  let direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | null = null;
  if (dirRaw.includes('BULL')) direction = 'BULLISH';
  else if (dirRaw.includes('BEAR')) direction = 'BEARISH';
  else if (dirRaw.includes('NEUT')) direction = 'NEUTRAL';
  else if (/engulfing|hammer|morning|bullish/i.test(name)) direction = 'BULLISH';
  else if (/shooting|evening|bearish|hanging/i.test(name)) direction = 'BEARISH';

  const strengthRaw = (body?.pattern_strength || body?.patternStrength || body?.pattern?.strength || '')
    .toString()
    .toLowerCase();
  let strength: 'strong' | 'medium' | 'weak' | null = null;
  if (strengthRaw.includes('strong')) strength = 'strong';
  else if (strengthRaw.includes('medium') || strengthRaw.includes('mod')) strength = 'medium';
  else if (strengthRaw.includes('weak')) strength = 'weak';
  else if (typeof body?.research?.pattern?.meanPatternQuality === 'number') {
    const q = body.research.pattern.meanPatternQuality;
    strength = q >= 0.7 ? 'strong' : q >= 0.4 ? 'medium' : 'weak';
  }

  return { name: String(name).slice(0, 28), direction, strength };
}

function selectRankingCandidates(sourceCatalog: CatalogAsset[], type: AssetType): CatalogAsset[] {
  return sourceCatalog
    .filter((asset) => asset.type === type && asset.symbol && asset.name)
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

async function fetchJsonWithStatus(
  url: string,
  init?: RequestInit,
  timeoutMs = 6500,
): Promise<{ ok: boolean; status: number; body: any }> {
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

function toAssetRow(
  symbol: string,
  name: string,
  type: AssetType,
  body: any,
  statusOverride?: string,
  rankingOverride?: BackendRankingMeta | null,
): AssetRow {
  const status =
    typeof body?.status === 'string'
      ? body.status
      : statusOverride || 'SCORE_NOT_COMPUTABLE';
  const score = finiteScore(body?.final_score ?? body?.score);
  const sentiment = extractSentiment(body);
  const momentum = extractMomentum(body);
  const pattern = extractLeadingPattern(body);
  const backendRanking =
    rankingOverride === undefined ? extractAttachedBackendRanking(body?.backendRanking) : rankingOverride;
  const rankingReason = backendRanking?.exclusionDetail ?? backendRanking?.exclusionReason ?? undefined;

  return {
    symbol,
    name,
    type,
    assetId: typeof body?.assetId === 'string' ? body.assetId : undefined,
    score: status === 'READY' ? score : null,
    status,
    providers: stringList(body?.integrity?.providers ?? body?.providers),
    evidenceIds: evidenceIdList(body?.integrity?.evidence ?? body?.evidenceIds),
    screeningEligible: status === 'READY' && (body?.screeningEligibility?.eligible !== false),
    reasoning: reasoningList(body?.reasoning),
    reason: typeof body?.reason === 'string' ? body.reason : rankingReason,
    sentiment: sentiment.score,
    sentimentLabel: sentiment.label,
    momentum: momentum.score,
    momentumLabel: momentum.label,
    leadingPattern: pattern.name,
    patternDirection: pattern.direction,
    patternStrength: pattern.strength,
    backendRanking,
  };
}

export function RankingBoard({ onSelectAsset }: RankingBoardProps) {
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
      setCatalog(
        body.filter(
          (item: any) =>
            typeof item?.symbol === 'string' &&
            typeof item?.name === 'string' &&
            typeof item?.type === 'string',
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Asset-Katalog konnte nicht geladen werden.');
    } finally {
      setCatalogLoading(false);
    }
  }

  async function refreshScores(sourceCatalog: CatalogAsset[]) {
    setScoreLoading(true);
    const candidates = GROUPS.flatMap((group) => selectRankingCandidates(sourceCatalog, group.type));
    const crypto = candidates.filter((asset) => asset.type === 'crypto');
    const traditional = candidates.filter((asset) => asset.type !== 'crypto');
    const next: Record<string, AssetRow> = {};

    if (crypto.length > 0) {
      try {
        const result = await fetchJsonWithStatus(
          '/api/crypto/score',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assets: crypto.map((asset) => ({ symbol: asset.symbol, asset_name: asset.name })),
            }),
          },
          18000,
        );
        if (!result.ok || !Array.isArray(result.body?.results)) {
          throw new Error(`HTTP ${result.status}`);
        }

        const rankingByAssetId = buildBackendRankingLookup(result.body?.backendRanking);
        const seen = new Set<string>();
        for (const row of result.body.results) {
          const rowSymbol = typeof row?.symbol === 'string' ? row.symbol.toUpperCase() : '';
          const asset = crypto.find((item) => item.symbol?.toUpperCase() === rowSymbol);
          if (!asset?.symbol || !asset.name) continue;
          seen.add(asset.symbol);
          const ranking =
            typeof row?.assetId === 'string' ? rankingByAssetId.get(row.assetId) ?? null : null;
          next[asset.symbol] = toAssetRow(asset.symbol, asset.name, 'crypto', row, undefined, ranking);
        }

        for (const asset of crypto) {
          if (!asset.symbol || !asset.name || seen.has(asset.symbol)) continue;
          next[asset.symbol] = toAssetRow(asset.symbol, asset.name, 'crypto', {
            status: 'SCORE_NOT_COMPUTABLE',
            reason: 'Kein Ergebnis im verifizierten Crypto-Batch-Scoring zurückgegeben.',
          });
        }
      } catch (err: any) {
        for (const asset of crypto) {
          if (!asset.symbol || !asset.name) continue;
          next[asset.symbol] = toAssetRow(
            asset.symbol,
            asset.name,
            'crypto',
            {},
            err?.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
          );
          next[asset.symbol].reason = err?.message || 'Crypto-Batch-Scoring konnte nicht geladen werden.';
        }
      }
    }

    for (const batch of chunkVerifiedScoreCandidates(traditional)) {
      const seen = new Set<string>();
      try {
        const symbols = batch
          .map((asset) => asset.symbol)
          .filter(Boolean)
          .join(',');
        const body = await fetchJson(
          `/api/registry/assets/verified-scores?symbols=${encodeURIComponent(symbols)}`,
          undefined,
          12000,
        );
        for (const row of body?.results ?? []) {
          const asset = batch.find((item) => item.symbol === row?.symbol);
          if (!asset?.symbol || !asset.name || !asset.type) continue;
          seen.add(asset.symbol);
          next[asset.symbol] = toAssetRow(asset.symbol, asset.name, asset.type, row);
        }
        for (const asset of batch) {
          if (!asset.symbol || !asset.name || !asset.type || seen.has(asset.symbol)) continue;
          next[asset.symbol] = toAssetRow(asset.symbol, asset.name, asset.type, {
            status: 'SCORE_NOT_COMPUTABLE',
            reason: 'Kein Ergebnis im verifizierten Batch-Scoring zurückgegeben.',
          });
        }
      } catch (err: any) {
        for (const asset of batch) {
          if (!asset.symbol || !asset.name || !asset.type) continue;
          next[asset.symbol] = toAssetRow(
            asset.symbol,
            asset.name,
            asset.type,
            {},
            err?.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
          );
          next[asset.symbol].reason = err?.message || 'Verifiziertes Batch-Scoring konnte nicht geladen werden.';
        }
      }
    }

    setScores(next);
    setScoreLoading(false);
    setLastUpdated(new Date());
  }

  useEffect(() => {
    void loadCatalog();
  }, []);
  useEffect(() => {
    if (catalog.length) void refreshScores(catalog);
  }, [catalog]);

  useEffect(() => {
    const interval = setInterval(() => forceTick((tick) => tick + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const grouped = useMemo(
    () =>
      GROUPS.map((group) => {
        const candidates = selectRankingCandidates(catalog, group.type);
        const allRows = Object.values(scores).filter((row) => row.type === group.type);
        const readyRows = allRows.filter((row) => row.status === 'READY' && row.score !== null);
        const rankableRows = readyRows.filter(
          (row) =>
            row.backendRanking?.authority === 'CrossAssetRanking' &&
            row.backendRanking.crossCohortOrder === false &&
            row.backendRanking.rank !== null &&
            row.backendRanking.cohortKey !== null,
        );
        const cohortKeys = Array.from(
          new Set(
            rankableRows
              .map((row) => row.backendRanking?.cohortKey)
              .filter((key): key is string => typeof key === 'string' && key.length > 0),
          ),
        );
        const rankingCohortConflict = cohortKeys.length > 1;
        const backendOrderedRows = rankingCohortConflict
          ? []
          : [...rankableRows].sort(
              (a, b) =>
                (a.backendRanking?.rank ?? Number.MAX_SAFE_INTEGER) -
                (b.backendRanking?.rank ?? Number.MAX_SAFE_INTEGER),
            );
        const unavailable = allRows.filter(
          (row) =>
            row.status !== 'READY' ||
            row.score === null ||
            row.backendRanking === null ||
            row.backendRanking.rank === null ||
            row.backendRanking.cohortKey === null ||
            rankingCohortConflict,
        );
        const projection = buildUniverseAvailabilityProjection(
          candidates,
          allRows.map((row) => ({
            symbol: row.symbol,
            assetType: row.type,
            status: row.status,
            providers: row.providers,
            evidenceIds: row.evidenceIds,
            screeningEligible: row.screeningEligible,
          })),
        );
        const universe = projection.classes.find((entry) => entry.assetClass === group.type);
        const universeSla = universe?.topLevel ?? null;
        const subcategories = universe?.subcategories ?? [];
        return {
          ...group,
          best: backendOrderedRows.slice(0, 3),
          worst:
            backendOrderedRows.length >= 6
              ? backendOrderedRows.slice(-3).reverse()
              : backendOrderedRows.slice(3, 6).reverse(),
          readyCount: readyRows.length,
          candidatesInGroup: candidates.length,
          unavailable,
          coverage: candidates.length ? Math.round((readyRows.length / candidates.length) * 100) : 0,
          universeSla,
          universeSubcategories: subcategories,
          availableSubcategories: subcategories.filter((item) => item.status === 'AVAILABLE').length,
        };
      }),
    [scores, catalog],
  );

  const totalReady = grouped.reduce((sum, group) => sum + group.readyCount, 0);
  const totalCandidates = grouped.reduce((sum, group) => sum + group.candidatesInGroup, 0);
  const totalCoverage = totalCandidates ? Math.round((totalReady / totalCandidates) * 100) : 0;
  const availableClasses = grouped.filter((group) => group.universeSla?.status === 'AVAILABLE').length;

  if (error)
    return (
      <div className="ui-panel text-center">
        <AlertTriangle className="mx-auto text-status-reject" size={30} />
        <p className="mt-3 text-sm font-bold text-text-primary">Ladefehler</p>
        <p className="mt-1 text-xs text-text-secondary">{error}</p>
      </div>
    );

  return (
    <div className="ui-panel relative overflow-hidden" id="ranking-board-root">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border pb-6 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-status-ai/15 text-status-ai border border-status-ai/25 uppercase">
              CAPITAL-AI QUANT-SYSTEM
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/25 uppercase flex items-center gap-1">
              <Activity size={10} /> Ranking Board
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-surface text-text-secondary border border-border uppercase flex items-center gap-1">
              <ShieldCheck size={10} /> {totalReady}/{totalCandidates || '–'} verifiziert · {totalCoverage}% Coverage
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-surface text-text-secondary border border-border uppercase flex items-center gap-1">
              <ShieldCheck size={10} /> Universe SLA {availableClasses}/{GROUPS.length} Klassen
            </span>
          </div>
          <h2 className="text-lg font-black font-display text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Award className="text-score-ranking" size={18} /> Ranking Board · Top & Worst 3
          </h2>
          <p className="text-xs text-text-secondary mt-2 max-w-2xl leading-relaxed">
            Bis zu {RANKING_CANDIDATE_LIMIT} priorisierte Kandidaten je Assetklasse. Anzeige von Score,
            Sentiment, Momentum und führendem Pattern. Nur READY-Assets mit Provider- und
            Evidence-Nachweis; fehlende Werte werden nie aufgefüllt; die Reihenfolge folgt ausschließlich
            backend-autoritativen Rank-Werten.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <button
            onClick={() => void refreshScores(catalog)}
            disabled={!catalog.length || scoreLoading}
            className="ui-hit min-h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-xs text-text-secondary disabled:opacity-40 hover:brightness-110 transition-colors"
          >
            <RefreshCw size={13} className={scoreLoading ? 'animate-spin' : ''} /> Aktualisieren
          </button>
          <span className="text-[9px] font-mono text-text-secondary flex items-center gap-1">
            <Clock size={10} /> {scoreLoading ? 'lädt…' : `Stand: ${relativeTime(lastUpdated)}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grouped.map((group) => {
          const Icon = group.icon;
          const universeSla = group.universeSla;
          const visual = ASSET_CLASS_STYLE[group.type];
          return (
            <div
              key={group.id}
              className={`rounded-xl border bg-background/30 p-5 min-h-72 flex flex-col ${visual.border}`}
            >
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className={`p-2 rounded-lg border ${visual.bg} ${visual.border} ${visual.text}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-black uppercase text-text-primary">{group.name}</h3>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ${visual.bg} ${visual.border} ${visual.text}`}
                    >
                      {visual.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-secondary mt-0.5">{group.description}</p>
                  {group.universeSubcategories.length > 0 && (
                    <p className="text-[8px] font-mono text-text-secondary mt-1">
                      Unterkategorien: {group.availableSubcategories}/{group.universeSubcategories.length}{' '}
                      erfüllen das 24er-Ziel
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-[9px] font-mono font-bold rounded border px-1.5 py-0.5 ${visual.bg} ${visual.border} ${visual.text}`}
                  title={universeSla?.reason}
                >
                  {universeSla
                    ? `${universeSla.availableCount}/${universeSla.targetCount} · ${universeSla.status}`
                    : `${group.readyCount}/${group.candidatesInGroup || '–'}`}
                </span>
              </div>
              <div className="mt-5 space-y-5 flex-1">
                <AssetBlock
                  title="Top 3 Best"
                  rows={group.best}
                  tone="best"
                  onSelectAsset={onSelectAsset}
                  pending={scoreLoading}
                />
                <AssetBlock
                  title="Top 3 Worst"
                  rows={group.worst}
                  tone="worst"
                  onSelectAsset={onSelectAsset}
                  pending={scoreLoading}
                />
                <UnavailableBlock rows={group.unavailable} pending={scoreLoading} />
              </div>
            </div>
          );
        })}
      </div>
      {catalogLoading && (
        <div className="mt-6 text-[10px] font-mono text-text-secondary">Asset-Katalog wird geladen…</div>
      )}
    </div>
  );
}

function AssetBlock({
  title,
  rows,
  tone,
  onSelectAsset,
  pending,
}: {
  title: string;
  rows: AssetRow[];
  tone: 'best' | 'worst';
  onSelectAsset?: (symbol: string) => void;
  pending: boolean;
}) {
  return (
    <div>
      <div
        className={`mb-2.5 text-[9px] font-mono font-black uppercase ${
          tone === 'best' ? 'text-score-best' : 'text-score-worst'
        }`}
      >
        {title}
      </div>
      <div className="space-y-2">
        {rows.length ? (
          rows.map((row) => (
            <AssetRowItem key={row.symbol} row={row} tone={tone} onSelectAsset={onSelectAsset} />
          ))
        ) : (
          <div className="rounded-lg border border-border bg-surface/40 p-3 text-[9px] text-text-secondary">
            {pending
              ? 'Verifizierte Scores werden nachgeladen…'
              : 'Kein eindeutiges backend-autoritatives Ranking für diese Kohorte verfügbar'}
          </div>
        )}
      </div>
    </div>
  );
}

function UnavailableBlock({ rows, pending }: { rows: AssetRow[]; pending: boolean }) {
  if (pending || rows.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 text-[9px] font-mono font-black uppercase text-score-warning">
        Nicht berechenbar / nicht rankbar · {rows.length}
      </div>
      <div className="space-y-2">
        {rows.slice(0, 4).map((row) => (
          <div
            key={row.symbol}
            className="rounded-lg border border-score-warning/10 bg-score-warning/[0.03] px-3 py-2"
            title={row.reason}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-text-primary/70">{row.symbol}</span>
              <StatusBadge status={row.status} />
            </div>
            {row.reason && <div className="mt-1 truncate text-[8px] text-text-secondary">{row.reason}</div>}
          </div>
        ))}
        {rows.length > 4 && (
          <div className="text-[8px] font-mono text-text-secondary">
            + {rows.length - 4} weitere nicht rankbare / berechenbare Assets
          </div>
        )}
      </div>
    </div>
  );
}

function PatternBadge({
  name,
  direction,
  strength,
}: {
  name: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | null;
  strength: 'strong' | 'medium' | 'weak' | null;
}) {
  // Missing pattern evidence stays absent by contract. Never synthesize a
  // placeholder badge or infer a BUY/SELL signal from missing data.
  if (name === 'NO PATTERN' || !name) return null;

  const dirColor =
    direction === 'BULLISH'
      ? 'text-score-best border-score-best/30 bg-score-best/10'
      : direction === 'BEARISH'
        ? 'text-score-worst border-score-worst/30 bg-score-worst/10'
        : 'text-text-secondary border-border bg-surface/60';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ${dirColor}`}
      title={strength ? `Strength: ${strength}` : undefined}
    >
      <GitBranch size={9} />
      {name}
      {strength && <span className="opacity-70">·{strength[0].toUpperCase()}</span>}
    </span>
  );
}

function MetricChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone?: 'best' | 'worst' | 'neutral';
}) {
  const color =
    tone === 'best'
      ? 'text-score-best'
      : tone === 'worst'
        ? 'text-score-worst'
        : 'text-text-secondary';
  return (
    <span className={`inline-flex items-center gap-1 text-[8px] font-mono ${color}`} title={label}>
      <Icon size={9} className="opacity-70" />
      <span className="opacity-60">{label}:</span>
      <span className="font-bold">{value}</span>
    </span>
  );
}

function AssetRowItem({
  row,
  tone,
  onSelectAsset,
}: {
  row: AssetRow;
  tone: 'best' | 'worst';
  onSelectAsset?: (symbol: string) => void;
}) {
  const score = row.score ?? 0;
  const gaugeColor = tone === 'best' ? 'bg-score-best' : 'bg-score-worst';
  const scoreBadge = tone === 'best' ? 'bg-score-best text-background' : 'bg-score-worst text-background';
  const visual = ASSET_CLASS_STYLE[row.type];

  const sentimentTone =
    row.sentiment !== null && row.sentiment >= 65
      ? 'best'
      : row.sentiment !== null && row.sentiment <= 35
        ? 'worst'
        : 'neutral';
  const momentumTone =
    row.momentum !== null && row.momentum >= 65
      ? 'best'
      : row.momentum !== null && row.momentum <= 35
        ? 'worst'
        : 'neutral';

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
              <span
                className={`h-1.5 w-1.5 rounded-full ${visual.bg} ${visual.text}`}
                aria-label={visual.label}
              />
            </div>
            <div className="truncate text-[9px] text-text-secondary">{row.name}</div>
          </div>
        </div>
        <div className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black font-mono ${scoreBadge}`}>
          {row.score?.toFixed(1) ?? '—'}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <MetricChip
          icon={MessageSquare}
          label="Sent"
          value={row.sentiment !== null ? `${row.sentiment.toFixed(0)} ${row.sentimentLabel}` : row.sentimentLabel}
          tone={sentimentTone}
        />
        <MetricChip
          icon={Zap}
          label="Mom"
          value={row.momentum !== null ? `${row.momentum.toFixed(0)} ${row.momentumLabel}` : row.momentumLabel}
          tone={momentumTone}
        />
        <PatternBadge
          name={row.leadingPattern}
          direction={row.patternDirection}
          strength={row.patternStrength}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full ${gaugeColor} opacity-70 group-hover:opacity-100 transition-opacity`}
            style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
          />
        </div>
        {row.providers.length > 0 && (
          <span className="shrink-0 text-[8px] font-mono text-text-secondary">
            {row.providers.length} Quelle{row.providers.length === 1 ? '' : 'n'}
          </span>
        )}
      </div>
    </button>
  );
}

export default RankingBoard;