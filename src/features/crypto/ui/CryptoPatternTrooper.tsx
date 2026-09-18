import React, { useMemo } from 'react';
import {
  Activity,
  Crosshair,
  Database,
  Orbit,
  Radar,
  ScanSearch,
  ShieldCheck,
  Waves,
} from 'lucide-react';
import {
  AuthorityBadge,
  ResearchOnlyBanner,
  StatusBadge,
} from '../../../shared/ui';
import {
  buildCryptoPatternTrooperViewModel,
  type CryptoPatternResearchProjectionInput,
} from './cryptoPatternTrooperViewModel';

export interface CryptoPatternTrooperProps {
  readonly assessment?: CryptoPatternResearchProjectionInput | null;
  readonly className?: string;
}

const REFERENCE_PATTERNS = [
  { id: 'inverse-head-and-shoulders', label: 'Inverse H&S', type: 'Reversal' },
  { id: 'head-and-shoulders', label: 'Head & Shoulders', type: 'Reversal' },
  { id: 'double-bottom', label: 'Double Bottom', type: 'Reversal' },
] as const;

const REFERENCE_CONFIRMATION_AXES = [
  { id: 'volume', label: 'Volume', Icon: Waves },
  { id: 'rsi', label: 'RSI', Icon: Activity },
  { id: 'support', label: 'Support / Resistance', Icon: Crosshair },
  { id: 'macd', label: 'MACD', Icon: Radar },
] as const;

function formatObservedValue(value: number | boolean | null): string {
  if (value === null) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function PatternGeometry() {
  return (
    <svg
      viewBox="0 0 280 150"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 35 L45 78 L78 42 L118 126 L158 46 L198 80 L230 42 L270 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-asset-crypto"
      />
      <path
        d="M35 47 L232 47"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="7 7"
        className="text-text-secondary"
      />
      <circle cx="45" cy="78" r="5" fill="currentColor" className="text-asset-crypto" />
      <circle cx="118" cy="126" r="6" fill="currentColor" className="text-asset-crypto" />
      <circle cx="198" cy="80" r="5" fill="currentColor" className="text-asset-crypto" />
      <circle cx="270" cy="24" r="5" fill="currentColor" className="text-status-ready" />
    </svg>
  );
}

function ResearchScoreRing({
  score,
  threshold,
}: {
  score: number | null;
  threshold: number | null;
}) {
  const progress = score ?? 0;

  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-border"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          pathLength="100"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} 100`}
          className="text-asset-crypto transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <div className="relative text-center" aria-live="polite">
        <div className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-text-secondary">
          Pattern Research
        </div>
        <div className="mt-1 text-4xl font-black text-text-primary">
          {score === null ? '—' : Math.round(score)}
        </div>
        <div className="mt-1 font-mono text-[9px] text-text-secondary">
          {threshold === null ? 'FINTECH evidence pending' : `ref. gate ≥ ${threshold}`}
        </div>
      </div>
    </div>
  );
}

export function CryptoPatternTrooper({
  assessment = null,
  className = '',
}: CryptoPatternTrooperProps) {
  const model = useMemo(
    () => buildCryptoPatternTrooperViewModel(assessment),
    [assessment],
  );

  return (
    <section
      id="crypto-pattern-trooper"
      className={`relative overflow-hidden rounded-3xl border border-asset-crypto/25 bg-surface/55 p-5 shadow-[0_0_50px_rgba(141,38,255,0.08)] sm:p-6 ${className}`}
      aria-labelledby="crypto-pattern-trooper-title"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-asset-crypto/10" />
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-asset-crypto/15" />
        <div className="absolute bottom-[-7rem] left-[18%] h-56 w-56 rounded-full bg-asset-crypto/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10 space-y-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-asset-crypto/30 bg-asset-crypto/[0.08] px-3 py-1 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-asset-crypto">
                <Orbit size={12} aria-hidden="true" />
                Crypto Universe · Pattern Trooper
              </span>
              <AuthorityBadge authority="RESEARCH" label="FINTECH Research" />
              <StatusBadge
                status={model.status === 'READY' ? 'READY' : 'SCORE_NOT_COMPUTABLE'}
                label={model.status}
              />
            </div>

            <h2
              id="crypto-pattern-trooper-title"
              className="mt-3 text-2xl font-black tracking-tight text-text-primary sm:text-3xl"
            >
              Altcoin Pattern Scoring Cockpit
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-text-secondary sm:text-sm">
              Grafische Research-Projektion für 4h/1D-Pattern, Confirmation-Evidence und den
              FINTECH-Referenzscore. Der Browser berechnet keinen Finanzscore und erzeugt keine
              Trade-, Ranking- oder Execution-Freigabe.
            </p>
          </div>

          <ResearchScoreRing
            score={model.referenceScore}
            threshold={model.referenceThreshold}
          />
        </header>

        <ResearchOnlyBanner
          title="Pattern Research Score ≠ Canonical Score"
          description={model.reason}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="rounded-2xl border border-border bg-background/30 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-asset-crypto">
                  <ScanSearch size={13} aria-hidden="true" />
                  Pattern geometry
                </div>
                <h3 className="mt-1 text-lg font-black text-text-primary">{model.patternLabel}</h3>
              </div>

              <div className="flex gap-2">
                {model.timeframeLanes.map((lane) => (
                  <span
                    key={lane.timeframe}
                    className={
                      lane.state === 'ACTIVE'
                        ? 'rounded-lg border border-asset-crypto/35 bg-asset-crypto/[0.10] px-3 py-1.5 font-mono text-[10px] font-black uppercase text-asset-crypto'
                        : 'rounded-lg border border-border bg-surface/60 px-3 py-1.5 font-mono text-[10px] font-black uppercase text-text-secondary'
                    }
                  >
                    {lane.timeframe}
                    <span className="ml-1.5 text-[8px]">{lane.state}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative min-h-52 overflow-hidden rounded-2xl border border-asset-crypto/15 bg-surface/45 p-4">
                <div className="absolute inset-4 rounded-full border border-asset-crypto/10" aria-hidden="true" />
                <div className="absolute inset-10 rounded-full border border-asset-crypto/10" aria-hidden="true" />
                <div className="relative flex h-full min-h-44 items-center text-asset-crypto">
                  <PatternGeometry />
                </div>
                <div className="absolute bottom-3 left-3 rounded border border-border bg-background/70 px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-text-secondary">
                  Reference geometry · not live price data
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <div className="text-[9px] font-mono font-black uppercase tracking-wider text-text-secondary">Direction</div>
                  <div className="mt-2 text-sm font-black text-text-primary">{model.direction ?? '—'}</div>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <div className="text-[9px] font-mono font-black uppercase tracking-wider text-text-secondary">Evidence refs</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-black text-text-primary">
                    <Database size={14} className="text-asset-crypto" aria-hidden="true" />
                    {model.evidenceCount}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface/50 p-3">
                  <div className="text-[9px] font-mono font-black uppercase tracking-wider text-text-secondary">Canonical impact</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-black text-text-primary">
                    <ShieldCheck size={14} className="text-status-ready" aria-hidden="true" />
                    NONE
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {REFERENCE_PATTERNS.map((pattern) => {
                const active = model.patternId === pattern.id;
                return (
                  <div
                    key={pattern.id}
                    className={
                      active
                        ? 'rounded-xl border border-asset-crypto/35 bg-asset-crypto/[0.08] p-3'
                        : 'rounded-xl border border-border bg-surface/45 p-3'
                    }
                  >
                    <div className="font-mono text-[8px] font-black uppercase tracking-wider text-text-secondary">
                      {pattern.type}
                    </div>
                    <div className="mt-1 text-xs font-black text-text-primary">{pattern.label}</div>
                    <div className="mt-2 text-[9px] text-text-secondary">
                      {active ? 'Active FINTECH projection' : 'Reference profile'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-background/30 p-4 sm:p-5" aria-label="Pattern confirmation evidence">
            <div className="flex items-center gap-2">
              <Radar size={15} className="text-asset-crypto" aria-hidden="true" />
              <h3 className="text-sm font-black text-text-primary">Confirmation Matrix</h3>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">
              FINTECH liefert beobachtete Faktoren; Frontend zeigt sie nur an.
            </p>

            <div className="mt-4 space-y-2">
              {model.confirmations.length > 0 ? (
                model.confirmations.map((confirmation) => (
                  <div
                    key={confirmation.feature}
                    className="rounded-xl border border-border bg-surface/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-black text-text-primary">{confirmation.label}</div>
                        <div className="mt-1 font-mono text-[8px] text-text-secondary">
                          observed {formatObservedValue(confirmation.observedValue)} · rule {confirmation.condition}
                        </div>
                      </div>
                      <StatusBadge
                        status={confirmation.state === 'CONFIRMED' ? 'READY' : 'DATA_UNAVAILABLE'}
                        label={confirmation.state}
                      />
                    </div>
                    <div className="mt-2 font-mono text-[8px] text-text-secondary">
                      Reference contribution: +{confirmation.contribution}
                    </div>
                  </div>
                ))
              ) : (
                REFERENCE_CONFIRMATION_AXES.map(({ id, label, Icon }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/45 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-asset-crypto" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-text-primary">{label}</span>
                    </div>
                    <StatusBadge status="DATA_UNAVAILABLE" label="AWAITING EVIDENCE" />
                  </div>
                ))
              )}
            </div>

            {model.missingConfirmationFields.length > 0 && (
              <div className="mt-4 rounded-xl border border-status-warning/25 bg-status-warning/[0.06] p-3">
                <div className="font-mono text-[8px] font-black uppercase tracking-wider text-status-warning">
                  Missing confirmation
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">
                  {model.missingConfirmationFields.join(', ')}
                </p>
              </div>
            )}
          </aside>
        </div>

        <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[9px] text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>
            Krypto Purple = Crypto Universe semantics · kein StarTroops/Forex-Farbtransfer
          </span>
          <span className="font-mono uppercase tracking-wider">
            scoreEligible=false · executionEligible=false
          </span>
        </footer>
      </div>
    </section>
  );
}

export default CryptoPatternTrooper;
