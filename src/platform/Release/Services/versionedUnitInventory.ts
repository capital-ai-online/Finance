import fs from 'node:fs';
import path from 'node:path';
import { getPlatformVersion, PLATFORM_VERSION_AUTHORITY } from './platformVersionControlPlane';

export const VERSIONED_UNIT_INVENTORY_CONTRACT = 'versioned-unit-inventory/1.0.0' as const;

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const GIT_SHA = /^[0-9a-f]{40}$/;
const CANONICAL_PROJECT = /\bCAPITAL-AI-(CLIENT|OPS|DOC|GOV|DATA|FINTECH|QM|SEC|COMP|FE|SEO|SOCIAL)\b/;
const PVC = /\bPVC-\d{2}\b/g;

export type VersionedUnitKind =
  | 'platform'
  | 'platform-component'
  | 'frontend-feature'
  | 'application-module'
  | 'backend-service';

export type VersionAuthorityMode = 'platform' | 'component' | 'inherited-platform';

export interface VersionedUnit {
  unitId: string;
  name: string;
  kind: VersionedUnitKind;
  sourcePath: string;
  version: string;
  versionAuthority: string;
  versionAuthorityMode: VersionAuthorityMode;
  sourceCommit: string;
  manifestPath: string | null;
  ownerProject: string | null;
  primaryPVC: string[];
  ownershipResolution: 'resolved' | 'unresolved';
  documentationRefs: string[];
  dependencies: string[];
}

export interface VersionedUnitInventory {
  contract: typeof VERSIONED_UNIT_INVENTORY_CONTRACT;
  platformVersion: string;
  platformVersionAuthority: typeof PLATFORM_VERSION_AUTHORITY;
  sourceCommit: string;
  readOnly: true;
  mutationPerformed: false;
  units: VersionedUnit[];
  coverage: {
    totalUnits: number;
    versionAuthorityResolvedUnits: number;
    componentAuthorityUnits: number;
    inheritedPlatformUnits: number;
    ownershipResolvedUnits: number;
    ownershipUnresolvedUnits: number;
  };
}

interface ComponentManifest {
  name?: unknown;
  version?: unknown;
  owner?: unknown;
  documentation?: unknown;
  dependencies?: unknown;
}

function normalizeSlashes(value: string): string {
  return value.replaceAll('\\', '/');
}

function requireSemver(value: unknown, authority: string): string {
  if (typeof value !== 'string' || !SEMVER.test(value)) {
    throw new Error(`[VersionedUnitInventory] ${authority} must declare strict MAJOR.MINOR.PATCH SemVer.`);
  }
  return value;
}

function requireSourceCommit(sourceCommit: string): string {
  if (!GIT_SHA.test(sourceCommit)) {
    throw new Error('[VersionedUnitInventory] sourceCommit must be a 40-character lowercase Git SHA.');
  }
  return sourceCommit;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function listDirectories(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim()))]
    .sort((a, b) => a.localeCompare(b));
}

function resolveOwner(owner: unknown): { ownerProject: string | null; primaryPVC: string[] } {
  if (typeof owner !== 'string') return { ownerProject: null, primaryPVC: [] };
  const project = owner.match(CANONICAL_PROJECT)?.[0] ?? null;
  const explicitPvc = [...new Set(owner.match(PVC) ?? [])].sort((a, b) => a.localeCompare(b));
  if (explicitPvc.length > 0) return { ownerProject: project, primaryPVC: explicitPvc };

  const defaults: Record<string, string[]> = {
    'CAPITAL-AI-CLIENT': ['PVC-01'],
    'CAPITAL-AI-DOC': ['PVC-03'],
    'CAPITAL-AI-GOV': ['PVC-05'],
    'CAPITAL-AI-DATA': ['PVC-09', 'PVC-10', 'PVC-11'],
    'CAPITAL-AI-FINTECH': ['PVC-12', 'PVC-13', 'PVC-14', 'PVC-15', 'PVC-16', 'PVC-17'],
  };
  return { ownerProject: project, primaryPVC: project ? (defaults[project] ?? []) : [] };
}

function stableSlug(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
}

function inheritedUnit(
  kind: Exclude<VersionedUnitKind, 'platform-component' | 'platform'>,
  name: string,
  sourcePath: string,
  platformVersion: string,
  sourceCommit: string,
): VersionedUnit {
  const prefix = kind === 'frontend-feature' ? 'FEATURE' : kind === 'backend-service' ? 'BACKEND' : 'MODULE';
  return Object.freeze({
    unitId: `UNIT-${prefix}-${stableSlug(name)}`,
    name,
    kind,
    sourcePath,
    version: platformVersion,
    versionAuthority: PLATFORM_VERSION_AUTHORITY,
    versionAuthorityMode: 'inherited-platform' as const,
    sourceCommit,
    manifestPath: null,
    ownerProject: null,
    primaryPVC: [],
    ownershipResolution: 'unresolved' as const,
    documentationRefs: [],
    dependencies: [],
  });
}

function componentUnit(
  repoRoot: string,
  componentName: string,
  platformVersion: string,
  sourceCommit: string,
): VersionedUnit {
  const sourcePath = normalizeSlashes(path.join('src', 'platform', componentName));
  const manifestPath = normalizeSlashes(path.join(sourcePath, 'manifest.json'));
  const absoluteManifest = path.join(repoRoot, manifestPath);

  if (!fs.existsSync(absoluteManifest)) {
    return Object.freeze({
      unitId: `UNIT-PLATFORM-${stableSlug(componentName)}`,
      name: componentName,
      kind: 'platform-component' as const,
      sourcePath,
      version: platformVersion,
      versionAuthority: PLATFORM_VERSION_AUTHORITY,
      versionAuthorityMode: 'inherited-platform' as const,
      sourceCommit,
      manifestPath: null,
      ownerProject: null,
      primaryPVC: [],
      ownershipResolution: 'unresolved' as const,
      documentationRefs: [],
      dependencies: [],
    });
  }

  const manifest = readJson<ComponentManifest>(absoluteManifest);
  const versionAuthority = `${manifestPath}#version`;
  const version = requireSemver(manifest.version, versionAuthority);
  const resolvedOwner = resolveOwner(manifest.owner);
  const displayName = typeof manifest.name === 'string' && manifest.name.trim() ? manifest.name.trim() : componentName;

  return Object.freeze({
    unitId: `UNIT-PLATFORM-${stableSlug(displayName)}`,
    name: displayName,
    kind: 'platform-component' as const,
    sourcePath,
    version,
    versionAuthority,
    versionAuthorityMode: 'component' as const,
    sourceCommit,
    manifestPath,
    ownerProject: resolvedOwner.ownerProject,
    primaryPVC: resolvedOwner.primaryPVC,
    ownershipResolution: resolvedOwner.ownerProject ? 'resolved' as const : 'unresolved' as const,
    documentationRefs: asStringArray(manifest.documentation),
    dependencies: asStringArray(manifest.dependencies),
  });
}

function assertUniqueUnitIds(units: VersionedUnit[]): void {
  const seen = new Set<string>();
  for (const unit of units) {
    if (seen.has(unit.unitId)) {
      throw new Error(`[VersionedUnitInventory] duplicate unitId detected: ${unit.unitId}`);
    }
    seen.add(unit.unitId);
  }
}

export function buildVersionedUnitInventory(
  repoRoot: string = process.cwd(),
  sourceCommit: string,
): VersionedUnitInventory {
  const commit = requireSourceCommit(sourceCommit);
  const platformVersion = getPlatformVersion(repoRoot);
  const units: VersionedUnit[] = [];

  units.push(Object.freeze({
    unitId: 'UNIT-PLATFORM-CAPITAL-AI',
    name: 'capital-ai',
    kind: 'platform' as const,
    sourcePath: '.',
    version: platformVersion,
    versionAuthority: PLATFORM_VERSION_AUTHORITY,
    versionAuthorityMode: 'platform' as const,
    sourceCommit: commit,
    manifestPath: null,
    ownerProject: 'CAPITAL-AI-OPS',
    primaryPVC: ['PVC-06'],
    ownershipResolution: 'resolved' as const,
    documentationRefs: [],
    dependencies: [],
  }));

  for (const component of listDirectories(path.join(repoRoot, 'src', 'platform'))) {
    units.push(componentUnit(repoRoot, component, platformVersion, commit));
  }

  for (const feature of listDirectories(path.join(repoRoot, 'src', 'features'))) {
    units.push(inheritedUnit('frontend-feature', feature, normalizeSlashes(path.join('src', 'features', feature)), platformVersion, commit));
  }

  const ignoredSrcRoots = new Set(['features', 'platform']);
  for (const moduleName of listDirectories(path.join(repoRoot, 'src'))) {
    if (ignoredSrcRoots.has(moduleName)) continue;
    units.push(inheritedUnit('application-module', moduleName, normalizeSlashes(path.join('src', moduleName)), platformVersion, commit));
  }

  if (fs.existsSync(path.join(repoRoot, 'server')) && fs.statSync(path.join(repoRoot, 'server')).isDirectory()) {
    units.push(inheritedUnit('backend-service', 'server', 'server', platformVersion, commit));
  }

  units.sort((a, b) => a.unitId.localeCompare(b.unitId));
  assertUniqueUnitIds(units);

  const componentAuthorityUnits = units.filter((unit) => unit.versionAuthorityMode === 'component').length;
  const inheritedPlatformUnits = units.filter((unit) => unit.versionAuthorityMode === 'inherited-platform').length;
  const ownershipResolvedUnits = units.filter((unit) => unit.ownershipResolution === 'resolved').length;

  return Object.freeze({
    contract: VERSIONED_UNIT_INVENTORY_CONTRACT,
    platformVersion,
    platformVersionAuthority: PLATFORM_VERSION_AUTHORITY,
    sourceCommit: commit,
    readOnly: true as const,
    mutationPerformed: false as const,
    units: Object.freeze(units) as unknown as VersionedUnit[],
    coverage: Object.freeze({
      totalUnits: units.length,
      versionAuthorityResolvedUnits: units.length,
      componentAuthorityUnits,
      inheritedPlatformUnits,
      ownershipResolvedUnits,
      ownershipUnresolvedUnits: units.length - ownershipResolvedUnits,
    }),
  });
}
