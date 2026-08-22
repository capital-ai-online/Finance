import { createDocumentaryDocument, type DocumentaryDocument } from '../Models/DocumentaryDocument';
import { projectDocumentaryKnowledge, type DocumentaryKnowledgeProjection } from './DocumentaryKnowledgeProjection';
import {
  buildDocumentaryTraceabilityRecord,
  type DocumentaryTraceabilityRecord,
} from '../Traceability/DocumentaryTraceability';
import { resolveDocumentaryVersionContext } from '../Versioning/DocumentaryVersion';
import type { VocabularyWordingSnapshot } from '../../Vocabulary/Projection/VocabularyWordingSnapshot';

export const VOCABULARY_WORDING_DOCUMENTARY_ADAPTER_SCHEMA = 'documentary-vocabulary-wording-adapter/1.0.0' as const;

export interface VocabularyWordingDocumentaryProjection {
  schemaVersion: typeof VOCABULARY_WORDING_DOCUMENTARY_ADAPTER_SCHEMA;
  snapshotChecksum: string;
  document: DocumentaryDocument;
  knowledge: DocumentaryKnowledgeProjection;
  traceability: DocumentaryTraceabilityRecord;
  mutationAuthority: false;
  financialDecisionAuthority: false;
}

export interface VocabularyWordingDocumentaryInput {
  snapshot: VocabularyWordingSnapshot;
  generatedAt: string;
  correlationId: string;
  causationId: string;
  repoRoot?: string;
}

function stableUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export function projectVocabularyWordingThroughDocumentary(
  input: VocabularyWordingDocumentaryInput,
): VocabularyWordingDocumentaryProjection {
  const { snapshot } = input;
  if (snapshot.mutationAuthority !== false || snapshot.financialDecisionAuthority !== false) {
    throw new Error('[VocabularyWordingDocumentaryProjection] snapshot must remain read-only and non-authorizing.');
  }

  const messageKeys = snapshot.messages.map((message) => message.key);
  const stageIds = snapshot.stages.map((stage) => stage.stageId);
  const sourcePaths = stableUnique(snapshot.usages.map((usage) => usage.sourcePath));
  const traceabilityIds = stableUnique([
    ...messageKeys.map((key) => `message:${key}`),
    ...stageIds.map((stageId) => `fintech-stage:${stageId}`),
    ...sourcePaths.map((sourcePath) => `source:${sourcePath}`),
  ]);

  const content = JSON.stringify({
    snapshotSchemaVersion: snapshot.schemaVersion,
    snapshotChecksum: snapshot.checksum,
    messageKeys: stableUnique(messageKeys),
    sourcePaths,
    fintechStageIds: stableUnique(stageIds),
    authorityReferences: stableUnique(snapshot.authorityReferences),
    mutationAuthority: false,
    financialDecisionAuthority: false,
  });

  const document = createDocumentaryDocument({
    documentId: 'DOC-PROJECTION-VOCABULARY-WORDING',
    documentType: 'handoff',
    sourceCommit: snapshot.sourceCommit,
    generatedAt: input.generatedAt,
    reviewStatus: 'generated',
    title: 'Vocabulary / Wording Governance Projection',
    content,
    conceptIds: snapshot.concepts.map((concept) => concept.id),
    traceabilityIds,
    provenance: [
      {
        kind: 'vocabulary',
        referenceId: snapshot.schemaVersion,
        sourceCommit: snapshot.sourceCommit,
        detail: `snapshot-checksum:${snapshot.checksum}`,
      },
      {
        kind: 'ess',
        referenceId: 'ESS-0017',
        sourceCommit: snapshot.sourceCommit,
      },
      {
        kind: 'manual',
        referenceId: 'SC-MD-SPT-0001',
        sourceCommit: snapshot.sourceCommit,
        detail: 'read-only wording projection parent authority',
      },
    ],
  }, resolveDocumentaryVersionContext(input.repoRoot));

  const knowledge = projectDocumentaryKnowledge(document);
  const traceability = buildDocumentaryTraceabilityRecord(document, input.correlationId, input.causationId);

  return Object.freeze({
    schemaVersion: VOCABULARY_WORDING_DOCUMENTARY_ADAPTER_SCHEMA,
    snapshotChecksum: snapshot.checksum,
    document,
    knowledge,
    traceability,
    mutationAuthority: false as const,
    financialDecisionAuthority: false as const,
  });
}
