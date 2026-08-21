import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  createDefaultUiMessageCatalog,
  createDefaultVocabularyRegistry,
  FINTECH_VALUE_CHAIN_STAGE_IDS,
  fintechWordingBindings,
  projectVocabularyGovernance,
  scanWordingUsages,
  validateFintechWordingBindings,
} from '../../src/platform/Vocabulary';

const root = process.cwd();
const registry = createDefaultVocabularyRegistry();
const messages = createDefaultUiMessageCatalog(registry);
const bindingFindings = validateFintechWordingBindings(registry, messages, fintechWordingBindings);

if (bindingFindings.length > 0) {
  throw new Error(`[VOCABULARY-WORDING] invalid FinTech bindings: ${JSON.stringify(bindingFindings)}`);
}

const qualityProjectionPath = path.join(root, 'src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts');
const qualityProjectionSource = fs.readFileSync(qualityProjectionPath, 'utf8');
for (const stageId of FINTECH_VALUE_CHAIN_STAGE_IDS) {
  if (!qualityProjectionSource.includes(`id: '${stageId}'`)) {
    throw new Error(`[VOCABULARY-WORDING] SC-MD-SPT stage drift detected; missing in Quality projection: ${stageId}`);
  }
}

const usages = scanWordingUsages(root, messages, fintechWordingBindings);
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const projection = projectVocabularyGovernance(sourceCommit, registry, messages, usages, fintechWordingBindings);

if (projection.documentary.fintechStageIds.length !== FINTECH_VALUE_CHAIN_STAGE_IDS.length) {
  throw new Error('[VOCABULARY-WORDING] projection does not cover the complete FinTech value chain.');
}
if (projection.mutationAuthority !== false || projection.financialDecisionAuthority !== false) {
  throw new Error('[VOCABULARY-WORDING] projection authority boundary is invalid.');
}

console.log('[VOCABULARY-WORDING] PASS');
console.log(`[VOCABULARY-WORDING] concepts=${registry.list().length}`);
console.log(`[VOCABULARY-WORDING] messages=${messages.list().length}`);
console.log(`[VOCABULARY-WORDING] stages=${fintechWordingBindings.length}`);
console.log(`[VOCABULARY-WORDING] usages=${usages.list().length}`);
console.log(`[VOCABULARY-WORDING] checksum=${projection.checksum}`);
