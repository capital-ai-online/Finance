import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

const vocabulary = read('src/features/learning/ui/LearningVocabulary.tsx');
const navigation = read('src/app/dashboard/DashboardNavigation.tsx');
const router = read('src/app/dashboard/DashboardViewRouter.tsx');
const profile = read('src/components/ProfilePage.tsx');
const ranking = read('src/features/screening/ui/RankingBoard.tsx');
const governanceFacade = read('src/features/governance/ui/index.ts');

describe('16.08 Universe presentation recovery', () => {
  it('keeps Vocabulary on the canonical registry while using the Market Vocabulary presentation', () => {
    expect(vocabulary).toContain('createDefaultVocabularyRegistry()');
    expect(vocabulary).toContain('Market Vocabulary Module');
    expect(vocabulary).toContain('Finanz- & Quant-Glossar');
    expect(vocabulary).toContain('Thesaurus');
    expect(vocabulary).not.toContain('Governance-Referenzen');
    expect(vocabulary).not.toContain('new Map<string, VocabularyConcept>');
  });

  it('restores differentiated asset-class navigation without creating financial authority', () => {
    expect(navigation).toContain("id: 'equities'");
    expect(navigation).toContain("id: 'index'");
    expect(navigation).toContain("id: 'forex'");
    expect(navigation).toContain("id: 'crypto'");
    expect(navigation).toContain("id: 'commodity'");
    expect(navigation).toContain("tone: 'text-asset-stock'");
    expect(navigation).toContain("tone: 'text-asset-index'");
    expect(navigation).toContain("tone: 'text-asset-forex'");
    expect(navigation).toContain("tone: 'text-asset-crypto'");
    expect(navigation).toContain("tone: 'text-asset-commodity'");
  });

  it('preserves pattern badges as evidence-backed direction plus text, not color-only semantics', () => {
    expect(ranking).toContain('function PatternBadge');
    expect(ranking).toContain("direction === 'BULLISH'");
    expect(ranking).toContain("direction === 'BEARISH'");
    expect(ranking).toContain("'BUY'");
    expect(ranking).toContain("'SELL'");
    expect(ranking).toContain("name === 'NO PATTERN'");
  });

  it('keeps Profile and Admin surfaces integrated through the current app facades', () => {
    expect(profile).toContain('export function ProfilePage');
    expect(router).toContain("case 'profil':");
    expect(router).toContain('<UserUI.ProfilePage');
    expect(governanceFacade).toContain('AdminPortal');
    expect(navigation).toContain('Admin-Portal');
    expect(navigation).toContain('isAdmin ?');
  });

  it('does not fabricate the Satoshi Universe Check before its FINTECH contract exists', () => {
    expect(navigation).toContain('Satoshi Universe Check · FINTECH-Handoff offen');
    expect(navigation).toContain('FINTECH-Feature-Contract erforderlich');
    expect(navigation).toContain('disabled');
    expect(navigation).not.toContain("navigateAsset('BTC', 'crypto', 'buffet-value')");
  });
});