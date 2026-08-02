import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { AssetLogo } from './AssetLogo';
import { UserSession } from '../App';

interface MarketScreenerProps {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
  userSession?: UserSession;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  categoryFilter?: string;
  setCategoryFilter?: (c: string) => void;
  userEmail?: string;
}

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

type CatalogAsset = {
  symbol: string;
  name: string;
  type: AssetType;
  subtype?: string;
  aliases?: string[];
  origin?: 'legacy-registry' | 'catalog-expansion';
  screeningContract?: 'crypto-provenance' | 'traditional-provenance' | 'catalog-only';
  evidenceScoringContract?: string | null;
  providerMappingContract?: string | null;
};

type ScreeningResult = {
  symbol: string;
  assetName: string;
  assetType: AssetType;
  status: string;
  score: number | null;
  providers: string[];
  evidenceIds: string[];
  correlationId: string | null;
  reasoning: string[];
  pattern: string;
  macroStatus: string | null;
  macroRegime: string | null;
  scoreImpactEnabled: false;
};

const INTERVAL_OPTIONS = [
  { value: '15m', label: '15 Minuten' },
  { value: '1h', label: '1 Stunde' },
  { value: '4h', label: '4 Stunden' },
  { value: '1d', label: 'Täglich' },
  { value: '1M', label: 'Monatlich' },
  { value: '1Y', label: '1 Jahr' },
];

const ASSET_TYPE_ORDER: AssetType[] = ['crypto', 'stock', 'forex', 'commodity', 'index', 'bond'];
const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  crypto: 'Krypto',
  stock: 'Aktien',
  forex: 'Forex',
  commodity: 'Rohstoffe',
  index: 'Indizes',
  bond: 'Anleihen',
};

function emptyAssetCounts(): Record<AssetType, number> {
  return { crypto: 0, stock: 0, forex: 0, commodity: 0, index: 0, bond: 0 };
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function reasoningArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function classifyVerifiedPattern(reasoning: string[]): string {
  const text = reasoning.join(' ').toLowerCase();
  if (!text) return 'Kein verifiziertes Pattern ableitbar';
  if (text.includes('breakout') || text.includes('ausbruch')) return 'Breakout-Kontext aus Backend-Reasoning';
  if (text.includes('momentum')) return 'Momentum-Kontext aus Backend-Reasoning';
  if (text.includes('trend')) return 'Trend-Kontext aus Backend-Reasoning';
  if (text.includes('volatil')) return 'Volatilitäts-Kontext aus Backend-Reasoning';
  return 'Kein verifiziertes Pattern ableitbar';
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function evaluateAsset(asset: CatalogAsset, rootCorrelationId: string): Promise<ScreeningResult> {
  if (asset.type === 'crypto') {
    const response = await fetchWithTimeout('/api/crypto/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': `${rootCorrelationId}:${asset.symbol}`,
      },
      body: JSON.stringify({ symbol: asset.symbol, asset_name: asset.name }),
    });
    const body = await response.json().catch(() => ({}));
    const integrity = body?.integrity ?? {};
    const reasoning = reasoningArray(body?.reasoning);
    const evidenceIds = Array.isArray(integrity?.evidence)
      ? integrity.evidence.map((entry: any) => entry?.evidenceId ?? entry?.id).filter((id: unknown): id is string => typeof id === 'string')
      : stringArray(body?.evidenceIds);
    return {
      symbol: asset.symbol,
      assetName: asset.name,
      assetType: asset.type,
      status: typeof body?.status === 'string' ? body.status : 'SCORE_NOT_COMPUTABLE',
      score: finite(body?.final_score),
      providers: stringArray(integrity?.providers ?? body?.providers),
      evidenceIds,
      correlationId: typeof body?.correlationId === 'string' ? body.correlationId : response.headers.get('x-correlation-id'),
      reasoning,
      pattern: classifyVerifiedPattern(reasoning),
      macroStatus: null,
      macroRegime: null,
      scoreImpactEnabled: false,
    };
  }

  const response = await fetchWithTimeout(`/api/registry/assets/${encodeURIComponent(asset.symbol)}/verified-context`, {
    headers: { 'x-correlation-id': `${rootCorrelationId}:${asset.symbol}` },
  });
  const body = await response.json().catch(() => ({}));
  const scoreContext = body?.scoreContext ?? {};
  const macroContext = body?.macroContext ?? {};
  const reasoning = reasoningArray(scoreContext?.reasoning ?? scoreContext?.reason);
  return {
    symbol: asset.symbol,
    assetName: asset.name,
    assetType: asset.type,
    status: typeof scoreContext?.status === 'string' ? scoreContext.status : 'SCORE_NOT_COMPUTABLE',
    score: finite(scoreContext?.score),
    providers: stringArray(scoreContext?.providers),
    evidenceIds: stringArray(scoreContext?.evidenceIds),
    correlationId: typeof body?.correlationId === 'string' ? body.correlationId : response.headers.get('x-correlation-id'),
    reasoning,
    pattern: classifyVerifiedPattern(reasoning),
    macroStatus: typeof macroContext?.status === 'string' ? macroContext.status : null,
    macroRegime: typeof macroContext?.regime === 'string' ? macroContext.regime : null,
    scoreImpactEnabled: false,
  };
}

export function MarketScreener({
  onSelectSymbol,
  selectedSymbol,
  triggerAttempt,
  userSession,
  userEmail,
}: MarketScreenerProps) {
  const effectiveEmail = userEmail || userSession?.email || '';
  const [assets, setAssets] = useState<CatalogAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<CatalogAsset[]>([]);
  const [searchVal, setSearchVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [interval1, setInterval1] = useState('15m');
  const [interval2, setInterval2] = useState('1d');
  const [results, setResults] = useState<Record<string, ScreeningResult>>({});
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchWithTimeout('/api/registry/assets', {}, 5_000)
      .then((response) => {
        if (!response.ok) throw new Error('Asset-Katalog konnte nicht geladen werden.');
        return response.json();
      })
      .then((data) => {
        const list = Array.isArray(data)
          ? data.filter((item): item is CatalogAsset =>
              typeof item?.symbol === 'string' && typeof item?.name === 'string' && typeof item?.type === 'string')
          : [];
        setAssets(list);
        const preferred = ['BTC', 'AAPL', 'EURUSD']
          .map((symbol) => list.find((asset) => asset.symbol === symbol))
          .filter((asset): asset is CatalogAsset => Boolean(asset));
        setSelectedAssets(preferred.length ? preferred : list.slice(0, 3));
      })
      .catch((error) => setScanError(error instanceof Error ? error.message : String(error)));
  }, []);

  const assetCounts = useMemo(() => {
    const counts = emptyAssetCounts();
    for (const asset of assets) {
      if (ASSET_TYPE_ORDER.includes(asset.type)) counts[asset.type] += 1;
    }
    return counts;
  }, [assets]);

  const searchResults = useMemo(() => {
    const query = searchVal.trim().toLowerCase();
    if (!query) return [];
    return assets
      .filter((asset) =>
        asset.symbol.toLowerCase().includes(query)
        || asset.name.toLowerCase().includes(query)
        || (asset.aliases ?? []).some((alias) => alias.toLowerCase().includes(query)))
      .slice(0, 12);
  }, [assets, searchVal]);

  const addAsset = (asset: CatalogAsset) => {
    setSelectedAssets((current) => {
      if (current.some((item) => item.symbol === asset.symbol)) return current;
      return current.length >= 3 ? [...current.slice(0, 2), asset] : [...current, asset];
    });
    setSearchVal('');
    setShowDropdown(false);
  };

  const executeScan = async () => {
    if (selectedAssets.length === 0) return;
    setScanning(true);
    setScanError(null);
    const correlationId = `screen-${Date.now()}`;
    try {
      const settled = await Promise.all(selectedAssets.map(async (asset) => {
        try {
          return await evaluateAsset(asset, correlationId);
        } catch (error) {
          return {
            symbol: asset.symbol,
            assetName: asset.name,
            assetType: asset.type,
            status: 'DATA_UNAVAILABLE',
            score: null,
            providers: [],
            evidenceIds: [],
            correlationId: `${correlationId}:${asset.symbol}`,
            reasoning: [error instanceof Error ? error.message : String(error)],
            pattern: 'Kein verifiziertes Pattern ableitbar',
            macroStatus: null,
            macroRegime: null,
            scoreImpactEnabled: false as const,
          };
        }
      }));
      setResults(Object.fromEntries(settled.map((item) => [item.symbol, item])));
    } finally {
      setScanning(false);
    }
  };

  const startScan = () => {
    if (triggerAttempt) triggerAttempt('market-screening', () => void executeScan());
    else void executeScan();
  };

  const requestAiSummary = async (result: ScreeningResult) => {
    setAnalysisLoading(result.symbol);
    try {
      const response = await fetchWithTimeout('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: [
            `Erstelle eine kurze, nüchterne Screening-Zusammenfassung für ${result.assetName} (${result.symbol}).`,
            `Kanonischer Score: ${result.score ?? 'nicht berechenbar'}. Status: ${result.status}.`,
            `Provider: ${result.providers.join(', ') || 'keine'}. Evidence IDs: ${result.evidenceIds.length}.`,
            `Backend-Reasoning: ${result.reasoning.join(' | ') || 'nicht vorhanden'}.`,
            'Keine Preise, Renditen, Stop-Loss-, Take-Profit- oder Patternwerte erfinden. Keine Anlageempfehlung.',
          ].join('\n'),
          history: [],
        }),
      }, 15_000);
      if (!response.ok) throw new Error('AI-Zusammenfassung nicht verfügbar.');
      const body = await response.json();
      setAnalysis((current) => ({ ...current, [result.symbol]: typeof body?.reply === 'string' ? body.reply : 'Keine AI-Antwort.' }));
    } catch (error) {
      setAnalysis((current) => ({ ...current, [result.symbol]: `Analyse nicht verfügbar: ${error instanceof Error ? error.message : String(error)}` }));
    } finally {
      setAnalysisLoading(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-aif-gold-DEFAULT">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Enterprise Screener</span>
            </div>
            <h2 className="mt-1 text-xl font-black text-white">Multi-Asset Screening</h2>
            <p className="mt-1 text-xs text-white/45">Score, Evidence und Macro Context bleiben getrennte, versionierte Verträge.</p>
          </div>
          <button
            type="button"
            onClick={startScan}
            disabled={scanning || selectedAssets.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-aif-gold-DEFAULT/30 bg-aif-gold-DEFAULT/10 px-4 py-2 text-xs font-black text-aif-gold-DEFAULT disabled:opacity-50"
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Verifizierte Daten prüfen…' : 'Screening starten'}
          </button>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2">
            <Search size={15} className="text-white/35" />
            <input
              value={searchVal}
              onChange={(event) => { setSearchVal(event.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Asset, Symbol oder Währungspaar suchen…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
            />
            <ChevronDown size={14} className="text-white/25" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[9px] font-mono text-white/35" data-testid="asset-class-counts">
            <span className="font-bold uppercase tracking-wider text-white/45">Assetbestand</span>
            {ASSET_TYPE_ORDER.map((type) => (
              <span key={type}>
                {ASSET_TYPE_LABELS[type]} <strong className="text-white/65">{assetCounts[type]}</strong>
              </span>
            ))}
            <span className="ml-auto text-white/45">Gesamt <strong className="text-white/70">{assets.length}</strong></span>
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-neutral-950 p-2 shadow-2xl">
              {searchResults.map((asset) => (
                <button key={asset.symbol} type="button" onClick={() => addAsset(asset)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5">
                  <AssetLogo symbol={asset.symbol} size="xs" />
                  <span className="font-mono text-xs font-bold text-white">{asset.symbol}</span>
                  <span className="truncate text-xs text-white/45">{asset.name}</span>
                  <span className="ml-auto text-[9px] uppercase text-white/30">{asset.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {selectedAssets.map((asset) => (
            <div key={asset.symbol} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
              <div className="flex items-center gap-2">
                <AssetLogo symbol={asset.symbol} size="sm" />
                <button type="button" onClick={() => onSelectSymbol(asset.symbol)} className="min-w-0 flex-1 text-left">
                  <div className="font-mono text-sm font-black text-white">{asset.symbol}</div>
                  <div className="truncate text-[10px] text-white/40">{asset.name}</div>
                </button>
                <button type="button" onClick={() => setSelectedAssets((current) => current.filter((item) => item.symbol !== asset.symbol))} className="text-white/30 hover:text-rose-300">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[{ label: 'Analysefenster A', value: interval1, set: setInterval1 }, { label: 'Analysefenster B', value: interval2, set: setInterval2 }].map((item) => (
            <label key={item.label} className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              {item.label}
              <select value={item.value} onChange={(event) => item.set(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white">
                {INTERVAL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-white/30">Zeitrahmen sind UI-/Research-Kontext und verändern den kanonischen Backend-Score nicht.</p>
      </div>

      {scanError && <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-xs text-red-100">{scanError}</div>}

      <div className="grid gap-5 xl:grid-cols-3">
        {selectedAssets.map((asset) => {
          const result = results[asset.symbol];
          const ready = result?.status === 'READY' && result.score !== null;
          return (
            <article key={asset.symbol} className={`rounded-2xl border p-5 ${asset.symbol === selectedSymbol ? 'border-aif-gold-DEFAULT/35 bg-aif-gold-DEFAULT/[0.03]' : 'border-white/10 bg-black/35'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AssetLogo symbol={asset.symbol} size="md" />
                  <div>
                    <div className="font-mono text-lg font-black text-white">{asset.symbol}</div>
                    <div className="text-[10px] text-white/40">{asset.name} · {asset.type}</div>
                  </div>
                </div>
                {ready ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertTriangle size={18} className="text-amber-300" />}
              </div>

              {!result ? (
                <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/35">Screening noch nicht ausgeführt.</div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                      <div className="text-[9px] uppercase text-white/35">Canonical Score</div>
                      <div className="mt-1 font-mono text-2xl font-black text-white">{result.score === null ? '—' : result.score.toFixed(1)}</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                      <div className="text-[9px] uppercase text-white/35">Status</div>
                      <div className="mt-2 text-[10px] font-bold text-white/70">{result.status}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-[10px] text-white/55">
                    <div><span className="text-white/30">Provider:</span> {result.providers.join(', ') || '—'}</div>
                    <div><span className="text-white/30">Evidence:</span> {result.evidenceIds.length}</div>
                    <div><span className="text-white/30">Correlation:</span> {result.correlationId || '—'}</div>
                    <div><span className="text-white/30">Macro:</span> {result.macroStatus || '—'} {result.macroRegime ? `· ${result.macroRegime}` : ''}</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/35">Pattern</div>
                    <div className="mt-1 text-xs font-bold text-white/75">{result.pattern}</div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-white/35">Backend Reasoning</div>
                    <div className="mt-2 space-y-1 text-[10px] text-white/55">
                      {result.reasoning.length ? result.reasoning.slice(0, 4).map((line, index) => <div key={`${result.symbol}-${index}`}>• {line}</div>) : <div>Keine belegte Begründung verfügbar.</div>}
                    </div>
                  </div>

                  <button type="button" onClick={() => void requestAiSummary(result)} disabled={analysisLoading === result.symbol} className="inline-flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-[10px] font-bold text-purple-200 disabled:opacity-50">
                    <Sparkles size={13} />
                    {analysisLoading === result.symbol ? 'AI prüft Evidence…' : 'Kurze AI-Zusammenfassung'}
                  </button>
                  {analysis[result.symbol] && <div className="prose prose-invert prose-sm max-w-none rounded-xl border border-purple-500/15 bg-purple-500/[0.04] p-3 text-[11px]"><Markdown>{analysis[result.symbol]}</Markdown></div>}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-[10px] text-emerald-100/65">
        <strong>Data Integrity:</strong> Katalogbestand und Marktbeobachtung sind getrennt. Ein gelistetes Asset erhält weder Preis noch Score allein durch seine Registry-Zugehörigkeit; READY erfordert Provider-Evidence und die jeweiligen Provenance-/Freshness-Gates. Indizes nutzen das versionierte Provider-Mapping, Rohstoffe den freigegebenen Commodity-Market-Evidence-Contract und Government-Benchmark-Anleihen ausschließlich den Sovereign-Yield-Contract; allgemeines Einzelanleihen-Scoring bleibt gesperrt.
        {effectiveEmail ? '' : ' Nutzerkontext ist derzeit nicht angemeldet.'}
      </div>
    </section>
  );
}
