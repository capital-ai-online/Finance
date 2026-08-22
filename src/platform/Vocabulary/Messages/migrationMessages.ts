import type { UiMessageDefinition } from './UiMessage';

/**
 * First governed migration slice for existing hardcoded user-facing wording.
 * These entries intentionally mirror current production copy before consumers
 * are migrated, preventing semantic changes during the wording-control-plane cutover.
 */
export const migrationMessages: UiMessageDefinition[] = [
  {
    key: 'screening.title',
    text: { de: 'Multi-Asset Screening', en: 'Multi-asset screening' },
    conceptIds: ['VOC-ANALYTICS-0001'],
    context: 'react', status: 'approved', version: '1.0.0',
    authorityReferences: ['ESS-0017', 'SC-MD-SPT-0001'],
  },
  {
    key: 'screening.subtitle.contractSeparation',
    text: {
      de: 'Score, Evidence und Macro Context bleiben getrennte, versionierte Verträge.',
      en: 'Score, evidence and macro context remain separate versioned contracts.',
    },
    conceptIds: ['VOC-ANALYTICS-0105', 'VOC-ANALYTICS-0108'],
    context: 'react', status: 'approved', version: '1.0.0',
    authorityReferences: ['ESS-0017', 'SC-MD-SPT-0001'],
  },
  {
    key: 'screening.action.start',
    text: { de: 'Screening starten', en: 'Start screening' },
    conceptIds: ['VOC-PRODUCT-0101', 'VOC-ANALYTICS-0001'],
    context: 'react', status: 'approved', version: '1.0.0',
    authorityReferences: ['ESS-0017'],
  },
  {
    key: 'screening.action.loading',
    text: { de: 'Verifizierte Daten prüfen…', en: 'Checking verified data…' },
    conceptIds: ['VOC-ANALYTICS-0105'],
    context: 'react', status: 'approved', version: '1.0.0',
    authorityReferences: ['ESS-0017', 'SC-MD-SPT-0001'],
  },
  {
    key: 'screening.search.placeholder',
    text: { de: 'Asset, Symbol oder Währungspaar suchen…', en: 'Search asset, symbol or currency pair…' },
    conceptIds: ['VOC-ASSET-0101'],
    context: 'react', status: 'approved', version: '1.0.0',
    authorityReferences: ['ESS-0017'],
  },
];
