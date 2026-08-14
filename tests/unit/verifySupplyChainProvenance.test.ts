// M6 (Supply Chain Provenance, docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md): deckt die im Runbook
// vorgeschriebenen Positiv-/Negativtests fuer die source -> lockfile -> SBOM -> provenance-Kette
// ab. verifySupplyChainConsistency() ist eine reine Funktion (keine Dateisystem-/Netzwerkzugriffe),
// daher hier vollstaendig ohne Mocks testbar.

import { describe, it, expect } from 'vitest';
import { verifySupplyChainConsistency, type SupplyChainVerificationInput } from '../../scripts/security/verifySupplyChainProvenance';

function baseInput(): SupplyChainVerificationInput {
  return {
    releaseManifest: { sourceCommit: 'abc123' },
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
        { name: 'dist/control-plane/release-manifest.json', digest: { sha256: 'manifest-sha' } },
        { name: 'dist/security/sbom.cdx.json', digest: { sha256: 'sbom-sha' } },
      ],
      predicate: {
        buildDefinition: {
          resolvedDependencies: [{ digest: { gitCommit: 'abc123' } }],
        },
        runDetails: {
          builder: { id: 'https://github.com/SvenKulessa/Finance/.github/workflows/ci.yml' },
        },
      },
    },
    currentSourceCommit: 'abc123',
    currentPackageLockSha256: 'lock-sha',
    releaseManifestFileSha256: 'manifest-sha',
    sbomFileSha256: 'sbom-sha',
    requireCiBuilder: false,
  };
}

describe('verifySupplyChainConsistency', () => {
  it('PASS: consistent source/lock/SBOM/provenance chain', () => {
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

  it('DENY: artifact digest mismatch (release manifest file changed after provenance was built)', () => {
    const input = baseInput();
    input.releaseManifestFileSha256 = 'tampered-sha';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('release-manifest.json') && v.includes('Digest-Mismatch'))).toBe(true);
  });

  it('DENY: artifact digest mismatch (SBOM file changed after provenance was built)', () => {
    const input = baseInput();
    input.sbomFileSha256 = 'tampered-sha';
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(false);
    expect(result.violations.some(v => v.includes('sbom.cdx.json') && v.includes('Digest-Mismatch'))).toBe(true);
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

  it('ignores agent/provider claims: only the structural builder.id and digests are checked, never a free-text agent/model field', () => {
    const input = baseInput();
    (input.provenance.predicate.runDetails as any).claimedAgent = { provider: 'anthropic', trusted: true, role: 'owner' };
    const result = verifySupplyChainConsistency(input);
    expect(result.ok).toBe(true);
  });
});
