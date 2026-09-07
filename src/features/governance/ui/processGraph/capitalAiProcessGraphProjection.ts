import { buildProcessGraphModel, type ProcessGraphEdge, type ProcessGraphNode } from './processGraphModel';

const stages = [
  ['PVC-01', 'Agent Client', 'CAPITAL-AI-CLIENT'],
  ['PVC-02', 'Controlled Implementation', 'CAPITAL-AI-OPS'],
  ['PVC-03', 'Documentary Engine', 'CAPITAL-AI-DOC'],
  ['PVC-04', 'Supervisor', 'CAPITAL-AI-OPS'],
  ['PVC-05', 'Platform Director', 'CAPITAL-AI-GOV'],
  ['PVC-06', 'Version Management', 'CAPITAL-AI-OPS'],
  ['PVC-07', 'Release Management', 'CAPITAL-AI-OPS'],
  ['PVC-08', 'Production Operations', 'CAPITAL-AI-OPS'],
  ['PVC-09', 'UAI / Data Ingestion', 'CAPITAL-AI-DATA'],
  ['PVC-10', 'Evidence Management', 'CAPITAL-AI-DATA'],
  ['PVC-11', 'Data Quality', 'CAPITAL-AI-DATA'],
  ['PVC-12', 'Feature Engineering', 'CAPITAL-AI-FINTECH'],
  ['PVC-13', 'Scoring Models', 'CAPITAL-AI-FINTECH'],
  ['PVC-14', 'Scoring Orchestration', 'CAPITAL-AI-FINTECH'],
  ['PVC-15', 'Domain Analysis / Executor', 'CAPITAL-AI-FINTECH'],
  ['PVC-16', 'Canonical Scoring', 'CAPITAL-AI-FINTECH'],
  ['PVC-17', 'Ranking / Decision Support', 'CAPITAL-AI-FINTECH'],
  ['PVC-18', 'EventMesh / Traceability', 'CAPITAL-AI-OPS'],
] as const;

const nodes: Omit<ProcessGraphNode, 'authority'>[] = stages.map(([pvc, label, primaryOwner]) => ({
  id: pvc,
  label,
  pvc,
  primaryOwner,
  state: 'UNKNOWN',
  evidenceRefs: [],
}));

const edges: ProcessGraphEdge[] = stages.slice(0, -1).map(([pvc], index) => ({
  from: pvc,
  to: stages[index + 1][0],
  kind: 'SEQUENCE',
}));

/**
 * Repository-backed organizational projection only.
 * Live status remains UNKNOWN until supplied by the OPS/PVC-18 read-only state contract.
 */
export const capitalAiProcessGraphProjection = buildProcessGraphModel(nodes, edges);
