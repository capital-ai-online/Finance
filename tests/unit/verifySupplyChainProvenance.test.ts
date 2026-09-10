// M6 (Supply Chain Provenance, ADR-0060): covers positive/negative verification for the
// source -> lockfile -> SBOM -> runtime artifact -> provenance chain. The consistency function is
// pure, so stale/tampered/missing artifact states can be exercised without filesystem mocks.

import { describe, it, expect } from 'vitest';
import { verifySupplyChainConsistency, type SupplyChainVerificationInput } from '../../scripts/security/verifySupplyChainProvenance';

function baseInput(): SupplyChainVerificationInput {
  const runtimeArtifact = {
    root: 'dist' as const,
    algorithm: 'sha256-subject-set-v1' as const,
    sha256: 'runtime-set-sha',
    files: 2,
    subjects: [
      { name: 'dist/assets/app.js', digest: { sha256: 'app-sha' } },
      { name: 'dist/server.cjs', digest: { sha256: 'server-sha' } },
    ],
  };

  return {
    releaseManifest: {
      sourceCommit: 'abc123',
      runtimeArtifact: {
        root: runtimeArtifact.root,
        algorithm: runtimeArtifact.algorithm,
        sha256: runtimeArtifact.sha256,
        files: runtimeArtifact.files,
      },
    },
    sbom: {
      metadata: {
        properties: [
          { name: 'capital-ai:source-commit', value: 'abc123' },
          { name: 'capital-ai:package-lock-sha256', value: 'lock-sha' },
        ],
      },
    },
    provenance: {
      subject: [
        ...runtimeArtifact.subjects,
        { name: 'dist/control-plane/release-manifest.json', digest: { sha256: 'manifest-sha' } },
        { name: 'dist/security/sbom.cdx.json', digest: { sha256: 'sbom-sha' } },
      ],
      predicate: {
        buildDefinition: {
          internalParameters: {
            runtimeArtifact: {
              root: runtimeArtifact.root,
              algorithm: runtimeArtifact.algorithm,
              sha256: runtimeArtifact.sha256,
              files: runtimeArtifact.files,
            },
          },
          resolvedDependencies: [{ digest: { gitCommit: 'abc123' } }],
        },
        runDetails: {
          builder: { id: 'https://github.com/SvenKulessa/Finance/.github/workflows/ci.yml' },
        },
      },
    },
    currentSourceCommit: 'abc123',
    currentPackageLockSha256: 'lock-sha',
    currentRuntimeArtifact: runtimeArtifact,
    releaseManifestFileSha256: 'manifest-sha',
    sbomFileSha256: 'sbom-sha',
    requireCiBuilder: false,
  };
}

describe('verifySupplyChainConsistency', () => {
  it('PASS: consistent source/lock/SBOM/runtime/provenance chain', () => {
    const result = verifySupplyChainConsistency(baseInput());
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('DENY: changed source with stale provenance/manifest (commit mismatch)', () => {
    const input = baseInput();
    input.currentSourceCommit = 'def456';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('Release-Manifest-Commit'))).toBe(true);
    expect(result.violations.some(v => v.includes('SBOM-Commit'))).toBe(true);
    expect(result.violations.some(v => v.includes('resolvedDependencies gitCommit'))).toBe(true);
  });

  it('DENY: changed lockfile with stale SBOM (lockfile digest mismatch)', () => {
    const input = baseInput();
    input.currentPackageLockSha256 = 'new-lock-sha';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('package-lock.json-Digest'))).toBe(true);
  });

  it('DENY: release manifest file changed after provenance was built', () => {
    const input = baseInput();
    input.releaseManifestFileSha256 = 'tampered-sha';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('release-manifest.json') && v.includes('Digest-Mismatch'))).toBe(true);
  });

  it('DENY: SBOM file changed after provenance was built', () => {
    const input = baseInput();
    input.sbomFileSha256 = 'tampered-sha';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('sbom.cdx.json') && v.includes('Digest-Mismatch'))).toBe(true);
  });

  it('DENY: runtime artifact changed after manifest/provenance generation', () => {
    const input = baseInput();
    input.currentRuntimeArtifact = {
      ...input.currentRuntimeArtifact!,
      sha256: 'runtime-set-tampered-sha',
      subjects: input.currentRuntimeArtifact!.subjects.map(subject =>
        subject.name === 'dist/server.cjs'
          ? { ...subject, digest: { sha256: 'tampered-server-sha' } }
          : subject,
      ),
    };
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('Release-Manifest') && v.includes('stale/missing runtime artifact'))).toBe(true);
    expect(result.violations.some(v => v.includes('Runtime-Subject-Digest-Mismatch'))).toBe(true);
  });

  it('DENY: runtime artifact is missing', () => {
    const input = baseInput();
    input.currentRuntimeArtifact = null;
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('Runtime-Build-Artefakt fehlt'))).toBe(true);
  });

  it('DENY: release manifest has no runtime artifact binding', () => {
    const input = baseInput();
    delete input.releaseManifest.runtimeArtifact;
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('Runtime-Artefakt-Digest im Release-Manifest'))).toBe(true);
  });

  it('DENY: provenance is missing one real runtime subject', () => {
    const input = baseInput();
    input.provenance.subject = input.provenance.subject.filter((subject: any) => subject.name !== 'dist/server.cjs');
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('fehlen Runtime-Subjects') && v.includes('dist/server.cjs'))).toBe(true);
  });

  it('DENY: provenance carries a stale extra runtime subject', () => {
    const input = baseInput();
    input.provenance.subject.push({ name: 'dist/stale.js', digest: { sha256: 'stale-sha' } });
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('stale/unerwartete Runtime-Subjects'))).toBe(true);
  });

  it('DENY: provenance runtime aggregate identity is stale', () => {
    const input = baseInput();
    input.provenance.predicate.buildDefinition.internalParameters.runtimeArtifact.sha256 = 'stale-runtime-set-sha';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('Runtime-Artefakt-Identitaet der Provenance'))).toBe(true);
  });

  it('DENY: unresolvable current source commit', () => {
    const input = baseInput();
    input.currentSourceCommit = null;
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('konnte nicht aufgeloest werden'))).toBe(true);
  });

  it('DENY: untrusted/local builder identity when --require-ci is set', () => {
    const input = baseInput();
    input.requireCiBuilder = true;
    input.provenance.predicate.runDetails.builder.id = 'local-developer-build';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('vertrauenswuerdiger'))).toBe(true);
  });

  it('PASS: local builder identity is accepted when --require-ci is not set', () => {
    const input = baseInput();
    input.requireCiBuilder = false;
    input.provenance.predicate.runDetails.builder.id = 'local-developer-build';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(true);
  });

  it('DENY: missing builder identity when --require-ci is set', () => {
    const input = baseInput();
    input.requireCiBuilder = true;
    input.provenance.predicate.runDetails.builder = {};
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
  });

  it('ignores agent/provider claims: only structural builder identity and digests are trusted', () => {
    const input = baseInput();
    (input.provenance.predicate.runDetails as any).claimedAgent = { provider: 'anthropic', trusted: true, role: 'owner' };
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(true);
  });
});
