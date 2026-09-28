export type PlanningVisualToolAvailability =
  | 'available-in-repository'
  | 'evaluated-candidate';

export interface PlanningVisualToolDescriptor {
  id: 'd3' | 'mermaid' | 'react-flow' | 'frappe-gantt' | 'vis-timeline';
  packageName: string;
  availability: PlanningVisualToolAvailability;
  license: string;
  upstream: string;
  bestFor: string;
  repositoryBinding: string;
  dependencyMutationRequired: boolean;
}

export const PLANNING_VISUAL_TOOL_CATALOG: readonly PlanningVisualToolDescriptor[] = [
  {
    id: 'd3',
    packageName: 'd3',
    availability: 'available-in-repository',
    license: 'ISC',
    upstream: 'https://github.com/d3/d3',
    bestFor: 'Deterministische Layout-Geometrie, Dependency-Maps und eigene SVG-/MediaProject-Renderer.',
    repositoryBinding: 'package.json direct dependency; PlanningVisual uses it offline through D3PlanningVisualAdapter.',
    dependencyMutationRequired: false,
  },
  {
    id: 'mermaid',
    packageName: 'mermaid',
    availability: 'evaluated-candidate',
    license: 'MIT',
    upstream: 'https://github.com/mermaid-js/mermaid',
    bestFor: 'Diagramme-as-Code, Flowcharts, Gantt, Git Graph, Mindmap, Timeline und Sankey; geeignet für versionierbare Social-Renderaufträge.',
    repositoryBinding: 'Not installed in this slice; requires package-lock and supply-chain evidence before activation.',
    dependencyMutationRequired: true,
  },
  {
    id: 'react-flow',
    packageName: '@xyflow/react',
    availability: 'evaluated-candidate',
    license: 'MIT',
    upstream: 'https://github.com/xyflow/xyflow',
    bestFor: 'Interaktive Node-/Edge-Maps mit Pan, Zoom, Dragging und eigener React-Node-Darstellung.',
    repositoryBinding: 'Not installed in this slice; intended for an interactive web projection, not Social render authority.',
    dependencyMutationRequired: true,
  },
  {
    id: 'frappe-gantt',
    packageName: 'frappe-gantt',
    availability: 'evaluated-candidate',
    license: 'MIT',
    upstream: 'https://github.com/frappe/gantt',
    bestFor: 'Klassische Gantt-Roadmaps mit echten Start-/Enddaten und Zeitachsen.',
    repositoryBinding: 'Not installed; unsuitable for current CAPITAL-AI work-state when dates are not authoritative.',
    dependencyMutationRequired: true,
  },
  {
    id: 'vis-timeline',
    packageName: 'vis-timeline',
    availability: 'evaluated-candidate',
    license: 'MIT OR Apache-2.0',
    upstream: 'https://github.com/visjs/vis-timeline',
    bestFor: 'Interaktive Timeline-/Range-Darstellung bei vorhandenen echten Zeitdaten.',
    repositoryBinding: 'Not installed; remains a future option only for evidence-backed time ranges.',
    dependencyMutationRequired: true,
  },
] as const;

export function getAvailablePlanningVisualTool(
  id: PlanningVisualToolDescriptor['id'],
): PlanningVisualToolDescriptor {
  const tool = PLANNING_VISUAL_TOOL_CATALOG.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`PLANNING_VISUAL_TOOL_UNKNOWN:${id}`);
  if (tool.availability !== 'available-in-repository') {
    throw new Error(`PLANNING_VISUAL_TOOL_NOT_INSTALLED:${id}`);
  }
  return tool;
}
