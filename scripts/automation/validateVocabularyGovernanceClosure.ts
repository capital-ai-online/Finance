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
const mergedImplementationPullRequest = 477;
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

const lifecycleArtifacts = [
  'docs/architecture/VOCABULARY_WORDING_WIKI_ARCHITECTURE.md',
  'docs/governance/vocabulary/VOCABULARY_WORDING_WIKI_SUPERSESSION_2026-08-21.md',
  ...expectedPackages.map((workPackage) => {
    const suffixes: Record<string, string> = {
      'VW-0': 'VOCABULARY_WORDING_WIKI_SUPERSESSION', 'VW-1': 'UI_MESSAGE_CATALOG', 'VW-2': 'FINTECH_CONCEPT_BASELINE',
      'VW-3': 'WORDING_USAGE_INDEX', 'VW-4': 'DELIVERY_ADAPTERS', 'VW-5': 'DOCUMENTARY_KNOWLEDGE_TRACEABILITY_PROJECTION',
      'VW-6': 'GITHUB_WIKI_PROJECTION', 'VW-7': 'CONTROLLED_WORDING_MIGRATION', 'VW-8': 'CONTINUOUS_GOVERNANCE_RELEASE_CLOSURE',
    };
    return `docs/roadmaps/work-packages/${workPackage}_${suffixes[workPackage]}_2026-08-21.md`;
  }),
];

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

for (const relative of lifecycleArtifacts) {
  const artifact = fs.readFileSync(path.join(root, relative), 'utf8');
  if (/PENDING HUMAN MERGE|IMPLEMENTED ON BRANCH/.test(artifact)) throw new Error(`[VOCABULARY-CLOSURE] stale pre-merge lifecycle marker in ${relative}.`);
}

const historicalClaim = readJson<{ status?: string; releaseEvidence?: { pullRequest?: number; merged?: boolean } }>('.ai/work-claims/VW-0-VW8-VOCABULARY-WORDING-WIKI-2026-08-21.json');
if (historicalClaim.status !== 'released' || historicalClaim.releaseEvidence?.pullRequest !== mergedImplementationPullRequest || historicalClaim.releaseEvidence?.merged !== true) {
  throw new Error('[VOCABULARY-CLOSURE] merged VW-0…VW-8 claim must be released and bound to PR #477.');
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
