import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  createDefaultUiMessageCatalog,
  createDefaultVocabularyRegistry,
  createVocabularyWordingSnapshot,
  FINTECH_VALUE_CHAIN_STAGE_IDS,
  fintechWordingBindings,
  scanWordingUsages,
  validateFintechWordingBindings,
} from '../../src/platform/Vocabulary';
import { projectVocabularyWordingThroughDocumentary } from '../../src/platform/Documentary/Knowledge/VocabularyWordingDocumentaryProjection';

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
const snapshot = createVocabularyWordingSnapshot(sourceCommit, registry, messages, usages, fintechWordingBindings);
const projection = projectVocabularyWordingThroughDocumentary({
  snapshot,
  generatedAt: new Date().toISOString(),
  correlationId: `vocabulary-wording:${sourceCommit}`,
  causationId: `vocabulary-wording:${sourceCommit}`,
  repoRoot: root,
});

if (snapshot.stages.length !== FINTECH_VALUE_CHAIN_STAGE_IDS.length) {
  throw new Error('[VOCABULARY-WORDING] snapshot does not cover the complete FinTech value chain.');
}
if (
  snapshot.mutationAuthority !== false
  || snapshot.financialDecisionAuthority !== false
  || projection.mutationAuthority !== false
  || projection.financialDecisionAuthority !== false
) {
  throw new Error('[VOCABULARY-WORDING] projection authority boundary is invalid.');
}
if (projection.document.sourceCommit !== sourceCommit.toLowerCase()) {
  throw new Error('[VOCABULARY-WORDING] Documentary projection is not bound to the current commit.');
}
if (projection.knowledge.sourceCommit !== projection.document.sourceCommit) {
  throw new Error('[VOCABULARY-WORDING] Documentary Knowledge projection source commit drift detected.');
}
if (projection.traceability.documentFingerprint !== projection.document.fingerprint) {
  throw new Error('[VOCABULARY-WORDING] Documentary Traceability projection fingerprint drift detected.');
}

console.log('[VOCABULARY-WORDING] PASS');
console.log(`[VOCABULARY-WORDING] concepts=${registry.list().length}`);
console.log(`[VOCABULARY-WORDING] messages=${messages.list().length}`);
console.log(`[VOCABULARY-WORDING] stages=${fintechWordingBindings.length}`);
console.log(`[VOCABULARY-WORDING] usages=${usages.list().length}`);
console.log(`[VOCABULARY-WORDING] snapshotChecksum=${snapshot.checksum}`);
console.log(`[VOCABULARY-WORDING] documentaryFingerprint=${projection.document.fingerprint}`);
console.log(`[VOCABULARY-WORDING] knowledgeChecksum=${projection.knowledge.checksum}`);
