import crypto from 'node:crypto';
import type { IVocabularyRegistry } from '../Interfaces/IVocabularyRegistry';
import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import type { WordingUsageReference } from '../Usage/WordingUsage';
import type { WordingUsageIndex } from '../Usage/WordingUsageIndex';
import type { FintechValueChainWordingBinding } from '../ValueChain/FintechWordingBinding';

export const VOCABULARY_WORDING_SNAPSHOT_SCHEMA = 'vocabulary-wording-snapshot/1.0.0' as const;
export const VOCABULARY_WORDING_SNAPSHOT_AUTHORITY = 'ESS-0017' as const;
export const VOCABULARY_WORDING_NON_AUTHORIZING_STATEMENT =
  'This snapshot is read-only vocabulary and wording evidence. It cannot authorize or mutate market data, identity, entitlements, scoring, confidence, ranking, eligibility, provider routing, release, deployment or production state.' as const;

export interface VocabularyWordingConceptSnapshot {
  id: string;
  canonicalCodeTerm: string;
  displayNameDE: string;
  displayNameEN: string;
  status: string;
  version: string;
}

export interface VocabularyWordingMessageSnapshot {
  key: string;
  conceptIds: string[];
  context: string;
  status: string;
  version: string;
  authorityReferences: string[];
}

export interface VocabularyWordingStageSnapshot {
  stageId: string;
  stageName: string;
  conceptIds: string[];
  messageKeys: string[];
  authorityReferences: string[];
}

export interface VocabularyWordingSnapshot {
  schemaVersion: typeof VOCABULARY_WORDING_SNAPSHOT_SCHEMA;
  sourceCommit: string;
  authority: typeof VOCABULARY_WORDING_SNAPSHOT_AUTHORITY;
  concepts: VocabularyWordingConceptSnapshot[];
  messages: VocabularyWordingMessageSnapshot[];
  usages: WordingUsageReference[];
  stages: VocabularyWordingStageSnapshot[];
  authorityReferences: string[];
  checksum: string;
  mutationAuthority: false;
  financialDecisionAuthority: false;
  nonAuthorizingStatement: typeof VOCABULARY_WORDING_NON_AUTHORIZING_STATEMENT;
}

function stableUnique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function checksum(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function createVocabularyWordingSnapshot(
  sourceCommit: string,
  vocabulary: IVocabularyRegistry,
  messages: UiMessageCatalog,
  usageIndex: WordingUsageIndex,
  bindings: readonly FintechValueChainWordingBinding[],
): VocabularyWordingSnapshot {
  if (!/^[0-9a-f]{40}$/i.test(sourceCommit)) {
    throw new Error('Vocabulary wording snapshot requires an exact 40-character source commit SHA.');
  }

  const concepts = vocabulary.list().map((concept) => ({
    id: concept.id,
    canonicalCodeTerm: concept.canonicalCodeTerm,
    displayNameDE: concept.displayNameDE,
    displayNameEN: concept.displayNameEN,
    status: concept.status,
    version: concept.version,
  })).sort((a, b) => a.id.localeCompare(b.id));

  const messageList = messages.list().map((message) => ({
    key: message.key,
    conceptIds: [...message.conceptIds].sort(),
    context: message.context,
    status: message.status,
    version: message.version,
    authorityReferences: stableUnique(message.authorityReferences ?? []),
  })).sort((a, b) => a.key.localeCompare(b.key));

  const usages = usageIndex.list().map((usage) => ({
    ...usage,
    conceptIds: [...usage.conceptIds].sort(),
    fintechStageIds: [...(usage.fintechStageIds ?? [])].sort(),
  }));

  const stages = bindings.map((binding) => ({
    stageId: binding.stageId,
    stageName: binding.stageName,
    conceptIds: [...binding.conceptIds].sort(),
    messageKeys: [...binding.messageKeys].sort(),
    authorityReferences: stableUnique(binding.authorityReferences),
  })).sort((a, b) => a.stageId.localeCompare(b.stageId));

  const authorityReferences = stableUnique([
    'ESS-0017',
    ...vocabulary.list().flatMap((concept) => [...concept.essReferences, ...concept.adrReferences, ...concept.traceabilityReferences]),
    ...messageList.flatMap((message) => message.authorityReferences),
    ...stages.flatMap((stage) => stage.authorityReferences),
  ]);

  const stablePayload = {
    schemaVersion: VOCABULARY_WORDING_SNAPSHOT_SCHEMA,
    sourceCommit: sourceCommit.toLowerCase(),
    authority: VOCABULARY_WORDING_SNAPSHOT_AUTHORITY,
    concepts,
    messages: messageList,
    usages,
    stages,
    authorityReferences,
    mutationAuthority: false as const,
    financialDecisionAuthority: false as const,
    nonAuthorizingStatement: VOCABULARY_WORDING_NON_AUTHORIZING_STATEMENT,
  };

  return Object.freeze({ ...stablePayload, checksum: checksum(stablePayload) });
}
