import { describe, expect, it } from 'vitest';
import type {
  OperationalTraceStateEnvelope,
  OperationalTraceStateRecord,
} from '../../../../platform/Traceability/Contracts/OperationalTraceStateContract';
import {
  buildProcessGraphViewModel,
  mapOperationalTraceState,
  parseAutonomousWorkStages,
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

const agentTrustRoot = `
## 3. Canonical scope and ownership resolution
## 4. Autonomous work graph
## 5. Branch and Pull Request execution
## 6. Bounded self-healing and convergence
## 7. Validation and cost control
## 8. Evidence, EventMesh and handover
## 9. Capability and tool boundary
`;

function record(overrides: Partial<OperationalTraceStateRecord> = {}): OperationalTraceStateRecord {
  return {
    identity: {
      projectId: 'CAPITAL-AI-OPS',
      pvcId: 'PVC-18',
      statusId: 'trace-1',
    },
    reportedState: 'CURRENT',
    reportedValidation: 'PASS',
    evidence: [{
      ref: 'trace-1',
      kind: 'trace',
      label: 'TraceabilityBuildCompletedEvent',
      identityRef: 'trace-1',
      correlationId: 'corr-1',
    }],
    provenance: {
      source: 'EventMesh/EventContract',
      sourceRef: 'trace-1',
      sourceTimestamp: '2026-09-16T16:00:00.000Z',
      observedAt: '2026-09-16T16:00:10.000Z',
      freshness: 'FRESH',
    },
    trace: { correlationId: 'corr-1' },
    state: 'CURRENT',
    validation: 'PASS',
    missingEvidence: false,
    staleOrUnknownFreshness: false,
    strictEvidenceBindingRequired: false,
    missingCorrelation: false,
    missingEvidenceIdentity: false,
    missingSourceTimestamp: false,
    evidenceBindingMismatch: false,
    failsClosed: false,
    ...overrides,
  };
}

function envelope(records: readonly OperationalTraceStateRecord[]): OperationalTraceStateEnvelope {
  return {
    schemaVersion: '1.1',
    generatedAt: '2026-09-16T16:00:12.000Z',
    authority: {
      semantics: 'EVIDENCE_ONLY',
      decisionAuthority: false,
      mergeAuthority: false,
      releaseAuthority: false,
      deploymentAuthority: false,
    },
    missingStateSemantics: 'UNKNOWN_NON_PASS',
    records,
  };
}

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

  it('projects autonomous work stages from AGENTS.md headings instead of the retired DevelopmentChain', () => {
    const stages = parseAutonomousWorkStages(agentTrustRoot);
    expect(stages.map((stage) => stage.id)).toEqual([
      'GOV-SCOPE',
      'GOV-WORK-GRAPH',
      'GOV-BRANCH-PR',
      'GOV-CONVERGENCE',
      'GOV-VALIDATION',
      'GOV-EVIDENCE',
      'GOV-CAPABILITY',
    ]);
  });

  it('fails closed for every graph node when no operational state envelope is connected', () => {
    const graph = buildProcessGraphViewModel(pvc, projects, agentTrustRoot);
    const pvcNodes = graph.nodes.filter((node) => node.kind === 'pvc');
    const workStageNodes = graph.nodes.filter((node) => node.kind === 'work-stage');
    const gateNodes = graph.nodes.filter((node) => node.kind === 'evidence-gate' || node.kind === 'owner-gate');

    expect(graph.operationalStateAvailable).toBe(false);
    expect(graph.decisionAuthority).toBe(false);
    expect(pvcNodes).toHaveLength(2);
    expect(workStageNodes).toHaveLength(7);
    expect(workStageNodes.map((node) => node.id)).toEqual([
      'GOV-SCOPE',
      'GOV-WORK-GRAPH',
      'GOV-BRANCH-PR',
      'GOV-CONVERGENCE',
      'GOV-VALIDATION',
      'GOV-EVIDENCE',
      'GOV-CAPABILITY',
    ]);
    expect([...pvcNodes, ...workStageNodes, ...gateNodes].every((node) => node.state === 'unknown')).toBe(true);
  });

  it('maps only effective PVC-18 operational states into presentation states', () => {
    expect(mapOperationalTraceState('CURRENT')).toBe('current');
    expect(mapOperationalTraceState('BLOCKED')).toBe('blocked');
    expect(mapOperationalTraceState('WAITING')).toBe('waiting-for-evidence');
    expect(mapOperationalTraceState('UNKNOWN')).toBe('unknown');
  });

  it('projects one fresh evidenced PVC-18 CURRENT record without changing PVC structure', () => {
    const graph = buildProcessGraphViewModel(pvc, projects, agentTrustRoot, envelope([record()]));
    const pvcNodes = graph.nodes.filter((node) => node.kind === 'pvc');
    const pvc18 = pvcNodes.find((node) => node.id === 'PVC-18');
    const pvc01 = pvcNodes.find((node) => node.id === 'PVC-01');

    expect(graph.operationalStateAvailable).toBe(true);
    expect(graph.operationalStateGeneratedAt).toBe('2026-09-16T16:00:12.000Z');
    expect(pvcNodes.map((node) => node.id)).toEqual(['PVC-01', 'PVC-18']);
    expect(pvc01?.state).toBe('unknown');
    expect(pvc18).toMatchObject({
      state: 'current',
      owner: 'CAPITAL-AI-OPS',
      projectFolder: 'docs/projects/operations/',
    });
    expect(pvc18?.stateEvidence).toMatchObject({
      statusIds: ['trace-1'],
      evidenceRefs: ['trace-1'],
      validations: ['PASS'],
      provenanceSources: ['EventMesh/EventContract'],
      ambiguous: false,
    });
  });

  it('projects BLOCKED and WAITING only when supplied as effective evidence states', () => {
    const blocked = record({ state: 'BLOCKED', reportedState: 'BLOCKED', identity: { projectId: 'CAPITAL-AI-OPS', pvcId: 'PVC-18', statusId: 'blocked-1' } });
    const waiting = record({ state: 'WAITING', reportedState: 'WAITING', identity: { projectId: 'CAPITAL-AI-OPS', pvcId: 'PVC-18', statusId: 'evidence-gate' } });

    const blockedGraph = buildProcessGraphViewModel(pvc, projects, agentTrustRoot, envelope([blocked]));
    expect(blockedGraph.nodes.find((node) => node.id === 'PVC-18')?.state).toBe('blocked');

    const waitingGraph = buildProcessGraphViewModel(pvc, projects, agentTrustRoot, envelope([waiting]));
    expect(waitingGraph.nodes.find((node) => node.id === 'PVC-18')?.state).toBe('waiting-for-evidence');
    expect(waitingGraph.nodes.find((node) => node.id === 'evidence-gate')?.state).toBe('waiting-for-evidence');
  });

  it('keeps agreeing records deterministic but refuses to aggregate conflicting effective states', () => {
    const currentA = record({ identity: { projectId: 'CAPITAL-AI-OPS', pvcId: 'PVC-18', statusId: 'trace-a' } });
    const currentB = record({ identity: { projectId: 'CAPITAL-AI-OPS', pvcId: 'PVC-18', statusId: 'trace-b' } });
    const agreeing = buildProcessGraphViewModel(pvc, projects, agentTrustRoot, envelope([currentA, currentB]));
    expect(agreeing.nodes.find((node) => node.id === 'PVC-18')).toMatchObject({ state: 'current' });
    expect(agreeing.nodes.find((node) => node.id === 'PVC-18')?.stateEvidence?.ambiguous).toBe(false);

    const blocked = record({
      identity: { projectId: 'CAPITAL-AI-OPS', pvcId: 'PVC-18', statusId: 'trace-c' },
      reportedState: 'BLOCKED',
      state: 'BLOCKED',
    });
    const conflicting = buildProcessGraphViewModel(pvc, projects, agentTrustRoot, envelope([currentA, blocked]));
    expect(conflicting.nodes.find((node) => node.id === 'PVC-18')).toMatchObject({ state: 'unknown' });
    expect(conflicting.nodes.find((node) => node.id === 'PVC-18')?.stateEvidence?.ambiguous).toBe(true);
  });

  it('uses effective UNKNOWN for stale evidence and never converts stale evidence into historical', () => {
    const stale = record({
      reportedState: 'CURRENT',
      reportedValidation: 'PASS',
      state: 'UNKNOWN',
      validation: 'UNKNOWN',
      provenance: {
        source: 'EventMesh/EventContract',
        sourceRef: 'trace-stale',
        sourceTimestamp: '2026-09-16T15:00:00.000Z',
        observedAt: '2026-09-16T16:00:00.000Z',
        freshness: 'STALE',
      },
      staleOrUnknownFreshness: true,
      failsClosed: true,
    });
    const graph = buildProcessGraphViewModel(pvc, projects, agentTrustRoot, envelope([stale]));
    const pvc18 = graph.nodes.find((node) => node.id === 'PVC-18');

    expect(pvc18?.state).toBe('unknown');
    expect(pvc18?.state).not.toBe('historical');
    expect(pvc18?.stateEvidence?.validations).toEqual(['UNKNOWN']);
  });

  it('keeps evidence and Human authority as distinct gates without assigning local gate state', () => {
    const graph = buildProcessGraphViewModel(pvc, projects, agentTrustRoot);
    expect(graph.nodes.find((node) => node.id === 'evidence-gate')).toMatchObject({ authority: 'evidence-only', state: 'unknown' });
    expect(graph.nodes.find((node) => node.id === 'owner-gate')).toMatchObject({ authority: 'authorizing', state: 'unknown' });
    expect(graph.decisionAuthority).toBe(false);
  });
});
