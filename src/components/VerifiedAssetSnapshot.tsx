import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export type VerifiedAssetSnapshotType = 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';

type ProvenanceEntry = {
  provider?: string;
  source?: string;
  observedAt?: string;
  retrievedAt?: string;
  evidenceId?: string;
  id?: string;
};

type QuoteSnapshot = {
  status: string;
  price: number | null;
  unit: string | null;
  providers: string[];
  evidenceIds: string[];
  observedAt: string | null;
  correlationId: string | null;
  reason: string | null;
};

export interface VerifiedAssetSnapshotProps {
  symbol: string;
  assetName: string;
  assetType: VerifiedAssetSnapshotType;
  scoringStatus: string;
  score: number | null;
  coverage: number | null;
  dataQuality: string | null;
  scoringProviders: string[];
  scoringEvidenceIds: string[];
  provenance: ProvenanceEntry[];
}

const TYPE_LABEL: Record<VerifiedAssetSnapshotType, string> = {
  crypto: 'Krypto',
  stock: 'Aktie',
  forex: 'Forex',
  commodity: 'Rohstoff',
  index: 'Index',
  bond: 'Anleihe',
};

function finitePositive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function latestTimestamp(values: Array<string | null | undefined>): string | null {
  return values
    .filter((value): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function formatPrice(value: number | null, unit: string | null): string {
  if (value === null) return '—';
  const maximumFractionDigits = value >= 1000 ? 2 : value >= 1 ? 4 : 8;
  const formatted = value.toLocaleString('de-DE', { maximumFractionDigits });
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatTimestamp(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function emptyQuote(status = 'LOADING'): QuoteSnapshot {
  return {
    status,
    price: null,
    unit: null,
    providers: [],
    evidenceIds: [],
    observedAt: null,
    correlationId: null,
    reason: null,
  };
}

export function VerifiedAssetSnapshot({
  symbol,
  assetName,
  assetType,
  scoringStatus,
  score,
  coverage,
  dataQuality,
  scoringProviders,
  scoringEvidenceIds,
  provenance,
}: VerifiedAssetSnapshotProps) {
  const [quote, setQuote] = useState<QuoteSnapshot>(() => emptyQuote());
  const [refreshKey, setRefreshKey] = useState(0);
  const normalizedSymbol = symbol.toUpperCase().trim();
  const hasRealtimeQuoteContract = assetType === 'crypto' || assetType === 'stock' || assetType === 'forex' || assetType === 'index';

  useEffect(() => {
    if (!hasRealtimeQuoteContract) {
      setQuote({
        ...emptyQuote('DATA_UNAVAILABLE'),
        reason: assetType === 'commodity'
          ? 'Rohstoffe verwenden verifizierte Research-/History-Evidence; ein Execution-Quote-Contract ist bewusst nicht freigegeben.'
          : 'Sovereign-Benchmark-Anleihen verwenden verifizierte Yield-/History-Evidence; ein Execution-Quote-Contract ist bewusst nicht freigegeben.',
      });
      return undefined;
    }

    const controller = new AbortController();
    setQuote(emptyQuote());

    const load = async () => {
      try {
        if (assetType === 'crypto') {
          const response = await fetch(`/api/crypto/price-consensus/${encodeURIComponent(normalizedSymbol)}`, { signal: controller.signal });
          const body = await response.json().catch(() => ({}));
          const observations = Array.isArray(body?.observations) ? body.observations : [];
          const price = finitePositive(body?.canonicalValue);
          const providers = unique([
            ...strings(body?.providers),
            ...observations
              .map((entry: any) => entry?.provider)
              .filter((provider: unknown): provider is string => typeof provider === 'string'),
          ]);
          const evidenceIds = unique([
            ...strings(body?.evidenceIds),
            ...observations
              .map((entry: any) => entry?.evidenceId)
              .filter((id: unknown): id is string => typeof id === 'string'),
          ]);
          const units = unique(observations
            .map((entry: any) => entry?.unit)
            .filter((unit: unknown): unit is string => typeof unit === 'string'));
          const observedAt = latestTimestamp(observations.map((entry: any) => entry?.observedAt));

          setQuote({
            status: response.ok && body?.status === 'CONSENSUS' && price !== null ? 'READY' : typeof body?.status === 'string' ? body.status : 'DATA_UNAVAILABLE',
            price: response.ok && body?.status === 'CONSENSUS' ? price : null,
            unit: units.length === 1 ? units[0] : null,
            providers,
            evidenceIds,
            observedAt,
            correlationId: typeof body?.correlationId === 'string' ? body.correlationId : response.headers.get('x-correlation-id'),
            reason: typeof body?.reason === 'string' ? body.reason : typeof body?.error === 'string' ? body.error : null,
          });
          return;
        }

        const response = await fetch(`/api/registry/assets/${encodeURIComponent(normalizedSymbol)}/verified-quote`, { signal: controller.signal });
        const body = await response.json().catch(() => ({}));
        const price = finitePositive(body?.price);
        const providers = unique([
          ...strings(body?.providers),
          ...(typeof body?.provider === 'string' ? [body.provider] : []),
        ]);
        setQuote({
          status: response.ok && body?.status === 'READY' && price !== null ? 'READY' : typeof body?.status === 'string' ? body.status : 'DATA_UNAVAILABLE',
          price: response.ok && body?.status === 'READY' ? price : null,
          unit: typeof body?.currency === 'string' ? body.currency : null,
          providers,
          evidenceIds: unique(strings(body?.evidenceIds)),
          observedAt: typeof body?.observedAt === 'string' ? body.observedAt : null,
          correlationId: typeof body?.correlationId === 'string' ? body.correlationId : response.headers.get('x-correlation-id'),
          reason: typeof body?.reason === 'string' ? body.reason : null,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setQuote({
          ...emptyQuote('DATA_UNAVAILABLE'),
          reason: error instanceof Error ? error.message : 'Verifizierte Marktdaten konnten nicht geladen werden.',
        });
      }
    };

    void load();
    return () => controller.abort();
  }, [assetType, hasRealtimeQuoteContract, normalizedSymbol, refreshKey]);

  const scoringObservedAt = useMemo(
    () => latestTimestamp(provenance.flatMap((entry) => [entry.observedAt, entry.retrievedAt])),
    [provenance],
  );
  const observedAt = quote.observedAt ?? scoringObservedAt;
  const providers = useMemo(
    () => unique([...quote.providers, ...scoringProviders, ...provenance.map((entry) => entry.provider ?? entry.source ?? '')]),
    [provenance, quote.providers, scoringProviders],
  );
  const evidenceCount = useMemo(
    () => unique([
      ...quote.evidenceIds,
      ...scoringEvidenceIds,
      ...provenance.map((entry) => entry.evidenceId ?? entry.id ?? ''),
    ]).length,
    [provenance, quote.evidenceIds, scoringEvidenceIds],
  );
  const coveragePct = coverage === null ? null : Math.round(Math.max(0, Math.min(1, coverage)) * 100);
  const marketStatusLabel = hasRealtimeQuoteContract
    ? quote.status === 'LOADING' ? 'Marktdaten werden geladen' : `Marktdaten ${quote.status}`
    : 'Research-Evidence ohne Quote';

  return (
    <section aria-labelledby="verified-asset-snapshot-title" className="relative z-20 rounded-2xl border border-cyan-400/15 bg-black/35 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-[0.18em] text-cyan-300">
            <ShieldCheck size={14} /> Verifizierte Asset-Daten
          </div>
          <h3 id="verified-asset-snapshot-title" className="mt-1 text-base font-black text-white">
            {assetName} <span className="font-mono text-white/55">({normalizedSymbol})</span>
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-white/55">
            Marktbeobachtung und kanonisches Scoring bleiben getrennte Evidence-Verträge. Fehlende Daten werden nicht durch Registry-Bootstrapwerte ersetzt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={quote.status} label={marketStatusLabel} />
          {hasRealtimeQuoteContract && (
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={quote.status === 'LOADING'}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-[10px] font-bold text-white/70 hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw size={12} className={quote.status === 'LOADING' ? 'animate-spin' : ''} /> Aktualisieren
            </button>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <dt className="text-[9px] font-mono uppercase tracking-wider text-white/50">Verifizierter Kurs</dt>
          <dd className="mt-1 break-words font-mono text-lg font-black tabular-nums text-white">{formatPrice(quote.price, quote.unit)}</dd>
          <div className="mt-1 text-[9px] text-white/40">{hasRealtimeQuoteContract ? 'Consensus / Verified Quote' : 'Kein freigegebener Quote-Contract'}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <dt className="text-[9px] font-mono uppercase tracking-wider text-white/50">Kanonischer Score</dt>
          <dd className="mt-1 font-mono text-lg font-black tabular-nums text-white">{score === null ? '—' : score.toFixed(1)}</dd>
          <div className="mt-1"><StatusBadge status={scoringStatus} label={`Scoring ${scoringStatus}`} /></div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <dt className="text-[9px] font-mono uppercase tracking-wider text-white/50">Coverage</dt>
          <dd className="mt-1 font-mono text-lg font-black tabular-nums text-white">{coveragePct === null ? '—' : `${coveragePct}%`}</dd>
          <div className="mt-1 text-[9px] text-white/40">Data Quality: {dataQuality ?? '—'}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <dt className="text-[9px] font-mono uppercase tracking-wider text-white/50">Evidence</dt>
          <dd className="mt-1 font-mono text-lg font-black tabular-nums text-white">{evidenceCount}</dd>
          <div className="mt-1 text-[9px] text-white/40">{providers.length} Provider</div>
        </div>
      </dl>

      <dl className="mt-3 grid gap-x-6 gap-y-3 rounded-xl border border-white/10 bg-black/25 p-4 text-[10px] sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="font-mono uppercase tracking-wider text-white/45">Assetklasse</dt>
          <dd className="mt-1 font-bold text-white/80">{TYPE_LABEL[assetType]}</dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-wider text-white/45">Provider</dt>
          <dd className="mt-1 break-words font-bold text-white/80">{providers.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-wider text-white/45">Letzte Evidence</dt>
          <dd className="mt-1 font-bold text-white/80">{formatTimestamp(observedAt)}</dd>
        </div>
        <div>
          <dt className="font-mono uppercase tracking-wider text-white/45">Correlation</dt>
          <dd className="mt-1 break-all font-mono text-white/65">{quote.correlationId ?? '—'}</dd>
        </div>
      </dl>

      {quote.reason && quote.status !== 'READY' && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] p-3 text-[10px] leading-relaxed text-amber-100/75">
          <Database size={13} className="mt-0.5 shrink-0" />
          <span>{quote.reason}</span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-white/35">
        <Activity size={11} /> Read-only · Evidence-gated · No Demo Data
      </div>
    </section>
  );
}

export default VerifiedAssetSnapshot;
