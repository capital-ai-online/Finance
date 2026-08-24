/**
 * Node-only Vocabulary entry point for repository automation and governance.
 * Browser/runtime consumers must import from ./index or Delivery/browserMessageCatalog.
 */
export {
  validateContinuousVocabularyGovernance,
  type ContinuousGovernanceFinding,
  type ContinuousGovernanceReport,
} from './Validators/ContinuousGovernanceValidator';
export { WordingUsageIndex, scanWordingUsages } from './Usage/WordingUsageIndex';
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
