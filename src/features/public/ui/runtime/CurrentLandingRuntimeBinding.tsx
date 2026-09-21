import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Database, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import type { CoreModule, MarketAsset } from '../frontend-port/types';

const VERIFIED_DISPLAY_CONTRACT = 'verified-asset-display/1.0.0' as const;
const FINTECH_LANDING_SCORER_GATE = 'FIN-LF-01' as const;

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

interface VerifiedAssetDisplayResponse {
  contractVersion: typeof VERIFIED_DISPLAY_CONTRACT;
  symbol: string;
  name: string;
  assetClass: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
  status: 'READY' | 'PARTIAL' | 'SOURCE_UNAVAILABLE' | 'NOT_APPLICABLE';
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

type LoadState =
  | { state: 'loading'; asset: MarketAsset; data: null; error: null }
  | { state: 'ready'; asset: MarketAsset; data: VerifiedAssetDisplayResponse; error: null }
  | { state: 'error'; asset: MarketAsset; data: null; error: string }
  | null;

function formatMetric(value: number | null, unit: string | null): string {
  if (value === null || !Number.isFinite(value)) return 'Nicht verfügbar';
  const magnitude = Math.abs(value);
  const maximumFractionDigits = magnitude >= 1000 ? 2 : magnitude >= 1 ? 4 : 6;
  const formatted = new Intl.NumberFormat('de-DE', { maximumFractionDigits }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Nicht verfügbar';
  return `${value >= 0 ? '+' : ''}${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value)} %`;
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

export function CurrentLandingDataNotice() {
  return (
    <div
      className="mx-5 mb-1 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-[10.5px] leading-relaxed text-slate-400"
      data-current-landing-data-binding="verified-on-selection"
    >
      Marktwerte und Evidence werden bei Auswahl eines Assets über den verifizierten Finance-Datenvertrag geladen.
      Die grafische FRONTEND-Quelle bleibt unverändert und ist keine Daten- oder Scoring-Authority.
    </div>
  );
}

function VerifiedAssetModal({
  loadState,
  onClose,
  onOpenScorerGate,
}: {
  loadState: Exclude<LoadState, null>;
  onClose: () => void;
  onOpenScorerGate: () => void;
}) {
  const { asset } = loadState;
  const canonicalSymbol = CANONICAL_SYMBOL_BY_DESIGN_ID[asset.id] ?? asset.symbol.replace('/', '');
  const data = loadState.state === 'ready' ? loadState.data : null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Verifizierte Marktdaten für ${asset.name}`}
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-slate-700/80 bg-[#070e22] p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <Database className="h-4 w-4" aria-hidden="true" />
              Verified Asset Display
            </div>
            <h3 className="mt-1 text-2xl font-bold text-white">{asset.name}</h3>
            <p className="mt-1 font-mono text-xs text-slate-400">
              {canonicalSymbol} · {asset.mainCategory}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Marktdaten schließen"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loadState.state === 'loading' && (
          <div className="py-12 text-center" role="status" aria-live="polite">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <p className="mt-3 text-sm font-semibold text-slate-200">Verifizierte Provider-Evidence wird geladen…</p>
            <p className="mt-1 text-xs text-slate-500">Kein lokaler Preis- oder Score-Fallback.</p>
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
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-800 bg-[#040816] p-3">
                <div className="text-[10.5px] text-slate-400">{data.valueKind === 'yield' ? 'Rendite' : 'Marktwert'}</div>
                <div className="mt-1 text-lg font-bold text-white">{formatMetric(data.value, data.unit)}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#040816] p-3">
                <div className="text-[10.5px] text-slate-400">24h-Veränderung</div>
                <div className="mt-1 text-lg font-bold text-white">{formatPercent(data.change24hPct)}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#040816] p-3">
                <div className="text-[10.5px] text-slate-400">Marktkapitalisierung</div>
                <div className="mt-1 text-sm font-bold text-white">{formatCompact(data.marketCap)}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#040816] p-3">
                <div className="text-[10.5px] text-slate-400">24h-Volumen</div>
                <div className="mt-1 text-sm font-bold text-white">{formatCompact(data.volume24h)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Evidence · {data.status}
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-slate-300">
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Provider</dt><dd className="text-right">{data.providers.length ? data.providers.join(', ') : 'Nicht verfügbar'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Evidence IDs</dt><dd>{data.evidenceIds.length}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Beobachtet</dt><dd className="text-right">{formatTimestamp(data.observedAt)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-500">Degraded</dt><dd>{data.degraded ? 'Ja' : 'Nein'}</dd></div>
              </dl>
              {data.reason && <p className="mt-3 border-t border-slate-800 pt-3 text-xs leading-relaxed text-slate-400">{data.reason}</p>}
            </div>

            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-xs text-slate-300">
              <strong className="text-amber-300">Scoring:</strong> auf der Landing weiterhin nicht produktiv aktiviert.
              Es wird kein Design-Fixture-Score als Finance-Ergebnis verwendet.
            </div>
          </>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onOpenScorerGate}
            className="min-h-11 flex-1 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm font-bold text-amber-200 hover:bg-amber-400/15"
          >
            Scorer-Integrationsstatus
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}

function ScorerGateModal({ onClose }: { onClose: () => void }) {
  const gates = [
    'LF-02_AUTH_PROFILE_PASS',
    'LF-03_PRICING_ENTITLEMENTS_PASS',
    'SEC_REVIEW_READY',
    'QM_VALIDATION_READY',
  ];

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/85 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enterprise Scorer Integrationsstatus"
    >
      <div className="w-full max-w-lg rounded-t-3xl border border-amber-500/25 bg-[#070e22] p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              {FINTECH_LANDING_SCORER_GATE}
            </div>
            <h2 className="mt-1 text-xl font-black text-white">Enterprise Scorer · Landing-Aktivierung HELD</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Der kanonische FINTECH-Scorer bleibt die einzige Scoring-Authority. Die aktuelle Landing öffnet bis zum
              vollständigen Gate-Nachweis keine Mock-Analyse und startet keinen produktiven Score.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Integrationsstatus schließen"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {gates.map((gate) => (
            <div key={gate} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#040816] px-3 py-2.5">
              <span className="font-mono text-[11px] text-slate-200">{gate}</span>
              <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                EVIDENCE_PENDING
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-11 w-full rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}

function ServerGatedModuleModal({ module, onClose }: { module: CoreModule; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[94] flex items-end justify-center bg-black/85 p-0 backdrop-blur-md sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-t-3xl border border-slate-700/80 bg-[#070e22] p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Produktiver Datenpfad geschützt</div>
            <h2 className="mt-1 text-xl font-black text-white">{module.title}</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Die aktuelle FRONTEND-Quelle enthält hierfür Präsentationsbeispiele. Produktive Live-Daten werden nicht
              aus diesen Fixtures abgeleitet; der bestehende serverseitige Daten-/Entitlement-Pfad bleibt maßgeblich.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Hinweis schließen" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <a href="/login" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black hover:bg-amber-300">
          Anmelden
        </a>
      </div>
    </div>
  );
}

export function useCurrentLandingRuntimeBinding() {
  const [assetState, setAssetState] = useState<LoadState>(null);
  const [scorerGateOpen, setScorerGateOpen] = useState(false);
  const [serverGatedModule, setServerGatedModule] = useState<CoreModule | null>(null);
  const requestSequence = useRef(0);

  const openVerifiedAsset = useCallback((asset: MarketAsset) => {
    const canonicalSymbol = CANONICAL_SYMBOL_BY_DESIGN_ID[asset.id];
    if (!canonicalSymbol) {
      setAssetState({ state: 'error', asset, data: null, error: 'Für dieses Design-Asset ist noch keine kanonische Finance-Identität gebunden.' });
      return;
    }

    const sequence = ++requestSequence.current;
    setAssetState({ state: 'loading', asset, data: null, error: null });

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
      .then((data) => {
        if (sequence !== requestSequence.current) return;
        setAssetState({ state: 'ready', asset, data, error: null });
      })
      .catch((error: unknown) => {
        if (sequence !== requestSequence.current) return;
        setAssetState({
          state: 'error',
          asset,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, []);

  const closeAsset = useCallback(() => {
    requestSequence.current += 1;
    setAssetState(null);
  }, []);

  const openScorerGate = useCallback(() => {
    setScorerGateOpen(true);
  }, []);

  const handleModuleSelection = useCallback((module: CoreModule): boolean => {
    if (module.id === 'enterprise-scorer') {
      setScorerGateOpen(true);
      return true;
    }
    if (module.id === 'ai-newsfeed') {
      setServerGatedModule(module);
      return true;
    }
    return false;
  }, []);

  const overlays = typeof document === 'undefined'
    ? null
    : createPortal(
        <>
          {assetState && (
            <VerifiedAssetModal
              loadState={assetState}
              onClose={closeAsset}
              onOpenScorerGate={() => {
                closeAsset();
                setScorerGateOpen(true);
              }}
            />
          )}
          {scorerGateOpen && <ScorerGateModal onClose={() => setScorerGateOpen(false)} />}
          {serverGatedModule && <ServerGatedModuleModal module={serverGatedModule} onClose={() => setServerGatedModule(null)} />}
        </>,
        document.body,
      );

  return {
    openVerifiedAsset,
    openScorerGate,
    handleModuleSelection,
    overlays,
  };
}
