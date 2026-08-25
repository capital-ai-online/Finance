import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function source(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Learning Vocabulary website integration', () => {
  it('projects the canonical browser-safe Vocabulary registry instead of defining a second vocabulary source', () => {
    const learning = source('src/features/learning/ui/LearningVocabulary.tsx');

    expect(learning).toContain('createDefaultVocabularyRegistry');
    expect(learning).toContain("from '../../../platform/Vocabulary'");
    expect(learning).toContain("concept.status === 'approved'");
    expect(learning).toContain('Read-only Lernprojektion.');

    expect(learning).not.toContain("platform/Vocabulary/node");
    expect(learning).not.toContain('node:crypto');
    expect(learning).not.toContain('VOC-BILLING-0001');
    expect(learning).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it('validates category input fail-closed and de-duplicates governance references', () => {
    const learning = source('src/features/learning/ui/LearningVocabulary.tsx');

    expect(learning).toContain('function isVocabularyCategory(value: string): value is VocabularyCategory');
    expect(learning).toContain('Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value)');
    expect(learning).toContain('return isVocabularyCategory(value) ? value : ALL_CATEGORIES;');
    expect(learning).toContain('setCategory(parseCategoryFilter(event.target.value))');
    expect(learning).not.toContain('event.target.value as CategoryFilter');
    expect(learning).toContain('function governanceReferences(concept: VocabularyConcept): string[]');
    expect(learning).toContain('return Array.from(new Set([');
  });

  it('wires Learning into Hauptzentrale, breadcrumb and active view rendering', () => {
    const dashboard = source('src/components/Dashboard.tsx');

    expect(dashboard).toContain("import { LearningVocabulary } from '../features/learning/ui';");
    expect(dashboard).toContain("'dashboard' | 'myworkspace' | 'learning'");
    expect(dashboard).toContain("['dashboard', 'myworkspace', 'learning', 'universe-scoring'");
    expect(dashboard).toContain('title="Learning"');
    expect(dashboard).toContain("navigateTo('learning')");
    expect(dashboard).toContain("activeView === 'learning' && 'Learning · CAPITAL-AI Vocabulary'");
    expect(dashboard).toContain("activeView === 'learning' && (");
    expect(dashboard).toContain('<LearningVocabulary />');
  });

  it('keeps the frontend on the browser-safe Vocabulary entry point', () => {
    const publicIndex = source('src/platform/Vocabulary/index.ts');
    const learning = source('src/features/learning/ui/LearningVocabulary.tsx');

    expect(publicIndex).toContain('createDefaultVocabularyRegistry');
    expect(learning).not.toContain("from '../../../platform/Vocabulary/Projection");
    expect(learning).not.toContain("from '../../../platform/Vocabulary/Usage");
    expect(learning).not.toContain("from '../../../platform/Vocabulary/Wiki");
  });
});
