import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  BellRing,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { UserSession } from '../App';
import {
  getSessionAlerts,
  saveSessionAlerts,
  getSessionLogs,
  saveSessionLogs,
} from '../lib/alertStore';

type AssetType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

type CatalogAsset = {
  symbol: string;
  name: string;
  type: AssetType;
};

type VerifiedQuote = {
  status: 'READY' | 'DATA_UNAVAILABLE' | 'SOURCE_CONFLICT' | 'INSUFFICIENT_SOURCES';
  symbol: string;
  value: number | null;
  unit: string | null;
  providers: string[];
  evidenceIds: string[];
  observedAt: string | null;
  correlationId: string | null;
  reason?: string;
};

export interface PriceAlert {
  id: string;
  symbol: string;
  assetName: string;
  type: AssetType;
  targetPrice: number;
  condition: 'above' | 'below';
  initialPrice: number;
  currentPrice: number;
  createdAt: string;
  triggeredAt?: string;
  isTriggered: boolean;
  soundEnabled: boolean;
  quoteProvider?: string[];
  quoteEvidenceIds?: string[];
  quoteObservedAt?: string;
  quoteCorrelationId?: string;
}

interface PriceAlertComponentProps {
  selectedSymbol?: string;
  userSession?: UserSession;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 8_000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

async function fetchVerifiedQuote(asset: CatalogAsset): Promise<VerifiedQuote> {
  if (asset.type !== 'crypto') {
    return {
      status: 'DATA_UNAVAILABLE',
      symbol: asset.symbol,
      value: null,
      unit: null,
      providers: [],
      evidenceIds: [],
      observedAt: null,
      correlationId: null,
      reason: 'Für diese Assetklasse ist noch kein freigegebener verifizierter Quote-Contract für Preisalarme aktiv.',
    };
  }

  const response = await fetchWithTimeout(`/api/crypto/price-consensus/${encodeURIComponent(asset.symbol)}`);
  const body = await response.json().catch(() => ({}));
  const consensusValue = finite(body?.canonicalValue);
  const observations = Array.isArray(body?.observations) ? body.observations : [];
  const providers = observations
    .map((entry: any) => entry?.provider)
    .filter((provider: unknown): provider is string => typeof provider === 'string');
  const evidenceIds = observations
    .map((entry: any) => entry?.evidenceId)
    .filter((id: unknown): id is string => typeof id === 'string');
  const observedTimes = observations
    .map((entry: any) => entry?.observedAt)
    .filter((value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value)));

  if (response.ok && body?.status === 'CONSENSUS' && consensusValue !== null) {
    return {
      status: 'READY',
      symbol: asset.symbol,
      value: consensusValue,
      unit: typeof body?.unit === 'string' ? body.unit : 'USD',
      providers,
      evidenceIds,
      observedAt: observedTimes.sort().at(-1) ?? null,
      correlationId: typeof body?.correlationId === 'string' ? body.correlationId : response.headers.get('x-correlation-id'),
    };
  }

  return {
    status: body?.status === 'SOURCE_CONFLICT'
      ? 'SOURCE_CONFLICT'
      : body?.status === 'INSUFFICIENT_SOURCES'
        ? 'INSUFFICIENT_SOURCES'
        : 'DATA_UNAVAILABLE',
    symbol: asset.symbol,
    value: null,
    unit: typeof body?.unit === 'string' ? body.unit : null,
    providers,
    evidenceIds,
    observedAt: observedTimes.sort().at(-1) ?? null,
    correlationId: typeof body?.correlationId === 'string' ? body.correlationId : response.headers.get('x-correlation-id'),
    reason: typeof body?.reason === 'string' ? body.reason : 'Keine verifizierte Preis-Evidence verfügbar.',
  };
}

export function PriceAlert({ selectedSymbol, userSession }: PriceAlertComponentProps) {
  const [assets, setAssets] = useState<CatalogAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('BTC');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; alertId: string; symbol: string; assetName: string; message: string; time: string }>>([]);
  const [quotes, setQuotes] = useState<Record<string, VerifiedQuote>>({});
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWithTimeout('/api/registry/assets', {}, 5_000)
      .then((response) => {
        if (!response.ok) throw new Error('Asset-Katalog konnte nicht geladen werden.');
        return response.json();
      })
      .then((data) => {
        const catalog = Array.isArray(data)
          ? data.filter((item): item is CatalogAsset =>
              typeof item?.symbol === 'string' && typeof item?.name === 'string' && typeof item?.type === 'string')
          : [];
        setAssets(catalog);
        const preferred = selectedSymbol?.toUpperCase();
        if (preferred && catalog.some((asset) => asset.symbol === preferred)) setSelectedAssetSymbol(preferred);
        else if (catalog.some((asset) => asset.symbol === 'BTC')) setSelectedAssetSymbol('BTC');
        else if (catalog.length) setSelectedAssetSymbol(catalog[0].symbol);
      })
      .catch((error) => setToast(error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [selectedSymbol]);

  useEffect(() => {
    const email = userSession?.email;
    setAlerts(getSessionAlerts(email) as PriceAlert[]);
    setNotifications(getSessionLogs(email));
  }, [userSession]);

  const saveAlerts = (next: PriceAlert[]) => {
    setAlerts(next);
    saveSessionAlerts(next as any, userSession?.email);
  };

  const saveLogs = (next: typeof notifications) => {
    setNotifications(next);
    saveSessionLogs(next, userSession?.email);
  };

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.symbol === selectedAssetSymbol) ?? null,
    [assets, selectedAssetSymbol],
  );

  const selectedQuote = selectedAsset ? quotes[selectedAsset.symbol] : undefined;

  const refreshQuote = async (asset: CatalogAsset, silent = false): Promise<VerifiedQuote> => {
    try {
      const quote = await fetchVerifiedQuote(asset);
      setQuotes((current) => ({ ...current, [asset.symbol]: quote }));
      if (!silent && quote.status !== 'READY') setToast(quote.reason || quote.status);
      return quote;
    } catch (error) {
      const quote: VerifiedQuote = {
        status: 'DATA_UNAVAILABLE',
        symbol: asset.symbol,
        value: null,
        unit: null,
        providers: [],
        evidenceIds: [],
        observedAt: null,
        correlationId: null,
        reason: error instanceof Error ? error.message : String(error),
      };
      setQuotes((current) => ({ ...current, [asset.symbol]: quote }));
      if (!silent) setToast(quote.reason || 'Quote nicht verfügbar.');
      return quote;
    }
  };

  useEffect(() => {
    if (selectedAsset) void refreshQuote(selectedAsset, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssetSymbol, assets.length]);

  const triggerNotification = (alert: PriceAlert, quote: VerifiedQuote) => {
    if (quote.value === null) return;
    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const operator = alert.condition === 'above' ? 'überschritten' : 'unterschritten';
    const message = `${alert.assetName} (${alert.symbol}) hat die Zielschwelle ${operator}. Verifizierter Kurs: ${quote.value.toLocaleString('de-DE', { maximumFractionDigits: 8 })} ${quote.unit || ''}.`;
    saveLogs([{ id: `log-${Date.now()}`, alertId: alert.id, symbol: alert.symbol, assetName: alert.assetName, message, time }, ...notifications].slice(0, 50));
    setToast(message);
  };

  const checkAlerts = async () => {
    if (checking || alerts.length === 0) return;
    setChecking(true);
    try {
      const next = [...alerts];
      for (let index = 0; index < next.length; index += 1) {
        const alert = next[index];
        if (alert.isTriggered) continue;
        const asset = assets.find((item) => item.symbol === alert.symbol);
        if (!asset) continue;
        const quote = await refreshQuote(asset, true);
        if (quote.status !== 'READY' || quote.value === null) continue;

        const hit = alert.condition === 'above'
          ? quote.value >= alert.targetPrice
          : quote.value <= alert.targetPrice;

        next[index] = {
          ...alert,
          currentPrice: quote.value,
          quoteProvider: quote.providers,
          quoteEvidenceIds: quote.evidenceIds,
          quoteObservedAt: quote.observedAt ?? undefined,
          quoteCorrelationId: quote.correlationId ?? undefined,
          isTriggered: hit,
          triggeredAt: hit ? new Date().toISOString() : alert.triggeredAt,
        };
        if (hit) triggerNotification(alert, quote);
      }
      saveAlerts(next);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => void checkAlerts(), 60_000);
    return () => window.clearInterval(timer);
    // Poll interval is intentionally coarse; provider quotas and alert evidence matter more than pseudo-realtime browser polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts, assets]);

  const createAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAsset) return;
    const target = Number(targetPrice);
    if (!Number.isFinite(target) || target <= 0) return;

    const quote = selectedQuote?.status === 'READY' ? selectedQuote : await refreshQuote(selectedAsset);
    if (quote.status !== 'READY' || quote.value === null) {
      setToast('Preisalarm nicht erstellt: Es liegt keine verifizierte Quote-Evidence vor.');
      return;
    }

    const alert: PriceAlert = {
      id: `alert-${Date.now()}`,
      symbol: selectedAsset.symbol,
      assetName: selectedAsset.name,
      type: selectedAsset.type,
      targetPrice: target,
      condition,
      initialPrice: quote.value,
      currentPrice: quote.value,
      createdAt: new Date().toISOString(),
      isTriggered: false,
      soundEnabled: false,
      quoteProvider: quote.providers,
      quoteEvidenceIds: quote.evidenceIds,
      quoteObservedAt: quote.observedAt ?? undefined,
      quoteCorrelationId: quote.correlationId ?? undefined,
    };
    saveAlerts([alert, ...alerts]);
    setTargetPrice('');
    setToast(`Preisalarm für ${selectedAsset.symbol} mit verifizierter Quote-Evidence eingerichtet.`);
  };

  const applyPreset = (percent: number) => {
    if (!selectedQuote || selectedQuote.status !== 'READY' || selectedQuote.value === null) {
      setToast('Preset benötigt zuerst eine verifizierte Quote.');
      return;
    }
    const target = selectedQuote.value * (1 + percent / 100);
    setTargetPrice(target.toFixed(target < 5 ? 6 : 2));
    setCondition(percent >= 0 ? 'above' : 'below');
  };

  return (
    <section className="space-y-6">
      {toast && (
        <div className="rounded-xl border border-aif-gold-DEFAULT/30 bg-black/90 p-4 text-xs text-white/80">
          <div className="flex items-start gap-3">
            <BellRing size={17} className="mt-0.5 text-aif-gold-DEFAULT" />
            <div className="flex-1">{toast}</div>
            <button type="button" onClick={() => setToast(null)} className="text-white/30">✕</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Bell size={19} className="text-aif-gold-DEFAULT" />
            <div>
              <h3 className="text-sm font-black uppercase text-white">Evidence-backed Preisalarm</h3>
              <p className="text-[10px] text-white/40">Keine Registry-Bootstrappreise · kein Random-Walk</p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-white/40"><RefreshCw size={20} className="mx-auto mb-2 animate-spin" />Lade Asset-Katalog…</div>
          ) : (
            <form onSubmit={createAlert} className="mt-5 space-y-4">
              <label className="block text-[10px] uppercase tracking-wider text-white/45">
                Asset
                <select value={selectedAssetSymbol} onChange={(event) => setSelectedAssetSymbol(event.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white">
                  {assets.map((asset) => <option key={asset.symbol} value={asset.symbol}>{asset.symbol} · {asset.name} · {asset.type}</option>)}
                </select>
              </label>

              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                <div className="flex items-center gap-2">
                  {selectedAsset && <AssetLogo symbol={selectedAsset.symbol} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-black text-white">{selectedAsset?.symbol || '—'}</div>
                    <div className="text-[10px] text-white/40">{selectedQuote?.status || 'QUOTE_NOT_CHECKED'}</div>
                  </div>
                  <button type="button" onClick={() => selectedAsset && void refreshQuote(selectedAsset)} className="rounded-lg border border-white/10 p-2 text-white/55 hover:text-white"><RefreshCw size={14} /></button>
                </div>
                <div className="mt-3 font-mono text-xl font-black text-white">{selectedQuote?.value === null || selectedQuote?.value === undefined ? '—' : `${selectedQuote.value.toLocaleString('de-DE', { maximumFractionDigits: 8 })} ${selectedQuote.unit || ''}`}</div>
                <div className="mt-1 text-[9px] text-white/35">Provider: {selectedQuote?.providers.join(', ') || '—'} · Evidence: {selectedQuote?.evidenceIds.length ?? 0}</div>
                {selectedQuote?.reason && <div className="mt-2 text-[10px] text-amber-200/70">{selectedQuote.reason}</div>}
              </div>

              <label className="block text-[10px] uppercase tracking-wider text-white/45">
                Zielpreis
                <input value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} inputMode="decimal" placeholder="0.00" className="mt-1 w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-sm text-white outline-none" />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCondition('above')} className={`rounded-lg border px-3 py-2 text-xs ${condition === 'above' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-white/10 text-white/45'}`}>Über Ziel</button>
                <button type="button" onClick={() => setCondition('below')} className={`rounded-lg border px-3 py-2 text-xs ${condition === 'below' ? 'border-rose-500/40 bg-rose-500/10 text-rose-200' : 'border-white/10 text-white/45'}`}>Unter Ziel</button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[-5, -2, 2, 5].map((percent) => <button key={percent} type="button" onClick={() => applyPreset(percent)} className="rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-white/50">{percent > 0 ? '+' : ''}{percent}%</button>)}
              </div>

              <button type="submit" disabled={selectedQuote?.status !== 'READY'} className="w-full rounded-xl border border-aif-gold-DEFAULT/30 bg-aif-gold-DEFAULT/10 px-4 py-2.5 text-xs font-black text-aif-gold-DEFAULT disabled:cursor-not-allowed disabled:opacity-40">Preisalarm mit Evidence erstellen</button>
            </form>
          )}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase text-white">Aktive Preisalarme</h3>
                <p className="text-[10px] text-white/40">Schwellen werden nur gegen verifizierte Quote-Evidence geprüft.</p>
              </div>
              <button type="button" onClick={() => void checkAlerts()} disabled={checking} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-white/60 disabled:opacity-50"><RefreshCw size={13} className={checking ? 'animate-spin' : ''} />Jetzt prüfen</button>
            </div>

            <div className="mt-4 space-y-3">
              {alerts.length === 0 && <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center text-xs text-white/35">Noch keine verifizierten Preisalarme.</div>}
              {alerts.map((alert) => (
                <div key={alert.id} className={`rounded-xl border p-4 ${alert.isTriggered ? 'border-emerald-500/25 bg-emerald-500/[0.05]' : 'border-white/10 bg-white/[0.02]'}`}>
                  <div className="flex items-start gap-3">
                    <AssetLogo symbol={alert.symbol} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-white">{alert.symbol}</span>
                        {alert.isTriggered ? <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-300"><CheckCircle2 size={11} />TRIGGERED</span> : <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white/40"><ShieldCheck size={11} />EVIDENCE-GATED</span>}
                      </div>
                      <div className="mt-1 text-[10px] text-white/45">Ziel {alert.condition === 'above' ? '≥' : '≤'} {alert.targetPrice.toLocaleString('de-DE', { maximumFractionDigits: 8 })}</div>
                      <div className="mt-2 text-[9px] text-white/30">Aktuell: {alert.currentPrice.toLocaleString('de-DE', { maximumFractionDigits: 8 })} · Provider: {alert.quoteProvider?.join(', ') || '—'} · Evidence: {alert.quoteEvidenceIds?.length ?? 0}</div>
                    </div>
                    <button type="button" onClick={() => saveAlerts(alerts.filter((item) => item.id !== alert.id))} className="text-white/30 hover:text-rose-300"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h3 className="text-sm font-black uppercase text-white">Alert Evidence Log</h3>
            <div className="mt-4 space-y-2">
              {notifications.length === 0 && <div className="text-xs text-white/35">Noch keine ausgelösten Alarme.</div>}
              {notifications.slice(0, 10).map((entry) => <div key={entry.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-[10px] text-white/55"><span className="font-mono font-bold text-white/75">{entry.time} · {entry.symbol}</span><div className="mt-1">{entry.message}</div></div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4 text-[10px] text-amber-100/65">
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
        <div><strong>FinTech Data Policy:</strong> Browser-Simulationen und Registry-Bootstrappreise sind keine Market Evidence. Solange für Stock/Forex/Index/Commodity/Bond kein expliziter Quote-Contract freigegeben ist, werden dort keine Preisalarme aktiviert.</div>
      </div>
    </section>
  );
}
