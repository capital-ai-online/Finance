import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createDefaultUiMessageCatalog, createDefaultVocabularyRegistry } from '../../src/platform/Vocabulary';
import { fintechWordingBindings } from '../../src/platform/Vocabulary/ValueChain/fintechWordingBindings';
import { renderVocabularyWikiProjection } from '../../src/platform/Vocabulary/Wiki/VocabularyWikiProjection';
import { isAllowedVocabularyWikiRemote } from '../../src/platform/Vocabulary/Wiki/VocabularyWikiRemotePolicy';

function argValue(name: string): string | undefined {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

const repoRoot = process.cwd();
const apply = process.argv.includes('--apply');
const push = process.argv.includes('--push');
const wikiDirArg = argValue('--wiki-dir');
const sourceCommit = (argValue('--source-commit') ?? git(repoRoot, ['rev-parse', 'HEAD'])).trim().toLowerCase();

if (!wikiDirArg) throw new Error('[VOCABULARY-WIKI-SYNC] --wiki-dir=<path> is required.');
const wikiDir = path.resolve(repoRoot, wikiDirArg);
if (!fs.existsSync(path.join(wikiDir, '.git'))) throw new Error('[VOCABULARY-WIKI-SYNC] wiki-dir must be an existing Git checkout.');

const remote = git(wikiDir, ['remote', 'get-url', 'origin']);
if (!isAllowedVocabularyWikiRemote(remote)) {
  throw new Error('[VOCABULARY-WIKI-SYNC] origin is not an exact allowlisted CAPITAL-AI Finance Wiki GitHub remote.');
}
if (git(wikiDir, ['status', '--porcelain'])) throw new Error('[VOCABULARY-WIKI-SYNC] Wiki checkout must be clean before sync.');
if (push && !apply) throw new Error('[VOCABULARY-WIKI-SYNC] --push requires --apply.');

const registry = createDefaultVocabularyRegistry();
const messages = createDefaultUiMessageCatalog(registry);
const projection = renderVocabularyWikiProjection(sourceCommit, registry, messages, fintechWordingBindings);
const managedFiles = projection.pages.map((item) => item.filename);

console.log(`[VOCABULARY-WIKI-SYNC] sourceCommit=${projection.sourceCommit}`);
console.log('[VOCABULARY-WIKI-SYNC] wikiOrigin=allowlisted-github-finance-wiki');
console.log(`[VOCABULARY-WIKI-SYNC] managedPages=${managedFiles.join(',')}`);
console.log(`[VOCABULARY-WIKI-SYNC] checksum=${projection.checksum}`);

if (!apply) {
  console.log('[VOCABULARY-WIKI-SYNC] DRY-RUN PASS; no Wiki files were changed.');
  process.exit(0);
}

for (const item of projection.pages) fs.writeFileSync(path.join(wikiDir, item.filename), item.content, 'utf8');
const manifestName = '.capital-ai-vocabulary-wiki-manifest.json';
fs.writeFileSync(path.join(wikiDir, manifestName), `${JSON.stringify({
  schemaVersion: projection.schemaVersion,
  sourceCommit: projection.sourceCommit,
  checksum: projection.checksum,
  managedPages: projection.pages.map(({ filename, checksum }) => ({ filename, checksum })),
  repositoryAuthoritative: false,
  mutationAuthority: false,
}, null, 2)}\n`, 'utf8');

git(wikiDir, ['add', '--', ...managedFiles, manifestName]);
const staged = git(wikiDir, ['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
const unauthorized = staged.filter((name) => !managedFiles.includes(name) && name !== manifestName);
if (unauthorized.length > 0) throw new Error(`[VOCABULARY-WIKI-SYNC] unexpected staged files: ${unauthorized.join(', ')}`);

if (staged.length === 0) {
  console.log('[VOCABULARY-WIKI-SYNC] APPLY PASS; Wiki already matches projection.');
  process.exit(0);
}

git(wikiDir, ['commit', '-m', `docs(vocabulary): sync generated Wiki from ${sourceCommit.slice(0, 12)}`]);
if (push) {
  git(wikiDir, ['push', 'origin', 'HEAD']);
  console.log('[VOCABULARY-WIKI-SYNC] PUSH PASS.');
} else {
  console.log('[VOCABULARY-WIKI-SYNC] APPLY PASS; commit created locally, push not requested.');
}
