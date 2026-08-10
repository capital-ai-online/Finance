export type DocumentaryProvenanceKind = 'code' | 'ess' | 'adr' | 'vocabulary' | 'event' | 'manual';

export interface DocumentaryProvenanceReference {
  kind: DocumentaryProvenanceKind;
  referenceId: string;
  sourceCommit?: string;
  path?: string;
  symbol?: string;
  evidenceId?: string;
  detail?: string;
}

export function validateDocumentaryProvenanceReference(reference: DocumentaryProvenanceReference): void {
  if (!reference.referenceId.trim()) throw new Error('[DocumentaryProvenance] referenceId is required.');
  if (reference.sourceCommit && !/^[0-9a-f]{7,40}$/i.test(reference.sourceCommit)) throw new Error('[DocumentaryProvenance] sourceCommit must be a Git commit SHA.');
  if (reference.kind === 'code' && (!reference.sourceCommit || !reference.path)) throw new Error('[DocumentaryProvenance] code evidence requires sourceCommit and path.');
}
