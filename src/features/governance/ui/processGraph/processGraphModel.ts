export type ProcessGraphState = 'CURRENT' | 'BLOCKED' | 'WAITING' | 'UNKNOWN';

export interface ProcessGraphNode {
  id: string;
  label: string;
  pvc: string;
  primaryOwner: string;
  state: ProcessGraphState;
  evidenceRefs: readonly string[];
  authority: 'NON_AUTHORIZING_PROJECTION';
}

export interface ProcessGraphEdge {
  from: string;
  to: string;
  kind: 'SEQUENCE' | 'DEPENDENCY';
}

export interface ProcessGraphModel {
  sourceRefs: readonly string[];
  nodes: readonly ProcessGraphNode[];
  edges: readonly ProcessGraphEdge[];
  decisionAuthority: false;
}

export const GOV08_CANONICAL_SOURCE_REFS = [
  'docs/projects/PROJECT_VALUE_CHAIN.md',
  'docs/projects/README.md',
  'docs/projects/governance/ADMIN_PANEL_PROCESS_GRAPH_HANDOFF.md',
] as const;

export function buildProcessGraphModel(
  nodes: readonly Omit<ProcessGraphNode, 'authority'>[],
  edges: readonly ProcessGraphEdge[],
): ProcessGraphModel {
  return {
    sourceRefs: GOV08_CANONICAL_SOURCE_REFS,
    nodes: nodes.map((node) => ({ ...node, authority: 'NON_AUTHORIZING_PROJECTION' as const })),
    edges,
    decisionAuthority: false,
  };
}
