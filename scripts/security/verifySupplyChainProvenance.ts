import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  computeRuntimeArtifactIdentity,
  RUNTIME_ARTIFACT_EXCLUDED_PREFIXES,
  type RuntimeArtifactIdentity,
} from '../automation/runtimeArtifactIdentity';
import { resolveSourceCommit } from '../automation/sourceIdentity';

// M6 (Supply Chain Provenance, ADR-0060). Fail-closed consistency gate for the
// source -> lockfile -> SBOM -> runtime artifact -> provenance chain produced by
// buildRuntimeReleaseManifest.ts, dependencySecurity.ts and buildSupplyChainProvenance.ts.
// This script proves internal consistency. Authenticity remains the existing GitHub-hosted
// cosign keyless signing/verification path in ci.yml; this verifier does not create or spoof
// a second signing, attestation, Release or Deployment authority.

export interface SupplyChainVerificationInput {
  releaseManifest: any;
  sbom: any;
  provenance: any;
  currentSourceCommit: string | null;
  currentPackageLockSha256: string | null;
  currentRuntimeArtifact: RuntimeArtifactIdentity | null;
  releaseManifestFileSha256: string;
  sbomFileSha256: string;
  requireCiBuilder: boolean;
}

export interface SupplyChainVerificationResult {
  ok: boolean;
  violations: string[];
}

function sbomProperty(sbom: any, name: string): string | null {
  return (sbom?.metadata?.properties ?? []).find((property: any) => property?.name === name)?.value ?? null;
}

function isRuntimeSubjectName(name: unknown): name is string {
  return typeof name === 'string'
    && name.startsWith('dist/')
    && !RUNTIME_ARTIFACT_EXCLUDED_PREFIXES.some(prefix => name.startsWith(prefix));
}

export function verifySupplyChainConsistency(input: SupplyChainVerificationInput): SupplyChainVerificationResult {
  const violations: string[] = [];
  const {
    releaseManifest,
    sbom,
    provenance,
    currentSourceCommit,
    currentPackageLockSha256,
    currentRuntimeArtifact,
    releaseManifestFileSha256,
    sbomFileSha256,
    requireCiBuilder,
  } = input;

  if (!currentSourceCommit) {
    violations.push('aktueller Quell-Commit konnte nicht aufgeloest werden (weder Env-Variable noch git HEAD).');
  }

  const manifestCommit = releaseManifest?.sourceCommit ?? null;
  const sbomCommit = sbomProperty(sbom, 'capital-ai:source-commit');
  if (!manifestCommit || manifestCommit !== currentSourceCommit) {
    violations.push(
      `Release-Manifest-Commit (${manifestCommit ?? 'fehlt'}) stimmt nicht mit dem aktuellen Quell-Commit ` +
      `(${currentSourceCommit ?? 'unbekannt'}) ueberein - Quelle wurde nach dem Build veraendert (stale artifact).`,
    );
  }
  if (!sbomCommit || sbomCommit !== currentSourceCommit) {
    violations.push(
      `SBOM-Commit (${sbomCommit ?? 'fehlt'}) stimmt nicht mit dem aktuellen Quell-Commit ` +
      `(${currentSourceCommit ?? 'unbekannt'}) ueberein - Quelle wurde nach der SBOM-Erzeugung veraendert (stale SBOM).`,
    );
  }

  const sbomLockSha = sbomProperty(sbom, 'capital-ai:package-lock-sha256');
  if (!sbomLockSha || !currentPackageLockSha256 || sbomLockSha !== currentPackageLockSha256) {
    violations.push(
      `package-lock.json-Digest der SBOM (${sbomLockSha ?? 'fehlt'}) stimmt nicht mit dem aktuellen Lockfile ` +
      `(${currentPackageLockSha256 ?? 'unbekannt'}) ueberein - Lockfile wurde nach der SBOM-Erzeugung geaendert (stale SBOM).`,
    );
  }

  const manifestRuntimeArtifact = releaseManifest?.runtimeArtifact ?? null;
  if (!currentRuntimeArtifact) {
    violations.push('Aktuelles Runtime-Build-Artefakt fehlt oder konnte nicht deterministisch aufgeloest werden.');
  } else {
    if (
      !manifestRuntimeArtifact ||
      manifestRuntimeArtifact.root !== currentRuntimeArtifact.root ||
      manifestRuntimeArtifact.algorithm !== currentRuntimeArtifact.algorithm ||
      manifestRuntimeArtifact.sha256 !== currentRuntimeArtifact.sha256 ||
      manifestRuntimeArtifact.files !== currentRuntimeArtifact.files
    ) {
      violations.push(
        `Runtime-Artefakt-Digest im Release-Manifest (${manifestRuntimeArtifact?.sha256 ?? 'fehlt'}) ` +
        `stimmt nicht mit dem aktuellen Build (${currentRuntimeArtifact.sha256}) ueberein (stale/missing runtime artifact).`,
      );
    }

    const provenanceRuntimeIdentity = provenance?.predicate?.buildDefinition?.internalParameters?.runtimeArtifact ?? null;
    if (
      !provenanceRuntimeIdentity ||
      provenanceRuntimeIdentity.root !== currentRuntimeArtifact.root ||
      provenanceRuntimeIdentity.algorithm !== currentRuntimeArtifact.algorithm ||
      provenanceRuntimeIdentity.sha256 !== currentRuntimeArtifact.sha256 ||
      provenanceRuntimeIdentity.files !== currentRuntimeArtifact.files
    ) {
      violations.push(
        `Runtime-Artefakt-Identitaet der Provenance (${provenanceRuntimeIdentity?.sha256 ?? 'fehlt'}) ` +
        `stimmt nicht mit dem aktuellen Build (${currentRuntimeArtifact.sha256}) ueberein.`,
      );
    }
  }

  const subjects: Array<{ name?: string; digest?: { sha256?: string } }> = Array.isArray(provenance?.subject)
    ? provenance.subject
    : [];
  const manifestSubject = subjects.find(s => s.name === 'dist/control-plane/release-manifest.json');
  const sbomSubject = subjects.find(s => s.name === 'dist/security/sbom.cdx.json');
  if (!manifestSubject?.digest?.sha256 || manifestSubject.digest.sha256 !== releaseManifestFileSha256) {
    violations.push('Provenance-Subject-Digest fuer release-manifest.json stimmt nicht mit der Datei auf der Platte ueberein (Artifact-Digest-Mismatch).');
  }
  if (!sbomSubject?.digest?.sha256 || sbomSubject.digest.sha256 !== sbomFileSha256) {
    violations.push('Provenance-Subject-Digest fuer sbom.cdx.json stimmt nicht mit der Datei auf der Platte ueberein (Artifact-Digest-Mismatch).');
  }

  if (currentRuntimeArtifact) {
    const expectedSubjects = new Map(
      currentRuntimeArtifact.subjects.map(subject => [subject.name, subject.digest.sha256] as const),
    );
    const provenanceRuntimeSubjects = subjects.filter(subject => isRuntimeSubjectName(subject.name));
    const seenNames = new Set<string>();
    const duplicateNames = new Set<string>();
    for (const subject of provenanceRuntimeSubjects) {
      if (seenNames.has(subject.name!)) duplicateNames.add(subject.name!);
      seenNames.add(subject.name!);
    }
    if (duplicateNames.size > 0) {
      violations.push(`Provenance enthaelt doppelte Runtime-Subjects: ${[...duplicateNames].sort().join(', ')}.`);
    }

    const actualSubjects = new Map(
      provenanceRuntimeSubjects.map(subject => [subject.name!, subject.digest?.sha256 ?? null] as const),
    );
    const missingSubjects = [...expectedSubjects.keys()].filter(name => !actualSubjects.has(name));
    const mismatchedSubjects = [...expectedSubjects.entries()]
      .filter(([name, digest]) => actualSubjects.has(name) && actualSubjects.get(name) !== digest)
      .map(([name]) => name);
    const unexpectedSubjects = [...actualSubjects.keys()].filter(name => !expectedSubjects.has(name));

    if (missingSubjects.length > 0) {
      violations.push(`Provenance fehlen Runtime-Subjects: ${missingSubjects.join(', ')}.`);
    }
    if (mismatchedSubjects.length > 0) {
      violations.push(`Runtime-Subject-Digest-Mismatch: ${mismatchedSubjects.join(', ')}.`);
    }
    if (unexpectedSubjects.length > 0) {
      violations.push(`Provenance enthaelt stale/unerwartete Runtime-Subjects: ${unexpectedSubjects.join(', ')}.`);
    }
  }

  const resolvedDeps: any[] = provenance?.predicate?.buildDefinition?.resolvedDependencies ?? [];
  const gitCommitDep = resolvedDeps.find(dep => dep?.digest?.gitCommit);
  if (!gitCommitDep || gitCommitDep.digest.gitCommit !== currentSourceCommit) {
    violations.push('Provenance resolvedDependencies gitCommit stimmt nicht mit dem aktuellen Quell-Commit ueberein.');
  }

  const builderId: string | undefined = provenance?.predicate?.runDetails?.builder?.id;
  if (requireCiBuilder && (!builderId || builderId === 'local-developer-build')) {
    violations.push(
      `Provenance-Builder-Identitaet (${builderId ?? 'fehlt'}) ist kein vertrauenswuerdiger, gehosteter Build-Pfad - ` +
      `--require-ci verlangt eine GitHub-Actions-Builder-Identitaet, keinen lokalen Entwickler-Build.`,
    );
  }

  return { ok: violations.length === 0, violations };
}

function main() {
  const repoRoot = process.cwd();
  const requireCiBuilder = process.argv.includes('--require-ci');

  const releaseManifestPath = path.join(repoRoot, 'dist', 'control-plane', 'release-manifest.json');
  const sbomPath = path.join(repoRoot, 'dist', 'security', 'sbom.cdx.json');
  const provenancePath = path.join(repoRoot, 'dist', 'security', 'provenance.json');
  const packageLockPath = path.join(repoRoot, 'package-lock.json');

  for (const [label, filePath] of [
    ['Release-Manifest', releaseManifestPath],
    ['SBOM', sbomPath],
    ['Provenance', provenancePath],
  ] as const) {
    if (!fs.existsSync(filePath)) {
      console.error(`[supply-chain-verify] FAIL-CLOSED: ${label} fehlt unter ${path.relative(repoRoot, filePath)}.`);
      process.exit(1);
    }
  }

  let currentRuntimeArtifact: RuntimeArtifactIdentity;
  try {
    currentRuntimeArtifact = computeRuntimeArtifactIdentity(repoRoot);
  } catch (error) {
    console.error(
      `[supply-chain-verify] FAIL-CLOSED: Runtime-Artefakt konnte nicht bestimmt werden: ` +
      `${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }

  const releaseManifestBuf = fs.readFileSync(releaseManifestPath);
  const sbomBuf = fs.readFileSync(sbomPath);
  const releaseManifest = JSON.parse(releaseManifestBuf.toString('utf8'));
  const sbom = JSON.parse(sbomBuf.toString('utf8'));
  const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));

  const result = verifySupplyChainConsistency({
    releaseManifest,
    sbom,
    provenance,
    currentSourceCommit: resolveSourceCommit(repoRoot),
    currentPackageLockSha256: fs.existsSync(packageLockPath)
      ? crypto.createHash('sha256').update(fs.readFileSync(packageLockPath)).digest('hex')
      : null,
    currentRuntimeArtifact,
    releaseManifestFileSha256: crypto.createHash('sha256').update(releaseManifestBuf).digest('hex'),
    sbomFileSha256: crypto.createHash('sha256').update(sbomBuf).digest('hex'),
    requireCiBuilder,
  });

  if (!result.ok) {
    console.error('[supply-chain-verify] FAIL-CLOSED:');
    for (const violation of result.violations) console.error(`  - ${violation}`);
    process.exit(1);
  }
  console.log(
    `[supply-chain-verify] source/lock/SBOM/runtime/provenance chain consistent ` +
    `(${currentRuntimeArtifact.files} runtime subjects; ${result.violations.length} violations).`,
  );
}

const isDirectExecution = Boolean(process.argv[1]) && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectExecution) {
  main();
}
