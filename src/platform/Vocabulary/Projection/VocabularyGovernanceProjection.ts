import crypto from 'node:crypto';
import type { IVocabularyRegistry } from '../Interfaces/IVocabularyRegistry';
import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import type { WordingUsageIndex } from '../Usage/WordingUsageIndex';
import type { FintechValueChainWordingBinding } from '../ValueChain/FintechWordingBinding';

export const VOCABULARY_GOVERNANCE_PROJECTION_SCHEMA = 'vocabulary-governance-projection/1.0.0' as const;
export const VOCABULARY_GOVERNANCE_PROJECTION_AUTHORITY = 'ESS-0017' as const;
export const VOCABULARY_GOVERNANCE_NON_AUTHORIZING_STATEMENT =
  'This projection is documentation, knowledge and traceability evidence only. It cannot authorize or mutate market data, identity, entitlements, scoring, confidence, ranking, eligibility, provider routing, release, deployment or production state.' as const;

export type VocabularyKnowledgeNodeType = 'concept' | 'message' | 'source' | 'fintech-stage' | 'authority';
export type VocabularyKnowledgeRelationshipType = 'HAS_MESSAGE' | 'USED_BY' | 'PROJECTS_STAGE' | 'GOVERNED_BY';

export interface VocabularyKnowledgeNode {
  id: string;
  type: VocabularyKnowledgeNodeType;
  label: string;
  metadata: Record<string, string | number | boolean>;
}

export interface VocabularyKnowledgeRelationship {
  from: string;
  to: string;
  type: VocabularyKnowledgeRelationshipType;
}

export interface VocabularyTraceabilityEdge {
  traceabilityId: string;
  from: string;
  to: string;
  relation: VocabularyKnowledgeRelationshipType;
  sourceCommit: string;
}

export interface VocabularyDocumentaryProjection {
  documentId: 'DOC-PROJECTION-VOCABULARY-WORDING';
  titleDE: 'Vocabulary-, Wording- und Usage-Projektion';
  titleEN: 'Vocabulary, wording and usage projection';
  sourceCommit: string;
  conceptIds: string[];
  messageKeys: string[];
  sourcePaths: string[];
  fintechStageIds: string[];
  authorityReferences: string[];
}

export interface VocabularyGovernanceProjection {
  schemaVersion: typeof VOCABULARY_GOVERNANCE_PROJECTION_SCHEMA;
  sourceCommit: string;
  authority: typeof VOCABULARY_GOVERNANCE_PROJECTION_AUTHORITY;
  documentary: VocabularyDocumentaryProjection;
  knowledge: {
    nodes: VocabularyKnowledgeNode[];
    relationships: VocabularyKnowledgeRelationship[];
  };
  traceability: VocabularyTraceabilityEdge[];
  checksum: string;
  mutationAuthority: false;
  financialDecisionAuthority: false;
  nonAuthorizingStatement: typeof VOCABULARY_GOVERNANCE_NON_AUTHORIZING_STATEMENT;
}

function stableUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function checksum(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function relationshipId(relationship: VocabularyKnowledgeRelationship): string {
  return `${relationship.type}|${relationship.from}|${relationship.to}`;
}

export function projectVocabularyGovernance(
  sourceCommit: string,
  vocabulary: IVocabularyRegistry,
  messages: UiMessageCatalog,
  usageIndex: WordingUsageIndex,
  bindings: readonly FintechValueChainWordingBinding[],
): VocabularyGovernanceProjection {
  if (!/^[0-9a-f]{40}$/i.test(sourceCommit)) {
    throw new Error('Vocabulary governance projection requires an exact 40-character source commit SHA.');
  }

  const concepts = vocabulary.list();
  const messageList = messages.list();
  const usages = usageIndex.list();
  const authorityReferences = stableUnique([
    'ESS-0017',
    ...concepts.flatMap((concept) => [...concept.essReferences, ...concept.adrReferences, ...concept.traceabilityReferences]),
    ...messageList.flatMap((message) => message.authorityReferences ?? []),
    ...bindings.flatMap((binding) => binding.authorityReferences),
  ]);

  const nodes: VocabularyKnowledgeNode[] = [
    ...concepts.map((concept) => ({
      id: `concept:${concept.id}`,
      type: 'concept' as const,
      label: concept.canonicalCodeTerm,
      metadata: {
        status: concept.status,
        version: concept.version,
        displayNameDE: concept.displayNameDE,
        displayNameEN: concept.displayNameEN,
      },
    })),
    ...messageList.map((message) => ({
      id: `message:${message.key}`,
      type: 'message' as const,
      label: message.key,
      metadata: { status: message.status, version: message.version, context: message.context },
    })),
    ...stableUnique(usages.map((usage) => usage.sourcePath)).map((sourcePath) => ({
      id: `source:${sourcePath}`,
      type: 'source' as const,
      label: sourcePath,
      metadata: { generated: false },
    })),
    ...bindings.map((binding) => ({
      id: `fintech-stage:${binding.stageId}`,
      type: 'fintech-stage' as const,
      label: binding.stageName,
      metadata: { stageId: binding.stageId, financialDecisionAuthority: false, mutationAuthority: false },
    })),
    ...authorityReferences.map((authority) => ({
      id: `authority:${authority}`,
      type: 'authority' as const,
      label: authority,
      metadata: { projectionOnly: true },
    })),
  ].sort((a, b) => a.id.localeCompare(b.id));

  const relationships: VocabularyKnowledgeRelationship[] = [];
  for (const message of messageList) {
    for (const conceptId of message.conceptIds) {
      relationships.push({ from: `concept:${conceptId}`, to: `message:${message.key}`, type: 'HAS_MESSAGE' });
    }
    for (const authority of message.authorityReferences ?? []) {
      relationships.push({ from: `message:${message.key}`, to: `authority:${authority}`, type: 'GOVERNED_BY' });
    }
  }

  for (const concept of concepts) {
    for (const authority of stableUnique([...concept.essReferences, ...concept.adrReferences, ...concept.traceabilityReferences])) {
      relationships.push({ from: `concept:${concept.id}`, to: `authority:${authority}`, type: 'GOVERNED_BY' });
    }
  }

  for (const usage of usages) {
    relationships.push({ from: `message:${usage.messageKey}`, to: `source:${usage.sourcePath}`, type: 'USED_BY' });
  }

  for (const binding of bindings) {
    for (const conceptId of binding.conceptIds) {
      relationships.push({ from: `concept:${conceptId}`, to: `fintech-stage:${binding.stageId}`, type: 'PROJECTS_STAGE' });
    }
    for (const messageKey of binding.messageKeys) {
      relationships.push({ from: `message:${messageKey}`, to: `fintech-stage:${binding.stageId}`, type: 'PROJECTS_STAGE' });
    }
    for (const authority of binding.authorityReferences) {
      relationships.push({ from: `fintech-stage:${binding.stageId}`, to: `authority:${authority}`, type: 'GOVERNED_BY' });
    }
  }

  const uniqueRelationships = [...new Map(relationships.map((relationship) => [relationshipId(relationship), relationship])).values()]
    .sort((a, b) => relationshipId(a).localeCompare(relationshipId(b)));

  const traceability: VocabularyTraceabilityEdge[] = uniqueRelationships.map((relationship, index) => ({
    traceabilityId: `VOC-TRACE-${String(index + 1).padStart(5, '0')}`,
    from: relationship.from,
    to: relationship.to,
    relation: relationship.type,
    sourceCommit: sourceCommit.toLowerCase(),
  }));

  const documentary: VocabularyDocumentaryProjection = {
    documentId: 'DOC-PROJECTION-VOCABULARY-WORDING',
    titleDE: 'Vocabulary-, Wording- und Usage-Projektion',
    titleEN: 'Vocabulary, wording and usage projection',
    sourceCommit: sourceCommit.toLowerCase(),
    conceptIds: stableUnique(concepts.map((concept) => concept.id)),
    messageKeys: stableUnique(messageList.map((message) => message.key)),
    sourcePaths: stableUnique(usages.map((usage) => usage.sourcePath)),
    fintechStageIds: stableUnique(bindings.map((binding) => binding.stageId)),
    authorityReferences,
  };

  const stablePayload = {
    schemaVersion: VOCABULARY_GOVERNANCE_PROJECTION_SCHEMA,
    sourceCommit: sourceCommit.toLowerCase(),
    authority: VOCABULARY_GOVERNANCE_PROJECTION_AUTHORITY,
    documentary,
    knowledge: { nodes, relationships: uniqueRelationships },
    traceability,
    mutationAuthority: false as const,
    financialDecisionAuthority: false as const,
    nonAuthorizingStatement: VOCABULARY_GOVERNANCE_NON_AUTHORIZING_STATEMENT,
  };

  return Object.freeze({ ...stablePayload, checksum: checksum(stablePayload) });
}
