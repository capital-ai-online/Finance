export type {
  VocabularyCategory,
  VocabularyConcept,
  VocabularyFinding,
  VocabularyStatus,
} from './Domain/VocabularyConcept';
export type { IVocabularyRegistry } from './Interfaces/IVocabularyRegistry';
export { VocabularyRegistry } from './Registry/VocabularyRegistry';
export { seedConcepts } from './Registry/seedConcepts';
export { VocabularyService } from './Services/VocabularyService';
export {
  InMemoryGovernanceLifecycleSink,
  type GovernanceLifecycleEvent,
  type GovernanceLifecycleSink,
  type GovernanceLifecycleType,
} from './Services/GovernanceLifecycle';
export { VocabularyValidator } from './Validators/VocabularyValidator';
export {
  validateContinuousVocabularyGovernance,
  type ContinuousGovernanceFinding,
  type ContinuousGovernanceReport,
} from './Validators/ContinuousGovernanceValidator';
export type {
  UiMessageDefinition,
  UiMessageFinding,
  UiMessageLocale,
  UiMessageStatus,
  UiMessageSurface,
  UiMessageText,
} from './Messages/UiMessage';
export { UiMessageCatalog } from './Messages/UiMessageCatalog';
export { seedMessages } from './Messages/seedMessages';
export { migrationMessages } from './Messages/migrationMessages';
export { UiMessageValidator } from './Validators/UiMessageValidator';
export {
  FINTECH_VALUE_CHAIN_STAGE_IDS,
  FINTECH_WORDING_AUTHORITY,
  FINTECH_WORDING_PROJECTION_SCHEMA,
  type FintechValueChainStageId,
  type FintechValueChainWordingBinding,
  type FintechWordingBindingFinding,
} from './ValueChain/FintechWordingBinding';
export { fintechWordingBindings, validateFintechWordingBindings } from './ValueChain/fintechWordingBindings';
export type { WordingImpactReport, WordingUsageReference } from './Usage/WordingUsage';
export { WordingUsageIndex, scanWordingUsages } from './Usage/WordingUsageIndex';
export { MessageDeliveryAdapter, type MessageValues } from './Delivery/MessageDeliveryAdapter';
export { createMessageDeliveryAdapters, type MessageDeliveryAdapters } from './Delivery/createMessageDeliveryAdapters';
export {
  createVocabularyWordingSnapshot,
  VOCABULARY_WORDING_NON_AUTHORIZING_STATEMENT,
  VOCABULARY_WORDING_SNAPSHOT_AUTHORITY,
  VOCABULARY_WORDING_SNAPSHOT_SCHEMA,
  type VocabularyWordingConceptSnapshot,
  type VocabularyWordingMessageSnapshot,
  type VocabularyWordingSnapshot,
  type VocabularyWordingStageSnapshot,
} from './Projection/VocabularyWordingSnapshot';

import { VocabularyRegistry } from './Registry/VocabularyRegistry';
import { seedConcepts } from './Registry/seedConcepts';
import { UiMessageCatalog } from './Messages/UiMessageCatalog';
import { seedMessages } from './Messages/seedMessages';
import { migrationMessages } from './Messages/migrationMessages';

export function createDefaultVocabularyRegistry(): VocabularyRegistry {
  const registry = new VocabularyRegistry();
  registry.registerAll(seedConcepts);
  return registry;
}

export function createDefaultUiMessageCatalog(registry = createDefaultVocabularyRegistry()): UiMessageCatalog {
  const catalog = new UiMessageCatalog(registry);
  catalog.registerAll([...seedMessages, ...migrationMessages]);
  return catalog;
}
