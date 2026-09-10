import { describe, expect, it } from 'vitest';
import {
  createDefaultVocabularyRegistry,
  pvcProjectConcepts,
  pvcStageThesaurus,
} from '../index';

describe('PVC project vocabulary', () => {
  it('registers exactly one canonical project concept for every PVC stage', () => {
    const registry = createDefaultVocabularyRegistry();

    expect(pvcProjectConcepts).toHaveLength(18);
    expect(pvcStageThesaurus).toHaveLength(18);

    for (let index = 1; index <= 18; index += 1) {
      const pvc = `PVC-${String(index).padStart(2, '0')}`;
      const concept = registry.resolveTerm(pvc);

      expect(concept?.id).toBe(`VOC-PVC-${String(index).padStart(4, '0')}`);
    }
  });

  it('keeps thesaurus relations inside the canonical registry', () => {
    const registry = createDefaultVocabularyRegistry();

    for (const entry of pvcStageThesaurus) {
      expect(entry.relatedTerms.length).toBeGreaterThan(0);
      expect(entry.relatedVocabularyConceptIds.length).toBeGreaterThan(0);

      for (const conceptId of entry.relatedVocabularyConceptIds) {
        expect(registry.getById(conceptId), `${entry.pvc} references ${conceptId}`).toBeDefined();
      }
    }
  });

  it('does not turn related thesaurus terms into aliases of the PVC stage', () => {
    const registry = createDefaultVocabularyRegistry();
    const controlledImplementation = registry.resolveTerm('PVC-02');

    expect(controlledImplementation?.canonicalCodeTerm).toBe('PvcControlledImplementation');
    expect(controlledImplementation?.aliases).toEqual(['PVC-02']);
    expect(registry.resolveTerm('Atomic Change')?.id).toBe('VOC-AIDEV-0008');
  });
});
