import { describe, expect, it } from 'vitest';
import { createDefaultUiMessageCatalog, createDefaultVocabularyRegistry } from '../index';
import { UiMessageCatalog } from '../Messages/UiMessageCatalog';

describe('VW-1 UI Message Catalog', () => {
  it('loads the governed bilingual seed catalog', () => {
    const catalog = createDefaultUiMessageCatalog();
    const message = catalog.get('screening.request.title');

    expect(message?.text.de).toBe('Analyse starten');
    expect(message?.text.en).toBe('Start analysis');
    expect(message?.conceptIds).toContain('VOC-ANALYTICS-0001');
    expect(catalog.listByContext('react').some((item) => item.key === 'screening.request.title')).toBe(true);
  });

  it('fails closed on unknown concepts', () => {
    const catalog = new UiMessageCatalog(createDefaultVocabularyRegistry());
    expect(() => catalog.register({
      key: 'example.unknownConcept',
      text: { de: 'Beispiel', en: 'Example' },
      conceptIds: ['VOC-UNKNOWN-9999'],
      context: 'shared',
      status: 'approved',
      version: '1.0.0',
    })).toThrow(/UNKNOWN_CONCEPT/);
  });

  it('requires declared placeholders in both language variants', () => {
    const catalog = new UiMessageCatalog(createDefaultVocabularyRegistry());
    expect(() => catalog.register({
      key: 'example.placeholder',
      text: { de: 'Hallo {name}', en: 'Hello' },
      conceptIds: ['VOC-PRODUCT-0101'],
      context: 'shared',
      status: 'approved',
      version: '1.0.0',
      placeholders: ['name'],
    })).toThrow(/PLACEHOLDER_MISMATCH/);
  });
});
