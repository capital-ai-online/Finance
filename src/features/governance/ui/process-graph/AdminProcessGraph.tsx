import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, History, ShieldCheck, Wrench } from 'lucide-react';
import agentTrustRootMarkdown from '../../../../../AGENTS.md?raw';
import pvcMarkdown from '../../../../../docs/projects/PROJECT_VALUE_CHAIN.md?raw';
import projectMappingMarkdown from '../../../../../docs/projects/README.md?raw';
import selfHealingWorkPackageMarkdown from '../../../../../docs/projects/operations/work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md?raw';
import selfHealingEvidenceWorkPackageMarkdown from '../../../../../docs/projects/operations/work-packages/OPS_08_B_SH_02_3E_EVIDENCE_INTEGRITY_2026-09-20.md?raw';
import {
  getRemediationActions,
  getRemediationPolicies,
} from '../../../../platform/Supervisor/selfHealingContract';
import type { OperationalTraceStateEnvelope } from '../../../../platform/Traceability/Contracts/OperationalTraceStateContract';
import {
  buildFixAlgorithmProjection,
  buildProcessGraphViewModel,
  type ProcessGraphFixActionProjection,
  type ProcessGraphNode,
  type ProcessGraphState,
} from './processGraphModel';

const stateLabel: Record<ProcessGraphState, string> = {
  current: 'Current',
  blocked: 'Blocked',
  'waiting-for-evidence': 'Waiting for evidence',
  historical: 'Historical / non-authorizing',
  unknown: 'Unknown — fail closed',
};

const stateIcon: Record<ProcessGraphState, React.ComponentType<{ size?: number; className?: string }>> = {
  current: CheckCircle2,
  blocked: AlertTriangle,
  'waiting-for-evidence': AlertTriangle,
  historical: History,
  unknown: ShieldCheck,
};

export interface AdminProcessGraphProps {
  /**
   * Effective, evidence-only state envelope produced by the canonical PVC-18 Traceability contract.
   * The component never accepts source records or reportedState directly so normalization and
   * fail-closed semantics stay owned by OPS/Traceability rather than the browser.
   */
  operationalState?: OperationalTraceStateEnvelope | null;
}

function GraphNodeCard({ node }: { node: ProcessGraphNode }) {
  const Icon = stateIcon[node.state];
  return (
    <article className="min-w-[250px] rounded-xl border border-white/10 bg-black/30 p-4" aria-label={`${node.label}. ${stateLabel[node.state]}. ${node.authority}.`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">{node.kind}</p>
          <h4 className="mt-1 text-sm font-bold text-white">{node.label}</h4>
        </div>
        <Icon size={16} className="shrink-0 text-aif-gold-DEFAULT" aria-hidden="true" />
      </div>
      {node.owner && <p className="mt-3 text-xs text-white/65"><span className="font-semibold text-white/80">Primary Owner:</span> {node.owner}</p>}
      {node.projectFolder && <p className="mt-1 break-all font-mono text-[10px] text-white/45">{node.projectFolder}</p>}
      {node.declaredState && (
        <p className="mt-2 text-[10px] text-white/45">
          <span className="font-semibold text-white/65">Declared work-package state:</span> {node.declaredState}
          {' '}<span className="text-white/30">(projection only)</span>
        </p>
      )}
      {node.dependencies && node.dependencies.length > 0 && (
        <p className="mt-1 text-[10px] text-white/45">
          <span className="font-semibold text-white/65">Dependencies:</span> {node.dependencies.join(', ')}
        </p>
      )}
      {node.exitGate && (
        <p className="mt-1 text-[10px] leading-relaxed text-white/45">
          <span className="font-semibold text-white/65">Exit gate:</span> {node.exitGate}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wide">
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{stateLabel[node.state]}</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{node.authority}</span>
      </div>
      {node.stateEvidence && (
        <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-2 text-[10px] text-white/55">
          <summary className="cursor-pointer font-mono font-bold uppercase tracking-wider text-white/70">
            Trace / Evidence · {node.stateEvidence.statusIds.length} record(s)
          </summary>
          <div className="mt-2 space-y-1.5 break-all">
            <p><span className="font-semibold text-white/70">Projection:</span> {node.stateEvidence.generatedAt}</p>
            <p><span className="font-semibold text-white/70">Validation:</span> {node.stateEvidence.validations.join(', ') || 'UNKNOWN'}</p>
            <p><span className="font-semibold text-white/70">Source:</span> {node.stateEvidence.provenanceSources.join(', ')}</p>
            <p><span className="font-semibold text-white/70">Status IDs:</span> {node.stateEvidence.statusIds.join(', ')}</p>
            <p><span className="font-semibold text-white/70">Evidence:</span> {node.stateEvidence.evidenceRefs.join(', ') || 'none'}</p>
            {node.stateEvidence.ambiguous && (
              <p className="font-semibold text-amber-200">Conflicting effective records — status remains Unknown / fail closed.</p>
            )}
          </div>
        </details>
      )}
      <p className="mt-3 text-[10px] leading-relaxed text-white/35">Source: {node.source}</p>
    </article>
  );
}

function FixAlgorithmCard({ fix }: { fix: ProcessGraphFixActionProjection }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/30 p-4" aria-label={`${fix.actionId}. ${fix.activation}. ${fix.tier}.`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">bounded remediation action</p>
          <h4 className="mt-1 break-all text-sm font-bold text-white">{fix.actionId}</h4>
        </div>
        <Wrench size={16} className="shrink-0 text-aif-gold-DEFAULT" aria-hidden="true" />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/55">{fix.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wide">
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{fix.tier}</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{fix.activation}</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{fix.idempotencyClass}</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">max {fix.maxAttempts} attempt(s)</span>
      </div>
      <div className="mt-3 space-y-1 text-[10px] leading-relaxed text-white/45">
        <p><span className="font-semibold text-white/65">Preferred for:</span> {fix.preferredForFindingClasses.join(', ') || 'fallback only'}</p>
        <p><span className="font-semibold text-white/65">Capability:</span> {fix.requiredCapability || 'none'}</p>
        <p><span className="font-semibold text-white/65">Verification:</span> {fix.verificationProbe}</p>
        <p><span className="font-semibold text-white/65">Kill switch:</span> {fix.killSwitch}</p>
      </div>
    </article>
  );
}

function HorizontalChain({ nodes, label }: { nodes: ProcessGraphNode[]; label: string }) {
  return (
    <section aria-label={label} className="space-y-3">
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60">{label}</h3>
      <div className="overflow-x-auto pb-2" tabIndex={0} aria-label={`${label}, horizontally scrollable`}>
        <div className="flex min-w-max items-stretch gap-3">
          {nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <GraphNodeCard node={node} />
              {index < nodes.length - 1 && <div className="flex items-center px-1 text-white/30" aria-hidden="true"><ArrowRight size={18} /></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminProcessGraph({ operationalState = null }: AdminProcessGraphProps) {
  const fixAlgorithm = React.useMemo(
    () => buildFixAlgorithmProjection(getRemediationActions(), getRemediationPolicies()),
    [],
  );
  const graph = React.useMemo(
    () => buildProcessGraphViewModel(
      pvcMarkdown,
      projectMappingMarkdown,
      agentTrustRootMarkdown,
      operationalState,
      [selfHealingWorkPackageMarkdown, selfHealingEvidenceWorkPackageMarkdown],
    ),
    [operationalState],
  );
  const pvcNodes = graph.nodes.filter((node) => node.kind === 'pvc');
  const workStageNodes = graph.nodes.filter((node) => node.kind === 'work-stage');
  const selfHealingWorkPackageNodes = graph.nodes.filter((node) => node.kind === 'self-healing-work-package');
  const gateNodes = graph.nodes.filter((node) => node.kind === 'evidence-gate' || node.kind === 'owner-gate');

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-[#121215] p-5">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">Read-only governance projection</p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">Process & Dependency Graph</h2>
        <p className="mt-2 max-w-4xl text-xs leading-relaxed text-white/55">Canonical PVC/project ownership and the autonomous work graph are projected from current repository sources, with <code>/AGENTS.md</code> as the single AI/development instruction surface. Visible operational status is accepted only from the effective PVC-18 OperationalTraceStateEnvelope. The browser does not approve, merge, deploy, infer completion, aggregate conflicting evidence, or convert trace/evidence into authorization.</p>
        {graph.operationalStateAvailable ? (
          <div role="status" className="mt-4 flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-100/80">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>PVC-18 operational / trace evidence is connected{graph.operationalStateGeneratedAt ? ` · projection ${graph.operationalStateGeneratedAt}` : ''}. Missing nodes and conflicting effective records remain <strong>Unknown — fail closed</strong>.</p>
          </div>
        ) : (
          <div role="status" className="mt-4 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/80">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>No PVC-18 OperationalTraceStateEnvelope has been supplied to this presentation consumer. All protected status fields therefore remain <strong>Unknown — fail closed</strong>; no completion, waiting, blocked or historical state is synthesized.</p>
          </div>
        )}
      </header>
      <HorizontalChain nodes={pvcNodes} label="Project Value Chain" />
      <HorizontalChain nodes={workStageNodes} label="Autonomous work graph" />
      <HorizontalChain nodes={selfHealingWorkPackageNodes} label="Self-Healing Work Packages · read-only orchestration projection" />
      <section aria-label="Bounded fix algorithm" className="space-y-3">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60">Bounded Fix Algorithm · read-only contract projection</h3>
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-white/45">
            Finding-to-action mappings come directly from the canonical Self-Healing contract. This surface can explain eligibility, capability, budget, kill switch and verification requirements; it cannot execute a repair, grant a capability, merge a Pull Request or turn missing evidence into PASS.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {fixAlgorithm.map((fix) => <FixAlgorithmCard key={fix.actionId} fix={fix} />)}
        </div>
      </section>
      <section aria-label="Authority and evidence gates" className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60">Authority / evidence distinction</h3>
        <div className="grid gap-3 md:grid-cols-2">{gateNodes.map((node) => <GraphNodeCard key={node.id} node={node} />)}</div>
      </section>
      <details className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
        <summary className="cursor-pointer font-mono font-bold uppercase tracking-wider text-white/75">Accessible relationship list</summary>
        <ul className="mt-3 space-y-2">{graph.edges.map((edge) => <li key={edge.id}><span className="font-mono text-white/80">{edge.source}</span> → <span className="font-mono text-white/80">{edge.target}</span> ({edge.relation})</li>)}</ul>
      </details>
    </div>
  );
}
