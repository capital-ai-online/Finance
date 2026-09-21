import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Database, ExternalLink, ShieldCheck } from 'lucide-react';
import { PublicCryptoScoringPreview } from '../../../crypto/ui/public';
import { CORE_MODULES, MARKET_ASSETS } from '../frontend-port/data/mockData';
import type { CoreModule, MarketAsset } from '../frontend-port/types';

const PUBLIC_SCORER_SYMBOL = 'BTC' as const;
const VERIFIED_DISPLAY_CONTRACT = 'verified-asset-display/1.0.0' as const;

const DESIGN_ASSETS = MARKET_ASSETS.map((asset) => ({ ...asset }));
const DESIGN_MODULES = CORE_MODULES.map((module) => ({
  ...module,
  details: {
    ...module.details,
    features: [...module.details.features],
    sampleMetrics: module.details.sampleMetrics.map((metric) => ({ ...metric })),
    newsItems: module.details.newsItems?.map((item) => ({ ...item })),
  },
}));

const CANONICAL_SYMBOL_BY_DESIGN_ID: Record<string, string> = {
  sp500: 'GSPC',
  dax: 'GDAXI',
  nasdaq: 'NDX',
  btc: 'BTC',
  eth: 'ETH',
  sol: 'SOL',
  nvda: 'NVDA',
  aapl: 'AAPL',
  msft: 'MSFT',
  eurusd: 'EURUSD',
  gbpusd: 'GBPUSD',
  usdjpy: 'USDJPY',
  gold: 'CMD_GOLD_COMEX',
  silver: 'CMD_SILVER_COMEX',
  brent: 'CMD_BRENT_ICE',
};

type VerifiedDisplayStatus = 'READY' | 'PARTIAL' | 'SOURCE_UNAVAILABLE' | 'NOT_APPLICABLE';

interface VerifiedAssetDisplayResponse {
  contractVersion: typeof VERIFIED_DISPLAY_CONTRACT;
  symbol: string;
  name: string;
  assetClass: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
  status: VerifiedDisplayStatus;
  valueKind: 'price' | 'yield';
  value: number | null;
  unit: string | null;
  price: number | null;
  change24hPct: number | null;
  marketCap: number | null;
  volume24h: number | null;
  providers: string[];
  evidenceIds: string[];
  observedAt: string | null;
  retrievedAt: string | null;
  degraded: boolean;
  executionPriceEligible: false;
  reason: string | null;
}

type AssetLoadState =
  | { state: 'idle'; data: null; error: null }
  | { state: 'loading'; data: null; error: null }
  | { state: 'ready'; data: VerifiedAssetDisplayResponse; error: null }
  | { state: 'error'; data: null; error: string };

const INITIAL_ASSET_STATE: AssetLoadState = { state: 'idle', data: null, error: null };

function replaceModuleFixture(moduleId: string, patch: Partial<CoreModule> & { details?: Partial<CoreModule['details']> }) {
  const target = CORE_MODULES.find((module) => module.id === moduleId);
  const source = DESIGN_MODULES.find((module) => module.id === moduleId);
  if (!target || !source) return;
  Object.assign(target, patch);
  if (patch.details) {
    target.details = {
      ...source.details,
      ...patch.details,
    };
  }
}

function neutralizePinnedPresentationFixtures() {
  MARKET_ASSETS.splice(
    0,
    MARKET_ASSETS.length,
    ...DESIGN_ASSETS.map((asset) => ({
      ...asset,
      value: 'Auf Auswahl verifizieren',
      change: '—',
      isPositive: true,
      high24h: '—',
      low24h: '—',
      volume24h: '—',
      aiScore: 0,
      aiRating: 'Kanonischer Score nur aus FINTECH-Evidence',
      description:
        'Die gepinnte Designkarte enthält keine produktiven Finanzwerte. Reale Marktwerte werden erst bei Auswahl über den verifizierten Finance-Display-Vertrag geladen.',
    })),
  );

  replaceModuleFixture('enterprise-scorer', {
    description: 'Kanonisches FINTECH-Scoring mit sichtbarer Evidence- und Modell-Lineage.',
    tagline: 'Produktiver Enterprise Scorer · öffentlicher Modus BTC',
    details: {
      useCase:
        'Verwendet den bestehenden kanonischen FINTECH-Scorer. Auf der öffentlichen Landingpage bleibt die Asset-Auswahl bewusst auf BTC fixiert; es entsteht keine zweite Scoring-Logik.',
      features: [
        'Kanonischer FINTECH-Scorer statt lokaler Frontend-Berechnung',
        'Evidence-, Provider- und Modell-Lineage bleiben sichtbar',
        'Fehlende Daten bleiben fail-closed statt durch Demo-Werte ersetzt zu werden',
      ],
      sampleMetrics: [
        { label: 'Öffentlicher Asset-Scope', value: 'BTC', score: 'Kanonischer Scorer' },
        { label: 'Scoring Authority', value: 'CAPITAL-AI-FINTECH', score: 'PVC-13..17' },
      ],
      newsItems: [],
    },
  });

  replaceModuleFixture('buffett-value', {
    description: 'Aktien-only Value-Analyse; produktiver Zugriff bleibt entitlement- und login-gebunden.',
    tagline: 'Verifizierte Fundamentaldaten · geschützter Zugriff',
    details: {
      useCase:
        'Der Buffett Value Check konsumiert verifizierte Aktien- und Fundamentalevidence. Auf der öffentlichen Landingpage werden keine Beispielwerte als echte Bewertung ausgegeben.',
      features: [
        'Aktien-only gemäß bestehendem Produktvertrag',
        'Verifizierter Marktpreis und Fundamentaldaten statt Fixture-KPIs',
        'Zugriff bleibt an Login und serverseitige Entitlements gebunden',
      ],
      sampleMetrics: [
        { label: 'Öffentlicher Zugriff', value: 'Login erforderlich' },
        { label: 'Datenvertrag', value: VERIFIED_DISPLAY_CONTRACT },
      ],
      newsItems: [],
    },
  });

  replaceModuleFixture('ai-newsfeed', {
    description: 'Evidence-gebundener Newsfeed; keine Design-Fixture-Headlines im Produktivmodus.',
    tagline: 'Produktive News-Pipeline · serverseitig entitlement-gebunden',
    details: {
      useCase:
        'Der produktive Newsfeed bleibt an die bestehende News-/Evidence-Pipeline und ihre serverseitigen Berechtigungen gebunden. Gepinnte Demo-Headlines werden nicht als aktuelle Nachrichten dargestellt.',
      features: [
        'Keine statischen Design-Headlines als Live-News',
        'Bestehende News-/Evidence-Pipeline bleibt Authority',
        'Entitlement- und Auth-Gates bleiben serverseitig',
      ],
      sampleMetrics: [
        { label: 'Live-Fixture-News', value: 'Deaktiviert' },
        { label: 'Zugriff', value: 'Server-Gate' },
      ],
      newsItems: [],
    },
  });

  replaceModuleFixture('vocabulary', {
    description: 'Finanz- und Architekturbegriffe ohne erfundene Live-Metriken.',
    tagline: 'Erklärwissen getrennt von Markt- und Scoring-Authority',
    details: {
      useCase:
        'Vocabulary bleibt eine Wissens- und Erklärfläche. Es erzeugt keine Finanzwerte und übernimmt keine Data- oder Scoring-Authority.',
      features: [
        'Begriffe und Erklärungen ohne Marktwert-Fallbacks',
        'Keine lokale Scoring- oder Provider-Semantik',
        'Verknüpfungen zu produktiven Daten bleiben read-only',
      ],
      sampleMetrics: [
        { label: 'Finanzwert-Authority', value: 'Keine' },
        { label: 'Rolle', value: 'Erklärwissen' },
      ],
      newsItems: [],
    },
  });
}

neutralizePinnedPresentationFixtures();

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function resolveClickedAsset(target: EventTarget | null, boundary: HTMLElement): MarketAsset | null {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== boundary) {
    const text = normalizeText(node.textContent);
    if (text) {
      const matches = DESIGN_ASSETS.filter((asset) => text.includes(asset.name));
      if (matches.length === 1) return matches[0];
    }
    node = node.parentElement;
  }
  return null;
}

function resolveModuleFromDialog(target: EventTarget | null, boundary: HTMLElement): CoreModule | null {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== boundary) {
    const text = normalizeText(node.textContent);
    const matches = DESIGN_MODULES.filter((module) => text.includes(module.title));
    if (matches.length === 1) return matches[0];
    node = node.parentElement;
  }
  return null;
}

function formatMetric(value: number | null, unit: string | null): string {
  if (value === null || !Number.isFinite(value)) return 'Nicht verfügbar';
  const magnitude = Math.abs(value);
  const maximumFractionDigits = magnitude >= 1000 ? 2 : magnitude >= 1 ? 4 : 6;
  const formatted = new Intl.NumberFormat('de-DE', { maximumFractionDigits }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatCompact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Nicht verfügbar';
  return new Intl.NumberFormat('de-DE', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTimestamp(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Nicht verfügbar';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function VerifiedAssetModal({
  asset,
  loadState,
  onClose,
  onOpenScorer,
}: {
  asset: MarketAsset;
  loadState: AssetLoadState;
  onClose: () => void;
  onOpenScorer: () => void;
}) {
  const canonicalSymbol = CANONICAL_SYMBOL_BY_DESIGN_ID[asset.id] ?? asset.symbol.replace('/', '');
  const data = loadState.state === 'ready' ? loadState.data : null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Verifizierte Marktdaten für ${asset.name}`}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-amber-500/25 bg-[#070e22] p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <Database className="h-4 w-4" aria-hidden="true" />
              Verified Asset Display
            </div>
            <h3 className="mt-1 text-2xl font-black text-white">{asset.name}</h3>
            <p className="mt-1 font-mono text-xs text-slate-400">{canonicalSymbol} · {asset.mainCategory}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Marktdaten schließen" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loadState.state === 'loading' && (
          <div className="py-12 text-center" role="status" aria-live="polite">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <p className="mt-3 text-sm font-semibold text-slate-200">Verifizierte Provider-Evidence wird geladen…</p>
            <p className="mt-1 text-xs text-slate-500">Keine Demo- oder Fallback-Finanzwerte.</p>
          </div>
        )}

        {loadState.state === 'error' && (
          <div className="mt-5 rounded-2xl border border-red-400/25 bg-red-400/10 p-4">
            <div className="text-sm font-bold text-red-200">Marktdaten derzeit nicht verifizierbar</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">{loadState.error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-[#040816] p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">{data.valueKind === 'yield' ? 'Rendite' : 'Verifizierter Marktwert'}</div>
                <div className="mt-1 text-2xl font-black text-white">{formatMetric(data.value, data.unit)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#040816] p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">24h-Veränderung</div>
                <div className="mt-1 text-2xl font-black text-white">
                  {data.change24hPct === null ? 'Nicht verfügbar' : `${data.change24hPct >= 0 ? '+' : ''}${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(data.change24hPct)} %`}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#040816] p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Marktkapitalisierung</div>
                <div className="mt-1 text-lg font-bold text-white">{formatCompact(data.marketCap)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#040816] p-4">
                <div className="text-[11px] uppercase tracking-wider text-slate-500">24h-Volumen</div>
                <div className="mt-1 text-lg font-bold text-white">{formatCompact(data.volume24h)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Evidence State · {data.status}
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-slate-300">
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Provider</dt><dd className="text-right">{data.providers.length ? data.providers.join(', ') : 'Nicht verfügbar'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Evidence IDs</dt><dd>{data.evidenceIds.length}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Observed at</dt><dd className="text-right">{formatTimestamp(data.observedAt)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Degraded</dt><dd>{data.degraded ? 'Ja' : 'Nein'}</dd></div>
              </dl>
              {data.reason && <p className="mt-3 border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-400">{data.reason}</p>}
            </div>
          </>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {canonicalSymbol === PUBLIC_SCORER_SYMBOL && (
            <button type="button" onClick={onOpenScorer} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black hover:bg-amber-300">
              Enterprise Scorer öffnen
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

function CanonicalAnalysisModal({ onClose }: { onClose: () => void }) {
  const [timeframe, setTimeframe] = useState('1 tag');
  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto bg-black/85 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true" aria-label="Öffentlicher Enterprise Scorer">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-amber-500/25 bg-[#02050e] p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">Kanonische Produktivlogik</div>
            <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Enterprise Scorer · BTC</h2>
            <p className="mt-1 text-xs text-slate-400">Öffentlicher Modus: BTC fixiert. Scoring-, Evidence- und Modell-Authority bleiben bei CAPITAL-AI-FINTECH.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Enterprise Scorer schließen" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <PublicCryptoScoringPreview
          selectedSymbol={PUBLIC_SCORER_SYMBOL}
          timeframe={timeframe}
          onChangeTimeframe={setTimeframe}
          subscriptionTier="Free"
        />
      </div>
    </div>
  );
}

export function useLandingRuntimeBinding() {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [assetLoadState, setAssetLoadState] = useState<AssetLoadState>(INITIAL_ASSET_STATE);
  const requestSequence = useRef(0);

  const openVerifiedAsset = useCallback((asset: MarketAsset) => {
    const canonicalSymbol = CANONICAL_SYMBOL_BY_DESIGN_ID[asset.id];
    if (!canonicalSymbol) return;

    const sequence = ++requestSequence.current;
    setSelectedAsset(asset);
    setAssetLoadState({ state: 'loading', data: null, error: null });

    void fetch(`/api/registry/assets/${encodeURIComponent(canonicalSymbol)}/verified-display`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as Partial<VerifiedAssetDisplayResponse> | null;
        if (!response.ok) {
          throw new Error(typeof payload?.reason === 'string' ? payload.reason : `HTTP ${response.status}`);
        }
        if (!payload || payload.contractVersion !== VERIFIED_DISPLAY_CONTRACT) {
          throw new Error('Unerwarteter Verified-Asset-Display-Vertrag.');
        }
        return payload as VerifiedAssetDisplayResponse;
      })
      .then((payload) => {
        if (sequence !== requestSequence.current) return;
        setAssetLoadState({ state: 'ready', data: payload, error: null });
      })
      .catch((error: unknown) => {
        if (sequence !== requestSequence.current) return;
        setAssetLoadState({
          state: 'error',
          data: null,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, []);

  const onClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;

    const button = target.closest('button');
    const buttonText = normalizeText(button?.textContent);

    const opensPublicScorer =
      buttonText.includes('Analyse starten') ||
      buttonText === 'Analyse' ||
      buttonText.includes('KI-Marktanalyse') ||
      buttonText.includes('Enterprise Scorer');

    if (opensPublicScorer) {
      event.preventDefault();
      event.stopPropagation();
      setAnalysisOpen(true);
      return;
    }

    if (buttonText.includes('Dieses Modul jetzt testen')) {
      event.preventDefault();
      event.stopPropagation();
      const module = resolveModuleFromDialog(target, event.currentTarget);
      if (module?.id === 'enterprise-scorer') {
        setAnalysisOpen(true);
      } else {
        window.location.assign('/login');
      }
      return;
    }

    const asset = resolveClickedAsset(target, event.currentTarget);
    if (asset) {
      event.preventDefault();
      event.stopPropagation();
      openVerifiedAsset(asset);
    }
  }, [openVerifiedAsset]);

  const closeAsset = useCallback(() => {
    requestSequence.current += 1;
    setSelectedAsset(null);
    setAssetLoadState(INITIAL_ASSET_STATE);
  }, []);

  const openScorerFromAsset = useCallback(() => {
    closeAsset();
    setAnalysisOpen(true);
  }, [closeAsset]);

  const overlays = typeof document === 'undefined'
    ? null
    : createPortal(
        <>
          {selectedAsset && (
            <VerifiedAssetModal
              asset={selectedAsset}
              loadState={assetLoadState}
              onClose={closeAsset}
              onOpenScorer={openScorerFromAsset}
            />
          )}
          {analysisOpen && <CanonicalAnalysisModal onClose={() => setAnalysisOpen(false)} />}
        </>,
        document.body,
      );

  return { onClickCapture, overlays };
}
