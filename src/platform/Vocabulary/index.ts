export type {
  VocabularyCategory,
  VocabularyConcept,
  VocabularyFinding,
  VocabularyStatus,
} from './Domain/VocabularyConcept';
export type { IVocabularyRegistry } from './Interfaces/IVocabularyRegistry';
export { VocabularyRegistry } from './Registry/VocabularyRegistry';
export { seedConcepts } from './Registry/seedConcepts';
export { securityVerificationConcepts } from './Registry/securityVerificationConcepts';
export { frontendPresentationConcepts } from './Registry/frontendPresentationConcepts';
export {
  pvcProjectConcepts,
  pvcStageThesaurus,
  type PvcStageId,
  type PvcThesaurusEntry,
} from './Registry/pvcProjectConcepts';
export { VocabularyService } from './Services/VocabularyService';
export {
  InMemoryGovernanceLifecycleSink,
  type GovernanceLifecycleEvent,
  type GovernanceLifecycleSink,
  type GovernanceLifecycleType,
} from './Services/GovernanceLifecycle';
export { VocabularyValidator, normalizeVocabularyTerm } from './Validators/VocabularyValidator';
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
export { MessageDeliveryAdapter, type MessageValues } from './Delivery/MessageDeliveryAdapter';
export { createMessageDeliveryAdapters, type MessageDeliveryAdapters } from './Delivery/createMessageDeliveryAdapters';

import { VocabularyRegistry } from './Registry/VocabularyRegistry';
import { seedConcepts } from './Registry/seedConcepts';
import { securityVerificationConcepts } from './Registry/securityVerificationConcepts';
import { frontendPresentationConcepts } from './Registry/frontendPresentationConcepts';
import { pvcProjectConcepts } from './Registry/pvcProjectConcepts';
import { UiMessageCatalog } from './Messages/UiMessageCatalog';
import { seedMessages } from './Messages/seedMessages';
import { migrationMessages } from './Messages/migrationMessages';

export function createDefaultVocabularyRegistry(): VocabularyRegistry {
  const registry = new VocabularyRegistry();
  registry.registerAll([...seedConcepts, ...securityVerificationConcepts, ...pvcProjectConcepts, ...frontendPresentationConcepts]);
  return registry;
}

export function createDefaultUiMessageCatalog(registry = createDefaultVocabularyRegistry()): UiMessageCatalog {
  const catalog = new UiMessageCatalog(registry);
  catalog.registerAll([...seedMessages, ...migrationMessages]);
  return catalog;
}
