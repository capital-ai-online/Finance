import type {
  OperationalTraceState,
  OperationalTraceStateEnvelope,
  OperationalTraceStateRecord,
  OperationalTraceValidationState,
} from '../../../../platform/Traceability/Contracts/OperationalTraceStateContract';

export type ProcessGraphState = 'current' | 'blocked' | 'waiting-for-evidence' | 'historical' | 'unknown';
export type ProcessGraphNodeKind = 'pvc' | 'work-stage' | 'evidence-gate' | 'owner-gate';

export interface ProcessGraphStateEvidence {
  generatedAt: string;
  statusIds: string[];
  evidenceRefs: string[];
  validations: OperationalTraceValidationState[];
  provenanceSources: string[];
  sourceTimestamps: Array<string | null>;
  ambiguous: boolean;
}

export interface ProcessGraphNode {
  id: string;
  kind: ProcessGraphNodeKind;
  label: string;
  owner?: string;
  projectFolder?: string;
  state: ProcessGraphState;
  authority: 'authorizing' | 'evidence-only' | 'non-authorizing';
  source: string;
  stateEvidence?: ProcessGraphStateEvidence;
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
  operationalStateGeneratedAt?: string;
  decisionAuthority: false;
}

interface PvcRow { pvc: string; stage: string; owner: string; }
interface WorkStageDefinition { id: string; heading: string; label: string; }

const stripTicks = (value: string) => value.replace(/`/g, '').trim();

const WORK_STAGE_DEFINITIONS: readonly WorkStageDefinition[] = [
  { id: 'GOV-SCOPE', heading: '## 3. Canonical scope and ownership resolution', label: 'Scope / Owner / PVC resolution' },
  { id: 'GOV-WORK-GRAPH', heading: '## 4. Autonomous work graph', label: 'Autonomous work graph' },
  { id: 'GOV-BRANCH-PR', heading: '## 5. Branch and Pull Request execution', label: 'Atomic branch / Pull Request' },
  { id: 'GOV-CONVERGENCE', heading: '## 6. Bounded self-healing and convergence', label: 'Self-healing / convergence' },
  { id: 'GOV-VALIDATION', heading: '## 7. Validation and cost control', label: 'Validation / CI cost control' },
  { id: 'GOV-EVIDENCE', heading: '## 8. Evidence, EventMesh and handover', label: 'Evidence / EventMesh / handover' },
  { id: 'GOV-CAPABILITY', heading: '## 9. Capability and tool boundary', label: 'Capability / tool boundary' },
];

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

export function parseAutonomousWorkStages(agentTrustRootMarkdown: string): Array<{ id: string; label: string }> {
  return WORK_STAGE_DEFINITIONS
    .filter((stage) => agentTrustRootMarkdown.includes(stage.heading))
    .map(({ id, label }) => ({ id, label }));
}

function isOperationalEnvelopeTrustedForProjection(
  envelope: OperationalTraceStateEnvelope | null | undefined,
): envelope is OperationalTraceStateEnvelope {
  return Boolean(
    envelope
      && envelope.authority.semantics === 'EVIDENCE_ONLY'
      && envelope.authority.decisionAuthority === false
      && envelope.authority.mergeAuthority === false
      && envelope.authority.releaseAuthority === false
      && envelope.authority.deploymentAuthority === false
      && envelope.missingStateSemantics === 'UNKNOWN_NON_PASS',
  );
}

export function mapOperationalTraceState(state: OperationalTraceState): ProcessGraphState {
  switch (state) {
    case 'CURRENT': return 'current';
    case 'BLOCKED': return 'blocked';
    case 'WAITING': return 'waiting-for-evidence';
    case 'UNKNOWN': return 'unknown';
  }
}

function collectMatchingRecords(
  nodeId: string,
  kind: ProcessGraphNodeKind,
  envelope: OperationalTraceStateEnvelope,
): OperationalTraceStateRecord[] {
  if (kind === 'pvc') {
    return envelope.records.filter((record) => record.identity.pvcId === nodeId);
  }
  return envelope.records.filter((record) => record.identity.statusId === nodeId);
}

function resolveStateFromOperationalProjection(
  nodeId: string,
  kind: ProcessGraphNodeKind,
  envelope: OperationalTraceStateEnvelope | null | undefined,
): Pick<ProcessGraphNode, 'state' | 'stateEvidence'> {
  if (!isOperationalEnvelopeTrustedForProjection(envelope)) {
    return { state: 'unknown', stateEvidence: undefined };
  }

  const records = collectMatchingRecords(nodeId, kind, envelope);
  if (records.length === 0) {
    return { state: 'unknown', stateEvidence: undefined };
  }

  const effectiveStates = Array.from(new Set(records.map((record) => record.state)));
  const state = effectiveStates.length === 1
    ? mapOperationalTraceState(effectiveStates[0])
    : 'unknown';

  const stateEvidence: ProcessGraphStateEvidence = {
    generatedAt: envelope.generatedAt,
    statusIds: records.map((record) => record.identity.statusId),
    evidenceRefs: Array.from(new Set(records.flatMap((record) => record.evidence.map((item) => item.ref)))),
    validations: Array.from(new Set(records.map((record) => record.validation))),
    provenanceSources: Array.from(new Set(records.map((record) => record.provenance.source))),
    sourceTimestamps: records.map((record) => record.provenance.sourceTimestamp),
    ambiguous: effectiveStates.length !== 1,
  };

  return { state, stateEvidence };
}

export function buildProcessGraphViewModel(
  pvcMarkdown: string,
  projectMappingMarkdown: string,
  agentTrustRootMarkdown: string,
  operationalState?: OperationalTraceStateEnvelope | null,
): ProcessGraphViewModel {
  const rows = parsePvcRows(pvcMarkdown);
  const folders = parseProjectFolders(projectMappingMarkdown);
  const workStages = parseAutonomousWorkStages(agentTrustRootMarkdown);
  const operationalStateAvailable = isOperationalEnvelopeTrustedForProjection(operationalState)
    && operationalState.records.length > 0;

  const pvcNodes: ProcessGraphNode[] = rows.map((row) => ({
    id: row.pvc,
    kind: 'pvc',
    label: `${row.pvc} — ${row.stage}`,
    owner: row.owner,
    projectFolder: folders.get(row.owner),
    ...resolveStateFromOperationalProjection(row.pvc, 'pvc', operationalState),
    authority: 'non-authorizing',
    source: 'docs/projects/PROJECT_VALUE_CHAIN.md + docs/projects/README.md; state: PVC-18 OperationalTraceStateEnvelope',
  }));

  const workStageNodes: ProcessGraphNode[] = workStages.map((stage) => ({
    id: stage.id,
    kind: 'work-stage',
    label: stage.label,
    ...resolveStateFromOperationalProjection(stage.id, 'work-stage', operationalState),
    authority: 'non-authorizing',
    source: 'AGENTS.md — autonomous development work graph; state: PVC-18 OperationalTraceStateEnvelope',
  }));

  const gateNodes: ProcessGraphNode[] = [
    {
      id: 'evidence-gate',
      kind: 'evidence-gate',
      label: 'Evidence / validation gate',
      ...resolveStateFromOperationalProjection('evidence-gate', 'evidence-gate', operationalState),
      authority: 'evidence-only',
      source: 'AGENTS.md — Evidence, EventMesh and handover; state: PVC-18 OperationalTraceStateEnvelope',
    },
    {
      id: 'owner-gate',
      kind: 'owner-gate',
      label: 'Human / CODEOWNER merge gate',
      ...resolveStateFromOperationalProjection('owner-gate', 'owner-gate', operationalState),
      authority: 'authorizing',
      source: 'AGENTS.md — Human/CODEOWNER authority; state display: PVC-18 OperationalTraceStateEnvelope only',
    },
  ];

  const chainEdges: ProcessGraphEdge[] = pvcNodes.slice(1).map((node, index) => ({ id: `handoff-${pvcNodes[index].id}-${node.id}`, source: pvcNodes[index].id, target: node.id, relation: 'handoff' }));
  const workStageEdges: ProcessGraphEdge[] = workStageNodes.slice(1).map((node, index) => ({ id: `dependency-${workStageNodes[index].id}-${node.id}`, source: workStageNodes[index].id, target: node.id, relation: 'dependency' }));
  const gateEdges: ProcessGraphEdge[] = [{ id: 'evidence-owner', source: 'evidence-gate', target: 'owner-gate', relation: 'validation/evidence' }];

  return {
    nodes: [...pvcNodes, ...workStageNodes, ...gateNodes],
    edges: [...chainEdges, ...workStageEdges, ...gateEdges],
    operationalStateAvailable,
    ...(isOperationalEnvelopeTrustedForProjection(operationalState)
      ? { operationalStateGeneratedAt: operationalState.generatedAt }
      : {}),
    decisionAuthority: false,
  };
}
