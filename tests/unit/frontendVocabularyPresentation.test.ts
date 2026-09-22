import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

describe('Market Vocabulary presentation', () => {
  it('uses the FRONTEND vocabulary visual architecture without transferring content authority', () => {
    const modal = read(
      'src/features/public/ui/frontend-port/components/MarketVocabularyModal.tsx',
    );
    const vocabulary = read('src/features/learning/ui/LearningVocabulary.tsx');

    expect(modal).toContain('LearningVocabulary');
    expect(modal).toContain('data-vocabulary-authority="ESS-0017"');
    expect(modal).toContain('data-vocabulary-mode="READ_ONLY"');
    expect(modal).toContain('max-w-3xl');
    expect(modal).not.toContain('data-vocabulary-source');
    expect(modal).not.toContain('vocabularyData');

    expect(vocabulary).toContain('createDefaultVocabularyRegistry');
    expect(vocabulary).toContain('bg-[#070d1e]');
    expect(vocabulary).toContain('border-amber-500/30');
    expect(vocabulary).toContain('from-amber-500/10 via-[#8D26FF]/10');
    expect(vocabulary).toContain('Market Vocabulary Module');
    expect(vocabulary).toContain('Finanz- & Quant-Glossar');
  });

  it('adds searchable thesaurus terms and removes visible source/governance references', () => {
    const vocabulary = read('src/features/learning/ui/LearningVocabulary.tsx');

    expect(vocabulary).toContain('function thesaurusTerms');
    expect(vocabulary).toContain('...concept.aliases');
    expect(vocabulary).toContain('Thesaurus');
    expect(vocabulary).toContain('Definition und Thesaurus kopieren');
    expect(vocabulary).not.toContain('governanceReferences');
    expect(vocabulary).not.toContain('Governance-Referenzen');
    expect(vocabulary).not.toContain('Quelle:');
  });
});
