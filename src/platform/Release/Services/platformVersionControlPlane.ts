import fs from 'node:fs';
import path from 'node:path';

export const PLATFORM_VERSION_AUTHORITY = 'package.json#version' as const;
export const PLATFORM_VERSION_CONTROL_PLANE_CONTRACT = 'platform-version-control-plane/1.0.0' as const;
export const RELEASE_MANIFEST_CONTRACT = 'capital-ai-runtime-release-manifest/1.0.0' as const;

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

interface PackageMetadata {
  version?: unknown;
}

interface RuntimeReleaseManifest {
  contract?: unknown;
  mutable?: unknown;
  version?: unknown;
  sourceCommit?: unknown;
  buildIdentity?: unknown;
  inputs?: {
    packageLockSha256?: unknown;
    documentaryTreeSha256?: unknown;
    documentaryFileCount?: unknown;
  };
}

export interface PlatformVersionProjection {
  version: string;
  authority: typeof PLATFORM_VERSION_AUTHORITY;
  contract: typeof PLATFORM_VERSION_CONTROL_PLANE_CONTRACT;
  readOnly: true;
  source: 'package-json' | 'immutable-build-manifest';
  buildNumber: null;
  releaseDate: null;
  gitTag: string | null;
  dockerTag: null;
  releaseNotes: string;
  history: [];
  commitSha: string | null;
  buildIdentity: string | null;
  manifestContract: string | null;
  packageLockSha256: string | null;
  documentaryTreeSha256: string | null;
  documentaryFileCount: number | null;
}

function requireSemver(value: unknown, authority: string): string {
  if (typeof value !== 'string' || !SEMVER.test(value)) {
    throw new Error(`[PlatformVersionControlPlane] ${authority} must declare strict MAJOR.MINOR.PATCH SemVer.`);
  }
  return value;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function getPlatformVersion(repoRoot: string = process.cwd()): string {
  const pkg = readJson<PackageMetadata>(path.join(repoRoot, 'package.json'));
  return requireSemver(pkg.version, PLATFORM_VERSION_AUTHORITY);
}

function readRuntimeManifest(repoRoot: string): RuntimeReleaseManifest | null {
  const manifestPath = path.join(repoRoot, 'dist', 'control-plane', 'release-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  return readJson<RuntimeReleaseManifest>(manifestPath);
}

export function readPlatformVersionProjection(repoRoot: string = process.cwd()): PlatformVersionProjection {
  const version = getPlatformVersion(repoRoot);
  const manifest = readRuntimeManifest(repoRoot);

  if (manifest) {
    if (manifest.contract !== RELEASE_MANIFEST_CONTRACT || manifest.mutable !== false) {
      throw new Error('[PlatformVersionControlPlane] Runtime release manifest violates the immutable release contract.');
    }
    const manifestVersion = requireSemver(manifest.version, 'runtime release manifest');
    if (manifestVersion !== version) {
      throw new Error(`[PlatformVersionControlPlane] Runtime manifest version ${manifestVersion} diverges from ${PLATFORM_VERSION_AUTHORITY} ${version}.`);
    }
    if (typeof manifest.buildIdentity !== 'string' || !manifest.buildIdentity.trim()) {
      throw new Error('[PlatformVersionControlPlane] Runtime release manifest buildIdentity is missing.');
    }
  }

  const commitSha = manifest && typeof manifest.sourceCommit === 'string'
    ? manifest.sourceCommit
    : process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || process.env.SOURCE_VERSION || null;

  return Object.freeze({
    version,
    authority: PLATFORM_VERSION_AUTHORITY,
    contract: PLATFORM_VERSION_CONTROL_PLANE_CONTRACT,
    readOnly: true as const,
    source: manifest ? 'immutable-build-manifest' as const : 'package-json' as const,
    buildNumber: null,
    releaseDate: null,
    gitTag: commitSha ? `git:${commitSha}` : null,
    dockerTag: null,
    releaseNotes: 'Read-only platform-version projection. Version changes occur only through the controlled Release Version Gate.',
    history: [] as [],
    commitSha,
    buildIdentity: manifest && typeof manifest.buildIdentity === 'string' ? manifest.buildIdentity : null,
    manifestContract: manifest && typeof manifest.contract === 'string' ? manifest.contract : null,
    packageLockSha256: manifest && typeof manifest.inputs?.packageLockSha256 === 'string' ? manifest.inputs.packageLockSha256 : null,
    documentaryTreeSha256: manifest && typeof manifest.inputs?.documentaryTreeSha256 === 'string' ? manifest.inputs.documentaryTreeSha256 : null,
    documentaryFileCount: manifest && typeof manifest.inputs?.documentaryFileCount === 'number' ? manifest.inputs.documentaryFileCount : null,
  });
}
