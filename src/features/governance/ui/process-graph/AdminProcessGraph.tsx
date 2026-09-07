import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, History, ShieldCheck } from 'lucide-react';
import pvcMarkdown from '../../../../../docs/projects/PROJECT_VALUE_CHAIN.md?raw';
import projectMappingMarkdown from '../../../../../docs/projects/README.md?raw';
import trustRootMarkdown from '../../../../../AGENTS.md?raw';
import { buildProcessGraphViewModel, type ProcessGraphNode, type ProcessGraphState } from './processGraphModel';

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

function GraphNodeCard({ node }: { node: ProcessGraphNode }) {
  const Icon = stateIcon[node.state];
  return (
    <article
      className="min-w-[250px] rounded-xl border border-white/10 bg-black/30 p-4"
      aria-label={`${node.label}. ${stateLabel[node.state]}. ${node.authority}.`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">{node.kind}</p>
          <h4 className="mt-1 text-sm font-bold text-white">{node.label}</h4>
        </div>
        <Icon size={16} className="shrink-0 text-aif-gold-DEFAULT" aria-hidden="true" />
      </div>
      {node.owner && <p className="mt-3 text-xs text-white/65"><span className="font-semibold text-white/80">Primary Owner:</span> {node.owner}</p>}
      {node.projectFolder && <p className="mt-1 break-all font-mono text-[10px] text-white/45">{node.projectFolder}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wide">
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{stateLabel[node.state]}</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-white/60">{node.authority}</span>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-white/35">Source: {node.source}</p>
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
              {index < nodes.length - 1 && (
                <div className="flex items-center px-1 text-white/30" aria-hidden="true">
                  <ArrowRight size={18} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminProcessGraph() {
  const graph = React.useMemo(
    () => buildProcessGraphViewModel(pvcMarkdown, projectMappingMarkdown, trustRootMarkdown),
    [],
  );

  const pvcNodes = graph.nodes.filter((node) => node.kind === 'pvc');
  const developmentNodes = graph.nodes.filter((node) => node.kind === 'development');
  const gateNodes = graph.nodes.filter((node) => node.kind === 'evidence-gate' || node.kind === 'owner-gate');

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-[#121215] p-5">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">Read-only governance projection</p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-white">Process & Dependency Graph</h2>
        <p className="mt-2 max-w-4xl text-xs leading-relaxed text-white/55">
          Canonical PVC/project ownership and DevelopmentChain lifecycle are projected from repository authorities. The browser does not approve, merge, deploy, infer completion, or convert trace/evidence into authorization.
        </p>
        {!graph.operationalStateAvailable && (
          <div role="status" className="mt-4 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/80">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              Live operational / PVC-18 trace state is not yet connected. Protected current-state fields therefore remain <strong>Unknown — fail closed</strong>; no completion or approval is synthesized.
            </p>
          </div>
        )}
      </header>

      <HorizontalChain nodes={pvcNodes} label="Project Value Chain" />
      <HorizontalChain nodes={developmentNodes} label="DevelopmentChain lifecycle" />

      <section aria-label="Authority and evidence gates" className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60">Authority / evidence distinction</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {gateNodes.map((node) => <GraphNodeCard key={node.id} node={node} />)}
        </div>
      </section>

      <details className="rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
        <summary className="cursor-pointer font-mono font-bold uppercase tracking-wider text-white/75">Accessible relationship list</summary>
        <ul className="mt-3 space-y-2">
          {graph.edges.map((edge) => (
            <li key={edge.id}>
              <span className="font-mono text-white/80">{edge.source}</span> → <span className="font-mono text-white/80">{edge.target}</span> ({edge.relation})
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
