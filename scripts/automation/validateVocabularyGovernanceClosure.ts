import fs from 'node:fs';
import path from 'node:path';
import { createDefaultUiMessageCatalog } from '../../src/platform/Vocabulary';
import { inspectWordingMigrationPlan } from '../../src/platform/Vocabulary/Migration/WordingMigrationPlan';

const root = process.cwd();
const readJson = <T>(relative: string): T => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')) as T;

const manifest = readJson<{
  version?: string;
  implementation?: { completedWorkPackages?: string[] };
  valueChainIntegration?: { stageCoverage?: number; financialDecisionAuthority?: boolean; mutationAuthority?: boolean };
}>('src/platform/Vocabulary/manifest.json');

if (manifest.version !== '1.8.0') throw new Error(`[VOCABULARY-CLOSURE] manifest version must be 1.8.0, got ${String(manifest.version)}`);
const expectedPackages = ['VW-0', 'VW-1', 'VW-2', 'VW-3', 'VW-4', 'VW-5', 'VW-6', 'VW-7', 'VW-8'];
const completed = manifest.implementation?.completedWorkPackages ?? [];
for (const item of expectedPackages) if (!completed.includes(item)) throw new Error(`[VOCABULARY-CLOSURE] missing completed work package ${item}`);
if (manifest.valueChainIntegration?.stageCoverage !== 18) throw new Error('[VOCABULARY-CLOSURE] FinTech stage coverage must remain 18.');
if (manifest.valueChainIntegration?.financialDecisionAuthority !== false || manifest.valueChainIntegration?.mutationAuthority !== false) {
  throw new Error('[VOCABULARY-CLOSURE] non-authorizing value-chain boundary violated.');
}

const essRegistry = readJson<{ entries?: Array<{ id?: string; version?: string; relatedAdr?: string[]; implementationStatus?: string }> }>('.ai/registry/ess-registry.json');
for (const id of ['ESS-0017', 'ESS-0017-CONTRACTS']) {
  const entry = essRegistry.entries?.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`[VOCABULARY-CLOSURE] ${id} missing from ESS registry.`);
  if (entry.version !== '1.8.0') throw new Error(`[VOCABULARY-CLOSURE] ${id} registry version drift: ${String(entry.version)}`);
  if (!entry.relatedAdr?.includes('ADR-0078')) throw new Error(`[VOCABULARY-CLOSURE] ${id} must reference ADR-0078.`);
}

for (const relative of [
  'docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md',
  'docs/governance/vocabulary/VOCABULARY_WORDING_WIKI_SUPERSESSION_2026-08-21.md',
  'docs/roadmaps/work-packages/VW-6_GITHUB_WIKI_PROJECTION_2026-08-21.md',
  'docs/roadmaps/work-packages/VW-7_CONTROLLED_WORDING_MIGRATION_2026-08-21.md',
  'docs/roadmaps/work-packages/VW-8_CONTINUOUS_GOVERNANCE_RELEASE_CLOSURE_2026-08-21.md',
  'docs/security/VOCABULARY_WIKI_SYNC_THREAT_MODEL_2026-08-21.md',
]) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`[VOCABULARY-CLOSURE] required artifact missing: ${relative}`);
}

const migration = inspectWordingMigrationPlan(root, createDefaultUiMessageCatalog());
const drift = migration.filter((item) => item.state === 'DRIFT');
if (drift.length > 0) throw new Error(`[VOCABULARY-CLOSURE] wording migration drift: ${JSON.stringify(drift)}`);

const wikiSync = fs.readFileSync(path.join(root, 'scripts/automation/syncVocabularyWiki.ts'), 'utf8');
if (!wikiSync.includes("const apply = process.argv.includes('--apply')")) throw new Error('[VOCABULARY-CLOSURE] Wiki sync must remain explicit-apply gated.');
if (!wikiSync.includes("const push = process.argv.includes('--push')")) throw new Error('[VOCABULARY-CLOSURE] Wiki push must remain separately gated.');
if (!wikiSync.includes('isAllowedVocabularyWikiRemote')) throw new Error('[VOCABULARY-CLOSURE] Wiki sync must enforce the canonical remote allowlist.');

console.log('[VOCABULARY-CLOSURE] PASS');
console.log(`[VOCABULARY-CLOSURE] packages=${expectedPackages.length}`);
console.log(`[VOCABULARY-CLOSURE] migrationOpen=${migration.filter((item) => item.state === 'OPEN').length}`);
console.log(`[VOCABULARY-CLOSURE] migrationMigrated=${migration.filter((item) => item.state === 'MIGRATED').length}`);
