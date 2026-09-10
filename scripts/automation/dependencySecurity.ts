import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { resolveSourceCommit } from './sourceIdentity';

export interface DependencyPolicyResult {
  violations: string[];
  productionDependencyCount: number;
}

interface SecurityFloor {
  packageName: string;
  major: number;
  minimumVersion: string;
  advisories: readonly string[];
}

// Central lockfile floors prevent a patched dependency from silently regressing when
// package ranges are re-resolved. Keep the mechanism generic and add a floor whenever
// an advisory requires a minimum patched version for a supported major line.
const SECURITY_FLOORS: readonly SecurityFloor[] = [
  {
    packageName: 'vite',
    major: 6,
    minimumVersion: '6.4.3',
    advisories: [
      'GHSA-fx2h-pf6j-xcff',
      'GHSA-p9ff-h696-f583',
      'GHSA-4w7w-66w2-5vf9',
      'GHSA-cw47-99h4-q43f',
    ],
  },
];

function isDisallowedSpecifier(specifier: string): boolean {
  const value = specifier.trim().toLowerCase();
  return value === '*' || value === 'latest' || /^(git\+|git:|https?:|file:|link:)/.test(value);
}

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: boolean;
}

function parseSemver(version: string): ParsedSemver | null {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: Boolean(match[4]),
  };
}

function compareSemver(left: ParsedSemver, right: ParsedSemver): number {
  if (left.major !== right.major) return left.major - right.major;
  if (left.minor !== right.minor) return left.minor - right.minor;
  if (left.patch !== right.patch) return left.patch - right.patch;
  if (left.prerelease === right.prerelease) return 0;
  return left.prerelease ? -1 : 1;
}

function packageNameFromLockPath(packagePath: string): string | null {
  const marker = 'node_modules/';
  const markerIndex = packagePath.lastIndexOf(marker);
  if (markerIndex < 0) return null;
  const name = packagePath.slice(markerIndex + marker.length);
  return name || null;
}

function validateDependencySection(
  sectionName: 'dependencies' | 'devDependencies',
  pkg: any,
  lock: any,
  violations: string[],
): void {
  const dependencies: Record<string, string> = pkg?.[sectionName] ?? {};
  const rootLock = lock?.packages?.[''];

  for (const [name, specifier] of Object.entries(dependencies)) {
    if (typeof specifier !== 'string' || isDisallowedSpecifier(specifier)) {
      violations.push(`${sectionName}.${name}: unsicherer/nicht reproduzierbarer Dependency-Specifier '${String(specifier)}'`);
      continue;
    }

    const rootSpecifier = rootLock?.[sectionName]?.[name];
    if (rootSpecifier !== specifier) {
      violations.push(`${sectionName}.${name}: package.json und package-lock Root-Specifier divergieren`);
    }

    const locked = lock?.packages?.[`node_modules/${name}`];
    if (!locked || typeof locked.version !== 'string' || !locked.version) {
      violations.push(`${sectionName}.${name}: kein aufgelöster Lockfile-Eintrag mit Version`);
      continue;
    }
    if (!locked.integrity && !locked.resolved?.startsWith('https://registry.npmjs.org/')) {
      violations.push(
        `${sectionName}.${name}@${locked.version}: weder Integrity-Hash noch verifizierbarer npm-Registry-Ursprung im Lockfile`,
      );
    }
  }
}

function validateSecurityFloors(lock: any, violations: string[]): void {
  for (const [packagePath, entry] of Object.entries<any>(lock?.packages ?? {})) {
    const packageName = packageNameFromLockPath(packagePath);
    if (!packageName || !entry || typeof entry.version !== 'string') continue;

    const matchingFloors = SECURITY_FLOORS.filter(floor => floor.packageName === packageName);
    if (matchingFloors.length === 0) continue;

    const parsedVersion = parseSemver(entry.version);
    if (!parsedVersion) {
      violations.push(`${packagePath}: Sicherheitsversion '${entry.version}' ist nicht als SemVer auswertbar`);
      continue;
    }

    for (const floor of matchingFloors) {
      if (parsedVersion.major !== floor.major) continue;
      const parsedMinimum = parseSemver(floor.minimumVersion);
      if (!parsedMinimum) {
        throw new Error(`Ungültiger interner Security Floor ${floor.packageName}@${floor.minimumVersion}`);
      }
      if (compareSemver(parsedVersion, parsedMinimum) < 0) {
        violations.push(
          `${packagePath}: ${packageName}@${entry.version} unterschreitet Security Floor ${floor.minimumVersion} (${floor.advisories.join(', ')})`,
        );
      }
    }
  }
}

export function evaluateDependencyPolicy(pkg: any, lock: any): DependencyPolicyResult {
  const violations: string[] = [];
  const dependencies: Record<string, string> = pkg?.dependencies ?? {};

  validateDependencySection('dependencies', pkg, lock, violations);
  validateDependencySection('devDependencies', pkg, lock, violations);
  validateSecurityFloors(lock, violations);

  return { violations, productionDependencyCount: Object.keys(dependencies).length };
}

export interface SbomSourceBinding {
  sourceCommit: string | null;
  packageLockSha256: string | null;
}

// M6 (Supply Chain Provenance): binds the SBOM to the exact source commit and lockfile digest it
// was generated from, so buildSupplyChainProvenance.ts / verifySupplyChainProvenance.ts can prove
// (or reject) that a given SBOM matches the current source state, instead of an SBOM that is only
// ever trusted by proximity in time.
export function buildCycloneDxSbom(
  pkg: any,
  lock: any,
  serialNumber = 'urn:uuid:capital-ai-build',
  sourceBinding: SbomSourceBinding = { sourceCommit: null, packageLockSha256: null },
): any {
  const components = Object.entries<any>(lock?.packages ?? {})
    .filter(([packagePath, entry]) => packagePath.startsWith('node_modules/') && entry?.version && entry?.dev !== true)
    .map(([packagePath, entry]) => {
      const name = packagePath.replace(/^node_modules\//, '');
      return {
        type: 'library',
        name,
        version: String(entry.version),
        purl: `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(String(entry.version))}`,
        properties: [
          { name: 'capital-ai:lockfile-path', value: packagePath },
          ...(entry.integrity ? [{ name: 'capital-ai:npm-integrity', value: String(entry.integrity) }] : []),
        ],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber,
    version: 1,
    metadata: {
      component: {
        type: 'application',
        name: pkg?.name ?? 'unknown',
        version: pkg?.version ?? 'unknown',
      },
      tools: [{ vendor: 'CAPITAL-AI', name: 'dependencySecurity.ts', version: '1.0.0' }],
      properties: [
        ...(sourceBinding.sourceCommit ? [{ name: 'capital-ai:source-commit', value: sourceBinding.sourceCommit }] : []),
        ...(sourceBinding.packageLockSha256 ? [{ name: 'capital-ai:package-lock-sha256', value: sourceBinding.packageLockSha256 }] : []),
      ],
    },
    components,
  };
}

export function writeCycloneDxSbom(repoRoot: string, pkg: any, lock: any): string {
  const outputDir = path.join(repoRoot, 'dist', 'security');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'sbom.cdx.json');
  const packageLockPath = path.join(repoRoot, 'package-lock.json');
  const sourceBinding: SbomSourceBinding = {
    sourceCommit: resolveSourceCommit(repoRoot),
    packageLockSha256: fs.existsSync(packageLockPath)
      ? crypto.createHash('sha256').update(fs.readFileSync(packageLockPath)).digest('hex')
      : null,
  };
  const sbom = buildCycloneDxSbom(pkg, lock, undefined, sourceBinding);
  fs.writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8');
  return outputPath;
}
