import { describe, expect, it } from 'vitest';
import {
  buildProcessGraphViewModel,
  parseDevelopmentLifecycle,
  parseProjectFolders,
  parsePvcRows,
} from './processGraphModel';

const pvc = `
| PVC | Stage | Primary Project Owner |
|---|---|---|
| \`PVC-01\` | Agent Client | \`CAPITAL-AI-CLIENT\` |
| \`PVC-18\` | EventMesh / Traceability | \`CAPITAL-AI-OPS\` |
`;

const projects = `
| Project | PVC relationship | Canonical project folder | Branch project-folder slug |
|---|---|---|---|
| \`CAPITAL-AI-CLIENT\` | \`PVC-01\` Primary Owner | \`docs/projects/agent-client/\` | \`agent-client\` |
| \`CAPITAL-AI-OPS\` | \`PVC-18\` Primary Owner | \`docs/projects/operations/\` | \`operations\` |
`;

const trustRoot = `
## 5. Mandatory Development Lifecycle

\`\`\`text
CURRENT MAIN + OPEN-PR BASELINE
→ RESOLVE PVC / PRIMARY OWNER
→ READ PROJECT ROADMAP
→ PULL REQUEST
\`\`\`
`;

describe('process graph canonical projection', () => {
  it('parses PVC ownership without inventing stages', () => {
    expect(parsePvcRows(pvc)).toEqual([
      { pvc: 'PVC-01', stage: 'Agent Client', owner: 'CAPITAL-AI-CLIENT' },
      { pvc: 'PVC-18', stage: 'EventMesh / Traceability', owner: 'CAPITAL-AI-OPS' },
    ]);
  });

  it('resolves project folders from the canonical mapping', () => {
    const folders = parseProjectFolders(projects);
    expect(folders.get('CAPITAL-AI-CLIENT')).toBe('docs/projects/agent-client/');
    expect(folders.get('CAPITAL-AI-OPS')).toBe('docs/projects/operations/');
  });

  it('projects the DevelopmentChain lifecycle from the trust root', () => {
    expect(parseDevelopmentLifecycle(trustRoot)).toEqual([
      'CURRENT MAIN + OPEN-PR BASELINE',
      'RESOLVE PVC / PRIMARY OWNER',
      'READ PROJECT ROADMAP',
      'PULL REQUEST',
    ]);
  });

  it('fails closed when no operational state contract is connected', () => {
    const graph = buildProcessGraphViewModel(pvc, projects, trustRoot);
    const pvcNodes = graph.nodes.filter((node) => node.kind === 'pvc');

    expect(graph.operationalStateAvailable).toBe(false);
    expect(pvcNodes).toHaveLength(2);
    expect(pvcNodes.every((node) => node.state === 'unknown')).toBe(true);
    expect(pvcNodes.every((node) => node.authority === 'non-authorizing')).toBe(true);
  });

  it('keeps evidence and Human authority as distinct gates', () => {
    const graph = buildProcessGraphViewModel(pvc, projects, trustRoot);
    const evidence = graph.nodes.find((node) => node.id === 'evidence-gate');
    const owner = graph.nodes.find((node) => node.id === 'owner-gate');

    expect(evidence?.authority).toBe('evidence-only');
    expect(evidence?.state).toBe('waiting-for-evidence');
    expect(owner?.authority).toBe('authorizing');
    expect(owner?.state).toBe('unknown');
  });
});
