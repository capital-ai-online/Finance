import React, { useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { assetRegistry } from '../../../lib/assetRegistry';
import type {
  AltcoinPatternResearchViewEnvelope,
  AltcoinPatternResearchViewTimeframe,
} from '../../../platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchViewContract';
import { StatusBadge } from '../../../shared/ui';
import { CryptoPatternTrooper } from './CryptoPatternTrooper';
import { fetchAltcoinPatternResearchView } from './cryptoPatternTrooperClient';

function initialAltcoinSymbol(): string {
  const crypto = assetRegistry.getAssets().filter((asset) => asset.type === 'crypto');
  return crypto.find((asset) => asset.symbol.toUpperCase() !== 'BTC')?.symbol.toUpperCase()
    ?? crypto[0]?.symbol.toUpperCase()
    ?? '';
}

export function CryptoPatternTrooperLive() {
  const cryptoAssets = useMemo(
    () => assetRegistry.getAssets().filter((asset) => asset.type === 'crypto'),
    [],
  );
  const [symbol, setSymbol] = useState(initialAltcoinSymbol);
  const [timeframe, setTimeframe] = useState<AltcoinPatternResearchViewTimeframe>('4h');
  const [envelope, setEnvelope] = useState<AltcoinPatternResearchViewEnvelope | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!symbol) {
      setEnvelope(null);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    void fetchAltcoinPatternResearchView(symbol)
      .then((next) => {
        if (!cancelled) setEnvelope(next);
      })
      .catch(() => {
        if (!cancelled) setEnvelope(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const projection = envelope?.lanes[timeframe] ?? null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-asset-crypto/20 bg-surface/45 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-text-secondary">
                Research Asset
              </span>
              <select
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-text-primary"
              >
                {cryptoAssets.map((asset) => (
                  <option key={asset.symbol} value={asset.symbol.toUpperCase()}>
                    {asset.symbol.toUpperCase()} · {asset.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1">
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-text-secondary">
                Research Timeframe
              </span>
              <div className="flex min-h-11 gap-2">
                {(['4h', '1d'] as const).map((lane) => (
                  <button
                    key={lane}
                    type="button"
                    onClick={() => setTimeframe(lane)}
                    aria-pressed={timeframe === lane}
                    className={
                      timeframe === lane
                        ? 'min-h-11 rounded-xl border border-asset-crypto/40 bg-asset-crypto/10 px-4 font-mono text-xs font-black uppercase text-asset-crypto'
                        : 'min-h-11 rounded-xl border border-border bg-background px-4 font-mono text-xs font-black uppercase text-text-secondary'
                    }
                  >
                    {lane}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-xs text-text-secondary">
                <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
                Read model
              </span>
            ) : projection ? (
              <StatusBadge status={projection.assessment.status === 'READY' ? 'READY' : 'SCORE_NOT_COMPUTABLE'} />
            ) : (
              <StatusBadge status="DATA_UNAVAILABLE" label="NO ATTESTED PROJECTION" />
            )}
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-[10px] text-text-secondary sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background/35 p-2.5">
            <span className="font-mono uppercase">Asset ID</span>
            <div className="mt-1 font-bold text-text-primary">{envelope?.assetId ?? '—'}</div>
          </div>
          <div className="rounded-lg border border-border bg-background/35 p-2.5">
            <span className="font-mono uppercase">Observed</span>
            <div className="mt-1 font-bold text-text-primary">{projection?.observedAt ?? '—'}</div>
          </div>
          <div className="rounded-lg border border-border bg-background/35 p-2.5">
            <span className="inline-flex items-center gap-1 font-mono uppercase">
              <Database size={11} aria-hidden="true" />
              Provenance
            </span>
            <div className="mt-1 break-all font-bold text-text-primary">
              {projection ? projection.evidenceRefs.length + ' refs · ' + projection.correlationId : '—'}
            </div>
          </div>
        </div>
      </div>

      <CryptoPatternTrooper assessment={projection?.assessment ?? null} />
    </div>
  );
}

export default CryptoPatternTrooperLive;
