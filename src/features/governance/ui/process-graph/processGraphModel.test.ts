import { describe, expect, it } from 'vitest';
import { buildProcessGraphViewModel, parseDevelopmentLifecycle, parseProjectFolders, parsePvcRows } from './processGraphModel';

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

const developmentChain = `
## Durable lifecycle

\`\`\`text
DC-00 PRECHECK
→ DC-01 PLAN / SCOPE
→ DC-02 CLAIM / BRANCH
→ DC-03 CONTROLLED IMPLEMENTATION
→ DC-04 DOCUMENTARY / EVIDENCE
→ DC-05 SUPERVISOR VALIDATION
→ DC-06 PLATFORM / GOVERNANCE DECISION
→ DC-07 VERSION
→ DC-08 RELEASE
→ DC-09 PRODUCTION
→ DC-10 EVENTMESH / TRACEABILITY
→ DC-11 CLOSE / POST-CHANGE EVIDENCE
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

  it('projects exactly DC-00 through DC-11 from the DevelopmentChain contract', () => {
    const lifecycle = parseDevelopmentLifecycle(developmentChain);
    expect(lifecycle).toHaveLength(12);
    expect(lifecycle[0]).toBe('DC-00 PRECHECK');
    expect(lifecycle[11]).toBe('DC-11 CLOSE / POST-CHANGE EVIDENCE');
  });

  it('fails closed when no operational state contract is connected', () => {
    const graph = buildProcessGraphViewModel(pvc, projects, developmentChain);
    const pvcNodes = graph.nodes.filter((node) => node.kind === 'pvc');
    const developmentNodes = graph.nodes.filter((node) => node.kind === 'development');
    expect(graph.operationalStateAvailable).toBe(false);
    expect(graph.decisionAuthority).toBe(false);
    expect(pvcNodes).toHaveLength(2);
    expect(developmentNodes).toHaveLength(12);
    expect(developmentNodes.map((node) => node.id)).toEqual(['DC-00','DC-01','DC-02','DC-03','DC-04','DC-05','DC-06','DC-07','DC-08','DC-09','DC-10','DC-11']);
    expect(pvcNodes.every((node) => node.state === 'unknown')).toBe(true);
  });

  it('keeps evidence and Human authority as distinct gates', () => {
    const graph = buildProcessGraphViewModel(pvc, projects, developmentChain);
    expect(graph.nodes.find((node) => node.id === 'evidence-gate')).toMatchObject({ authority: 'evidence-only', state: 'waiting-for-evidence' });
    expect(graph.nodes.find((node) => node.id === 'owner-gate')).toMatchObject({ authority: 'authorizing', state: 'unknown' });
  });
});
