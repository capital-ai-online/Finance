import { describe, expect, it } from 'vitest';
import { createDefaultVocabularyRegistry } from '../index';
import { VocabularyRegistry } from '../Registry/VocabularyRegistry';
import type { VocabularyConcept } from '../Domain/VocabularyConcept';

function concept(overrides: Partial<VocabularyConcept> = {}): VocabularyConcept {
  return {
    id: 'VOC-PLATFORM-9999',
    canonicalCodeTerm: 'ExampleConcept',
    displayNameDE: 'Beispielbegriff',
    displayNameEN: 'Example concept',
    definitionDE: 'Beispieldefinition.',
    definitionEN: 'Example definition.',
    aliases: [],
    forbiddenTerms: [],
    category: 'platform',
    status: 'approved',
    version: '1.0.0',
    essReferences: ['ESS-0017'],
    adrReferences: ['ADR-0078'],
    traceabilityReferences: [],
    ...overrides,
  };
}

describe('VocabularyRegistry contracts', () => {
  it('resolves canonical and localized terms to the same concept', () => {
    const registry = createDefaultVocabularyRegistry();
    expect(registry.resolveTerm('Subscription')?.id).toBe('VOC-BILLING-0001');
    expect(registry.resolveTerm('Abonnement')?.id).toBe('VOC-BILLING-0001');
    expect(registry.resolveTerm('abo')?.id).toBe('VOC-BILLING-0001');
  });

  it('normalizes lookup terms deterministically', () => {
    const registry = createDefaultVocabularyRegistry();
    expect(registry.resolveTerm('  MONTE CARLO  ')?.canonicalCodeTerm).toBe('MonteCarlo');
    expect(registry.resolveTerm('Ｓｕｂｓｃｒｉｐｔｉｏｎ')?.canonicalCodeTerm).toBe('Subscription');
  });

  it('rejects duplicate concept IDs', () => {
    const registry = new VocabularyRegistry();
    registry.register(concept());
    expect(() => registry.register(concept())).toThrow(/already registered/);
  });

  it('rejects cross-concept alias collisions', () => {
    const registry = new VocabularyRegistry();
    registry.register(
      concept({
        id: 'VOC-PLATFORM-9998',
        displayNameDE: 'Beispiel A',
        displayNameEN: 'Example A',
        aliases: ['SharedTerm'],
      }),
    );
    expect(() =>
      registry.register(
        concept({
          id: 'VOC-PLATFORM-9997',
          canonicalCodeTerm: 'OtherConcept',
          displayNameDE: 'Beispiel B',
          displayNameEN: 'Example B',
          aliases: ['sharedterm'],
        }),
      ),
    ).toThrow(/TERM_COLLISION/);
  });

  it('rejects an active term that is already governed as forbidden', () => {
    const registry = new VocabularyRegistry();
    registry.register(
      concept({
        id: 'VOC-PLATFORM-9998',
        displayNameDE: 'Beispiel A',
        displayNameEN: 'Example A',
        forbiddenTerms: ['LegacyTerm'],
      }),
    );

    expect(() =>
      registry.register(
        concept({
          id: 'VOC-PLATFORM-9997',
          canonicalCodeTerm: 'LegacyTerm',
          displayNameDE: 'Beispiel B',
          displayNameEN: 'Example B',
        }),
      ),
    ).toThrow(/TERM_COLLISION/);
  });

  it('rejects a forbidden term that is already active in another concept', () => {
    const registry = new VocabularyRegistry();
    registry.register(
      concept({
        id: 'VOC-PLATFORM-9998',
        canonicalCodeTerm: 'ActiveTerm',
        displayNameDE: 'Beispiel A',
        displayNameEN: 'Example A',
      }),
    );

    expect(() =>
      registry.register(
        concept({
          id: 'VOC-PLATFORM-9997',
          canonicalCodeTerm: 'OtherConcept',
          displayNameDE: 'Beispiel B',
          displayNameEN: 'Example B',
          forbiddenTerms: ['activeterm'],
        }),
      ),
    ).toThrow(/TERM_COLLISION/);
  });

  it('rejects active and forbidden term overlap within one concept', () => {
    const registry = new VocabularyRegistry();
    expect(() =>
      registry.register(concept({ aliases: ['LegacyTerm'], forbiddenTerms: ['legacyterm'] })),
    ).toThrow(/TERM_COLLISION/);
  });

  it('rejects invalid technical canonical terms', () => {
    const registry = new VocabularyRegistry();
    expect(() => registry.register(concept({ canonicalCodeTerm: 'Ungültiger Begriff' }))).toThrow(
      /INVALID_CANONICAL_TERM/,
    );
  });

  it('requires authority references for approved concepts', () => {
    const registry = new VocabularyRegistry();
    expect(() => registry.register(concept({ essReferences: [], adrReferences: [] }))).toThrow(
      /MISSING_AUTHORITY/,
    );
  });

  it('detects forbidden terms without mutating source content', () => {
    const registry = createDefaultVocabularyRegistry();
    const matches = registry.findForbiddenUsage('Membership');
    expect(matches).toHaveLength(1);
    expect(matches[0].canonicalCodeTerm).toBe('Subscription');
  });

  it('stores immutable registry snapshots', () => {
    const registry = new VocabularyRegistry();
    const input = concept();
    registry.register(input);
    input.aliases.push('LateMutation');
    expect(registry.resolveTerm('LateMutation')).toBeUndefined();
    expect(registry.getById(input.id)?.aliases.includes('LateMutation')).toBe(false);
  });

  it('uses the canonical ADR-0078 vocabulary authority and covers the complete FinTech baseline', () => {
    const registry = createDefaultVocabularyRegistry();
    expect(registry.list()).toHaveLength(69);
    for (const item of registry.list()) {
      expect(item.adrReferences).toContain('ADR-0078');
      expect(item.adrReferences).not.toContain('ADR-0046');
    }
    expect(registry.getById('VOC-ANALYTICS-0108')?.canonicalCodeTerm).toBe('CanonicalScoreResult');
    expect(registry.getById('VOC-PRODUCT-0103')?.canonicalCodeTerm).toBe('DeliverySurface');
    expect(registry.resolveTerm('GHAS')?.canonicalCodeTerm).toBe('GitHubAdvancedSecurity');
    expect(registry.resolveTerm('GHEC')?.canonicalCodeTerm).toBe('GitHubEnterpriseCloud');
    expect(registry.getById('VOC-BILLING-0003')?.displayNameEN).toBe('GitHub Advanced Security');
    expect(registry.getById('VOC-BILLING-0004')?.displayNameEN).toBe('GitHub Enterprise Cloud');
  });

  it('provides the canonical AI Development Chat & Execution Terminology category', () => {
    const registry = createDefaultVocabularyRegistry();
    const developmentTerms = registry.list().filter((item) => item.category === 'ai-development-chat-execution');

    expect(developmentTerms).toHaveLength(43);
    expect(registry.resolveTerm('Pre-check')?.canonicalCodeTerm).toBe('PreCheck');
    expect(registry.resolveTerm('Re-sync')?.canonicalCodeTerm).toBe('MainResync');
    expect(registry.resolveTerm('Changed-file overlap')?.canonicalCodeTerm).toBe('ChangedFileOverlap');
    expect(registry.resolveTerm('Head SHA')?.canonicalCodeTerm).toBe('HeadSha');
    expect(registry.resolveTerm('Stand der Technik')?.canonicalCodeTerm).toBe('StateOfTheArt');
    expect(registry.resolveTerm('/healthz')?.canonicalCodeTerm).toBe('LivenessEndpoint');
    expect(registry.resolveTerm('/readyz')?.canonicalCodeTerm).toBe('ReadinessEndpoint');
    expect(registry.resolveTerm('/healthz/readiness')?.canonicalCodeTerm).toBe('ReadinessProjectionEndpoint');
    expect(registry.resolveTerm('Production URL')?.canonicalCodeTerm).toBe('ProductionBaseUrl');
    expect(registry.resolveTerm('Online research')?.canonicalCodeTerm).toBe('ExternalResearchPreCheck');
    expect(registry.resolveTerm('ASVS')?.canonicalCodeTerm).toBe('OWASPASVS');
    expect(registry.resolveTerm('ASVS-Matrix')?.canonicalCodeTerm).toBe('ASVSVerificationMatrix');
    expect(registry.resolveTerm('ASVA Matrix')).toBeUndefined();
    expect(registry.findForbiddenUsage('ASVA Matrix')).toHaveLength(1);
    expect(registry.resolveTerm('Candidate')).toBeUndefined();
    expect(registry.resolveTerm('Main URL')).toBeUndefined();
  });
});
