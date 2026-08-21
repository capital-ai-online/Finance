import { describe, expect, it } from 'vitest';
import { createDefaultUiMessageCatalog, createDefaultVocabularyRegistry } from '../index';
import { fintechWordingBindings } from '../ValueChain/fintechWordingBindings';
import { renderVocabularyWikiProjection } from '../Wiki/VocabularyWikiProjection';

describe('VW-6 Vocabulary Wiki projection', () => {
  it('renders deterministic non-authoritative managed pages', () => {
    const registry = createDefaultVocabularyRegistry();
    const catalog = createDefaultUiMessageCatalog(registry);
    const sourceCommit = 'b'.repeat(40);
    const first = renderVocabularyWikiProjection(sourceCommit, registry, catalog, fintechWordingBindings);
    const second = renderVocabularyWikiProjection(sourceCommit, registry, catalog, fintechWordingBindings);

    expect(first.checksum).toBe(second.checksum);
    expect(first.pages).toEqual(second.pages);
    expect(first.pages.map((item) => item.filename)).toEqual([
      'Canonical-Vocabulary.md',
      'FinTech-Value-Chain.md',
      'Home.md',
      'UI-Message-Catalog.md',
      'Vocabulary-Governance-Boundary.md',
    ]);
    expect(first.repositoryAuthoritative).toBe(false);
    expect(first.mutationAuthority).toBe(false);
    expect(first.pages.every((item) => item.content.includes(sourceCommit))).toBe(true);
  });

  it('rejects symbolic refs as audit bindings', () => {
    const registry = createDefaultVocabularyRegistry();
    const catalog = createDefaultUiMessageCatalog(registry);
    expect(() => renderVocabularyWikiProjection('main', registry, catalog, fintechWordingBindings))
      .toThrow(/exact 40-character source commit SHA/);
  });
});
