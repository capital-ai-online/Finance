import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { computeRuntimeArtifactIdentity } from './runtimeArtifactIdentity';
import { resolveSourceCommit } from './sourceIdentity';

// M6 (Supply Chain Provenance, ADR-0060, docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md).
//
// Builds an in-toto Statement carrying an SLSA Provenance v1.2 predicate binding the exact source
// commit, dependency state, CycloneDX SBOM, immutable release manifest and every actual runtime
// build file under dist/ (excluding the control-plane/security evidence trees themselves) into one
// signable provenance artifact. This script only assembles the statement and fails closed when the
// runtime artifact identity no longer matches the release manifest. Signing remains the existing
// GitHub-hosted cosign keyless path in ci.yml; no second attestation or Release plane is introduced.
const SLSA_PREDICATE_TYPE = 'https://slsa.dev/provenance/v1';
const repoRoot = process.cwd();

function sha256(content: Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readJson(filePath: string, label: string, hint: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} fehlt unter ${path.relative(repoRoot, filePath)} - ${hint}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function githubBuilder(): { id: string; workflowRef: string | null; runId: string | null } | null {
  if (process.env.GITHUB_ACTIONS !== 'true') return null;
  const repo = process.env.GITHUB_REPOSITORY || 'unknown/unknown';
  const workflowRef = process.env.GITHUB_WORKFLOW_REF || null;
  const runId = process.env.GITHUB_RUN_ID || null;
  return {
    id: `https://github.com/${repo}/.github/workflows/ci.yml`,
    workflowRef,
    runId,
  };
}

function main() {
  const releaseManifestPath = path.join(repoRoot, 'dist', 'control-plane', 'release-manifest.json');
  const sbomPath = path.join(repoRoot, 'dist', 'security', 'sbom.cdx.json');
  const releaseManifest = readJson(releaseManifestPath, 'Release-Manifest', "erst 'npm run build' ausfuehren.");
  const sbom = readJson(sbomPath, 'SBOM', "erst 'npm run predeploy:check' (erzeugt die SBOM) ausfuehren.");

  const sourceCommit = resolveSourceCommit(repoRoot);
  const manifestSourceCommit = releaseManifest.sourceCommit ?? null;
  const sbomSourceCommit = (sbom.metadata?.properties ?? []).find(
    (property: any) => property?.name === 'capital-ai:source-commit',
  )?.value ?? null;

  if (!sourceCommit || sourceCommit !== manifestSourceCommit || sourceCommit !== sbomSourceCommit) {
    throw new Error(
      `Quell-Commit-Bindung inkonsistent: aktuell=${sourceCommit ?? 'unbekannt'}, ` +
      `release-manifest=${manifestSourceCommit ?? 'unbekannt'}, sbom=${sbomSourceCommit ?? 'unbekannt'}. ` +
      `Release-Manifest und SBOM muessen im selben Build-Lauf, auf demselben Commit, erzeugt worden sein.`,
    );
  }

  const runtimeArtifact = computeRuntimeArtifactIdentity(repoRoot);
  const manifestRuntimeArtifact = releaseManifest.runtimeArtifact ?? null;
  if (
    !manifestRuntimeArtifact ||
    manifestRuntimeArtifact.root !== runtimeArtifact.root ||
    manifestRuntimeArtifact.algorithm !== runtimeArtifact.algorithm ||
    manifestRuntimeArtifact.sha256 !== runtimeArtifact.sha256 ||
    manifestRuntimeArtifact.files !== runtimeArtifact.files
  ) {
    throw new Error(
      `Runtime-Artefakt-Bindung inkonsistent: aktueller Digest=${runtimeArtifact.sha256}, ` +
      `release-manifest=${manifestRuntimeArtifact?.sha256 ?? 'fehlt'}. ` +
      'Build-Ausgabe wurde nach der Manifest-Erzeugung veraendert oder das Manifest ist unvollstaendig.',
    );
  }

  const builder = githubBuilder();
  const releaseManifestDigest = sha256(fs.readFileSync(releaseManifestPath));
  const sbomDigest = sha256(fs.readFileSync(sbomPath));

  const statement = {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [
      ...runtimeArtifact.subjects,
      { name: 'dist/control-plane/release-manifest.json', digest: { sha256: releaseManifestDigest } },
      { name: 'dist/security/sbom.cdx.json', digest: { sha256: sbomDigest } },
    ],
    predicateType: SLSA_PREDICATE_TYPE,
    predicate: {
      buildDefinition: {
        buildType: 'https://capital-ai.online/build-types/npm-vite-esbuild@v1',
        externalParameters: {
          repository: process.env.GITHUB_REPOSITORY ?? 'SvenKulessa/Finance',
          ref: process.env.GITHUB_REF ?? null,
        },
        internalParameters: {
          buildIdentity: releaseManifest.buildIdentity ?? null,
          runtimeArtifact: {
            root: runtimeArtifact.root,
            algorithm: runtimeArtifact.algorithm,
            sha256: runtimeArtifact.sha256,
            files: runtimeArtifact.files,
          },
        },
        resolvedDependencies: [
          {
            uri: `git+https://github.com/${process.env.GITHUB_REPOSITORY ?? 'SvenKulessa/Finance'}@${sourceCommit}`,
            digest: { gitCommit: sourceCommit },
          },
          {
            uri: 'file:./package-lock.json',
            digest: {
              sha256: (sbom.metadata?.properties ?? []).find(
                (property: any) => property?.name === 'capital-ai:package-lock-sha256',
              )?.value ?? null,
            },
          },
        ],
      },
      runDetails: {
        builder: builder ?? { id: 'local-developer-build', workflowRef: null, runId: null },
        metadata: {
          generatedAt: new Date().toISOString(),
          slsaSpecVersion: 'v1.2',
        },
      },
    },
  };

  const outputDir = path.join(repoRoot, 'dist', 'security');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'provenance.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(statement, null, 2)}\n`, 'utf8');
  console.log(
    `[provenance] ${path.relative(repoRoot, outputPath)} :: source-commit=${sourceCommit} :: ` +
    `runtime=${runtimeArtifact.sha256} (${runtimeArtifact.files} subjects)`,
  );
}

try {
  main();
} catch (error) {
  console.error(`[provenance] FAIL-CLOSED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
