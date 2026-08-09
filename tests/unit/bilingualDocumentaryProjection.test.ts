import { describe, expect, it } from 'vitest';
import { VocabularyRegistry } from '../../src/platform/Vocabulary/Registry/VocabularyRegistry';
import { seedConcepts } from '../../src/platform/Vocabulary/Registry/seedConcepts';
import { createBilingualDocumentPair, createDocumentReference } from '../../src/platform/Documentary/Documentation/BilingualDocumentaryProjection';

function createRegistry(): VocabularyRegistry {
  const registry = new VocabularyRegistry();
  registry.registerAll(seedConcepts);
  return registry;
}

describe('BilingualDocumentaryProjection', () => {
  it('derives DE and EN from the same approved concept identity', () => {
    const pair = createBilingualDocumentPair(createRegistry(), 'VOC-BILLING-0001');

    expect(pair.de.conceptId).toBe(pair.en.conceptId);
    expect(pair.de.canonicalCodeTerm).toBe(pair.en.canonicalCodeTerm);
    expect(pair.de.locale).toBe('de');
    expect(pair.en.locale).toBe('en');
    expect(pair.de.title).not.toBe(pair.en.title);
  });

  it('preserves language-neutral governance references', () => {
    const pair = createBilingualDocumentPair(createRegistry(), 'VOC-BILLING-0001');

    expect(pair.de.essReferences).toEqual(pair.en.essReferences);
    expect(pair.de.adrReferences).toEqual(pair.en.adrReferences);
    expect(pair.de.traceabilityReferences).toEqual(pair.en.traceabilityReferences);
  });

  it('fails closed for an unknown concept', () => {
    expect(() => createDocumentReference(createRegistry(), 'VOC-UNKNOWN-9999', 'de'))
      .toThrow('Unknown vocabulary concept');
  });
});
