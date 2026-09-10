import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const RUNTIME_ARTIFACT_ROOT = 'dist';
export const RUNTIME_ARTIFACT_ALGORITHM = 'sha256-subject-set-v1';
export const RUNTIME_ARTIFACT_EXCLUDED_PREFIXES = [
  'dist/control-plane/',
  'dist/security/',
] as const;

export interface RuntimeArtifactSubject {
  name: string;
  digest: { sha256: string };
}

export interface RuntimeArtifactIdentity {
  root: typeof RUNTIME_ARTIFACT_ROOT;
  algorithm: typeof RUNTIME_ARTIFACT_ALGORITHM;
  sha256: string;
  files: number;
  subjects: RuntimeArtifactSubject[];
}

function sha256(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function normalizeRepoPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function isExcluded(relativeRepoPath: string): boolean {
  return RUNTIME_ARTIFACT_EXCLUDED_PREFIXES.some(prefix => relativeRepoPath.startsWith(prefix));
}

export function computeRuntimeArtifactIdentity(repoRoot = process.cwd()): RuntimeArtifactIdentity {
  const distRoot = path.join(repoRoot, RUNTIME_ARTIFACT_ROOT);
  if (!fs.existsSync(distRoot) || !fs.statSync(distRoot).isDirectory()) {
    throw new Error(`Runtime-Build-Verzeichnis fehlt: ${RUNTIME_ARTIFACT_ROOT}/`);
  }

  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      const relativeRepoPath = normalizeRepoPath(path.relative(repoRoot, absolute));
      if (isExcluded(`${relativeRepoPath}${entry.isDirectory() ? '/' : ''}`)) continue;
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  };
  walk(distRoot);

  const subjects = files
    .map(filePath => ({
      name: normalizeRepoPath(path.relative(repoRoot, filePath)),
      digest: { sha256: sha256(fs.readFileSync(filePath)) },
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (subjects.length === 0) {
    throw new Error('Keine Runtime-Build-Artefakte unter dist/ gefunden; Digest-Bindung verweigert.');
  }

  return {
    root: RUNTIME_ARTIFACT_ROOT,
    algorithm: RUNTIME_ARTIFACT_ALGORITHM,
    sha256: sha256(JSON.stringify(subjects)),
    files: subjects.length,
    subjects,
  };
}
