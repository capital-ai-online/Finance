import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Database,
  Info,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';

export function formatBuffettMetric(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Nicht verfügbar';
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString('de-DE') : 'Nicht verfügbar';
}

type AssetClass = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

interface CatalogAsset {
  symbol: string;
  name: string;
  type: AssetClass;
  subtype?: string;
}

interface VerifiedAssetFundamentals {
  peRatio: number | null;
  debtToEquity: number | null;
  dividendYieldPct: number | null;
  profitMarginPct: number | null;
  epsTtm: number | null;
  freeCashFlowPerShare: number | null;
}

interface VerifiedAssetDisplay {
  contractVersion: 'verified-asset-display/1.0.0';
  symbol: string;
  name: string;
  assetClass: AssetClass;
  status: 'READY' | 'PARTIAL' | 'SOURCE_UNAVAILABLE' | 'NOT_APPLICABLE';
  valueKind: 'price' | 'yield';
  value: number | null;
  unit: string | null;
  price: number | null;
  change24hPct: number | null;
  marketCap: number | null;
  volume24h: number | null;
  fundamentals: VerifiedAssetFundamentals | null;
  buffettValuationStatus: 'READY' | 'PARTIAL' | 'NOT_APPLICABLE';
  providers: string[];
  evidenceIds: string[];
  observedAt: string | null;
  retrievedAt: string | null;
  degraded: boolean;
  executionPriceEligible: false;
  reason: string | null;
}

interface BuffetValueCheckProps {
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

interface DcfResult {
  value: number;
  steps: Array<{ year: number; projected: number; presentValue: number }>;
  terminalPrice: number;
  terminalPresentValue: number;
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatObservedAt(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Zeitpunkt nicht verfügbar';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function calculateGrahamValue(eps: number, growth: number, bondYieldFactor: number, aaaBondYield: number): number | null {
  if (![eps, growth, bondYieldFactor, aaaBondYield].every(Number.isFinite) || eps <= 0 || aaaBondYield <= 0) return null;
  return Number(((eps * (8.5 + 2 * growth) * bondYieldFactor) / aaaBondYield).toFixed(2));
}

function calculateDcfValue(
  baseCashFlowPerShare: number,
  growth: number,
  discountRate: number,
  terminalMultiple: number,
  projectionYears: number,
): DcfResult | null {
  if (
    ![baseCashFlowPerShare, growth, discountRate, terminalMultiple, projectionYears].every(Number.isFinite)
    || baseCashFlowPerShare <= 0
    || discountRate <= 0
    || terminalMultiple <= 0
    || projectionYears <= 0
  ) return null;

  let current = baseCashFlowPerShare;
  let presentValueSum = 0;
  const steps: DcfResult['steps'] = [];
  for (let year = 1; year <= projectionYears; year += 1) {
    current *= 1 + growth / 100;
    const discountFactor = Math.pow(1 + discountRate / 100, year);
    const presentValue = current / discountFactor;
    presentValueSum += presentValue;
    steps.push({ year, projected: current, presentValue });
  }
  const terminalPrice = current * terminalMultiple;
  const terminalPresentValue = terminalPrice / Math.pow(1 + discountRate / 100, projectionYears);
  return {
    value: Number((presentValueSum + terminalPresentValue).toFixed(2)),
    steps,
    terminalPrice,
    terminalPresentValue,
  };
}

export function BuffetValueCheck({ selectedSymbol, triggerAttempt }: BuffetValueCheckProps) {
  const [catalog, setCatalog] = useState<CatalogAsset[]>([]);
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol.toUpperCase());
  const [display, setDisplay] = useState<VerifiedAssetDisplay | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [valueLoading, setValueLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [eps, setEps] = useState(0);
  const [epsInputSource, setEpsInputSource] = useState<'verified' | 'manual' | 'missing'>('missing');
  const [growth, setGrowth] = useState(8.0);
  const [discountRate, setDiscountRate] = useState(9.0);
  const [terminalMultiple, setTerminalMultiple] = useState(18);
  const [projectionYears, setProjectionYears] = useState(5);
  const [bondYieldFactor, setBondYieldFactor] = useState(4.4);
  const [aaaBondYield, setAaaBondYield] = useState(4.8);
  const [customPrice, setCustomPrice] = useState(0);
  const [priceInputSource, setPriceInputSource] = useState<'verified' | 'manual' | 'missing'>('missing');
  const [activeTab, setActiveTab] = useState<'dcf' | 'graham' | 'evidence'>('dcf');

  useEffect(() => {
    triggerAttempt?.('Enterprise-Buffett-Valuation-Engine', () => {});
  }, [triggerAttempt]);

  useEffect(() => {
    setActiveSymbol(selectedSymbol.toUpperCase());
  }, [selectedSymbol]);

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    fetch('/api/registry/assets')
      .then(async response => {
        if (!response.ok) throw new Error('Asset-Katalog konnte nicht geladen werden.');
        return await response.json();
      })
      .then(body => {
        if (cancelled) return;
        const assets = Array.isArray(body)
          ? body.filter((item): item is CatalogAsset => Boolean(item?.symbol && item?.name && item?.type))
          : [];
        setCatalog(assets);
      })
      .catch(error => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeSymbol) return;
    let cancelled = false;
    setValueLoading(true);
    setLoadError(null);
    setDisplay(null);
    fetch(`/api/registry/assets/${encodeURIComponent(activeSymbol)}/verified-display`)
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.reason ?? 'Verifizierte Asset-Daten konnten nicht geladen werden.');
        return body as VerifiedAssetDisplay;
      })
      .then(body => {
        if (cancelled) return;
        setDisplay(body);
        if (body.assetClass === 'stock') {
          const verifiedPrice = finite(body.price);
          const verifiedEps = finite(body.fundamentals?.epsTtm);
          if (verifiedPrice !== null && verifiedPrice > 0) {
            setCustomPrice(verifiedPrice);
            setPriceInputSource('verified');
          } else {
            setCustomPrice(0);
            setPriceInputSource('missing');
          }
          if (verifiedEps !== null && verifiedEps > 0) {
            setEps(verifiedEps);
            setEpsInputSource('verified');
          } else {
            setEps(0);
            setEpsInputSource('missing');
          }
          setGrowth(8.0);
        } else {
          setEps(0);
          setEpsInputSource('missing');
          setCustomPrice(0);
          setPriceInputSource('missing');
        }
      })
      .catch(error => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setValueLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeSymbol]);

  const activeAsset = useMemo(
    () => catalog.find(asset => asset.symbol.toUpperCase() === activeSymbol.toUpperCase()) ?? null,
    [catalog, activeSymbol],
  );

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? catalog.filter(asset => asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query))
      : catalog;
    return [...filtered].sort((a, b) => {
      const stockPriority = Number(b.type === 'stock') - Number(a.type === 'stock');
      return stockPriority || a.symbol.localeCompare(b.symbol);
    });
  }, [catalog, searchQuery]);

  const isStock = display?.assetClass === 'stock';
  const verifiedFcf = finite(display?.fundamentals?.freeCashFlowPerShare);
  const dcfBase = verifiedFcf !== null && verifiedFcf > 0 ? verifiedFcf : eps;
  const dcfBaseLabel = verifiedFcf !== null && verifiedFcf > 0 ? 'Free Cash Flow / Aktie' : 'EPS als Proxy';
  const modelReady = Boolean(isStock && eps > 0 && customPrice > 0);
  const fullyEvidenceBacked = Boolean(
    modelReady
    && epsInputSource === 'verified'
    && priceInputSource === 'verified'
    && display?.buffettValuationStatus === 'READY',
  );

  const grahamValue = modelReady ? calculateGrahamValue(eps, growth, bondYieldFactor, aaaBondYield) : null;
  const dcfResult = modelReady ? calculateDcfValue(dcfBase, growth, discountRate, terminalMultiple, projectionYears) : null;
  const dcfValue = dcfResult?.value ?? null;
  const consensusValue = grahamValue !== null && dcfValue !== null
    ? Number(((grahamValue + dcfValue) / 2).toFixed(2))
    : null;
  const marginOfSafety = consensusValue !== null && consensusValue > 0 && customPrice > 0
    ? Number((((consensusValue - customPrice) / consensusValue) * 100).toFixed(1))
    : null;

  const pillars = useMemo(() => {
    const f = display?.fundamentals;
    if (!isStock || !f) return [];
    return [
      {
        title: 'Positive Ertragskraft (EPS TTM)',
        status: f.epsTtm !== null ? `${formatBuffettMetric(f.epsTtm)} USD/Aktie` : 'Nicht verfügbar',
        fulfilled: f.epsTtm !== null && f.epsTtm > 0,
        description: 'Ein positives, verifiziertes Trailing-EPS ist die Mindestbasis der Graham-Bewertung.',
      },
      {
        title: 'Positiver Free Cash Flow / Aktie',
        status: f.freeCashFlowPerShare !== null ? `${formatBuffettMetric(f.freeCashFlowPerShare)} USD/Aktie` : 'Nicht verfügbar',
        fulfilled: f.freeCashFlowPerShare !== null && f.freeCashFlowPerShare > 0,
        description: 'Free Cash Flow wird bevorzugt als DCF-Basis verwendet; fehlt er, wird kein Wert erfunden.',
      },
      {
        title: 'Verschuldung (Debt-to-Equity)',
        status: f.debtToEquity !== null ? `${formatBuffettMetric(f.debtToEquity)}x` : 'Nicht verfügbar',
        fulfilled: f.debtToEquity !== null && f.debtToEquity >= 0 && f.debtToEquity < 1,
        description: 'Fehlende Verschuldungsdaten gelten nicht mehr automatisch als bestanden.',
      },
      {
        title: 'Bewertung (P/E Ratio)',
        status: f.peRatio !== null ? `${formatBuffettMetric(f.peRatio)}x` : 'Nicht verfügbar',
        fulfilled: f.peRatio !== null && f.peRatio > 0 && f.peRatio < 35,
        description: 'Der Check wird nur aus einem belegten P/E-Wert abgeleitet; Nullwerte werden ausgeschlossen.',
      },
    ];
  }, [display, isStock]);

  const fulfilledCount = pillars.filter(item => item.fulfilled).length;

  const verdict = useMemo(() => {
    if (!isStock) {
      return {
        signal: 'NICHT ANWENDBAR',
        label: 'Buffett/Graham-Unternehmensbewertung nicht anwendbar',
        description: 'Für diese Assetklasse existieren Unternehmenskennzahlen wie EPS und Free Cash Flow nicht in derselben fachlichen Bedeutung. Der Marktwert wird oben weiterhin aus verifizierter Evidence angezeigt.',
        classes: 'border-sky-500/20 bg-sky-500/5 text-sky-200',
      };
    }
    if (!modelReady || marginOfSafety === null) {
      return {
        signal: 'NICHT BERECHENBAR',
        label: 'Noch keine belastbare Fundamentalbewertung',
        description: display?.reason ?? 'Für eine Berechnung werden mindestens ein positiver Marktpreis und ein positives EPS benötigt. Fehlende Eingaben werden nicht geschätzt.',
        classes: 'border-amber-500/20 bg-amber-500/5 text-amber-200',
      };
    }
    if (marginOfSafety >= 30) {
      return {
        signal: 'DEUTLICH UNTER MODELLWERT',
        label: `Hohe modellierte Sicherheitsmarge: +${marginOfSafety}%`,
        description: fullyEvidenceBacked
          ? 'Marktpreis und EPS stammen aus verifizierten Quellen; Wachstum, Diskontsatz und Terminal-Multiple bleiben transparente Modellannahmen.'
          : 'Mindestens eine Kerneingabe wurde manuell überschrieben. Das Ergebnis ist daher eine Szenariorechnung und keine vollständig evidence-basierte Bewertung.',
        classes: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
      };
    }
    if (marginOfSafety >= 10) {
      return {
        signal: 'UNTER MODELLWERT',
        label: `Positive modellierte Sicherheitsmarge: +${marginOfSafety}%`,
        description: 'Der Marktpreis liegt unter dem Modellkonsens. Das Ergebnis hängt ausdrücklich von den sichtbaren Modellannahmen ab.',
        classes: 'border-green-500/20 bg-green-500/5 text-green-200',
      };
    }
    if (marginOfSafety >= -10) {
      return {
        signal: 'NAHE MODELLWERT',
        label: `Marktpreis nahe Modellkonsens: ${marginOfSafety}%`,
        description: 'Zwischen Marktpreis und Modellkonsens besteht nur eine geringe Abweichung.',
        classes: 'border-amber-500/20 bg-amber-500/5 text-amber-200',
      };
    }
    return {
      signal: 'ÜBER MODELLWERT',
      label: `Negative modellierte Sicherheitsmarge: ${marginOfSafety}%`,
      description: 'Der Marktpreis liegt über dem modellierten inneren Wert. Dies ist ein Bewertungsbefund, keine Kauf- oder Verkaufsempfehlung.',
      classes: 'border-rose-500/20 bg-rose-500/5 text-rose-200',
    };
  }, [display?.reason, fullyEvidenceBacked, isStock, marginOfSafety, modelReady]);

  if (catalogLoading && catalog.length === 0) {
    return (
      <div className="bg-zinc-800/60 border border-white/10 rounded-2xl p-8 min-h-[350px] flex flex-col items-center justify-center">
        <Activity className="w-7 h-7 animate-spin text-aif-gold-DEFAULT mb-3" />
        <p className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Lade Asset-Katalog...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/40 to-transparent" />

      <div className="flex flex-col xl:flex-row justify-between gap-5 pb-6 border-b border-white/10 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-aif-gold-DEFAULT tracking-widest font-black uppercase">
            <Award size={12} />
            <span>Enterprise Financial Intelligence Suite</span>
          </div>
          <h2 className="text-2xl font-black text-white font-display mt-1.5">Buffett Value Check & DCF Analysator</h2>
          <p className="text-sm text-white/60 mt-1 max-w-3xl">
            Asset-Katalog und Marktbeobachtung sind getrennt. Werte werden erst bei Auswahl über den verifizierten Evidence-Layer geladen; Bootstrap- oder Demo-Werte werden nicht verwendet.
          </p>
        </div>

        <div className="relative min-w-[320px]" id="buffett-asset-selector">
          {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => { setIsDropdownOpen(false); setSearchQuery(''); }} />}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(current => !current)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left relative z-40"
          >
            <div className="w-11 h-11 rounded-lg bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 flex items-center justify-center font-mono font-black text-aif-gold-DEFAULT text-sm shrink-0">
              {activeSymbol}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white flex items-center gap-1">
                <span className="truncate">{activeAsset?.name ?? display?.name ?? activeSymbol}</span>
                <ChevronDown size={14} className="text-white/40" />
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono uppercase">
                <span className="text-white/40">{display?.assetClass ?? activeAsset?.type ?? 'Asset'}</span>
                <span className="text-emerald-300 normal-case">
                  {valueLoading ? 'Wert wird verifiziert…' : display?.value !== null && display?.value !== undefined
                    ? `${formatBuffettMetric(display.value)} ${display.unit ?? ''}`
                    : 'Kein verifizierter Wert'}
                </span>
              </div>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-3 z-50">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 text-white/40" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Symbol oder Name suchen..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                  autoFocus
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
                {filteredAssets.slice(0, 150).map(asset => (
                  <button
                    type="button"
                    key={asset.symbol}
                    onClick={() => {
                      setActiveSymbol(asset.symbol.toUpperCase());
                      setIsDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-3 ${activeSymbol === asset.symbol ? 'bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-[11px] text-white">{asset.symbol}</div>
                      <div className="text-[10px] text-white/45 truncate">{asset.name}</div>
                    </div>
                    <span className="text-[9px] uppercase font-mono text-white/35 shrink-0">{asset.type} · bei Auswahl laden</span>
                  </button>
                ))}
                {filteredAssets.length === 0 && <div className="py-5 text-center text-xs text-white/40">Keine Assets gefunden.</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {loadError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-black/20 border border-white/10 rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Verifizierter {display?.valueKind === 'yield' ? 'Renditewert' : 'Marktwert'}</div>
          <div className="mt-1 text-xl font-mono font-black text-white">
            {valueLoading ? '…' : display?.value === null || display?.value === undefined ? '—' : `${formatBuffettMetric(display.value)} ${display.unit ?? ''}`}
          </div>
        </div>
        <div className="bg-black/20 border border-white/10 rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono">24h Änderung</div>
          <div className="mt-1 text-xl font-mono font-black text-white">{display?.change24hPct === null || display?.change24hPct === undefined ? '—' : `${display.change24hPct >= 0 ? '+' : ''}${display.change24hPct.toFixed(2)}%`}</div>
        </div>
        <div className="bg-black/20 border border-white/10 rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Market Cap</div>
          <div className="mt-1 text-xl font-mono font-black text-white">{display?.marketCap === null || display?.marketCap === undefined ? '—' : `${formatBuffettMetric(display.marketCap)} USD`}</div>
        </div>
        <div className="bg-black/20 border border-white/10 rounded-xl p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-mono">24h Volumen</div>
          <div className="mt-1 text-xl font-mono font-black text-white">{display?.volume24h === null || display?.volume24h === undefined ? '—' : `${formatBuffettMetric(display.volume24h)} USD`}</div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-[11px] text-white/60">
        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
          <ShieldCheck size={14} />
          <span>Verified Asset Display · {display?.status ?? 'Lädt'} · keine Bootstrap-Ersatzwerte</span>
        </div>
        <div className="mt-1">
          Provider: {display?.providers?.length ? display.providers.join(', ') : '—'} · Evidence IDs: {display?.evidenceIds?.length ?? 0} · Beobachtet: {formatObservedAt(display?.observedAt ?? null)}
        </div>
        {display?.reason && <div className="mt-1 text-amber-200/80">{display.reason}</div>}
      </div>

      {!isStock ? (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-6">
          <div className="flex items-start gap-3">
            <Info className="text-sky-300 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-lg font-bold text-white">Buffett Value Check: nicht anwendbar auf {display?.assetClass ?? activeAsset?.type ?? 'diese Assetklasse'}</h3>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                Der Marktwert bleibt sichtbar, aber Graham-/DCF-Unternehmenskennzahlen werden nicht auf Krypto, Forex, Rohstoffe, Indizes oder Anleiherenditen übertragen. Dadurch wird „Nicht verfügbar“ von fachlich „Nicht anwendbar“ getrennt.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 space-y-5">
            <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Bewertungsparameter</span>
                <Database size={15} className="text-aif-gold-DEFAULT" />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-white/55 mb-1.5">
                  <span>EPS TTM</span>
                  <span className={epsInputSource === 'verified' ? 'text-emerald-300' : epsInputSource === 'manual' ? 'text-amber-300' : 'text-white/35'}>
                    {eps > 0 ? `${eps.toFixed(2)} USD · ${epsInputSource === 'verified' ? 'verifiziert' : 'manuell'}` : 'Nicht verfügbar'}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={eps || ''}
                  onChange={event => {
                    const value = Math.max(0, Number(event.target.value));
                    setEps(Number.isFinite(value) ? value : 0);
                    setEpsInputSource(value > 0 ? 'manual' : 'missing');
                  }}
                  className="w-full bg-zinc-900/80 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                  placeholder="Verifiziertes EPS fehlt"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-white/55 mb-1.5">
                  <span>Wachstumsannahme (g)</span><span className="text-aif-gold-DEFAULT">{growth.toFixed(1)}%</span>
                </div>
                <input type="range" min="0" max="30" step="0.5" value={growth} onChange={event => setGrowth(Number(event.target.value))} className="w-full accent-aif-gold-DEFAULT" />
                <p className="text-[10px] text-white/35 mt-1">Explizite Modellannahme, kein gemessener Datenpunkt.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-[10px] uppercase tracking-wider text-white/45 font-mono">
                  WACC / Diskontsatz
                  <input type="number" min="1" step="0.1" value={discountRate} onChange={event => setDiscountRate(Math.max(1, Number(event.target.value)))} className="mt-1 w-full bg-zinc-900/80 border border-white/20 rounded-lg px-2.5 py-2 text-sm text-white" />
                </label>
                <label className="text-[10px] uppercase tracking-wider text-white/45 font-mono">
                  Terminal Multiple
                  <input type="number" min="5" step="1" value={terminalMultiple} onChange={event => setTerminalMultiple(Math.max(5, Number(event.target.value)))} className="mt-1 w-full bg-zinc-900/80 border border-white/20 rounded-lg px-2.5 py-2 text-sm text-white" />
                </label>
              </div>

              <div className="flex gap-2">
                {[3, 5, 7, 10].map(years => (
                  <button key={years} type="button" onClick={() => setProjectionYears(years)} className={`flex-1 py-1.5 rounded border text-[11px] font-mono ${projectionYears === years ? 'border-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT' : 'border-white/10 text-white/50'}`}>{years}J</button>
                ))}
              </div>

              <div className="border-t border-white/10 pt-3">
                <label className="text-[10px] uppercase tracking-wider text-white/45 font-mono">Vergleichspreis</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice || ''}
                  onChange={event => {
                    const value = Math.max(0, Number(event.target.value));
                    setCustomPrice(Number.isFinite(value) ? value : 0);
                    setPriceInputSource(value > 0 ? 'manual' : 'missing');
                  }}
                  className="mt-1 w-full bg-zinc-900/80 border border-white/20 rounded-lg px-3 py-2 text-base font-bold text-white font-mono"
                  placeholder="Verifizierter Preis fehlt"
                />
                <p className="text-[10px] mt-1 text-white/35">Quelle: {priceInputSource === 'verified' ? 'Verified Asset Display' : priceInputSource === 'manual' ? 'manueller Szenariowert' : 'nicht verfügbar'}</p>
              </div>
            </div>

            <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-3">Verifizierte Fundamentals</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {[
                  ['P/E', display?.fundamentals?.peRatio, 'x'],
                  ['Debt/Equity', display?.fundamentals?.debtToEquity, 'x'],
                  ['Dividendenrendite', display?.fundamentals?.dividendYieldPct, '%'],
                  ['Nettomarge', display?.fundamentals?.profitMarginPct, '%'],
                  ['EPS TTM', display?.fundamentals?.epsTtm, 'USD/Aktie'],
                  ['FCF/Aktie', display?.fundamentals?.freeCashFlowPerShare, 'USD/Aktie'],
                ].map(([label, value, unit]) => (
                  <div key={String(label)} className="bg-black/20 rounded-lg border border-white/5 p-2">
                    <div className="text-white/35">{String(label)}</div>
                    <div className="text-white font-bold mt-1">{value === null || value === undefined ? '—' : `${formatBuffettMetric(value)} ${String(unit)}`}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="xl:col-span-7 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4">
                <div className="text-[10px] uppercase text-white/40 font-mono">Graham Value</div>
                <div className="text-2xl font-black text-white font-mono mt-3">{grahamValue === null ? '—' : `${formatBuffettMetric(grahamValue)} USD`}</div>
              </div>
              <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4">
                <div className="text-[10px] uppercase text-white/40 font-mono">DCF · {dcfBaseLabel}</div>
                <div className="text-2xl font-black text-white font-mono mt-3">{dcfValue === null ? '—' : `${formatBuffettMetric(dcfValue)} USD`}</div>
              </div>
              <div className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 rounded-xl p-4">
                <div className="text-[10px] uppercase text-aif-gold-DEFAULT font-mono">Modellkonsens</div>
                <div className="text-2xl font-black text-aif-gold-DEFAULT font-mono mt-3">{consensusValue === null ? '—' : `${formatBuffettMetric(consensusValue)} USD`}</div>
              </div>
            </div>

            <div className="flex gap-2 bg-white/5 border border-white/10 p-1 rounded-lg">
              {([
                ['dcf', 'DCF Modell'],
                ['graham', 'Graham Formel'],
                ['evidence', 'Evidence'],
              ] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex-1 py-2 rounded-md text-[11px] font-bold uppercase font-mono ${activeTab === id ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/55'}`}>{label}</button>
              ))}
            </div>

            <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4">
              {activeTab === 'dcf' && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-3"><Activity size={14} className="text-cyan-300" />DCF Projektion</div>
                  <p className="text-[11px] text-white/45 mb-3">Basis: {dcfBaseLabel}. Free Cash Flow wird bevorzugt; EPS dient nur als sichtbar gekennzeichneter Proxy, wenn FCF fehlt.</p>
                  {dcfResult ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] font-mono">
                        <thead><tr className="text-white/35 border-b border-white/10"><th className="text-left py-2">Jahr</th><th className="text-right">Projiziert</th><th className="text-right">Barwert</th></tr></thead>
                        <tbody>
                          {dcfResult.steps.map(step => <tr key={step.year} className="border-b border-white/5"><td className="py-2 text-white/60">{step.year}</td><td className="text-right text-white">{step.projected.toFixed(2)}</td><td className="text-right text-cyan-300">{step.presentValue.toFixed(2)}</td></tr>)}
                        </tbody>
                      </table>
                    </div>
                  ) : <div className="text-sm text-amber-200">DCF nicht berechenbar: verifizierte oder manuell gesetzte positive Eingaben fehlen.</div>}
                </div>
              )}

              {activeTab === 'graham' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white"><Scale size={14} className="text-amber-300" />Graham-Formel</div>
                  <div className="text-[12px] font-mono text-white/70 bg-black/20 border border-white/5 rounded-lg p-3">V = (EPS × (8.5 + 2g) × {bondYieldFactor}) / {aaaBondYield}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[10px] text-white/45 uppercase font-mono">Zins-Multiplikator<input type="number" step="0.1" min="0.1" value={bondYieldFactor} onChange={event => setBondYieldFactor(Math.max(0.1, Number(event.target.value)))} className="mt-1 w-full bg-zinc-900 border border-white/20 rounded px-2 py-2 text-white" /></label>
                    <label className="text-[10px] text-white/45 uppercase font-mono">AAA-Rendite (%)<input type="number" step="0.1" min="0.1" value={aaaBondYield} onChange={event => setAaaBondYield(Math.max(0.1, Number(event.target.value)))} className="mt-1 w-full bg-zinc-900 border border-white/20 rounded px-2 py-2 text-white" /></label>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck size={14} className="text-emerald-300" />Daten-Lineage</div>
                  <div className="text-[11px] text-white/55 space-y-1">
                    <div>Contract: <span className="font-mono text-white">{display?.contractVersion ?? '—'}</span></div>
                    <div>Provider: <span className="font-mono text-white">{display?.providers?.join(', ') || '—'}</span></div>
                    <div>Evidence IDs: <span className="font-mono text-white">{display?.evidenceIds?.length ?? 0}</span></div>
                    <div>Observed At: <span className="font-mono text-white">{formatObservedAt(display?.observedAt ?? null)}</span></div>
                    <div>Execution-Preis: <span className="font-mono text-white">Nein · Display/Research Evidence</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-white uppercase">Buffett Fundamental-Evidence-Checkliste</span>
                <span className="text-aif-gold-DEFAULT font-mono text-xs">{fulfilledCount} / {pillars.length}</span>
              </div>
              <div className="space-y-2">
                {pillars.map(item => (
                  <div key={item.title} className="flex items-start gap-2.5 bg-black/20 border border-white/5 rounded-lg p-3">
                    {item.fulfilled ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle size={15} className="text-amber-300 shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3"><span className="text-sm font-bold text-white">{item.title}</span><span className="text-[10px] font-mono text-white/50 shrink-0">{item.status}</span></div>
                      <p className="text-[10px] text-white/40 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border rounded-xl p-4 ${verdict.classes}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-wider font-mono">Bewertungsurteil</div>
                <div className="text-[10px] uppercase tracking-wider font-mono font-bold">{verdict.signal}</div>
              </div>
              <div className="text-base font-black text-white mt-1">{verdict.label}</div>
              <p className="text-sm text-white/65 mt-1.5 leading-relaxed">{verdict.description}</p>
              {marginOfSafety !== null && <div className="mt-3 text-xs font-mono text-white/50">Marktpreis {customPrice.toFixed(2)} USD · Modellkonsens {consensusValue?.toFixed(2)} USD · MoS {marginOfSafety >= 0 ? '+' : ''}{marginOfSafety}%</div>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 bg-aif-gold-DEFAULT/[0.03] border border-aif-gold-DEFAULT/15 rounded-xl p-3 flex items-start gap-3">
        <BookOpen className="text-aif-gold-DEFAULT/70 shrink-0 mt-0.5" size={16} />
        <p className="text-[11px] text-white/50 leading-relaxed">
          Der Buffett/Graham-Bereich ist ein Bewertungsmodell. Provider-Evidence, Modellannahmen und manuelle Overrides bleiben getrennt sichtbar; fehlende Daten werden weder automatisch als bestanden gewertet noch durch pauschale Ersatzwerte ersetzt.
        </p>
      </div>
    </div>
  );
}
