import type { VocabularyConcept } from '../Domain/VocabularyConcept';

export interface IVocabularyRegistry {
  register(concept: VocabularyConcept): void;
  registerAll(concepts: VocabularyConcept[]): void;
  getById(id: string): VocabularyConcept | undefined;
  resolveTerm(term: string): VocabularyConcept | undefined;
  list(): VocabularyConcept[];
  findForbiddenUsage(term: string): VocabularyConcept[];
}
