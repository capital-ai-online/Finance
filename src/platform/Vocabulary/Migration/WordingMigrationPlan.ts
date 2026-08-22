import fs from 'node:fs';
import path from 'node:path';
import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';

export type WordingMigrationState = 'MIGRATED' | 'OPEN' | 'DRIFT';

export interface WordingMigrationCandidate {
  id: string;
  sourcePath: string;
  literal: string;
  messageKey: string;
  surface: 'react';
  automaticApplyAllowed: false;
}

export interface WordingMigrationFinding extends WordingMigrationCandidate {
  state: WordingMigrationState;
  reason: string;
}

export const wordingMigrationPlan: readonly WordingMigrationCandidate[] = Object.freeze([
  Object.freeze({
    id: 'VW7-MARKET-SCREENER-TITLE',
    sourcePath: 'src/components/MarketScreener.tsx',
    literal: 'Multi-Asset Screening',
    messageKey: 'screening.title',
    surface: 'react',
    automaticApplyAllowed: false,
  }),
  Object.freeze({
    id: 'VW7-MARKET-SCREENER-SUBTITLE',
    sourcePath: 'src/components/MarketScreener.tsx',
    literal: 'Score, Evidence und Macro Context bleiben getrennte, versionierte Verträge.',
    messageKey: 'screening.subtitle.contractSeparation',
    surface: 'react',
    automaticApplyAllowed: false,
  }),
  Object.freeze({
    id: 'VW7-MARKET-SCREENER-START',
    sourcePath: 'src/components/MarketScreener.tsx',
    literal: 'Screening starten',
    messageKey: 'screening.action.start',
    surface: 'react',
    automaticApplyAllowed: false,
  }),
  Object.freeze({
    id: 'VW7-MARKET-SCREENER-LOADING',
    sourcePath: 'src/components/MarketScreener.tsx',
    literal: 'Verifizierte Daten prüfen…',
    messageKey: 'screening.action.loading',
    surface: 'react',
    automaticApplyAllowed: false,
  }),
  Object.freeze({
    id: 'VW7-MARKET-SCREENER-SEARCH',
    sourcePath: 'src/components/MarketScreener.tsx',
    literal: 'Asset, Symbol oder Währungspaar suchen…',
    messageKey: 'screening.search.placeholder',
    surface: 'react',
    automaticApplyAllowed: false,
  }),
]);

export function inspectWordingMigrationPlan(
  repoRoot: string,
  catalog: UiMessageCatalog,
  plan: readonly WordingMigrationCandidate[] = wordingMigrationPlan,
): WordingMigrationFinding[] {
  const seenIds = new Set<string>();
  const seenPairs = new Set<string>();
  return plan.map((candidate) => {
    if (seenIds.has(candidate.id)) throw new Error(`Duplicate wording migration id: ${candidate.id}`);
    seenIds.add(candidate.id);
    const pair = `${candidate.sourcePath}|${candidate.literal}`;
    if (seenPairs.has(pair)) throw new Error(`Duplicate wording migration source literal: ${pair}`);
    seenPairs.add(pair);

    const message = catalog.get(candidate.messageKey);
    if (!message) return { ...candidate, state: 'DRIFT', reason: 'Message key is not registered in the canonical catalog.' };
    if (!Object.values(message.text).includes(candidate.literal)) {
      return { ...candidate, state: 'DRIFT', reason: 'Migration literal no longer matches either governed locale text.' };
    }
    const absolute = path.join(repoRoot, candidate.sourcePath);
    if (!fs.existsSync(absolute)) return { ...candidate, state: 'DRIFT', reason: 'Source path does not exist.' };
    const source = fs.readFileSync(absolute, 'utf8');
    const hasLiteral = source.includes(candidate.literal);
    const hasKey = source.includes(candidate.messageKey);
    if (hasKey && !hasLiteral) return { ...candidate, state: 'MIGRATED', reason: 'Source references the stable message key and no longer embeds the governed literal.' };
    if (hasLiteral && !hasKey) return { ...candidate, state: 'OPEN', reason: 'Governed hardcoded literal remains and is queued for controlled component migration.' };
    return { ...candidate, state: 'DRIFT', reason: hasLiteral ? 'Source contains both literal and message key.' : 'Neither governed literal nor message key is present.' };
  });
}
