import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDefaultUiMessageCatalog, createDefaultVocabularyRegistry } from '../index';
import { UiMessageCatalog } from '../Messages/UiMessageCatalog';

describe('VW-1 UI Message Catalog', () => {
  it('keeps Node-only governance utilities out of the browser entry point', () => {
    const browserEntry = fs.readFileSync(path.join(process.cwd(), 'src/platform/Vocabulary/index.ts'), 'utf8');
    const nodeEntry = fs.readFileSync(path.join(process.cwd(), 'src/platform/Vocabulary/node.ts'), 'utf8');

    expect(browserEntry).not.toContain('WordingUsageIndex');
    expect(browserEntry).not.toContain('VocabularyWordingSnapshot');
    expect(browserEntry).not.toContain('ContinuousGovernanceValidator');
    expect(nodeEntry).toContain("./Usage/WordingUsageIndex");
    expect(nodeEntry).toContain("./Projection/VocabularyWordingSnapshot");
    expect(nodeEntry).toContain("./Validators/ContinuousGovernanceValidator");
  });

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

  it('rejects placeholders that occur in message text without an explicit contract declaration', () => {
    const catalog = new UiMessageCatalog(createDefaultVocabularyRegistry());
    expect(() => catalog.register({
      key: 'example.undeclaredPlaceholder',
      text: { de: 'Hallo {name}', en: 'Hello {name}' },
      conceptIds: ['VOC-PRODUCT-0101'],
      context: 'shared',
      status: 'approved',
      version: '1.0.0',
    })).toThrow(/UNDECLARED_PLACEHOLDER/);
  });
});
