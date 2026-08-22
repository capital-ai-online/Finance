import { createDefaultUiMessageCatalog } from '../../src/platform/Vocabulary';
import { inspectWordingMigrationPlan } from '../../src/platform/Vocabulary/Migration/WordingMigrationPlan';

const findings = inspectWordingMigrationPlan(process.cwd(), createDefaultUiMessageCatalog());
const drift = findings.filter((item) => item.state === 'DRIFT');
const open = findings.filter((item) => item.state === 'OPEN');
const migrated = findings.filter((item) => item.state === 'MIGRATED');

if (drift.length > 0) {
  throw new Error(`[VOCABULARY-MIGRATION] DRIFT: ${JSON.stringify(drift, null, 2)}`);
}

console.log('[VOCABULARY-MIGRATION] PASS');
console.log(`[VOCABULARY-MIGRATION] migrated=${migrated.length}`);
console.log(`[VOCABULARY-MIGRATION] open=${open.length}`);
for (const item of open) console.log(`[VOCABULARY-MIGRATION] OPEN ${item.id} -> ${item.messageKey} @ ${item.sourcePath}`);
