import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createDefaultUiMessageCatalog, createDefaultVocabularyRegistry } from '../../src/platform/Vocabulary';
import { fintechWordingBindings } from '../../src/platform/Vocabulary/ValueChain/fintechWordingBindings';
import { renderVocabularyWikiProjection } from '../../src/platform/Vocabulary/Wiki/VocabularyWikiProjection';

function argValue(name: string): string | undefined {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

const root = process.cwd();
const checkOnly = process.argv.includes('--check') || !process.argv.includes('--write');
const outputDir = path.resolve(root, argValue('--output') ?? '.generated/vocabulary-wiki');
const sourceCommit = (argValue('--source-commit') ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })).trim();
const registry = createDefaultVocabularyRegistry();
const messages = createDefaultUiMessageCatalog(registry);
const first = renderVocabularyWikiProjection(sourceCommit, registry, messages, fintechWordingBindings);
const second = renderVocabularyWikiProjection(sourceCommit, registry, messages, fintechWordingBindings);

if (first.checksum !== second.checksum) throw new Error('[VOCABULARY-WIKI] non-deterministic projection checksum.');
if (JSON.stringify(first.pages) !== JSON.stringify(second.pages)) throw new Error('[VOCABULARY-WIKI] non-deterministic page output.');
if (first.repositoryAuthoritative !== false || first.mutationAuthority !== false) {
  throw new Error('[VOCABULARY-WIKI] authority boundary invalid.');
}
if (new Set(first.pages.map((item) => item.filename)).size !== first.pages.length) {
  throw new Error('[VOCABULARY-WIKI] duplicate managed filename.');
}
for (const item of first.pages) {
  if (!item.content.includes(sourceCommit.toLowerCase())) throw new Error(`[VOCABULARY-WIKI] ${item.filename} is not source-commit bound.`);
}

if (!checkOnly) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  for (const item of first.pages) fs.writeFileSync(path.join(outputDir, item.filename), item.content, 'utf8');
  fs.writeFileSync(path.join(outputDir, '.capital-ai-vocabulary-wiki-manifest.json'), `${JSON.stringify({
    schemaVersion: first.schemaVersion,
    sourceCommit: first.sourceCommit,
    checksum: first.checksum,
    managedPages: first.pages.map(({ filename, checksum }) => ({ filename, checksum })),
    repositoryAuthoritative: false,
    mutationAuthority: false,
  }, null, 2)}\n`, 'utf8');
}

console.log(`[VOCABULARY-WIKI] ${checkOnly ? 'CHECK' : 'WRITE'} PASS`);
console.log(`[VOCABULARY-WIKI] sourceCommit=${first.sourceCommit}`);
console.log(`[VOCABULARY-WIKI] pages=${first.pages.length}`);
console.log(`[VOCABULARY-WIKI] checksum=${first.checksum}`);
