import type { VocabularyConcept } from '../../Vocabulary/Domain/VocabularyConcept';

export type DocumentaryLocale = 'de' | 'en';

export interface BilingualDocumentReference {
  conceptId: VocabularyConcept['id'];
  locale: DocumentaryLocale;
  title: string;
  definition: string;
  canonicalCodeTerm: VocabularyConcept['canonicalCodeTerm'];
  essReferences: string[];
  adrReferences: string[];
  traceabilityReferences: string[];
}

export interface BilingualDocumentPair {
  conceptId: VocabularyConcept['id'];
  de: BilingualDocumentReference;
  en: BilingualDocumentReference;
}
