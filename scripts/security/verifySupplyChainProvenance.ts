import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveSourceCommit } from '../automation/sourceIdentity';

// M6 (Supply Chain Provenance, ADR-0060). Fail-closed consistency gate for the
// source -> lockfile -> SBOM -> provenance chain produced by buildRuntimeReleaseManifest.ts,
// dependencySecurity.ts and buildSupplyChainProvenance.ts. Deliberately does not attempt to
// verify a cryptographic signature locally: the actual trust anchor is the GitHub-hosted
// actions/attest-build-provenance step in ci.yml (Sigstore-backed, independently verifiable via
// `gh attestation verify` against GitHub's transparency log), which this script cannot and must
// not reimplement or spoof. This script proves internal consistency; CI's attestation step
// proves authenticity.

export interface SupplyChainVerificationInput {
  releaseManifest: any;
  sbom: any;
  provenance: any;
  currentSourceCommit: string | null;
  currentPackageLockSha256: string | null;
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

export function verifySupplyChainConsistency(input: SupplyChainVerificationInput): SupplyChainVerificationResult {
  const violations: string[] = [];
  const {
    releaseManifest,
    sbom,
    provenance,
    currentSourceCommit,
    currentPackageLockSha256,
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
    releaseManifestFileSha256: crypto.createHash('sha256').update(releaseManifestBuf).digest('hex'),
    sbomFileSha256: crypto.createHash('sha256').update(sbomBuf).digest('hex'),
    requireCiBuilder,
  });

  if (!result.ok) {
    console.error('[supply-chain-verify] FAIL-CLOSED:');
    for (const violation of result.violations) console.error(`  - ${violation}`);
    process.exit(1);
  }
  console.log(`[supply-chain-verify] source/lock/SBOM/provenance chain consistent (${result.violations.length} violations).`);
}

const isDirectExecution = Boolean(process.argv[1]) && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isDirectExecution) {
  main();
}
