import { describe, expect, it } from 'vitest';
import { createDefaultUiMessageCatalog, createDefaultVocabularyRegistry } from '../index';
import { fintechWordingBindings } from '../ValueChain/fintechWordingBindings';
import { renderVocabularyWikiProjection } from '../Wiki/VocabularyWikiProjection';
import {
  CAPITAL_AI_WIKI_HTTPS_REMOTE,
  CAPITAL_AI_WIKI_SSH_REMOTE,
  CAPITAL_AI_WIKI_SSH_URL_REMOTE,
  isAllowedVocabularyWikiRemote,
} from '../Wiki/VocabularyWikiRemotePolicy';

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

  it('allows only exact credential-free GitHub remotes for the Finance Wiki', () => {
    expect(isAllowedVocabularyWikiRemote(CAPITAL_AI_WIKI_HTTPS_REMOTE)).toBe(true);
    expect(isAllowedVocabularyWikiRemote(CAPITAL_AI_WIKI_SSH_REMOTE)).toBe(true);
    expect(isAllowedVocabularyWikiRemote(CAPITAL_AI_WIKI_SSH_URL_REMOTE)).toBe(true);

    expect(isAllowedVocabularyWikiRemote('https://evil.example/SvenKulessa/Finance.wiki.git')).toBe(false);
    expect(isAllowedVocabularyWikiRemote('https://github.com/OtherOwner/Finance.wiki.git')).toBe(false);
    expect(isAllowedVocabularyWikiRemote('https://token@github.com/SvenKulessa/Finance.wiki.git')).toBe(false);
    expect(isAllowedVocabularyWikiRemote('git@github.com:SvenKulessa/Finance.wiki.git.evil')).toBe(false);
  });
});
