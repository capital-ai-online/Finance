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

import { VocabularyRegistry } from './Registry/VocabularyRegistry';
import { seedConcepts } from './Registry/seedConcepts';

export function createDefaultVocabularyRegistry(): VocabularyRegistry {
  const registry = new VocabularyRegistry();
  registry.registerAll(seedConcepts);
  return registry;
}
