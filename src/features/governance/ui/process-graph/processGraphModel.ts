import type {
  OperationalTraceState,
  OperationalTraceStateEnvelope,
  OperationalTraceStateRecord,
  OperationalTraceValidationState,
} from '../../../../platform/Traceability/Contracts/OperationalTraceStateContract';

export type ProcessGraphState = 'current' | 'blocked' | 'waiting-for-evidence' | 'historical' | 'unknown';
export type ProcessGraphNodeKind = 'pvc' | 'development' | 'evidence-gate' | 'owner-gate';

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

  // The UI never resolves conflicting operational facts. It may project one effective state only
  // when every matching PVC-18 record already agrees on that effective state. Any disagreement is
  // fail-closed to unknown rather than becoming a frontend-local aggregation/decision rule.
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
  developmentChainMarkdown: string,
  operationalState?: OperationalTraceStateEnvelope | null,
): ProcessGraphViewModel {
  const rows = parsePvcRows(pvcMarkdown);
  const folders = parseProjectFolders(projectMappingMarkdown);
  const lifecycle = parseDevelopmentLifecycle(developmentChainMarkdown);
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

  const developmentNodes: ProcessGraphNode[] = lifecycle.map((label) => {
    const id = label.match(/^DC-\d{2}/)?.[0] ?? label;
    return {
      id,
      kind: 'development',
      label,
      ...resolveStateFromOperationalProjection(id, 'development', operationalState),
      authority: 'non-authorizing',
      source: 'docs/projects/operations/DEVELOPMENT_CHAIN.md — Durable lifecycle; state: PVC-18 OperationalTraceStateEnvelope',
    };
  });

  const gateNodes: ProcessGraphNode[] = [
    {
      id: 'evidence-gate',
      kind: 'evidence-gate',
      label: 'Evidence / validation gate',
      ...resolveStateFromOperationalProjection('evidence-gate', 'evidence-gate', operationalState),
      authority: 'evidence-only',
      source: 'GOV-08 Admin Panel graph handoff; state: PVC-18 OperationalTraceStateEnvelope',
    },
    {
      id: 'owner-gate',
      kind: 'owner-gate',
      label: 'Human / Owner decision gate',
      ...resolveStateFromOperationalProjection('owner-gate', 'owner-gate', operationalState),
      authority: 'authorizing',
      source: 'AGENTS.md — Human Authority; state display: PVC-18 OperationalTraceStateEnvelope only',
    },
  ];

  const chainEdges: ProcessGraphEdge[] = pvcNodes.slice(1).map((node, index) => ({ id: `handoff-${pvcNodes[index].id}-${node.id}`, source: pvcNodes[index].id, target: node.id, relation: 'handoff' }));
  const developmentEdges: ProcessGraphEdge[] = developmentNodes.slice(1).map((node, index) => ({ id: `dependency-${developmentNodes[index].id}-${node.id}`, source: developmentNodes[index].id, target: node.id, relation: 'dependency' }));
  const gateEdges: ProcessGraphEdge[] = [{ id: 'evidence-owner', source: 'evidence-gate', target: 'owner-gate', relation: 'validation/evidence' }];

  return {
    nodes: [...pvcNodes, ...developmentNodes, ...gateNodes],
    edges: [...chainEdges, ...developmentEdges, ...gateEdges],
    operationalStateAvailable,
    ...(isOperationalEnvelopeTrustedForProjection(operationalState)
      ? { operationalStateGeneratedAt: operationalState.generatedAt }
      : {}),
    decisionAuthority: false,
  };
}
