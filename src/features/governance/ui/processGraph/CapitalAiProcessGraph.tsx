import React from 'react';
import { ArrowRight, Network, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../../../../shared/ui';
import { capitalAiProcessGraphProjection } from './capitalAiProcessGraphProjection';

const stateToBadge = {
  CURRENT: 'READY',
  BLOCKED: 'REJECT',
  WAITING: 'PARTIAL',
  UNKNOWN: 'UNKNOWN',
} as const;

export function CapitalAiProcessGraph() {
  const model = capitalAiProcessGraphProjection;

  return (
    <section aria-labelledby="capital-ai-process-graph-title" className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">
              <Network size={14} /> GOV-08 Read-only Process Graph
            </p>
            <h3 id="capital-ai-process-graph-title" className="mt-2 text-xl font-black uppercase tracking-tight text-white">
              CAPITAL-AI Project Value Chain
            </h3>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-white/60">
              Organizational PVC projection only. Operational states remain UNKNOWN until supplied by the canonical OPS/PVC-18 trace-state contract.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono uppercase text-white/60">
            <ShieldCheck size={14} className="text-aif-gold-DEFAULT" />
            Non-authorizing
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2" role="region" aria-label="CAPITAL-AI PVC dependency graph" tabIndex={0}>
        <ol className="flex min-w-max items-stretch gap-3">
          {model.nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              <li className="w-52 shrink-0 rounded-xl border border-white/10 bg-[#121215] p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-aif-gold-DEFAULT">{node.pvc}</span>
                  <StatusBadge status={stateToBadge[node.state]} label={node.state} />
                </div>
                <h4 className="mt-3 text-sm font-bold text-white">{node.label}</h4>
                <p className="mt-2 text-[11px] font-mono text-white/50">{node.primaryOwner}</p>
                <p className="mt-3 text-[10px] leading-relaxed text-white/40">Evidence: {node.evidenceRefs.length ? node.evidenceRefs.join(', ') : 'none supplied'}</p>
              </li>
              {index < model.nodes.length - 1 && (
                <li aria-hidden="true" className="flex items-center text-white/30">
                  <ArrowRight size={18} />
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
      </div>
    </section>
  );
}
