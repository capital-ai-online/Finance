import type { VocabularyConcept } from '../Domain/VocabularyConcept';
import type { IVocabularyRegistry } from '../Interfaces/IVocabularyRegistry';

export class VocabularyService {
  constructor(private readonly registry: IVocabularyRegistry) {}

  resolve(term: string): VocabularyConcept | undefined {
    return this.registry.resolveTerm(term);
  }

  getCanonicalTerm(term: string): string | undefined {
    return this.resolve(term)?.canonicalCodeTerm;
  }

  getDisplayName(term: string, locale: 'de' | 'en'): string | undefined {
    const concept = this.resolve(term);
    if (!concept) return undefined;
    return locale === 'de' ? concept.displayNameDE : concept.displayNameEN;
  }

  isForbidden(term: string): boolean {
    return this.registry.findForbiddenUsage(term).length > 0;
  }
}
