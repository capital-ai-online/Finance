import React from 'react';
import { AlertTriangle, CheckCircle2, GitCommitHorizontal, RefreshCw, ShieldCheck } from 'lucide-react';
import type { QualityCenterReport, QualityGateStatus } from '../platform/Quality/Contracts/QualityCenterContract';
import { authFetch } from '../lib/authFetch';

function statusClass(status: QualityGateStatus | 'COMPLETE' | 'PARTIAL' | 'NOT_AVAILABLE') {
  if (status === 'PASS' || status === 'COMPLETE') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  if (status === 'FAIL') return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
  return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
}

function formatScore(value: number | null): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '—';
}

export function QualityCenterPanel() {
  const [report, setReport] = React.useState<QualityCenterReport | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/admin/quality-center', { cache: 'no-store' });
      if (response.status === 401 || response.status === 403) throw new Error('Keine Berechtigung für Quality-Center-Evidence.');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Quality Snapshot nicht verfügbar (HTTP ${response.status}).`);
      }
      setReport(await response.json() as QualityCenterReport);
    } catch (cause) {
      setReport(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  const passedGates = report?.gateReport.gates.filter((gate) => gate.status === 'PASS').length ?? 0;
  const availableValidators = report?.mandatoryValidators.available ?? 0;
  const totalValidators = report?.mandatoryValidators.total ?? 16;
  const sourceCommit = report?.repositoryObservation.sourceCommit ?? null;

  return (
    <section className="space-y-5 rounded-2xl border border-aif-gold-DEFAULT/15 bg-[#0D0E12]/90 p-5 backdrop-blur-md" aria-label="Quality Center">
      <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT">
            <ShieldCheck className="h-4 w-4" />
            <h2 className="text-xs font-black uppercase tracking-widest">Quality Center · Evidence Panel</h2>
          </div>
          <p className="mt-1 text-[10px] text-white/45">Read-only Projektion des bestehenden QualityCenterReport · keine Merge-, Release- oder Finanz-Authority</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="flex items-center gap-2 text-[10px] font-mono text-white/50 hover:text-white disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Aktualisieren
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error} Es werden keine Ersatzwerte erzeugt.</span>
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-black/40 p-4"><div className="text-[9px] uppercase tracking-wider text-white/35">Quality Gates</div><div className="mt-2 text-xl font-black font-mono text-white">{passedGates}/8</div></div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-4"><div className="text-[9px] uppercase tracking-wider text-white/35">Validatoren</div><div className="mt-2 text-xl font-black font-mono text-white">{availableValidators}/{totalValidators}</div></div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-4"><div className="text-[9px] uppercase tracking-wider text-white/35">FinTech-Kette</div><div className="mt-2 text-xl font-black font-mono text-white">{report.fintechValueChain.connectedStages}/{report.fintechValueChain.totalStages}</div></div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-4"><div className="text-[9px] uppercase tracking-wider text-white/35">Quality Score</div><div className="mt-2 text-xl font-black font-mono text-white">{formatScore(report.qualityScore.overallScore)}</div><div className="mt-1 text-[9px] text-white/35">{report.qualityScore.status}</div></div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-black/40 p-4">
              <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-white/60">8 Quality Gates</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {report.gateReport.gates.map((gate) => (
                  <div key={gate.id} className={`rounded-lg border px-3 py-2 text-[10px] ${statusClass(gate.status)}`}>
                    <div className="font-mono font-bold">{gate.id}</div><div className="mt-1 opacity-80">{gate.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/40 p-4">
              <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-white/60">FinTech Value Chain</h3>
              <div className="space-y-1.5">
                {report.fintechValueChain.stages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="truncate text-white/55">{stage.id} · {stage.name}</span>
                    <span className={stage.status === 'CONNECTED' ? 'text-emerald-300' : 'text-amber-200'}>{stage.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-black/40 p-4">
              <div className="text-[9px] uppercase tracking-wider text-white/35">Testflächen</div>
              <div className="mt-2 text-lg font-black font-mono text-white">{report.coverage.populatedAreas}/{report.coverage.totalAreas}</div>
              <div className="mt-1 text-[10px] text-white/45">{report.coverage.testAreaCoveragePercent}% belegt</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-4">
              <div className="text-[9px] uppercase tracking-wider text-white/35">Code Coverage</div>
              <div className="mt-2 text-sm font-black font-mono text-white">{report.coverage.codeCoverage.status}</div>
              <div className="mt-1 text-[10px] text-white/45">Nur echte Coverage-Artefakte werden angezeigt.</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/40 p-4">
              <div className="text-[9px] uppercase tracking-wider text-white/35">Technical Debt</div>
              <div className="mt-2 text-lg font-black font-mono text-white">{report.technicalDebt.open} offen</div>
              <div className="mt-1 text-[10px] text-white/45">{report.technicalDebt.resolved} aufgelöst</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] text-white/45"><GitCommitHorizontal className="h-3.5 w-3.5" /> Snapshot-Identität</div>
            <div className="break-all font-mono text-[10px] text-white/70">{sourceCommit ?? 'NOT_AVAILABLE'}</div>
            <div className="mt-1 text-[9px] text-white/35">{new Date(report.checkedAt).toLocaleString('de-DE')}</div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-aif-gold-DEFAULT/15 bg-aif-gold-DEFAULT/5 p-3 text-[10px] text-white/55">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aif-gold-DEFAULT" />
            <span>{report.nonAuthorizingStatement}</span>
          </div>
        </>
      )}
    </section>
  );
}
