import { describe, expect, it } from 'vitest';
import {
  createDefaultUiMessageCatalog,
  createDefaultVocabularyRegistry,
  createMessageDeliveryAdapters,
  UiMessageCatalog,
} from '../index';

describe('VW-4 message delivery adapters', () => {
  it('delivers governed messages only to compatible surfaces', () => {
    const adapters = createMessageDeliveryAdapters(createDefaultUiMessageCatalog());

    expect(adapters.react.format('screening.request.title', 'de')).toBe('Analyse starten');
    expect(adapters.pdf.format('reporting.canonicalScore.title', 'en')).toBe('Canonical score');
    expect(adapters.email.format('email.analysisReady.subject', 'de')).toBe('Analyse ist verfügbar');
    expect(adapters.seo.format('seo.enterpriseAnalytics.description', 'en')).toContain('traceable data provenance');
    expect(() => adapters.react.format('reporting.canonicalScore.title', 'de')).toThrow(/scoped to pdf/);
  });

  it('fails closed when a declared placeholder value is missing', () => {
    const registry = createDefaultVocabularyRegistry();
    const catalog = new UiMessageCatalog(registry);
    catalog.register({
      key: 'example.greeting',
      text: { de: 'Hallo {name}', en: 'Hello {name}' },
      conceptIds: ['VOC-PRODUCT-0101'],
      context: 'shared',
      status: 'approved',
      version: '1.0.0',
      placeholders: ['name'],
    });

    const adapters = createMessageDeliveryAdapters(catalog);
    expect(adapters.react.format('example.greeting', 'de', { name: 'Ada' })).toBe('Hallo Ada');
    expect(() => adapters.react.format('example.greeting', 'de')).toThrow(/Missing value/);
  });
});
