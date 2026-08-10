import fs from 'node:fs';
import path from 'node:path';

export const DOCUMENTARY_DOCUMENT_SCHEMA_VERSION = '1.0.0';

export interface DocumentaryVersionContext {
  componentVersion: string;
  documentSchemaVersion: string;
  platformVersion: string;
}

interface VersionedMetadata {
  version?: unknown;
}

function readJson<T>(absolutePath: string): T {
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function requireSemver(value: unknown, authority: string): string {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    throw new Error(`[DocumentaryVersion] ${authority} must declare a strict MAJOR.MINOR.PATCH version.`);
  }
  return value;
}

export function resolveDocumentaryVersionContext(repoRoot: string = process.cwd()): DocumentaryVersionContext {
  const manifest = readJson<VersionedMetadata>(path.join(repoRoot, 'src/platform/Documentary/manifest.json'));
  const packageMetadata = readJson<VersionedMetadata>(path.join(repoRoot, 'package.json'));

  return Object.freeze({
    componentVersion: requireSemver(manifest.version, 'Documentary manifest'),
    documentSchemaVersion: requireSemver(DOCUMENTARY_DOCUMENT_SCHEMA_VERSION, 'Document schema contract'),
    platformVersion: requireSemver(packageMetadata.version, 'package.json platform authority'),
  });
}
