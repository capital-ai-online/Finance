import React from 'react';
import { Filter, RotateCcw, ShieldCheck } from 'lucide-react';
import { VerifiedNewsFeed } from './VerifiedNewsFeed';

interface RealtimeAiNewsfeedProps {
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick: () => void;
  selectedSymbol?: string;
  searchQuery?: string;
  categoryFilter?: string;
  sourceFilter?: string;
  prioritySymbols?: string[];
  onTriggerPushNotification?: (data: {
    symbol: string;
    name: string;
    score: number;
    oldScore: number;
    headline: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    type: string;
    isOnWatchlist: boolean;
  }) => void;
  watchlist?: string[];
  maxDisplayItems?: number;
}

interface NewsAssetOption {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
}

const ASSET_TYPE_LABEL: Record<NewsAssetOption['type'], string> = {
  crypto: 'Krypto',
  stock: 'Aktien',
  forex: 'Forex',
  commodity: 'Rohstoffe',
  index: 'Indizes',
  bond: 'Anleihen',
};

/**
 * Canonical UI projection for the AI Newsfeed Viewer.
 *
 * Supersession 2026-08-22 / 2026-08-25:
 * - retired hard-coded and dynamically fabricated financial headlines/insights;
 * - cryptocurrency.cv public REST and GDELT are aggregated behind /api/news;
 * - the default feed is independent from the Enterprise Scorer's currently selected asset;
 * - users can explicitly filter by Enterprise asset and publisher/news source;
 * - heuristic sentiment is presentation metadata only and never mutates an asset score;
 * - no push notification or ranking event is fabricated from an article.
 */
export function RealtimeAiNewsfeed(props: RealtimeAiNewsfeedProps) {
  const limit = Math.max(1, Math.min(10, props.maxDisplayItems ?? 7));
  const selectedScorerSymbol = props.selectedSymbol?.trim().toUpperCase() ?? '';
  const [assetFilter, setAssetFilter] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState(props.sourceFilter?.trim() ?? '');
  const [assets, setAssets] = React.useState<NewsAssetOption[]>([]);
  const [sources, setSources] = React.useState<string[]>([]);
  const [filterMetadataUnavailable, setFilterMetadataUnavailable] = React.useState(false);

  React.useEffect(() => {
    setSourceFilter(props.sourceFilter?.trim() ?? '');
  }, [props.sourceFilter]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchMetadata = async (url: string): Promise<unknown> => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`News filter metadata unavailable: ${url}`);
      return response.json();
    };

    const loadFilterMetadata = async () => {
      const [assetResult, sourceResult] = await Promise.allSettled([
        fetchMetadata('/api/news/assets'),
        fetchMetadata('/api/news/sources'),
      ]);
      if (cancelled) return;

      let metadataUnavailable = false;

      if (assetResult.status === 'fulfilled') {
        const assetBody = assetResult.value as { assets?: unknown };
        const nextAssets = Array.isArray(assetBody?.assets)
          ? assetBody.assets.filter((item: unknown): item is NewsAssetOption => {
              if (!item || typeof item !== 'object') return false;
              const candidate = item as Record<string, unknown>;
              return typeof candidate.symbol === 'string'
                && typeof candidate.name === 'string'
                && candidate.type !== 'bond'
                && ['crypto', 'stock', 'forex', 'commodity', 'index'].includes(String(candidate.type));
            })
          : [];
        setAssets(nextAssets);
      } else {
        metadataUnavailable = true;
        setAssets([]);
      }

      if (sourceResult.status === 'fulfilled') {
        const sourceBody = sourceResult.value as { sources?: unknown };
        const nextSources = Array.isArray(sourceBody?.sources)
          ? sourceBody.sources.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
          : [];
        setSources(nextSources);
      } else {
        metadataUnavailable = true;
        setSources([]);
      }

      setFilterMetadataUnavailable(metadataUnavailable);
    };

    void loadFilterMetadata();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const groupedAssets = React.useMemo(() => {
    const groups = new Map<NewsAssetOption['type'], NewsAssetOption[]>();
    for (const asset of assets) {
      const list = groups.get(asset.type) ?? [];
      list.push(asset);
      groups.set(asset.type, list);
    }
    return groups;
  }, [assets]);

  const hasActiveFilter = Boolean(assetFilter || sourceFilter);
  const canUseScorerSymbol = Boolean(
    selectedScorerSymbol && assets.some(asset => asset.symbol.toUpperCase() === selectedScorerSymbol),
  );

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          <span>Evidence-only Newsfeed · Multi-Asset · Public REST + GDELT · kein direkter Score-Impact</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wide text-white/35">Tier: {props.subscriptionTier}</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/35 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/75">
            <Filter className="h-4 w-4 text-aif-gold-DEFAULT" />
            <span>Newsfeed filtern</span>
            <span className="text-[10px] font-normal text-white/35">Standard: gesamtes Enterprise-Universum</span>
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setAssetFilter('');
                setSourceFilter('');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/60 transition-colors hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Filter zurücksetzen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-[10px] font-mono uppercase tracking-wide text-white/45">
            <span>Asset</span>
            <select
              value={assetFilter}
              onChange={event => setAssetFilter(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs font-sans normal-case tracking-normal text-white outline-none focus:border-aif-gold-DEFAULT/50"
              aria-label="Newsfeed nach Asset filtern"
            >
              <option value="">Alle Enterprise Assets</option>
              {([...groupedAssets.entries()] as Array<[NewsAssetOption['type'], NewsAssetOption[]]>).map(([type, entries]) => (
                <optgroup key={type} label={ASSET_TYPE_LABEL[type]}>
                  {entries.map(asset => (
                    <option key={asset.symbol} value={asset.symbol}>{asset.symbol} · {asset.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-[10px] font-mono uppercase tracking-wide text-white/45">
            <span>Nachrichtenherkunft</span>
            <select
              value={sourceFilter}
              onChange={event => setSourceFilter(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs font-sans normal-case tracking-normal text-white outline-none focus:border-aif-gold-DEFAULT/50"
              aria-label="Newsfeed nach Nachrichtenherkunft filtern"
            >
              <option value="">Alle Quellen</option>
              {sources.map(source => <option key={source} value={source}>{source}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-white/35">
          <span>Die Auswahl im Enterprise Scorer ändert den Newsfeed nicht automatisch.</span>
          {canUseScorerSymbol && selectedScorerSymbol !== assetFilter && (
            <button
              type="button"
              onClick={() => setAssetFilter(selectedScorerSymbol)}
              className="rounded-md border border-aif-gold-DEFAULT/20 bg-aif-gold-DEFAULT/5 px-2 py-1 font-mono text-aif-gold-DEFAULT hover:bg-aif-gold-DEFAULT/10"
            >
              Scorer-Asset {selectedScorerSymbol} filtern
            </button>
          )}
          {filterMetadataUnavailable && (
            <span className="text-amber-300">Filter-Metadaten teilweise nicht verfügbar; verfügbare Filter und der Feed bleiben nutzbar.</span>
          )}
        </div>
      </div>

      <VerifiedNewsFeed
        symbol={assetFilter}
        source={sourceFilter}
        limit={limit}
        title={assetFilter ? `AI Newsfeed Viewer · ${assetFilter}` : 'AI Newsfeed Viewer · Multi-Asset'}
      />
    </div>
  );
}