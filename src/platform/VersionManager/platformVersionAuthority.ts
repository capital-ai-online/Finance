import fs from 'node:fs';
import path from 'node:path';

interface PackageMetadata {
  version?: unknown;
}

export function getPlatformVersion(repoRoot: string = process.cwd()): string {
  const packagePath = path.join(repoRoot, 'package.json');
  const metadata = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as PackageMetadata;
  const version = metadata.version;

  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error('[VersionManager] package.json must declare the canonical MAJOR.MINOR.PATCH platform version.');
  }

  return version;
}
