import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

interface HistoryPoint {
  timestamp: string;
  close: number;
}

interface VerifiedHistoryResponse {
  provider: string;
  providerFeed: string | null;
  symbol: string;
  assetClass: string;
  currency: string | null;
  receivedAt: string;
  qualityState: 'HISTORICAL' | 'UNAVAILABLE' | 'INVALID';
  correlationId: string;
  points: HistoryPoint[];
  evidenceId: string | null;
  barInterval?: string;
  reason?: string;
  error?: string;
}

export interface EnterpriseAsset4hChartProps {
  symbol: string;
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: value >= 100 ? 2 : 4,
    maximumFractionDigits: value >= 100 ? 2 : value >= 1 ? 4 : 8,
  });
}

/**
 * Read-only 4h market chart for the Enterprise Scorer.
 *
 * The component consumes only the canonical MarketDataHistoryGateway projection. It neither
 * calculates nor mutates a score. A missing verified intraday provider is rendered fail-closed as
 * DATA_UNAVAILABLE instead of falling back to simulated or client-generated market history.
 */
export function EnterpriseAsset4hChart({ symbol }: EnterpriseAsset4hChartProps) {
  const upper = symbol.toUpperCase().trim();
  const [result, setResult] = useState<VerifiedHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!upper) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setResult(null);

    void fetch(`/api/market-data/history/${encodeURIComponent(upper)}?interval=4h&maxPoints=90`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.reason || payload?.error || 'Verifizierte 4h-Bars sind nicht verfügbar.');
        return payload as VerifiedHistoryResponse;
      })
      .then(payload => setResult(payload))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Verifizierte 4h-Bars sind nicht verfügbar.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [upper]);

  const chartData = useMemo(() => (result?.points ?? []).map(point => ({
    timestamp: point.timestamp,
    label: new Date(point.timestamp).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    close: point.close,
  })), [result]);

  return (
    <section className="w-full rounded-2xl border border-brand-cyan/20 bg-surface/45 p-4 backdrop-blur-xl" aria-labelledby="enterprise-4h-chart-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-cyan">
            <Activity className="h-3.5 w-3.5" /> Verified Market Bars
          </div>
          <h3 id="enterprise-4h-chart-title" className="mt-1 text-sm font-black text-text-primary">
            {upper || '—'} · 4-Stunden-Chart
          </h3>
          <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">
            Read-only Marktvisualisierung aus der kanonischen MarketData-History-Pipeline. Kein Chart-Score und keine Demo-Daten.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ready/20 bg-status-ready/5 px-2 py-1 text-[8px] font-mono uppercase tracking-wider text-status-ready">
          <ShieldCheck size={10} /> 4H · verified
        </span>
      </div>

      {loading && (
        <div className="mt-4 flex min-h-64 items-center justify-center rounded-xl border border-border bg-background/40">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-text-secondary">
            <Loader2 size={14} className="animate-spin text-brand-cyan" /> 4h-Bars werden geladen
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 flex min-h-28 items-start gap-2 rounded-xl border border-status-warning/20 bg-status-warning/5 p-4 text-[10px] text-status-warning">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <div className="font-bold uppercase tracking-wider">DATA_UNAVAILABLE</div>
            <div className="mt-1 text-text-secondary">{error}</div>
          </div>
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <>
          <div className="mt-4 h-72 w-full rounded-xl border border-border bg-background/35 p-2 sm:p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="enterprise4hCyanFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-asset-crypto)" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="var(--color-asset-crypto)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" minTickGap={36} tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value: number) => formatPrice(value)}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    color: 'var(--color-text-primary)',
                    fontSize: 11,
                  }}
                  labelStyle={{ color: 'var(--color-text-secondary)' }}
                  formatter={(value: number) => [`${formatPrice(value)} ${result?.currency ?? ''}`.trim(), 'Close']}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="var(--color-asset-crypto)"
                  strokeWidth={2}
                  fill="url(#enterprise4hCyanFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[8px] font-mono uppercase tracking-wider text-text-secondary">
            <span>Quelle: {result?.provider ?? '—'} · {result?.providerFeed ?? '—'}</span>
            <span>{chartData.length} Bars · Evidence {result?.evidenceId ? 'gebunden' : '—'}</span>
          </div>
        </>
      )}
    </section>
  );
}
