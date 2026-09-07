export type ProcessGraphState = 'current' | 'blocked' | 'waiting-for-evidence' | 'historical' | 'unknown';
export type ProcessGraphNodeKind = 'pvc' | 'development' | 'evidence-gate' | 'owner-gate';

export interface ProcessGraphNode {
  id: string;
  kind: ProcessGraphNodeKind;
  label: string;
  owner?: string;
  projectFolder?: string;
  state: ProcessGraphState;
  authority: 'authorizing' | 'evidence-only' | 'non-authorizing';
  source: string;
}

export interface ProcessGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: 'handoff' | 'dependency' | 'validation/evidence';
}

export interface ProcessGraphViewModel {
  nodes: ProcessGraphNode[];
  edges: ProcessGraphEdge[];
  operationalStateAvailable: boolean;
  decisionAuthority: false;
}

interface PvcRow { pvc: string; stage: string; owner: string; }
const stripTicks = (value: string) => value.replace(/`/g, '').trim();

export function parsePvcRows(markdown: string): PvcRow[] {
  return markdown.split('\n').map((line) => line.trim()).filter((line) => /^\|\s*`PVC-\d{2}`\s*\|/.test(line)).map((line) => {
    const cells = line.split('|').slice(1, -1).map(stripTicks);
    return { pvc: cells[0], stage: cells[1], owner: cells[2] };
  }).filter((row) => Boolean(row.pvc && row.stage && row.owner));
}

export function parseProjectFolders(markdown: string): Map<string, string> {
  const folders = new Map<string, string>();
  markdown.split('\n').forEach((line) => {
    if (!/^\|\s*`CAPITAL-AI-/.test(line.trim())) return;
    const cells = line.split('|').slice(1, -1).map(stripTicks);
    const project = cells[0];
    const folder = cells.find((cell) => cell.startsWith('docs/projects/'));
    if (project && folder) folders.set(project, folder);
  });
  return folders;
}

export function parseDevelopmentLifecycle(markdown: string): string[] {
  const section = markdown.match(/## Durable lifecycle[\s\S]*?```text\n([\s\S]*?)```/);
  if (!section) return [];
  return section[1].split(/\n|→/).map((step) => step.trim()).filter((step) => /^DC-\d{2}\b/.test(step));
}

export function buildProcessGraphViewModel(pvcMarkdown: string, projectMappingMarkdown: string, developmentChainMarkdown: string): ProcessGraphViewModel {
  const rows = parsePvcRows(pvcMarkdown);
  const folders = parseProjectFolders(projectMappingMarkdown);
  const lifecycle = parseDevelopmentLifecycle(developmentChainMarkdown);

  const pvcNodes: ProcessGraphNode[] = rows.map((row) => ({
    id: row.pvc,
    kind: 'pvc',
    label: `${row.pvc} — ${row.stage}`,
    owner: row.owner,
    projectFolder: folders.get(row.owner),
    state: 'unknown',
    authority: 'non-authorizing',
    source: 'docs/projects/PROJECT_VALUE_CHAIN.md + docs/projects/README.md',
  }));

  const developmentNodes: ProcessGraphNode[] = lifecycle.map((label) => ({
    id: label.match(/^DC-\d{2}/)?.[0] ?? label,
    kind: 'development',
    label,
    state: 'unknown',
    authority: 'non-authorizing',
    source: 'docs/projects/operations/DEVELOPMENT_CHAIN.md — Durable lifecycle',
  }));

  const gateNodes: ProcessGraphNode[] = [
    { id: 'evidence-gate', kind: 'evidence-gate', label: 'Evidence / validation gate', state: 'waiting-for-evidence', authority: 'evidence-only', source: 'GOV-08 Admin Panel graph handoff' },
    { id: 'owner-gate', kind: 'owner-gate', label: 'Human / Owner decision gate', state: 'unknown', authority: 'authorizing', source: 'AGENTS.md — Human Authority' },
  ];

  const chainEdges: ProcessGraphEdge[] = pvcNodes.slice(1).map((node, index) => ({ id: `handoff-${pvcNodes[index].id}-${node.id}`, source: pvcNodes[index].id, target: node.id, relation: 'handoff' }));
  const developmentEdges: ProcessGraphEdge[] = developmentNodes.slice(1).map((node, index) => ({ id: `dependency-${developmentNodes[index].id}-${node.id}`, source: developmentNodes[index].id, target: node.id, relation: 'dependency' }));
  const gateEdges: ProcessGraphEdge[] = [{ id: 'evidence-owner', source: 'evidence-gate', target: 'owner-gate', relation: 'validation/evidence' }];

  return { nodes: [...pvcNodes, ...developmentNodes, ...gateNodes], edges: [...chainEdges, ...developmentEdges, ...gateEdges], operationalStateAvailable: false, decisionAuthority: false };
}
