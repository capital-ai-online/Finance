export type VocabularyCategory =
  | 'asset'
  | 'analytics'
  | 'architecture'
  | 'billing'
  | 'compliance'
  | 'documentation'
  | 'iam'
  | 'platform'
  | 'product'
  | 'release'
  | 'ai-development-chat-execution';

export type VocabularyStatus = 'draft' | 'proposed' | 'approved' | 'deprecated' | 'retired';

export interface VocabularyConcept {
  id: string;
  canonicalCodeTerm: string;
  displayNameDE: string;
  displayNameEN: string;
  definitionDE: string;
  definitionEN: string;
  aliases: string[];
  forbiddenTerms: string[];
  category: VocabularyCategory;
  status: VocabularyStatus;
  version: string;
  essReferences: string[];
  adrReferences: string[];
  traceabilityReferences: string[];
}

export interface VocabularyFinding {
  code:
    | 'INVALID_ID'
    | 'INVALID_CANONICAL_TERM'
    | 'MISSING_TRANSLATION'
    | 'MISSING_AUTHORITY'
    | 'DUPLICATE_ALIAS'
    | 'DUPLICATE_FORBIDDEN_TERM'
    | 'TERM_COLLISION';
  message: string;
  conceptId: string;
}
