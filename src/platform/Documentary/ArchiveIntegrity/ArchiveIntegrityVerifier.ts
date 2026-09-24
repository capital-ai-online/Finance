import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

export const ARCHIVE_INTEGRITY_CONTRACT_VERSION = 'documentary-archive-integrity/1.1.0' as const;
export const DEFAULT_ARCHIVE_INTEGRITY_INDEX = 'docs/archive/ARCHIVE_INTEGRITY_INDEX.json';

interface ArchiveIndexEntry {
  path: string;
  blobSha: string;
  size: number;
}

interface ArchiveIntegrityIndex {
  schemaVersion: '1.0.0';
  contractVersion: typeof ARCHIVE_INTEGRITY_CONTRACT_VERSION;
  baselineCommit: string;
  indexPath: string;
  excludedPaths: string[];
  entries: ArchiveIndexEntry[];
  manifests: Array<{
    manifestPath: string;
    policy: 'BYTE_PRESERVED_SOURCE_BOUND' | 'DEACTIVATED_NON_AUTHORIZING';
  }>;
}

export interface ArchiveIntegrityReport {
  contractVersion: typeof ARCHIVE_INTEGRITY_CONTRACT_VERSION;
  baselineCommit: string;
  archiveEntryCount: number;
  manifestCount: number;
  state: 'VERIFIED';
  historicalSourceVerification: 'VERIFIED' | 'SKIPPED';
}

function fail(message: string): never {
  throw new Error('[archive-integrity] ' + message);
}

function git(root: string, args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    fail('git ' + args.join(' ') + ' failed: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function safePath(root: string, relativePath: string) {
  const normalized = String(relativePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || path.isAbsolute(normalized) || normalized.split('/').includes('..')) {
    fail('unsafe repository path: ' + String(relativePath));
  }
  const absolute = path.resolve(root, normalized);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) fail('path escapes repository: ' + normalized);
  return { normalized, absolute };
}

function parseJson<T>(absolutePath: string, label: string): T {
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
  } catch (error) {
    fail(label + ' is not valid JSON: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export function gitBlobSha(bytes: Buffer): string {
  const header = Buffer.from('blob ' + String(bytes.length) + '\0', 'utf8');
  return crypto.createHash('sha1').update(header).update(bytes).digest('hex');
}

function readWorkingBlob(root: string, relativePath: string): { sha: string; size: number } {
  const resolved = safePath(root, relativePath);
  if (!fs.existsSync(resolved.absolute)) fail('missing archive file: ' + resolved.normalized);
  const stat = fs.lstatSync(resolved.absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail('archive path must be a regular non-symlink file: ' + resolved.normalized);
  const bytes = fs.readFileSync(resolved.absolute);
  return { sha: gitBlobSha(bytes), size: bytes.length };
}

function parseHeadArchiveTree(root: string, excluded: Set<string>): Map<string, ArchiveIndexEntry> {
  const output = git(root, ['ls-tree', '-r', '--long', 'HEAD', '--', 'docs/archive']);
  const result = new Map<string, ArchiveIndexEntry>();
  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const match = /^(\d+)\s+(blob)\s+([0-9a-f]{40})\s+(\d+|-)\t(.+)$/.exec(line);
    if (!match) fail('unparseable archive tree row: ' + line);
    const filePath = match[5];
    if (excluded.has(filePath)) continue;
    const size = match[4] === '-' ? readWorkingBlob(root, filePath).size : Number(match[4]);
    result.set(filePath, { path: filePath, blobSha: match[3], size });
  }
  return result;
}

function historicalBlob(root: string, commit: string, sourcePath: string): string {
  if (!/^[0-9a-f]{40}$/i.test(commit)) fail('historical sourceCommit is invalid: ' + commit);
  const normalized = safePath(root, sourcePath).normalized;
  const output = git(root, ['ls-tree', commit, '--', normalized]);
  const match = /^\d+\s+blob\s+([0-9a-f]{40})\t/.exec(output);
  if (!match) fail('historical source path is missing or not a blob: ' + commit + ':' + normalized);
  return match[1].toLowerCase();
}

function verifyBytePreservedManifest(root: string, manifestPath: string, verifyHistoricalSources: boolean) {
  const absolute = safePath(root, manifestPath).absolute;
  const manifest = parseJson<any>(absolute, manifestPath);
  const sourceCommit = String(manifest.sourceCommit || '').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) fail(manifestPath + ' sourceCommit must be a full SHA.');
  if (manifest.contentPolicy !== 'BYTE_PRESERVED') fail(manifestPath + ' must declare BYTE_PRESERVED.');
  if (!Array.isArray(manifest.entries)) fail(manifestPath + ' entries must be an array.');
  if (Number(manifest.artifactCount) !== manifest.entries.length) fail(manifestPath + ' artifactCount mismatch.');

  for (const entry of manifest.entries) {
    const archivePath = String(entry?.archivePath || '');
    const sourcePath = String(entry?.sourcePath || '');
    const sourceBlobSha = String(entry?.sourceBlobSha || '').toLowerCase();
    const archiveBlobSha = String(entry?.archiveBlobSha || '').toLowerCase();
    if (!archivePath.startsWith('docs/archive/')) fail(manifestPath + ' archive target must stay under docs/archive: ' + archivePath);
    if (!sourcePath.startsWith('docs/')) fail(manifestPath + ' source path must be repository documentation: ' + sourcePath);
    if (!/^[0-9a-f]{40}$/.test(sourceBlobSha) || !/^[0-9a-f]{40}$/.test(archiveBlobSha)) {
      fail(manifestPath + ' entry blob SHA is invalid: ' + archivePath);
    }
    if (entry?.contentPreserved !== true) fail(manifestPath + ' contentPreserved must be true: ' + archivePath);
    if (sourceBlobSha !== archiveBlobSha) fail(manifestPath + ' source/archive blob mismatch: ' + archivePath);
    const current = readWorkingBlob(root, archivePath);
    if (current.sha !== archiveBlobSha) {
      fail('archive content compromised or changed: ' + archivePath + ' expected=' + archiveBlobSha + ' current=' + current.sha);
    }
    if (verifyHistoricalSources) {
      const historical = historicalBlob(root, sourceCommit, sourcePath);
      if (historical !== sourceBlobSha) {
        fail('historical source provenance mismatch: ' + sourceCommit + ':' + sourcePath + ' expected=' + sourceBlobSha + ' actual=' + historical);
      }
    }
  }
}

function verifyDeactivatedManifest(root: string, manifestPath: string) {
  const manifest = parseJson<any>(safePath(root, manifestPath).absolute, manifestPath);
  if (manifest.status !== 'archived' || manifest.authorizing !== false || manifest.deactivated !== true) {
    fail(manifestPath + ' must remain archived, non-authorizing and deactivated.');
  }
  if (!Array.isArray(manifest.workClaims)) fail(manifestPath + ' workClaims must be an array.');
  for (const claim of manifest.workClaims) {
    if (claim?.lifecycle !== 'archived' || claim?.activeWriter !== false) {
      fail(manifestPath + ' contains a non-terminal archived work claim projection: ' + String(claim?.path || '<unknown>'));
    }
  }
}

export function verifyArchiveIntegrityIndex(
  repoRoot: string = process.cwd(),
  options: { indexPath?: string; verifyHistoricalSources?: boolean } = {},
): ArchiveIntegrityReport {
  const root = path.resolve(repoRoot);
  const indexPath = options.indexPath ?? DEFAULT_ARCHIVE_INTEGRITY_INDEX;
  const verifyHistoricalSources = options.verifyHistoricalSources ?? true;
  const indexLocation = safePath(root, indexPath);
  if (!fs.existsSync(indexLocation.absolute)) fail('archive integrity index is missing: ' + indexPath);
  const index = parseJson<ArchiveIntegrityIndex>(indexLocation.absolute, indexPath);

  if (index.schemaVersion !== '1.0.0') fail('unsupported index schemaVersion.');
  if (index.contractVersion !== ARCHIVE_INTEGRITY_CONTRACT_VERSION) fail('archive integrity contract version mismatch.');
  if (!/^[0-9a-f]{40}$/i.test(String(index.baselineCommit || ''))) fail('baselineCommit must be a full SHA.');
  if (index.indexPath !== indexPath) fail('indexPath self-binding mismatch.');
  if (!Array.isArray(index.excludedPaths) || index.excludedPaths.length !== 1 || index.excludedPaths[0] !== indexPath) {
    fail('only the self index may be excluded from archive coverage.');
  }
  if (!Array.isArray(index.entries) || index.entries.length === 0) fail('archive entries must be non-empty.');

  const excluded = new Set(index.excludedPaths);
  const expected = new Map<string, ArchiveIndexEntry>();
  for (const entry of index.entries) {
    const normalized = safePath(root, entry.path).normalized;
    if (!normalized.startsWith('docs/archive/')) fail('indexed path must stay under docs/archive: ' + normalized);
    if (excluded.has(normalized)) fail('self index must not appear in archive entries.');
    if (!/^[0-9a-f]{40}$/i.test(String(entry.blobSha || ''))) fail('invalid indexed Git blob SHA: ' + normalized);
    if (!Number.isInteger(entry.size) || entry.size < 0) fail('invalid indexed size: ' + normalized);
    if (expected.has(normalized)) fail('duplicate indexed archive path: ' + normalized);
    expected.set(normalized, { path: normalized, blobSha: entry.blobSha.toLowerCase(), size: entry.size });
  }

  const actual = parseHeadArchiveTree(root, excluded);
  const expectedPaths = [...expected.keys()].sort();
  const actualPaths = [...actual.keys()].sort();
  if (JSON.stringify(expectedPaths) !== JSON.stringify(actualPaths)) {
    const missing = expectedPaths.filter((value) => !actual.has(value));
    const unexpected = actualPaths.filter((value) => !expected.has(value));
    fail('archive file-set drift; missing=[' + missing.join(', ') + '] unexpected=[' + unexpected.join(', ') + '].');
  }

  for (const [filePath, expectedEntry] of expected) {
    const treeEntry = actual.get(filePath)!;
    if (treeEntry.blobSha !== expectedEntry.blobSha || treeEntry.size !== expectedEntry.size) {
      fail('archive Git-tree mismatch: ' + filePath);
    }
    const working = readWorkingBlob(root, filePath);
    if (working.sha !== expectedEntry.blobSha || working.size !== expectedEntry.size) {
      fail('archive working-tree tamper detected: ' + filePath);
    }
  }

  if (!Array.isArray(index.manifests) || index.manifests.length === 0) fail('manifest policy list must be non-empty.');
  for (const item of index.manifests) {
    if (!expected.has(item.manifestPath)) fail('registered archive manifest is not covered by archive index: ' + item.manifestPath);
    if (item.policy === 'BYTE_PRESERVED_SOURCE_BOUND') {
      verifyBytePreservedManifest(root, item.manifestPath, verifyHistoricalSources);
    } else if (item.policy === 'DEACTIVATED_NON_AUTHORIZING') {
      verifyDeactivatedManifest(root, item.manifestPath);
    } else {
      fail('unsupported archive manifest policy: ' + String((item as any)?.policy));
    }
  }

  return Object.freeze({
    contractVersion: ARCHIVE_INTEGRITY_CONTRACT_VERSION,
    baselineCommit: index.baselineCommit,
    archiveEntryCount: expected.size,
    manifestCount: index.manifests.length,
    state: 'VERIFIED' as const,
    historicalSourceVerification: verifyHistoricalSources ? 'VERIFIED' as const : 'SKIPPED' as const,
  });
}
