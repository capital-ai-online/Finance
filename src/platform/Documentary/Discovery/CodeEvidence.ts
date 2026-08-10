export type CodeEvidenceKind = 'module' | 'export' | 'contract' | 'route' | 'event' | 'manifest' | 'dependency';

export interface CodeEvidence {
  evidenceId: string;
  kind: CodeEvidenceKind;
  componentId: string;
  sourceCommit: string;
  path: string;
  symbol?: string;
  detail?: string;
}

export interface CodeEvidenceMap {
  sourceCommit: string;
  evidence: CodeEvidence[];
}
