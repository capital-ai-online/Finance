import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Database, Gauge, MessageCircleMore, RefreshCw, ShieldCheck } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface EvidenceObservation {
  key: string;
  status: 'VERIFIED' | 'STALE' | 'NOT_AVAILABLE' | 'INVALID' | 'NOT_APPLICABLE';
  value: number | boolean | string | null;
  provider: string | null;
  evidenceRefs: string[];
  observedAt: string | null;
  retrievedAt: string | null;
  degraded?: boolean;
  reason?: string;
}

interface ProviderState { provider: string; status: string; reason?: string; }
interface CryptoEvidencePayload {
  status: 'READY' | 'PARTIAL' | 'NOT_AVAILABLE';
  symbol: string;
  retrievedAt: string;
  evidence: EvidenceObservation[];
  providers: ProviderState[];
  verifiedFeatureCount: number;
  unavailableFeatureCount: number;
  scoreEligible: false;
  executionEligible: false;
  authority: 'EVIDENCE_ONLY';
}

interface CryptoEvidenceToolboxProps { symbol: string; }
type EvidenceFamily = 'security' | 'market' | 'social' | 'defi';

const FAMILY_META: Record<EvidenceFamily, { title: string; description: string }> = {
  security: {
    title: 'Contract & Rug Security',
    description: 'GoPlus Free + Sourcify v2: Contract-/Mint-, Honeypot-, Holder-/LP- und Source-Verification-Evidence.',
  },
  market: {
    title: 'Derivatives & DEX Market Structure',
    description: 'Kraken Public Futures + DEX Screener: OI, Funding, Liquidationen, Liquidity/Slippage sowie DEX-Pool-Aktivität.',
  },
  social: {
    title: 'Social & Narrative Evidence',
    description: 'Kein kostenpflichtiger Social-Provider aktiv. Fehlende Social-Evidence bleibt sichtbar und blockiert erforderliche Promotion-Gates.',
  },
  defi: {
    title: 'DeFi & On-chain Fundamentals',
    description: 'DeFiLlama Free + Owner-allowlisted Dune-Free-Tier-Queries. Keine beliebige SQL-Ausführung.',
  },
};

function familyForKey(key: string): EvidenceFamily {
  if (
    key.startsWith('security.')
    || key.startsWith('distribution.')
    || key.startsWith('risk.honeypot')
    || key.startsWith('risk.cannot')
    || key.startsWith('risk.tax')
    || key.startsWith('risk.buyTax')
    || key.startsWith('risk.sellTax')
    || key.startsWith('risk.transferTax')
    || key === 'liquidity.lockedLpShare'
  ) return 'security';
  if (
    key.startsWith('derivatives.')
    || key.startsWith('risk.liquidation')
    || key.startsWith('liquidity.kraken')
    || key.startsWith('market.dex')
    || key === 'liquidity.dexBestPairLiquidityUsd'
  ) return 'market';
  if (key.startsWith('community.')) return 'social';
  return 'defi';
}

function labelForKey(key: string): string {
  return key
    .replace(/^[^.]+\./, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatValue(value: EvidenceObservation['value']): string {
  if (value === null) return '—';
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'string') return value;
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} Mrd.`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Mio.`;
  if (Math.abs(value) >= 1_000) return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value);
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 6 }).format(value);
}

function statusClass(status: EvidenceObservation['status']): string {
  if (status === 'VERIFIED') return 'border-emerald-500/20 bg-emerald-500/8 text-emerald-200';
  if (status === 'STALE') return 'border-amber-500/20 bg-amber-500/8 text-amber-200';
  if (status === 'INVALID') return 'border-rose-500/20 bg-rose-500/8 text-rose-200';
  return 'border-white/10 bg-white/[0.03] text-white/45';
}

function FamilyIcon({ family }: { family: EvidenceFamily }) {
  if (family === 'security') return <ShieldCheck className="h-4 w-4" />;
  if (family === 'market') return <Activity className="h-4 w-4" />;
  if (family === 'social') return <MessageCircleMore className="h-4 w-4" />;
  return <Database className="h-4 w-4" />;
}

function EvidenceFamilyCard({ family, observations }: { family: EvidenceFamily; observations: EvidenceObservation[] }) {
  const numeric = observations
    .filter(item => item.status === 'VERIFIED' && typeof item.value === 'number' && Number.isFinite(item.value))
    .slice(0, 8)
    .map(item => ({ name: labelForKey(item.key), value: Number(item.value) }));

  return (
    <section className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><FamilyIcon family={family} />{FAMILY_META[family].title}</div>
          <p className="mt-1 text-[10px] leading-relaxed text-white/40">{FAMILY_META[family].description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-mono text-white/45">
          {observations.filter(item => item.status === 'VERIFIED').length}/{observations.length} VERIFIED
        </span>
      </div>

      {numeric.length > 0 && (
        <div className="mt-4 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={numeric} layout="vertical" margin={{ top: 4, right: 10, left: 12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
              <XAxis type="number" tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }} />
              <YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 9, fill: 'rgba(255,255,255,.45)' }} />
              <Tooltip formatter={(value: number) => formatValue(value)} contentStyle={{ background: '#111114', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, fontSize: 11 }} />
              <Bar dataKey="value" fill="#a855f7" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {observations.length === 0 ? (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-4 text-[10px] text-white/35">
            Keine governante Evidence für diese Familie verfügbar. Es wird kein Ersatzwert erzeugt.
          </div>
        ) : observations.slice(0, 14).map(item => (
          <div key={item.key} className={`rounded-xl border px-3 py-2 ${statusClass(item.status)}`} title={item.reason ?? item.evidenceRefs[0] ?? item.key}>
            <div className="flex items-center justify-between gap-2"><span className="truncate text-[10px]">{labelForKey(item.key)}</span><span className="text-[9px] font-mono">{item.status}</span></div>
            <div className="mt-1 text-sm font-semibold tabular-nums">{formatValue(item.value)}</div>
            <div className="mt-1 truncate text-[9px] opacity-60">{item.provider ?? 'keine Quelle'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CryptoEvidenceToolbox({ symbol }: CryptoEvidenceToolboxProps) {
  const [payload, setPayload] = useState<CryptoEvidencePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/crypto/evidence/${encodeURIComponent(symbol.toUpperCase())}`, { signal: controller.signal })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.reason ?? `Evidence nicht verfügbar (HTTP ${response.status}).`);
        return body as CryptoEvidencePayload;
      })
      .then(setPayload)
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : String(err)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [symbol, reloadKey]);

  const grouped = useMemo(() => {
    const result: Record<EvidenceFamily, EvidenceObservation[]> = { security: [], market: [], social: [], defi: [] };
    for (const observation of payload?.evidence ?? []) result[familyForKey(observation.key)].push(observation);
    return result;
  }, [payload]);

  const total = (payload?.verifiedFeatureCount ?? 0) + (payload?.unavailableFeatureCount ?? 0);
  const coverage = total > 0 ? Math.round(((payload?.verifiedFeatureCount ?? 0) / total) * 100) : 0;

  return (
    <section className="mt-6 rounded-3xl border border-purple-500/15 bg-gradient-to-b from-purple-500/[0.05] to-black/20 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white"><BarChart3 className="h-5 w-5 text-purple-300" /><h2 className="text-base font-bold">Evidence Bewertungstools · {symbol.toUpperCase()}</h2></div>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-white/45">Grafische Projektion verifizierter Provider-Evidence. Coverage ist Datenabdeckung – kein Investment- oder Trading-Score.</p>
        </div>
        <button type="button" onClick={() => setReloadKey(value => value + 1)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/55 hover:text-white" aria-label="Evidence aktualisieren">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-white/35"><Gauge className="h-3 w-3" /> Evidence Coverage</div><div className="mt-1 text-2xl font-bold text-white">{coverage}%</div></div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[9px] uppercase tracking-wide text-white/35">Verified Features</div><div className="mt-1 text-2xl font-bold text-emerald-300">{payload?.verifiedFeatureCount ?? 0}</div></div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[9px] uppercase tracking-wide text-white/35">Nicht verfügbar</div><div className="mt-1 text-2xl font-bold text-white/55">{payload?.unavailableFeatureCount ?? 0}</div></div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="text-[9px] uppercase tracking-wide text-white/35">Authority</div><div className="mt-2 text-[10px] font-mono font-semibold text-purple-200">{payload?.authority ?? 'EVIDENCE_ONLY'}</div></div>
      </div>

      {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(Object.keys(FAMILY_META) as EvidenceFamily[]).map(family => <EvidenceFamilyCard key={family} family={family} observations={grouped[family]} />)}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(payload?.providers ?? []).map((provider, index) => (
          <span key={`${provider.provider}-${index}`} title={provider.reason} className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[9px] font-mono text-white/45">{provider.provider}: {provider.status}</span>
        ))}
      </div>
    </section>
  );
}
